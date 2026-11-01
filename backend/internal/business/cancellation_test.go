package business

import (
	"bytes"
	"context"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"pickme-backend/internal/middleware"
)

// These handler transaction tests verify effects and SQL guards, not PostgreSQL
// concurrency. Contention behavior needs disposable PostgreSQL integration tests.
type cancellationTx struct {
	pgx.Tx
	state, user           string
	committed, rolledBack bool
	commitErr, queryErr   error
	updates, feeWrites    int
	t                     *testing.T
}
type cancellationRow struct{ err error }

func (r cancellationRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	*dest[0].(*string) = "rider-auth"
	*dest[1].(*string) = "assigned-driver-auth"
	return nil
}
func (tx *cancellationTx) QueryRow(_ context.Context, sql string, args ...any) pgx.Row {
	tx.updates++
	if !strings.Contains(sql, "r.status IN ('pending', 'scheduled', 'accepted', 'arrived', 'in_progress')") {
		tx.t.Error("missing exact conditional status allow list")
	}
	for _, state := range []string{"pending", "scheduled", "accepted", "arrived", "in_progress"} {
		if !strings.Contains(sql, "'"+state+"'") {
			tx.t.Errorf("missing cancellation allow-list state %s", state)
		}
	}
	if strings.Contains(sql, "cancellation_fee =") {
		tx.t.Error("caller must not overwrite stored fee")
	}
	if !strings.Contains(sql, "d.id = r.driver_id") || !strings.Contains(sql, "d.user_id::text") {
		tx.t.Error("must resolve driver row to auth identity")
	}
	if !strings.Contains(sql, "r.user_id::text = $2") {
		tx.t.Error("missing ownership predicate")
	}
	if tx.queryErr != nil {
		return cancellationRow{tx.queryErr}
	}
	allowed := map[string]bool{"pending": true, "scheduled": true, "accepted": true, "arrived": true, "in_progress": true}
	if tx.committed || !allowed[tx.state] || (!args[2].(bool) && args[1].(string) != tx.user) {
		return cancellationRow{pgx.ErrNoRows}
	}
	return cancellationRow{}
}
func (tx *cancellationTx) Exec(context.Context, string, ...any) (pgconn.CommandTag, error) {
	tx.feeWrites++
	tx.t.Error("unverified fee policy must not write fee rows")
	return pgconn.CommandTag{}, nil
}
func (tx *cancellationTx) Commit(context.Context) error {
	if tx.commitErr != nil {
		return tx.commitErr
	}
	tx.committed = true
	return nil
}
func (tx *cancellationTx) Rollback(context.Context) error { tx.rolledBack = true; return nil }

