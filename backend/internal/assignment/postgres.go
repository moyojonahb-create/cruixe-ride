package assignment

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostgresConfig describes the private, inactive assignment schema.
type PostgresConfig struct{ Schema, Currency string }

type PostgresStore struct {
	pool *pgxpool.Pool
	cfg  PostgresConfig
}
type postgresTx struct {
	tx  pgx.Tx
	cfg PostgresConfig
}

func NewPostgresStore(pool *pgxpool.Pool, cfg PostgresConfig) (*PostgresStore, error) {
	if pool == nil {
		return nil, errors.New("postgres pool is required")
	}
	if strings.TrimSpace(cfg.Schema) == "" || len(cfg.Currency) != 3 || cfg.Currency != strings.ToUpper(cfg.Currency) {
		return nil, errors.New("schema and uppercase currency are required")
	}
	return &PostgresStore{pool: pool, cfg: cfg}, nil
}
func (s *PostgresStore) Begin(ctx context.Context) (Tx, error) {
	tx, e := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if e != nil {
		return nil, mapPGError(e)
	}
	return &postgresTx{tx: tx, cfg: s.cfg}, nil
}
func (t *postgresTx) table(n string) string { return pgx.Identifier{t.cfg.Schema, n}.Sanitize() }
func mapPGError(err error) error {
	var pe *pgconn.PgError
	if errors.As(err, &pe) {
		switch pe.Code {
		case "23505":
			return domain(CodeDriverBusy, err)
		case "23503", "23514":
			return domain(CodeInvalidState, err)
		case "40001", "40P01":
			return domain(CodeTemporarilyUnavailable, err)
		}
	}
	return err
}
func parseMoney(v string, currency string) (Money, error) {
	s := strings.TrimSpace(v)
	if s == "" {
		return Money{}, errors.New("empty amount")
	}
	parts := strings.Split(s, ".")
	if len(parts) > 2 || len(parts[0]) == 0 {
		return Money{}, errors.New("invalid decimal")
	}
	frac := ""
	if len(parts) == 2 {
		frac = parts[1]
	}
	if len(frac) > 2 {
		return Money{}, errors.New("more than two decimals")
	}
	for len(frac) < 2 {
		frac += "0"
	}
	neg := strings.HasPrefix(parts[0], "-")
	whole := strings.TrimPrefix(parts[0], "-")
	if whole == "" {
		whole = "0"
	}
	n := new(big.Int)
	if _, ok := n.SetString(whole+frac, 10); !ok {
		return Money{}, errors.New("invalid decimal")
	}
	if neg {
		n.Neg(n)
	}
	if !n.IsInt64() {
		return Money{}, errors.New("amount overflow")
	}
	m := Money{Minor: n.Int64(), Currency: currency}
	return m, m.Validate()
}
func (t *postgresTx) LockReceipt(ctx context.Context, k ReceiptKey, h [32]byte) (Receipt, bool, error) {
	q := fmt.Sprintf("INSERT INTO %s(actor_id,operation,idempotency_key,request_hash,state,created_at) VALUES($1,$2,$3,$4,'pending',now()) ON CONFLICT DO NOTHING", t.table("command_receipts"))
	tag, e := t.tx.Exec(ctx, q, k.ActorID, k.Operation, k.IdempotencyKey, h[:])
	if e != nil {
		return Receipt{}, false, mapPGError(e)
	}
	inserted := tag.RowsAffected() == 1
	q = fmt.Sprintf("SELECT request_hash,state,assignment_id,result FROM %s WHERE actor_id=$1 AND operation=$2 AND idempotency_key=$3 FOR UPDATE", t.table("command_receipts"))
	var raw []byte
	var state string
	var aid *string
	var result []byte
	if e := t.tx.QueryRow(ctx, q, k.ActorID, k.Operation, k.IdempotencyKey).Scan(&raw, &state, &aid, &result); e != nil {
		return Receipt{}, false, mapPGError(e)
	}
	r := Receipt{Key: k, State: state}
	copy(r.RequestHash[:], raw)
	if aid != nil {
		r.Result.Assignment.ID = *aid
	}
	if len(result) > 0 {
		_ = json.Unmarshal(result, &r.Result)
	}
	return r, !inserted, nil
}

