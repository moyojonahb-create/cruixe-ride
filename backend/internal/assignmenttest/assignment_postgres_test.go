// Package assignmenttest contains PostgreSQL conformance tests only. It adds no
// assignment implementation, server route, production SQL or fallback writer.
package assignmenttest

import (
	"context"
	"errors"
	"net"
	"os"
	"regexp"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type command struct{ Operation, Actor, Ride, Offer, Key, Instance string }
type result struct{ Code, Assignment string }
type ride struct {
	State, Driver, Assignment, Currency string
	Minor                               int64
}
type snapshot struct {
	Rides                  map[string]ride
	Reservations           map[string]string // driver row identity -> ride identity
	ReservationAssignments map[string]string // driver -> physical assignment identity
	Receipts               map[string]string // actor/operation/key -> stable assignment identity
	ReservationRows        int               // direct SQL count, prevents maps hiding duplicate physical rows
	Offers                 map[string]string // offer ID -> committed status
	Agreements             map[string]int    // ride ID -> direct SQL agreement count
}

// Implement this fixture adapter only after the shared authority is reviewed.
// All commands MUST call that actual authority against PostgreSQL, each on an
// independent connection (Instance distinguishes gateway/service instances).
// Physical setup/state/locks/cleanup are supplied by postgresFixture, not the adapter.
// Its random isolated schema seeds r1/rider1, r2/rider2,
// d1/driver1, d2/driver2, o11(r1,d1), o12(r1,d2), o21(r2,d1), o11/o21 USD1255 and o12 USD1777 minor units.
// This fixture currency is not approval for a new product currency policy.
// Pause and WaitBlocked must observe actual transaction/row-lock boundaries;
// arbitrary sleeps or a process mutex are not substitutes for DB contention.
// All pause/failure/driver-lock release closures are idempotent; first driver release wins.
// Observation IDs are Instance+":"+Key; gateway identity is excluded from receipt hashes.
// Adapter Close releases its connections/hooks; the physical fixture then drops its schema.
type commandAdapter interface {
	Run(context.Context, command) (result, error)
	Pause(context.Context, string, string) (<-chan struct{}, func(), error)
	WaitBlocked(context.Context, string, string) error
	FailAfter(context.Context, string) (func(), error)
	ExpireRealRedisDispatchLease(context.Context, string) error
	Close(context.Context) error
}

// Deliberately unset: no parallel reference assignment implementation is supplied.
// A verified DB with no candidate adapter FAILS; it never produces a fake PASS.
var candidateFixture func(context.Context, *postgresFixture) (commandAdapter, error)

type assignmentFixture interface {
	commandAdapter
	State(context.Context) (snapshot, error)
	HoldDriver(context.Context, string) (func(string) error, error)
	ExpireOffer(context.Context, string) error
}
type databaseFixture struct {
	commandAdapter
	store *postgresFixture
}

func (f databaseFixture) State(ctx context.Context) (snapshot, error) { return f.store.State(ctx) }
func (f databaseFixture) HoldDriver(ctx context.Context, id string) (func(string) error, error) {
	return f.store.HoldDriver(ctx, id)
}
func (f databaseFixture) ExpireOffer(ctx context.Context, id string) error {
	return f.store.ExpireOffer(ctx, id)
}
func validateDestination(cfg *pgxpool.Config) error {
	if cfg.ConnConfig.Database != "cruize_p03_test" {
		return errors.New("exact disposable test database required")
	}
	local := func(host string) bool { ip := net.ParseIP(host); return ip != nil && ip.IsLoopback() }
	if !local(cfg.ConnConfig.Host) {
		return errors.New("literal loopback endpoint required; use an approved SSH tunnel for remote tests")
	}
	for _, fallback := range cfg.ConnConfig.Fallbacks {
		if !local(fallback.Host) {
			return errors.New("remote fallback refused")
		}
	}
	return nil
}
func verifiedPool(t *testing.T) (context.Context, *pgxpool.Pool) {
	t.Helper()
	dsn := os.Getenv("CRUIZE_P03_TEST_DSN")
	if dsn == "" {
		t.Skip("real PostgreSQL integration not run: CRUIZE_P03_TEST_DSN absent; candidate adapter also pending")
	}
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		t.Fatal("invalid explicit test DSN")
	}
	if err := validateDestination(cfg); err != nil {
		t.Fatal(err)
	}
	cfg.MaxConns = 4
	if cfg.ConnConfig.User != "cruize_p03_test" {
		t.Fatal("explicit disposable test role required before connecting")
	}
	token := os.Getenv("CRUIZE_P03_RUN_TOKEN")
	if !regexp.MustCompile(`^[a-f0-9]{64}$`).MatchString(token) {
		t.Fatal("explicit per-run nonproduction token required before connecting")
	}
	cfg.ConnConfig.RuntimeParams = map[string]string{"application_name": "cruize-p03-conformance", "search_path": "pg_catalog"}
	cfg.ConnConfig.RuntimeParams["statement_timeout"] = "10000"
	cfg.ConnConfig.RuntimeParams["lock_timeout"] = "3000"
	cfg.ConnConfig.RuntimeParams["idle_in_transaction_session_timeout"] = "15000"
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal("cannot create disposable test pool")
	}
	t.Cleanup(pool.Close)
	var database, role, sessionRole, marker, runToken string
	var privileged bool
	err = pool.QueryRow(ctx, `SELECT current_database(),current_user,session_user,
 (SELECT value FROM cruize_test_guard.metadata WHERE key='environment'),
 (SELECT value FROM cruize_test_guard.metadata WHERE key='run_token'),
 (SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls FROM pg_catalog.pg_roles WHERE rolname=current_user)`).Scan(&database, &role, &sessionRole, &marker, &runToken, &privileged)
	if err != nil || database != "cruize_p03_test" || role != "cruize_p03_test" || sessionRole != role || marker != "p03-disposable-v1" || runToken != token || privileged {
		t.Fatal("unverified disposable DB/role/privileges/per-run marker; no fixture writes")
	}
	return ctx, pool
}
func storageFixture(t *testing.T, ctx context.Context, pool *pgxpool.Pool) *postgresFixture {
	t.Helper()
	store, err := newPostgresFixture(ctx, pool)
	if store != nil {
		t.Cleanup(func() {
			cleanup, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			if e := store.Close(cleanup); e != nil {
				t.Error(e)
			}
		})
	}
	if err != nil {
		t.Fatal(err)
	}
	return store
}
func fixture(t *testing.T) (context.Context, assignmentFixture) {
	t.Helper()
	ctx, pool := verifiedPool(t)
	if candidateFixture == nil {
		t.Fatal("BLOCKED: reviewed shared-authority command adapter missing; no copied SQL/mock authority permitted")
	}
	store := storageFixture(t, ctx, pool)
	adapter, err := candidateFixture(ctx, store)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := adapter.Close(cleanup); err != nil {
			t.Error(err)
		}
	})
	return ctx, databaseFixture{commandAdapter: adapter, store: store}
}
func TestDestinationGuard(t *testing.T) {
	for _, tc := range []struct {
		dsn     string
		allowed bool
	}{
		{"postgres://test@127.0.0.1/cruize_p03_test", true},
		{"postgres://test@[::1]/cruize_p03_test", true},
		{"postgres://test@192.0.2.1/cruize_p03_test", false},
		{"postgres://test@127.0.0.1/postgres", false},
		{"postgres://test@localhost/cruize_p03_test", false},
	} {
		cfg, err := pgxpool.ParseConfig(tc.dsn)
		if err != nil {
			t.Fatal(err)
		}
		if (validateDestination(cfg) == nil) != tc.allowed {
			t.Errorf("destination guard mismatch for %s", tc.dsn)
		}
	}
}
func accept(rideID, offerID, actor, key string) command {
	return command{"accept", actor, rideID, offerID, key, "gateway-a"}
}
func run(t *testing.T, ctx context.Context, f assignmentFixture, c command) result {
	t.Helper()
	r, err := f.Run(ctx, c)
	if err != nil {
		t.Fatal(err)
	}
	return r
}
func state(t *testing.T, ctx context.Context, f assignmentFixture) snapshot {
	t.Helper()
	s, err := f.State(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err := validateSnapshot(s); err != nil {
		t.Fatal(err)
	}
	return s
}
func want(t *testing.T, r result, code string) {
	t.Helper()
	if r.Code != code {
		t.Fatalf("code=%s want=%s", r.Code, code)
	}
}

type outcome struct {
	r   result
	err error
}

func async(ctx context.Context, f assignmentFixture, c command) <-chan outcome {
	ch := make(chan outcome, 1)
	go func() { r, e := f.Run(ctx, c); ch <- outcome{r, e} }()
	return ch
}
func await(t *testing.T, ctx context.Context, ch <-chan outcome) result {
	t.Helper()
	select {
	case o := <-ch:
		if o.err != nil {
			t.Fatal(o.err)
		}
		return o.r
	case <-ctx.Done():
		t.Fatal("command did not finish before test deadline")
		return result{}
	}
}

// First command holds the real lock. WaitBlocked proves the second contends on
// PostgreSQL before releasing the first; it must not merely signal goroutine start.
func race(t *testing.T, ctx context.Context, f assignmentFixture, a, b command, blockedOn string) (result, result) {
	t.Helper()
	if a.Instance == b.Instance && a.Key == b.Key {
		b.Instance = "gateway-b"
	}
	reached, release, err := f.Pause(ctx, a.Instance+":"+a.Key, "after_driver_lock")
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	first := async(ctx, f, a)
	select {
	case <-reached:
	case <-ctx.Done():
		t.Fatal("lock hook not reached")
	}
	second := async(ctx, f, b)
	if err := f.WaitBlocked(ctx, b.Instance+":"+b.Key, blockedOn); err != nil {
		t.Fatal(err)
	}
	release()
	return await(t, ctx, first), await(t, ctx, second)
}
func TestTwoRidersOneDriver(t *testing.T) {
	ctx, f := fixture(t)
	a, b := race(t, ctx, f, accept("r1", "o11", "rider1", "a"), accept("r2", "o21", "rider2", "b"), "driver")
	want(t, a, "OK")
	want(t, b, "DRIVER_BUSY")
	s := state(t, ctx, f)
	if len(s.Reservations) != 1 || s.Reservations["d1"] != "r1" || s.Rides["r1"].State != "accepted" || s.Rides["r2"].State != "pending" {
		t.Fatal("multiple/partial assignments")
	}
}
func TestTwoOffersOneRide(t *testing.T) {
	ctx, f := fixture(t)
	a, b := race(t, ctx, f, accept("r1", "o11", "rider1", "a"), accept("r1", "o12", "rider1", "b"), "ride")
	want(t, a, "OK")
	want(t, b, "INVALID_STATE")
	s := state(t, ctx, f)
	if s.Offers["o11"] != "accepted" || s.Offers["o12"] != "rejected" {
		t.Fatal("competing offer statuses not committed atomically")
	}
	if len(s.Reservations) != 1 || s.Rides["r1"].Minor != 1255 || s.Rides["r1"].Currency != "USD" {
		t.Fatal("assignment/accepted exact terms mismatch")
	}
}
func TestAcceptanceVersusCancellation(t *testing.T) {
	t.Run("accept_then_cancel", func(t *testing.T) {
		ctx, f := fixture(t)
		a, b := race(t, ctx, f, accept("r1", "o11", "rider1", "a"), command{"cancel", "rider1", "r1", "", "b", "gateway-b"}, "ride")
		want(t, a, "OK")
		want(t, b, "OK")
		s := state(t, ctx, f)
		if s.Rides["r1"].State != "cancelled" || len(s.Reservations) != 0 {
			t.Fatal("cancel did not release exact reservation")
		}
	})
	t.Run("cancel_before_accept", func(t *testing.T) {
		ctx, f := fixture(t)
		want(t, run(t, ctx, f, command{"cancel", "rider1", "r1", "", "c", "gateway-a"}), "OK")
		want(t, run(t, ctx, f, accept("r1", "o11", "rider1", "a")), "INVALID_STATE")
		s := state(t, ctx, f)
		if len(s.Reservations) != 0 || s.Rides["r1"].State != "cancelled" || s.Agreements["r1"] != 0 {
			t.Fatal("terminal ride resurrected")
		}
	})
}
func TestAcceptanceVersusExpiry(t *testing.T) {
	ctx, f := fixture(t)
	release, err := f.HoldDriver(ctx, "d1")
	if err != nil {
		t.Fatal(err)
	}
	defer release("approved")
	ch := async(ctx, f, accept("r1", "o11", "rider1", "a"))
	if err := f.WaitBlocked(ctx, "gateway-a:a", "driver"); err != nil {
		t.Fatal(err)
	}
	if err := f.ExpireOffer(ctx, "o11"); err != nil {
		t.Fatal(err)
	}
	if err := release("approved"); err != nil {
		t.Fatal(err)
	}
	want(t, await(t, ctx, ch), "OFFER_EXPIRED")
	s := state(t, ctx, f)
	if len(s.Reservations) != 0 || s.Rides["r1"].State != "pending" || s.Agreements["r1"] != 0 || s.Offers["o11"] == "accepted" {
		t.Fatal("expired offer reserved driver")
	}
}
func TestSuspensionDuringAssignment(t *testing.T) {
	ctx, f := fixture(t)
	release, err := f.HoldDriver(ctx, "d1")
	if err != nil {
		t.Fatal(err)
	}
	defer release("approved")
	ch := async(ctx, f, accept("r1", "o11", "rider1", "a"))
	if err := f.WaitBlocked(ctx, "gateway-a:a", "driver"); err != nil {
		t.Fatal(err)
	}
	if err := release("suspended"); err != nil {
		t.Fatal(err)
	}
	want(t, await(t, ctx, ch), "DRIVER_INELIGIBLE")
	s := state(t, ctx, f)
	if len(s.Reservations) != 0 || s.Rides["r1"].State != "pending" || s.Agreements["r1"] != 0 || s.Offers["o11"] == "accepted" {
		t.Fatal("suspended driver assigned")
	}
}
func TestRedisDispatchLeaseExpiry(t *testing.T) {
	ctx, f := fixture(t)
	if err := f.ExpireRealRedisDispatchLease(ctx, "d1"); err != nil {
		t.Fatal(err)
	}
	a, b := race(t, ctx, f, accept("r1", "o11", "rider1", "a"), accept("r2", "o21", "rider2", "b"), "driver")
	want(t, a, "OK")
	want(t, b, "DRIVER_BUSY")
	if len(state(t, ctx, f).Reservations) != 1 {
		t.Fatal("Redis expiry bypassed PostgreSQL exclusivity")
	}
}
func TestTransactionRollback(t *testing.T) {
	ctx, f := fixture(t)
	clear, err := f.FailAfter(ctx, "reservation_insert")
	if err != nil {
		t.Fatal(err)
	}
	defer clear()
	r, err := f.Run(ctx, accept("r1", "o11", "rider1", "a"))
	if err == nil && r.Code == "OK" {
		t.Fatal("injected transaction failure succeeded")
	}
	s := state(t, ctx, f)
	if len(s.Reservations) != 0 || s.Rides["r1"].State != "pending" || len(s.Receipts) != 0 || len(s.Agreements) != 0 || s.Offers["o11"] != "pending" || s.Offers["o12"] != "pending" {
		t.Fatal("rollback left partial assignment/receipt")
	}
	clear()
	want(t, run(t, ctx, f, accept("r1", "o11", "rider1", "retry")), "OK")
}
func TestDuplicateIdempotencyKeys(t *testing.T) {
	ctx, f := fixture(t)
	c := accept("r1", "o11", "rider1", "same")
	a, b := race(t, ctx, f, c, c, "receipt")
	want(t, a, "OK")
	want(t, b, "OK")
	if a.Assignment == "" || a.Assignment != b.Assignment {
		t.Fatal("replay changed assignment")
	}
	c.Offer = "o12"
	want(t, run(t, ctx, f, c), "IDEMPOTENCY_CONFLICT")
	s := state(t, ctx, f)
	if len(s.Reservations) != 1 || len(s.Receipts) != 1 || s.Receipts["rider1/accept/same"] != a.Assignment || s.Rides["r1"].Assignment != a.Assignment {
		t.Fatal("replay changed physical assignment or committed receipt")
	}
}
func TestCompletionReleasesDriver(t *testing.T) {
	ctx, f := fixture(t)
	want(t, run(t, ctx, f, accept("r1", "o11", "rider1", "a")), "OK")
	want(t, run(t, ctx, f, command{"start", "driver1", "r1", "", "s", "gateway-a"}), "OK")
	want(t, run(t, ctx, f, command{"complete", "driver1", "r1", "", "done", "gateway-a"}), "OK")
	s := state(t, ctx, f)
	if s.Rides["r1"].State != "completed" || len(s.Reservations) != 0 {
		t.Fatal("completion left reservation")
	}
	want(t, run(t, ctx, f, accept("r2", "o21", "rider2", "b")), "OK")
	s = state(t, ctx, f)
	if s.Reservations["d1"] != "r2" || s.Rides["r1"].State != "completed" || s.Agreements["r1"] != 1 {
		t.Fatal("driver reuse lost reservation or historical agreement")
	}
}
func TestConflictingCrossInstanceRequests(t *testing.T) {
	ctx, f := fixture(t)
	a := accept("r1", "o11", "rider1", "a")
	b := accept("r2", "o21", "rider2", "b")
	b.Instance = "gateway-b"
	x, y := race(t, ctx, f, a, b, "driver")
	want(t, x, "OK")
	want(t, y, "DRIVER_BUSY")
	if len(state(t, ctx, f).Reservations) != 1 {
		t.Fatal("cross-instance duplicate assignment")
	}
}
