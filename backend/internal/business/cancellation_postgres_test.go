package business

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"pickme-backend/internal/middleware"
)

// These opt-in tests use actual PostgreSQL transactions. They never create a
// database or start infrastructure. Supply CRUIZE_P01_TEST_DSN for a disposable
// local database named exactly cruize_p01_test; otherwise tests explicitly skip.
type cancellationPostgresFixture struct {
	pool   *pgxpool.Pool
	schema string
}

func cancellationPostgres(t *testing.T) *cancellationPostgresFixture {
	t.Helper()
	dsn := os.Getenv("CRUIZE_P01_TEST_DSN")
	if dsn == "" {
		t.Skip("PostgreSQL integration skipped: set CRUIZE_P01_TEST_DSN to disposable local cruize_p01_test")
	}
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		t.Fatalf("invalid disposable PostgreSQL configuration: %v", err)
	}
	local := func(host string) bool { return host == "127.0.0.1" || host == "localhost" || host == "::1" }
	if config.ConnConfig.Database != "cruize_p01_test" || !local(config.ConnConfig.Host) {
		t.Fatal("refusing database access: tests require localhost/127.0.0.1/::1 and database exactly cruize_p01_test")
	}
	for _, fallback := range config.ConnConfig.Fallbacks {
		if !local(fallback.Host) {
			t.Fatal("refusing database access: nonlocal PostgreSQL fallback host")
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	// Validate all destinations before making any connection.
	admin, err := pgx.ConnectConfig(ctx, config.ConnConfig.Copy())
	if err != nil {
		t.Fatalf("connect disposable local PostgreSQL: %v", err)
	}
	token := make([]byte, 12)
	if _, err := rand.Read(token); err != nil {
		_ = admin.Close(ctx)
		t.Fatal(err)
	}
	schema := "p01_cancel_" + hex.EncodeToString(token)
	quoted := pgx.Identifier{schema}.Sanitize()
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+quoted); err != nil {
		_ = admin.Close(ctx)
		t.Fatal(err)
	}
	var pool *pgxpool.Pool
	t.Cleanup(func() {
		// No test connection remains when this uniquely created schema is removed.
		if pool != nil {
			pool.Close()
		}
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cleanupCancel()
		defer admin.Close(cleanupCtx)
		if _, err := admin.Exec(cleanupCtx, "DROP SCHEMA "+quoted+" CASCADE"); err != nil {
			t.Errorf("remove isolated test schema %s: %v", schema, err)
		}
	})
	if _, err := admin.Exec(ctx, `CREATE TABLE `+quoted+`.drivers (id text PRIMARY KEY, user_id text NOT NULL);
 CREATE TABLE `+quoted+`.rides (
 id text PRIMARY KEY, user_id text NOT NULL, driver_id text REFERENCES `+quoted+`.drivers(id),
 status text NOT NULL, cancellation_fee numeric NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now());
 INSERT INTO `+quoted+`.drivers(id,user_id) VALUES ('driver-row','driver-auth')`); err != nil {
		t.Fatal(err)
	}
	config.MaxConns = 4
	pool, err = pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	return &cancellationPostgresFixture{pool: pool, schema: quoted}
}

// Only relation names change; the actual handler SQL, predicates, transaction
// boundaries, and committed identity/callback path execute against PostgreSQL.
type isolatedCancellationTx struct {
	pgx.Tx
	schema string
}

func (tx isolatedCancellationTx) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	sql = strings.ReplaceAll(sql, "public.rides", tx.schema+".rides")
	sql = strings.ReplaceAll(sql, "public.drivers", tx.schema+".drivers")
	return tx.Tx.QueryRow(ctx, sql, args...)
}
func (f *cancellationPostgresFixture) app(callback RideCancelledCallback) *fiber.App {
	h := &Handler{beginCancellation: func(ctx context.Context, options pgx.TxOptions) (pgx.Tx, error) {
		tx, err := f.pool.BeginTx(ctx, options)
		if err != nil {
			return nil, err
		}
		return isolatedCancellationTx{Tx: tx, schema: f.schema}, nil
	}, onRideCancelled: callback}
	app := fiber.New()
	app.Post("/api/rides/:rideId/cancel", func(c *fiber.Ctx) error { c.Locals(middleware.LocalsAuthSubject, "rider-auth"); return h.CancelRide(c) })
	return app
}
func (f *cancellationPostgresFixture) insert(t *testing.T, id, state string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := f.pool.Exec(ctx, "INSERT INTO "+f.schema+".rides(id,user_id,driver_id,status,cancellation_fee) VALUES ($1,'rider-auth','driver-row',$2,12.34)", id, state)
	if err != nil {
		t.Fatal(err)
	}
}
func postgresCancel(app *fiber.App, id string) (int, error) {
	response, err := app.Test(httptest.NewRequest("POST", "/api/rides/"+id+"/cancel", nil), 10000)
	if err != nil {
		return 0, err
	}
	defer response.Body.Close()
	return response.StatusCode, nil
}

