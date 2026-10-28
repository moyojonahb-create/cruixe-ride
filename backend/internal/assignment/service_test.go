package assignment

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"
)

type fakeStore struct{ tx *fakeTx }
type fakeTx struct {
	order      []string
	receipt    *Receipt
	assignment Assignment
	failAt     string
	committed  bool
	rolledBack bool
	offer      Offer
	driver     Driver
	ride       Ride
}

func (s fakeStore) Begin(context.Context) (Tx, error) { return s.tx, nil }
func (t *fakeTx) mark(name string) error {
	t.order = append(t.order, name)
	if t.failAt == name {
		return errors.New("injected failure")
	}
	return nil
}
func (t *fakeTx) LockReceipt(_ context.Context, k ReceiptKey, _ [32]byte) (Receipt, bool, error) {
	if err := t.mark("receipt"); err != nil {
		return Receipt{}, false, err
	}
	if t.receipt != nil {
		return *t.receipt, true, nil
	}
	return Receipt{Key: k}, false, nil
}
func (t *fakeTx) LockRide(context.Context, string) (Ride, error) { return t.ride, t.mark("ride") }
func (t *fakeTx) ReadOffer(context.Context, string) (Offer, error) {
	if err := t.mark("offer_read"); err != nil {
		return Offer{}, err
	}
	return t.offer, nil
}
func (t *fakeTx) LockDriver(context.Context, string) (Driver, error) {
	return t.driver, t.mark("driver")
}
func (t *fakeTx) VerifyConsent(context.Context, Ride, Offer, [32]byte) error {
	return t.mark("consent")
}
func (t *fakeTx) LockOffer(context.Context, string, string) (Offer, error) {
	if err := t.mark("offer"); err != nil {
		return Offer{}, err
	}
	return t.offer, nil
}
func (t *fakeTx) InsertAgreement(_ context.Context, a Assignment) error {
	t.assignment = a
	return t.mark("agreement")
}
func (t *fakeTx) ReserveDriver(_ context.Context, a Assignment) error {
	t.assignment = a
	return t.mark("reservation")
}
func (t *fakeTx) AssignRide(context.Context, Assignment) error  { return t.mark("ride_write") }
func (t *fakeTx) AcceptOffer(context.Context, Assignment) error { return t.mark("offer_write") }
func (t *fakeTx) RejectOtherOffers(context.Context, string, string) error {
	return t.mark("offer_reject")
}
func (t *fakeTx) CommitReceipt(_ context.Context, r Receipt) error {
	t.receipt = &r
	return t.mark("receipt_write")
}
func (t *fakeTx) Commit(context.Context) error   { t.committed = true; return t.mark("commit") }
func (t *fakeTx) Rollback(context.Context) error { t.rolledBack = true; return nil }
func validService(t *testing.T) (*Service, *fakeTx, AcceptOfferCommand) {
	t.Helper()
	now := time.Date(2026, 10, 28, 0, 0, 0, 0, time.UTC)
	expiry := now.Add(time.Hour)
	tx := &fakeTx{ride: Ride{ID: "ride-1", OwnerID: "rider-1", Status: "pending"}, offer: Offer{ID: "offer-1", RideID: "ride-1", DriverAuthID: "driver-auth-1", Status: "pending", Price: Money{Minor: 1255, Currency: "USD"}, ExpiresAt: &expiry}, driver: Driver{RowID: "driver-row-1", AuthID: "driver-auth-1", Approved: true, Eligible: true}}
	s, err := NewService(fakeStore{tx: tx})
	if err != nil {
		t.Fatal(err)
	}
	s.now = func() time.Time { return now }
	var fp [32]byte
	fp[0] = 1
	return s, tx, AcceptOfferCommand{ActorID: "rider-1", RideID: "ride-1", OfferID: "offer-1", IdempotencyKey: "key-1", Consent: true, TermsFingerprint: fp}
}
func TestAcceptOfferUsesDeterministicLockOrderAndExactTerms(t *testing.T) {
	s, tx, c := validService(t)
	got, err := s.AcceptOfferAndAssignDriver(context.Background(), c)
	if err != nil {
		t.Fatal(err)
	}
	if got.Assignment.Amount.Minor != 1255 || got.Assignment.Amount.Currency != "USD" {
		t.Fatalf("unexpected exact terms: %#v", got.Assignment.Amount)
	}
	want := []string{"receipt", "ride", "offer_read", "driver", "offer", "consent", "agreement", "reservation", "ride_write", "offer_write", "offer_reject", "receipt_write", "commit"}
	if !reflect.DeepEqual(tx.order, want) {
		t.Fatalf("lock/write order=%v want=%v", tx.order, want)
	}
}
func TestAcceptOfferFailsClosedForPolicyAndAuthorization(t *testing.T) {
	s, tx, c := validService(t)
	c.Consent = false
	if !IsCode(mustErr(s.AcceptOfferAndAssignDriver(context.Background(), c)), CodeConsentRequired) {
		t.Fatal("missing consent was not rejected")
	}
	s, tx, c = validService(t)
	c.ActorID = "other"
	if !IsCode(mustErr(s.AcceptOfferAndAssignDriver(context.Background(), c)), CodeForbidden) {
		t.Fatal("foreign rider was not rejected")
	}
	s, tx, c = validService(t)
	tx.offer.ExpiresAt = nil
	if !IsCode(mustErr(s.AcceptOfferAndAssignDriver(context.Background(), c)), CodePolicyUnavailable) {
		t.Fatal("missing expiry policy was not rejected")
	}
}
func TestAcceptOfferIdempotencyReplayAndConflict(t *testing.T) {
	s, tx, c := validService(t)
	first, err := s.AcceptOfferAndAssignDriver(context.Background(), c)
	if err != nil {
		t.Fatal(err)
	}
	replay := first
	tx2 := *tx
	tx2.order = nil
	tx2.receipt = tx.receipt
	s.store = fakeStore{tx: &tx2}
	got, err := s.AcceptOfferAndAssignDriver(context.Background(), c)
	if err != nil || got.Assignment.ID != replay.Assignment.ID {
		t.Fatalf("replay=%#v err=%v", got, err)
	}
	c.TermsFingerprint[0] = 9
	if !IsCode(mustErr(s.AcceptOfferAndAssignDriver(context.Background(), c)), CodeIdempotencyConflict) {
		t.Fatal("changed request was not conflicted")
	}
}
func TestAcceptOfferRollsBackOnReservationFailure(t *testing.T) {
	s, tx, c := validService(t)
	tx.failAt = "reservation"
	if _, err := s.AcceptOfferAndAssignDriver(context.Background(), c); err == nil {
		t.Fatal("injected reservation failure succeeded")
	}
	if !tx.rolledBack {
		t.Fatal("transaction was not rolled back")
	}
}
func mustErr(_ Result, err error) error { return err }