func cancellationApp(t *testing.T, tx *cancellationTx, callback RideCancelledCallback) *fiber.App {
	t.Helper()
	h := &Handler{beginCancellation: func(context.Context, pgx.TxOptions) (pgx.Tx, error) { return tx, nil }, onRideCancelled: callback}
	app := fiber.New()
	app.Post("/api/rides/:rideId/cancel", func(c *fiber.Ctx) error { c.Locals(middleware.LocalsAuthSubject, "rider-auth"); return h.CancelRide(c) })
	// Test the admin service policy separately from the existing admin auth lookup.
	app.Post("/admin/rides/:rideId/cancel", func(c *fiber.Ctx) error { return h.cancelRide(c.Context(), c.Params("rideId"), "", true, c) })
	return app
}
func cancelRequest(t *testing.T, app *fiber.App, path, body string) int {
	t.Helper()
	req := httptest.NewRequest("POST", path, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	return resp.StatusCode
}
func TestCancellationStateGuardsAndCommittedIdentity(t *testing.T) {
	for _, admin := range []bool{false, true} {
		for _, state := range []string{"pending", "scheduled", "accepted", "arrived", "in_progress", "completed", "cancelled", "expired", "unknown"} {
			name := state
			path := "/api/rides/ride-1/cancel"
			if admin {
				name = "admin/" + name
				path = "/admin/rides/ride-1/cancel"
			}
			t.Run(name, func(t *testing.T) {
				tx := &cancellationTx{t: t, state: state, user: "rider-auth"}
				calls := 0
				app := cancellationApp(t, tx, func(_ context.Context, ride, rider, driver string) {
					calls++
					if !tx.committed {
						t.Error("callback before commit")
					}
					if ride != "ride-1" || rider != "rider-auth" || driver != "assigned-driver-auth" {
						t.Errorf("wrong canonical identities: %s %s %s", ride, rider, driver)
					}
				})
				status := cancelRequest(t, app, path, `{"cancellation_fee":0,"reason":"changed plans"}`)
				allowed := state == "pending" || state == "scheduled" || state == "accepted" || state == "arrived" || state == "in_progress"
				if allowed {
					if status != 200 || calls != 1 || !tx.committed {
						t.Fatalf("status=%d callbacks=%d committed=%v", status, calls, tx.committed)
					}
				} else {
					if status != 409 || calls != 0 || tx.committed {
						t.Fatalf("status=%d callbacks=%d committed=%v", status, calls, tx.committed)
					}
				}
				if !tx.rolledBack || tx.feeWrites != 0 {
					t.Fatal("missing cleanup or unexpected fee writes")
				}
			})
		}
	}
}
func TestCancellationRetriesDoNotDuplicateEffects(t *testing.T) {
	tx := &cancellationTx{t: t, state: "accepted", user: "rider-auth"}
	calls := 0
	app := cancellationApp(t, tx, func(context.Context, string, string, string) { calls++ })
	if got := cancelRequest(t, app, "/api/rides/ride-1/cancel", `{}`); got != 200 {
		t.Fatal(got)
	}
	if got := cancelRequest(t, app, "/api/rides/ride-1/cancel", `{}`); got != 409 {
		t.Fatal(got)
	}
	if calls != 1 || tx.feeWrites != 0 {
		t.Fatalf("callbacks=%d fee writes=%d", calls, tx.feeWrites)
	}
}
func TestCancellationFailuresNeverNotify(t *testing.T) {
	for _, kind := range []string{"commit", "query", "owner"} {
		t.Run(kind, func(t *testing.T) {
			tx := &cancellationTx{t: t, state: "accepted", user: "rider-auth"}
			if kind == "commit" {
				tx.commitErr = errors.New("commit failed")
			}
			if kind == "query" {
				tx.queryErr = errors.New("query failed")
			}
			if kind == "owner" {
				tx.user = "someone-else"
			}
			calls := 0
			app := cancellationApp(t, tx, func(context.Context, string, string, string) { calls++ })
			got := cancelRequest(t, app, "/api/rides/ride-1/cancel", `{}`)
			want := 500
			if kind == "owner" {
				want = 409
			}
			if got != want || calls != 0 || !tx.rolledBack || tx.committed {
				t.Fatalf("status=%d calls=%d rollback=%v committed=%v", got, calls, tx.rolledBack, tx.committed)
			}
		})
	}
}
func TestCancellationRejectsCallerFeesAndMalformedBodiesBeforeTransaction(t *testing.T) {
	for _, body := range []string{`{"cancellation_fee":5}`, `{"cancellation_fee":-1}`, `{"cancellation_fee":"5"}`, `{"reason":`} {
		t.Run(body, func(t *testing.T) {
			tx := &cancellationTx{t: t, state: "accepted", user: "rider-auth"}
			app := cancellationApp(t, tx, nil)
			if got := cancelRequest(t, app, "/api/rides/ride-1/cancel", body); got != 400 {
				t.Fatal(got)
			}
			if tx.updates != 0 || tx.committed || tx.feeWrites != 0 {
				t.Fatal("invalid request produced transaction effects")
			}
		})
	}
}

func TestCancellationRequiresAuthenticatedRider(t *testing.T) {
	tx := &cancellationTx{t: t, state: "accepted", user: "rider-auth"}
	h := &Handler{beginCancellation: func(context.Context, pgx.TxOptions) (pgx.Tx, error) {
		t.Fatal("unauthenticated request opened transaction")
		return tx, nil
	}}
	app := fiber.New()
	app.Post("/api/rides/:rideId/cancel", h.CancelRide)
	if got := cancelRequest(t, app, "/api/rides/ride-1/cancel", `{}`); got != 401 {
		t.Fatal(got)
	}
}
