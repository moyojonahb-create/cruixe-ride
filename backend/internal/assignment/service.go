// Package assignment contains the inactive P0.3 assignment authority boundary.
// It is intentionally not wired to HTTP, RPC, Supabase or production startup.
package assignment

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"
)

type ErrorCode string

const (
	CodeUnauthenticated        ErrorCode = "UNAUTHENTICATED"
	CodeForbidden              ErrorCode = "FORBIDDEN"
	CodeNotFound               ErrorCode = "NOT_FOUND"
	CodeInvalidState           ErrorCode = "INVALID_STATE"
	CodeDriverIneligible       ErrorCode = "DRIVER_INELIGIBLE"
	CodeDriverBusy             ErrorCode = "DRIVER_BUSY"
	CodeOfferExpired           ErrorCode = "OFFER_EXPIRED"
	CodeIdempotencyConflict    ErrorCode = "IDEMPOTENCY_CONFLICT"
	CodeConsentRequired        ErrorCode = "CONSENT_REQUIRED"
	CodePolicyUnavailable      ErrorCode = "POLICY_UNAVAILABLE"
	CodeTemporarilyUnavailable ErrorCode = "TEMPORARILY_UNAVAILABLE"
)

type Error struct {
	Code  ErrorCode
	Cause error
}

func (e *Error) Error() string {
	if e.Cause == nil {
		return string(e.Code)
	}
	return string(e.Code) + ": " + e.Cause.Error()
}
func (e *Error) Unwrap() error { return e.Cause }
func IsCode(err error, code ErrorCode) bool {
	var de *Error
	return errors.As(err, &de) && de.Code == code
}
func domain(code ErrorCode, cause error) error { return &Error{Code: code, Cause: cause} }

type Money struct {
	Minor    int64
	Currency string
}

func (m Money) Validate() error {
	if m.Minor <= 0 || len(m.Currency) != 3 || m.Currency != strings.ToUpper(m.Currency) {
		return errors.New("exact positive minor-unit money is required")
	}
	return nil
}

type AcceptOfferCommand struct {
	ActorID          string
	RideID           string
	OfferID          string
	IdempotencyKey   string
	Consent          bool
	TermsFingerprint [32]byte
}

type Assignment struct {
	ID, RideID, DriverID, OfferID string
	Amount                        Money
	TermsFingerprint              [32]byte
}
type Result struct{ Assignment Assignment }
type ReceiptKey struct{ ActorID, Operation, IdempotencyKey string }
type Receipt struct {
	Key         ReceiptKey
	RequestHash [32]byte
	State       string
	Result      Result
}
type Ride struct{ ID, OwnerID, Status string }
type Offer struct {
	ID, RideID, DriverAuthID, Status string
	Price                            Money
	ExpiresAt                        *time.Time
}
type Driver struct {
	RowID, AuthID      string
	Approved, Eligible bool
}

// Tx is the smallest persistence boundary required by the command. Implementations
// must map each lock method to a real PostgreSQL lock in the documented order.
type Tx interface {
	LockReceipt(context.Context, ReceiptKey, [32]byte) (Receipt, bool, error)
	LockRide(context.Context, string) (Ride, error)
	ReadOffer(context.Context, string) (Offer, error)
	LockDriver(context.Context, string) (Driver, error)
	LockOffer(context.Context, string, string) (Offer, error)
	VerifyConsent(context.Context, Ride, Offer, [32]byte) error
	InsertAgreement(context.Context, Assignment) error
	ReserveDriver(context.Context, Assignment) error
	AssignRide(context.Context, Assignment) error
	AcceptOffer(context.Context, Assignment) error
	RejectOtherOffers(context.Context, string, string) error
	CommitReceipt(context.Context, Receipt) error
	Commit(context.Context) error
	Rollback(context.Context) error
}

type Store interface {
	Begin(context.Context) (Tx, error)
}

type Service struct {
	store Store
	now   func() time.Time
}

func NewService(store Store) (*Service, error) {
	if store == nil {
		return nil, errors.New("assignment store is required")
	}
	return &Service{store: store, now: time.Now}, nil
}

func HashAcceptCommand(c AcceptOfferCommand) [32]byte {
	return sha256.Sum256([]byte(c.ActorID + "\x00accept_offer\x00" + c.RideID + "\x00" + c.OfferID + "\x00" + c.IdempotencyKey + "\x00" + hex.EncodeToString(c.TermsFingerprint[:])))
}