func TestPostgresConcurrentCancellationHasOneCommittedEffect(t *testing.T) {
	f := cancellationPostgres(t)
	f.insert(t, "duplicate", "accepted")
	var callbacks atomic.Int32
	app := f.app(func(_ context.Context, ride, rider, driver string) {
		if ride != "duplicate" || rider != "rider-auth" || driver != "driver-auth" {
			t.Errorf("wrong committed identities: %s %s %s", ride, rider, driver)
		}
		callbacks.Add(1)
	})
	start := make(chan struct{})
	results := make(chan int, 2)
	failures := make(chan error, 2)
	var workers sync.WaitGroup
	for i := 0; i < 2; i++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			<-start
			status, err := postgresCancel(app, "duplicate")
			if err != nil {
				failures <- err
			}
			results <- status
		}()
	}
	close(start)
	workers.Wait()
	close(results)
	close(failures)
	for err := range failures {
		t.Error(err)
	}
	counts := map[int]int{}
	for status := range results {
		counts[status]++
	}
	if counts[200] != 1 || counts[409] != 1 || callbacks.Load() != 1 {
		t.Fatalf("responses=%v callbacks=%d", counts, callbacks.Load())
	}
	var state, fee string
	if err := f.pool.QueryRow(context.Background(), "SELECT status,cancellation_fee::text FROM "+f.schema+".rides WHERE id='duplicate'").Scan(&state, &fee); err != nil {
		t.Fatal(err)
	}
	if state != "cancelled" || fee != "12.34" {
		t.Fatalf("state=%s fee=%s", state, fee)
	}
}

func TestPostgresCompletionRacingCancellationHasOneTerminalWinner(t *testing.T) {
	f := cancellationPostgres(t)
	// Repeated independent races exercise both commands using real row locks.
	for iteration := 0; iteration < 10; iteration++ {
		id := fmt.Sprintf("race-%d", iteration)
		f.insert(t, id, "in_progress")
		var callbacks atomic.Int32
		app := f.app(func(context.Context, string, string, string) { callbacks.Add(1) })
		start := make(chan struct{})
		var workers sync.WaitGroup
		workers.Add(2)
		var cancelStatus int
		var completed int64
		var cancelErr, completeErr error
		go func() { defer workers.Done(); <-start; cancelStatus, cancelErr = postgresCancel(app, id) }()
		go func() {
			defer workers.Done()
			<-start
			ctx, stop := context.WithTimeout(context.Background(), 10*time.Second)
			defer stop()
			tag, err := f.pool.Exec(ctx, "UPDATE "+f.schema+".rides SET status='completed',updated_at=now() WHERE id=$1 AND status='in_progress'", id)
			completeErr = err
			completed = tag.RowsAffected()
		}()
		close(start)
		workers.Wait()
		if cancelErr != nil || completeErr != nil {
			t.Fatalf("cancel=%v complete=%v", cancelErr, completeErr)
		}
		if !((cancelStatus == 200 && completed == 0 && callbacks.Load() == 1) || (cancelStatus == 409 && completed == 1 && callbacks.Load() == 0)) {
			t.Fatalf("status=%d completed=%d callbacks=%d", cancelStatus, completed, callbacks.Load())
		}
		var state string
		if err := f.pool.QueryRow(context.Background(), "SELECT status FROM "+f.schema+".rides WHERE id=$1", id).Scan(&state); err != nil {
			t.Fatal(err)
		}
		if (cancelStatus == 200 && state != "cancelled") || (completed == 1 && state != "completed") {
			t.Fatalf("wrong final state %s", state)
		}
	}
}

func TestPostgresTerminalCancellationPreservesStoredFee(t *testing.T) {
	f := cancellationPostgres(t)
	var callbacks atomic.Int32
	app := f.app(func(context.Context, string, string, string) { callbacks.Add(1) })
	for _, state := range []string{"completed", "cancelled", "expired"} {
		f.insert(t, state, state)
		for attempt := 0; attempt < 2; attempt++ {
			status, err := postgresCancel(app, state)
			if err != nil || status != 409 {
				t.Fatalf("state=%s response=%d err=%v", state, status, err)
			}
		}
		var actual, fee string
		if err := f.pool.QueryRow(context.Background(), "SELECT status,cancellation_fee::text FROM "+f.schema+".rides WHERE id=$1", state).Scan(&actual, &fee); err != nil {
			t.Fatal(err)
		}
		if actual != state || fee != "12.34" {
			t.Fatalf("terminal mutation: state=%s fee=%s", actual, fee)
		}
	}
	if callbacks.Load() != 0 {
		t.Fatalf("terminal notifications=%d", callbacks.Load())
	}
}