func (t *postgresTx) LockRide(ctx context.Context, id string) (Ride, error) {
	var r Ride
	q := "SELECT id,user_id,status FROM public.rides WHERE id=$1 FOR UPDATE"
	e := t.tx.QueryRow(ctx, q, id).Scan(&r.ID, &r.OwnerID, &r.Status)
	if e == pgx.ErrNoRows {
		return r, domain(CodeNotFound, e)
	}
	return r, mapPGError(e)
}
func (t *postgresTx) readOffer(ctx context.Context, id, ride string, lock bool) (Offer, error) {
	var o Offer
	var price string
	var exp *time.Time
	q := "SELECT id,ride_id,driver_id,status,price::text,expires_at FROM public.offers WHERE id=$1"
	if lock {
		q += " FOR UPDATE"
	}
	e := t.tx.QueryRow(ctx, q, id).Scan(&o.ID, &o.RideID, &o.DriverAuthID, &o.Status, &price, &exp)
	if e == pgx.ErrNoRows {
		return o, domain(CodeNotFound, e)
	}
	if e != nil {
		return o, mapPGError(e)
	}
	o.ExpiresAt = exp
	o.Price, e = parseMoney(price, t.cfg.Currency)
	if e != nil {
		return o, domain(CodePolicyUnavailable, e)
	}
	if ride != "" && o.RideID != ride {
		return o, domain(CodeNotFound, errors.New("offer ride mismatch"))
	}
	return o, nil
}
func (t *postgresTx) ReadOffer(ctx context.Context, id string) (Offer, error) {
	return t.readOffer(ctx, id, "", false)
}
func (t *postgresTx) LockOffer(ctx context.Context, ride, id string) (Offer, error) {
	return t.readOffer(ctx, id, ride, true)
}
func (t *postgresTx) LockDriver(ctx context.Context, auth string) (Driver, error) {
	var d Driver
	var status string
	q := "SELECT id,user_id,status FROM public.drivers WHERE user_id=$1 FOR UPDATE"
	e := t.tx.QueryRow(ctx, q, auth).Scan(&d.RowID, &d.AuthID, &status)
	if e == pgx.ErrNoRows {
		return d, domain(CodeNotFound, e)
	}
	if e != nil {
		return d, mapPGError(e)
	}
	d.Approved = status == "approved"
	d.Eligible = d.Approved
	return d, nil
}
func (t *postgresTx) VerifyConsent(context.Context, Ride, Offer, [32]byte) error {
	return domain(CodePolicyUnavailable, errors.New("consent policy must be supplied by reviewed storage contract"))
}
func (t *postgresTx) InsertAgreement(ctx context.Context, a Assignment) error {
	q := fmt.Sprintf("INSERT INTO %s(id,ride_id,driver_id,offer_id,amount_minor,currency,terms_fingerprint,accepted_at) VALUES($1,$2,$3,$4,$5,$6,$7,now())", t.table("accepted_agreements"))
	_, e := t.tx.Exec(ctx, q, a.ID, a.RideID, a.DriverID, a.OfferID, a.Amount.Minor, a.Amount.Currency, a.TermsFingerprint[:])
	return mapPGError(e)
}
func (t *postgresTx) ReserveDriver(ctx context.Context, a Assignment) error {
	q := fmt.Sprintf("INSERT INTO %s(driver_id,ride_id,assignment_id,reserved_at) VALUES($1,$2,$3,now())", t.table("active_driver_reservations"))
	_, e := t.tx.Exec(ctx, q, a.DriverID, a.RideID, a.ID)
	return mapPGError(e)
}
func (t *postgresTx) AssignRide(ctx context.Context, a Assignment) error {
	q := "UPDATE public.rides SET driver_id=$1,status='accepted',fare=$2 WHERE id=$3 AND status='pending'"
	r, e := t.tx.Exec(ctx, q, a.DriverID, fmt.Sprintf("%d.%02d", a.Amount.Minor/100, a.Amount.Minor%100), a.RideID)
	if e != nil {
		return mapPGError(e)
	}
	if r.RowsAffected() != 1 {
		return domain(CodeInvalidState, errors.New("ride assignment conflict"))
	}
	return nil
}
func (t *postgresTx) AcceptOffer(ctx context.Context, a Assignment) error {
	q := "UPDATE public.offers SET status='accepted' WHERE id=$1 AND ride_id=$2 AND status='pending'"
	r, e := t.tx.Exec(ctx, q, a.OfferID, a.RideID)
	if e != nil {
		return mapPGError(e)
	}
	if r.RowsAffected() != 1 {
		return domain(CodeInvalidState, errors.New("offer assignment conflict"))
	}
	return nil
}
func (t *postgresTx) RejectOtherOffers(ctx context.Context, ride, keep string) error {
	_, e := t.tx.Exec(ctx, "UPDATE public.offers SET status='rejected' WHERE ride_id=$1 AND id<>$2 AND status='pending'", ride, keep)
	return mapPGError(e)
}
func (t *postgresTx) CommitReceipt(ctx context.Context, r Receipt) error {
	b, e := json.Marshal(r.Result)
	if e != nil {
		return e
	}
	q := fmt.Sprintf("UPDATE %s SET request_hash=$1,state='committed',assignment_id=$2,result=$3 WHERE actor_id=$4 AND operation=$5 AND idempotency_key=$6 AND state='pending'", t.table("command_receipts"))
	x, e := t.tx.Exec(ctx, q, r.RequestHash[:], r.Result.Assignment.ID, b, r.Key.ActorID, r.Key.Operation, r.Key.IdempotencyKey)
	if e != nil {
		return mapPGError(e)
	}
	if x.RowsAffected() != 1 {
		return domain(CodeTemporarilyUnavailable, errors.New("receipt was not pending"))
	}
	return nil
}
func (t *postgresTx) Commit(ctx context.Context) error   { return mapPGError(t.tx.Commit(ctx)) }
func (t *postgresTx) Rollback(ctx context.Context) error { return t.tx.Rollback(ctx) }

var _ Store = (*PostgresStore)(nil)