// AcceptOfferAndAssignDriver is inactive until an approved adapter implements Store.
// Lock order is receipt -> ride -> offer read -> driver -> offer lock -> agreement /
// reservation / ride / offers / receipt writes. The driver and offer are rechecked
// after blocking. Missing expiry or consent policy fails closed.
func (s *Service) AcceptOfferAndAssignDriver(ctx context.Context, c AcceptOfferCommand) (Result, error) {
	if strings.TrimSpace(c.ActorID) == "" {
		return Result{}, domain(CodeUnauthenticated, errors.New("actor is required"))
	}
	if strings.TrimSpace(c.IdempotencyKey) == "" {
		return Result{}, domain(CodeIdempotencyConflict, errors.New("idempotency key is required"))
	}
	if !c.Consent {
		return Result{}, domain(CodeConsentRequired, errors.New("rider consent is required"))
	}
	if c.TermsFingerprint == [32]byte{} {
		return Result{}, domain(CodePolicyUnavailable, errors.New("immutable terms policy is not configured"))
	}
	hash := HashAcceptCommand(c)
	tx, err := s.store.Begin(ctx)
	if err != nil {
		return Result{}, err
	}
	defer tx.Rollback(context.Background())
	key := ReceiptKey{ActorID: c.ActorID, Operation: "accept_offer", IdempotencyKey: c.IdempotencyKey}
	old, exists, err := tx.LockReceipt(ctx, key, hash)
	if err != nil {
		return Result{}, err
	}
	if exists {
		if old.RequestHash != hash {
			return Result{}, domain(CodeIdempotencyConflict, errors.New("request hash differs"))
		}
		if old.State == "committed" {
			return old.Result, nil
		}
		return Result{}, domain(CodeTemporarilyUnavailable, errors.New("receipt is pending"))
	}
	ride, err := tx.LockRide(ctx, c.RideID)
	if err != nil {
		return Result{}, err
	}
	if ride.OwnerID != c.ActorID {
		return Result{}, domain(CodeForbidden, errors.New("ride owner mismatch"))
	}
	if ride.Status != "pending" {
		return Result{}, domain(CodeInvalidState, errors.New("ride is not pending"))
	}
	offer, err := tx.ReadOffer(ctx, c.OfferID)
	if err != nil {
		return Result{}, err
	}
	if offer.RideID != ride.ID {
		return Result{}, domain(CodeNotFound, errors.New("offer does not belong to ride"))
	}
	driver, err := tx.LockDriver(ctx, offer.DriverAuthID)
	if err != nil {
		return Result{}, err
	}
	if !driver.Approved || !driver.Eligible {
		return Result{}, domain(CodeDriverIneligible, errors.New("driver is not eligible"))
	}
	offer, err = tx.LockOffer(ctx, ride.ID, c.OfferID)
	if err != nil {
		return Result{}, err
	}
	if err := tx.VerifyConsent(ctx, ride, offer, c.TermsFingerprint); err != nil {
		return Result{}, domain(CodeConsentRequired, err)
	}
	if offer.Status != "pending" {
		return Result{}, domain(CodeInvalidState, errors.New("offer is not pending"))
	}
	if offer.ExpiresAt == nil {
		return Result{}, domain(CodePolicyUnavailable, errors.New("offer expiry policy is not configured"))
	}
	if !offer.ExpiresAt.After(s.now()) {
		return Result{}, domain(CodeOfferExpired, errors.New("offer has expired"))
	}
	if err := offer.Price.Validate(); err != nil {
		return Result{}, domain(CodePolicyUnavailable, err)
	}
	a := Assignment{ID: assignmentID(c), RideID: ride.ID, DriverID: driver.RowID, OfferID: offer.ID, Amount: offer.Price, TermsFingerprint: c.TermsFingerprint}
	if err := tx.InsertAgreement(ctx, a); err != nil {
		return Result{}, err
	}
	if err := tx.ReserveDriver(ctx, a); err != nil {
		return Result{}, err
	}
	if err := tx.AssignRide(ctx, a); err != nil {
		return Result{}, err
	}
	if err := tx.AcceptOffer(ctx, a); err != nil {
		return Result{}, err
	}
	if err := tx.RejectOtherOffers(ctx, ride.ID, offer.ID); err != nil {
		return Result{}, err
	}
	res := Result{Assignment: a}
	if err := tx.CommitReceipt(ctx, Receipt{Key: key, RequestHash: hash, State: "committed", Result: res}); err != nil {
		return Result{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Result{}, err
	}
	return res, nil
}
func assignmentID(c AcceptOfferCommand) string {
	sum := sha256.Sum256([]byte("assignment\x00" + c.ActorID + "\x00" + c.RideID + "\x00" + c.OfferID + "\x00" + c.IdempotencyKey))
	return fmt.Sprintf("%x-%x-%x-%x-%x", sum[0:4], sum[4:6], sum[6:8], sum[8:10], sum[10:16])
}
