package assignmenttest

import (
	"context"
	"crypto/rand"
	_ "embed"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema.sql
var fixtureDDL string

type postgresFixture struct {
	pool   *pgxpool.Pool
	schema string
	ids    map[string]string
}

func (f *postgresFixture) relation(table string) string {
	return pgx.Identifier{f.schema, table}.Sanitize()
}
func (f *postgresFixture) alias(id string) (string, error) {
	for k, v := range f.ids {
		if id == v {
			return k, nil
		}
	}
	return "", errors.New("unexpected identity in physical fixture snapshot")
}
func newPostgresFixture(ctx context.Context, pool *pgxpool.Pool) (*postgresFixture, error) {
	token := make([]byte, 16)
	if _, err := rand.Read(token); err != nil {
		return nil, err
	}
	f := &postgresFixture{pool: pool, schema: "p03_" + hex.EncodeToString(token), ids: map[string]string{}}
	for i, name := range []string{"r1", "r2", "d1", "d2", "rider1", "rider2", "driver1", "driver2", "o11", "o12", "o21"} {
		f.ids[name] = fmt.Sprintf("00000000-0000-4000-8000-%012d", i+1)
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		return f, err
	}
	defer rollback(tx)
	if _, err = tx.Exec(ctx, "CREATE SCHEMA "+pgx.Identifier{f.schema}.Sanitize()); err != nil {
		return f, err
	}
	if _, err = tx.Exec(ctx, strings.ReplaceAll(fixtureDDL, "__SCHEMA__", pgx.Identifier{f.schema}.Sanitize())); err != nil {
		return f, err
	}
	for _, d := range []string{"d1", "d2"} {
		actor := "driver1"
		if d == "d2" {
			actor = "driver2"
		}
		if _, err = tx.Exec(ctx, "INSERT INTO "+f.relation("drivers")+" VALUES($1,$2,'approved')", f.ids[d], f.ids[actor]); err != nil {
			return f, err
		}
	}
	for _, r := range []string{"r1", "r2"} {
		actor := "rider1"
		if r == "r2" {
			actor = "rider2"
		}
		if _, err = tx.Exec(ctx, "INSERT INTO "+f.relation("rides")+"(id,user_id,status,expires_at) VALUES($1,$2,'pending',clock_timestamp()+interval '1 hour')", f.ids[r], f.ids[actor]); err != nil {
			return f, err
		}
	}
	for _, o := range []struct{ id, r, d, price string }{{"o11", "r1", "driver1", "12.55"}, {"o12", "r1", "driver2", "17.77"}, {"o21", "r2", "driver1", "12.55"}} {
		if _, err = tx.Exec(ctx, "INSERT INTO "+f.relation("offers")+" VALUES($1,$2,$3,$4,'pending',clock_timestamp()+interval '1 hour')", f.ids[o.id], f.ids[o.r], f.ids[o.d], o.price); err != nil {
			return f, err
		}
	}
	return f, tx.Commit(ctx)
}
func (f *postgresFixture) Close(ctx context.Context) error {
	if len(f.schema) != 36 || !strings.HasPrefix(f.schema, "p03_") {
		return errors.New("refusing cleanup outside owned fixture prefix")
	}
	if _, err := hex.DecodeString(strings.TrimPrefix(f.schema, "p03_")); err != nil {
		return err
	}
	var owner string
	err := f.pool.QueryRow(ctx, "SELECT pg_catalog.pg_get_userbyid(nspowner) FROM pg_catalog.pg_namespace WHERE nspname=$1", f.schema).Scan(&owner)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if owner != "cruize_p03_test" {
		return errors.New("refusing cleanup of foreign-owned schema")
	}
	_, err = f.pool.Exec(ctx, "DROP SCHEMA "+pgx.Identifier{f.schema}.Sanitize()+" CASCADE")
	return err
}
func (f *postgresFixture) ExpireOffer(ctx context.Context, id string) error {
	value, ok := f.ids[id]
	if !ok {
		return errors.New("unknown fixture offer")
	}
	tag, err := f.pool.Exec(ctx, "UPDATE "+f.relation("offers")+" SET expires_at=clock_timestamp()-interval '1 second' WHERE id=$1", value)
	if err == nil && tag.RowsAffected() != 1 {
		return errors.New("expiry changed no row")
	}
	return err
}
func (f *postgresFixture) HoldDriver(ctx context.Context, id string) (func(string) error, error) {
	value, ok := f.ids[id]
	if !ok {
		return nil, errors.New("unknown fixture driver")
	}
	tx, err := f.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	var actual string
	if err = tx.QueryRow(ctx, "SELECT id::text FROM "+f.relation("drivers")+" WHERE id=$1 FOR UPDATE", value).Scan(&actual); err != nil {
		rollback(tx)
		return nil, err
	}
	var once sync.Once
	var outcome error
	return func(status string) error {
		once.Do(func() {
			if status != "approved" && status != "suspended" {
				outcome = errors.New("unsupported fixture status")
				rollback(tx)
				return
			}
			_, outcome = tx.Exec(ctx, "UPDATE "+f.relation("drivers")+" SET status=$2 WHERE id=$1", value, status)
			if outcome != nil {
				rollback(tx)
				return
			}
			outcome = tx.Commit(ctx)
		})
		return outcome
	}, nil
}
func rollback(tx pgx.Tx) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = tx.Rollback(ctx)
}
func (f *postgresFixture) State(ctx context.Context) (snapshot, error) {
	s := snapshot{Rides: map[string]ride{}, Reservations: map[string]string{}, ReservationAssignments: map[string]string{}, Receipts: map[string]string{}, Offers: map[string]string{}, Agreements: map[string]int{}}
	// A single read-only repeatable-read snapshot avoids mixing commits between queries.
	tx, err := f.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return s, err
	}
	defer rollback(tx)
	rows, err := tx.Query(ctx, "SELECT r.id::text,r.status,COALESCE(r.driver_id::text,''),COALESCE(r.assignment_id::text,''),COALESCE(a.amount_minor,0),COALESCE(a.currency,''),COALESCE(a.driver_id::text,''),COALESCE(a.ride_id::text,'') FROM "+f.relation("rides")+" r LEFT JOIN "+f.relation("accepted_agreements")+" a ON a.id=r.assignment_id")
	if err != nil {
		return s, err
	}
	for rows.Next() {
		var id, driver, agreementDriver, agreementRide string
		var r ride
		if err = rows.Scan(&id, &r.State, &driver, &r.Assignment, &r.Minor, &r.Currency, &agreementDriver, &agreementRide); err != nil {
			rows.Close()
			return s, err
		}
		if r.Assignment != "" && (driver != agreementDriver || id != agreementRide) {
			rows.Close()
			return s, errors.New("physical accepted agreement/ride/driver mismatch")
		}
		if driver != "" {
			r.Driver, err = f.alias(driver)
			if err != nil {
				rows.Close()
				return s, err
			}
		}
		name, e := f.alias(id)
		if e != nil {
			rows.Close()
			return s, e
		}
		s.Rides[name] = r
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return s, err
	}
	rows, err = tx.Query(ctx, "SELECT driver_id::text,ride_id::text,assignment_id::text FROM "+f.relation("active_driver_reservations"))
	if err != nil {
		return s, err
	}
	for rows.Next() {
		var d, r, a string
		if err = rows.Scan(&d, &r, &a); err != nil {
			rows.Close()
			return s, err
		}
		dn, e := f.alias(d)
		if e != nil {
			rows.Close()
			return s, e
		}
		rn, e := f.alias(r)
		if e != nil {
			rows.Close()
			return s, e
		}
		s.ReservationRows++
		s.Reservations[dn] = rn
		s.ReservationAssignments[dn] = a
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return s, err
	}
	var invalid int
	err = tx.QueryRow(ctx, "SELECT count(*) FROM "+f.relation("accepted_agreements")+" a LEFT JOIN "+f.relation("offers")+" o ON o.id=a.offer_id LEFT JOIN "+f.relation("drivers")+" d ON d.id=a.driver_id LEFT JOIN "+f.relation("rides")+" r ON r.id=a.ride_id WHERE o.id IS NULL OR d.id IS NULL OR o.ride_id<>a.ride_id OR o.driver_id<>d.user_id OR o.status<>'accepted' OR a.currency<>'USD' OR a.amount_minor::numeric<>o.price*100 OR r.assignment_id IS DISTINCT FROM a.id").Scan(&invalid)
	if err != nil {
		return s, err
	}
	if invalid != 0 {
		return s, errors.New("physical offer/auth-driver/exact-term agreement mismatch")
	}
	rows, err = tx.Query(ctx, "SELECT ride_id::text,count(*) FROM "+f.relation("accepted_agreements")+" GROUP BY ride_id")
	if err != nil {
		return s, err
	}
	for rows.Next() {
		var id string
		var n int
		if err = rows.Scan(&id, &n); err != nil {
			rows.Close()
			return s, err
		}
		name, e := f.alias(id)
		if e != nil {
			rows.Close()
			return s, e
		}
		s.Agreements[name] = n
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return s, err
	}
	rows, err = tx.Query(ctx, "SELECT id::text,status FROM "+f.relation("offers"))
	if err != nil {
		return s, err
	}
	for rows.Next() {
		var id, status string
		if err = rows.Scan(&id, &status); err != nil {
			rows.Close()
			return s, err
		}
		name, e := f.alias(id)
		if e != nil {
			rows.Close()
			return s, e
		}
		s.Offers[name] = status
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return s, err
	}
	rows, err = tx.Query(ctx, "SELECT actor_id::text,operation,idempotency_key,COALESCE(assignment_id::text,''),state FROM "+f.relation("command_receipts"))
	if err != nil {
		return s, err
	}
	for rows.Next() {
		var actor, op, key, a, status string
		if err = rows.Scan(&actor, &op, &key, &a, &status); err != nil {
			rows.Close()
			return s, err
		}
		if status != "committed" {
			rows.Close()
			return s, errors.New("pending receipt committed outside command transaction")
		}
		name, e := f.alias(actor)
		if e != nil {
			rows.Close()
			return s, e
		}
		s.Receipts[name+"/"+op+"/"+key] = a
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return s, err
	}
	return s, tx.Commit(ctx)
}
func validateSnapshot(s snapshot) error {
	if s.ReservationRows != len(s.Reservations) {
		return errors.New("reservation map hides duplicate physical rows")
	}
	for _, id := range []string{"r1", "r2"} {
		if _, ok := s.Rides[id]; !ok {
			return errors.New("physical snapshot lacks seeded ride")
		}
	}
	for id, r := range s.Rides {
		active := r.State == "accepted" || r.State == "arrived" || r.State == "in_progress"
		if active && (r.Driver == "" || r.Assignment == "" || r.Minor <= 0 || r.Currency == "" || s.Agreements[id] != 1 || s.Reservations[r.Driver] != id || s.ReservationAssignments[r.Driver] != r.Assignment) {
			return fmt.Errorf("active ride %s lacks consistent exact agreement/reservation", id)
		}
		if (r.State == "pending" || r.State == "scheduled") && (s.Agreements[id] != 0 || r.Driver != "" || r.Assignment != "") {
			return errors.New("uncommitted assignment persisted on unassigned ride")
		}
	}
	for d, id := range s.Reservations {
		r, ok := s.Rides[id]
		if !ok || r.Driver != d || (r.State != "accepted" && r.State != "arrived" && r.State != "in_progress") {
			return errors.New("orphan or terminal reservation")
		}
	}
	return nil
}
func TestPostgresFixtureStorage(t *testing.T) {
	ctx, pool := verifiedPool(t)
	f := storageFixture(t, ctx, pool)
	s, err := f.State(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err = validateSnapshot(s); err != nil {
		t.Fatal(err)
	}
	if len(s.Reservations) != 0 || len(s.Receipts) != 0 || len(s.Offers) != 3 {
		t.Fatal("incorrect seed state")
	}
	var version string
	if err = pool.QueryRow(ctx, "SELECT version()").Scan(&version); err != nil {
		t.Fatal(err)
	}
	t.Log("fixture engine:", version)
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer rollback(tx)
	for i, values := range []struct{ r, o string }{{"r1", "o11"}, {"r2", "o21"}} {
		id := fmt.Sprintf("00000000-0000-4000-9000-%012d", i+1)
		if _, err = tx.Exec(ctx, "INSERT INTO "+f.relation("accepted_agreements")+" VALUES($1,$2,$3,$4,1255,'USD')", id, f.ids[values.r], f.ids["d1"], f.ids[values.o]); err != nil {
			t.Fatal(err)
		}
	}
	if _, err = tx.Exec(ctx, "INSERT INTO "+f.relation("active_driver_reservations")+" VALUES($1,$2,'00000000-0000-4000-9000-000000000001')", f.ids["d1"], f.ids["r1"]); err != nil {
		t.Fatal(err)
	}
	if _, err = tx.Exec(ctx, "SAVEPOINT duplicate_check"); err != nil {
		t.Fatal(err)
	}
	_, err = tx.Exec(ctx, "INSERT INTO "+f.relation("active_driver_reservations")+" VALUES($1,$2,'00000000-0000-4000-9000-000000000002')", f.ids["d1"], f.ids["r2"])
	var pgerr *pgconn.PgError
	if !errors.As(err, &pgerr) || pgerr.Code != "23505" {
		t.Fatalf("real driver uniqueness violation expected; got %v", err)
	}
	if _, err = tx.Exec(ctx, "ROLLBACK TO SAVEPOINT duplicate_check"); err != nil {
		t.Fatal(err)
	}
	if err = tx.Rollback(ctx); err != nil {
		t.Fatal(err)
	}
	s, err = f.State(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(s.Reservations) != 0 || len(s.Agreements) != 0 {
		t.Fatal("real rollback left assignment data")
	}
}
func TestSnapshotRejectsBrokenInvariants(t *testing.T) {
	valid := func() snapshot {
		return snapshot{Rides: map[string]ride{"r1": {State: "pending"}, "r2": {State: "pending"}}, Reservations: map[string]string{}, ReservationAssignments: map[string]string{}, Agreements: map[string]int{}}
	}
	s := valid()
	if err := validateSnapshot(s); err != nil {
		t.Fatal(err)
	}
	s = valid()
	s.ReservationRows = 2
	if validateSnapshot(s) == nil {
		t.Fatal("duplicate physical rows accepted")
	}
	s = valid()
	s.Rides["r1"] = ride{State: "accepted", Driver: "d1", Assignment: "a", Currency: "USD", Minor: 1255}
	if validateSnapshot(s) == nil {
		t.Fatal("missing reservation accepted")
	}
	s = valid()
	s.Reservations["d1"] = "r1"
	s.ReservationRows = 1
	if validateSnapshot(s) == nil {
		t.Fatal("pending-ride reservation accepted")
	}
}
