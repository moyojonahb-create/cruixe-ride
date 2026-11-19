package business

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"
	"pickme-backend/internal/middleware"
)

type safetyWrite struct {
	rows  int
	err   error
	calls int
	sql   string
	args  []any
}

func (w *safetyWrite) Exec(_ context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	w.calls++
	w.sql, w.args = sql, args
	if w.err != nil {
		return pgconn.CommandTag{}, w.err
	}
	if w.rows == 0 {
		return pgconn.NewCommandTag("INSERT 0 0"), nil
	}
	return pgconn.NewCommandTag("INSERT 0 1"), nil
}

func safetyApp(w execer, auth bool) *fiber.App {
	h := &Handler{safetyWriter: w}
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		if auth {
			c.Locals(middleware.LocalsAuthSubject, "account-auth")
		}
		return c.Next()
	})
	app.Post("/disputes", h.CreateDispute)
	app.Post("/emergency-events", h.CreateEmergencyEvent)
	return app
}

func TestDisputeDoesNotTrustReporterRole(t *testing.T) {
	w := &safetyWrite{rows: 1}
	app := safetyApp(w, true)
	body := `{"ride_id":"ride-id","reporter_role":"admin","category":"fare","description":" disputed fare "}`
	if status := cancelRequest(t, app, "/disputes", body); status != 200 {
		t.Fatalf("status %d", status)
	}
	if len(w.args) != 4 || w.args[1] != "account-auth" || w.args[3] != "disputed fare" {
		t.Fatalf("unexpected bound arguments %#v", w.args)
	}
	for _, a := range w.args {
		if a == "admin" {
			t.Fatal("caller role reached database")
		}
	}
	for _, predicate := range []string{"CASE WHEN r.user_id::text = $2::text THEN 'rider' ELSE 'driver' END", "d.id = r.driver_id", "r.user_id::text = $2::text OR d.user_id::text = $2::text"} {
		if !strings.Contains(w.sql, predicate) {
			t.Fatalf("missing atomic ownership/role predicate %q", predicate)
		}
	}
}

func TestSafetyWriteRejectsUnavailableRideAndDatabaseFailure(t *testing.T) {
	for _, path := range []string{"/disputes", "/emergency-events"} {
		body := `{"ride_id":"ride-id","category":"fare","description":"issue","latitude":-20,"longitude":29}`
		for _, tc := range []struct {
			name   string
			rows   int
			err    error
			status int
		}{
			{"unrelated-or-missing", 0, nil, 403}, {"participant", 1, nil, 200}, {"database-failure", 0, errors.New("database unavailable"), 500},
		} {
			t.Run(path+tc.name, func(t *testing.T) {
				w := &safetyWrite{rows: tc.rows, err: tc.err}
				if status := cancelRequest(t, safetyApp(w, true), path, body); status != tc.status {
					t.Fatalf("status %d, want %d", status, tc.status)
				}
				if w.calls != 1 {
					t.Fatalf("expected one atomic write, got %d", w.calls)
				}
			})
		}
	}
}

func TestEmergencyWithoutRideStillWorksAndBlankRideDoesNot(t *testing.T) {
	w := &safetyWrite{rows: 1}
	if status := cancelRequest(t, safetyApp(w, true), "/emergency-events", `{"latitude":-20,"longitude":29}`); status != 200 {
		t.Fatalf("status %d", status)
	}
	if w.args[0].(*string) != nil {
		t.Fatal("no-ride alert must preserve null ride")
	}
	if !strings.Contains(w.sql, "$1::uuid IS NULL OR EXISTS") || !strings.Contains(w.sql, "d.user_id::text = $2::text") {
		t.Fatal("missing optional ride ownership guard")
	}
	w = &safetyWrite{rows: 1}
	if status := cancelRequest(t, safetyApp(w, true), "/emergency-events", `{"ride_id":" ","latitude":-20,"longitude":29}`); status != 400 {
		t.Fatalf("status %d", status)
	}
	if w.calls != 0 {
		t.Fatal("invalid input reached database")
	}
}

func TestSafetyEndpointsRequireAuthenticationBeforeWriting(t *testing.T) {
	for _, path := range []string{"/disputes", "/emergency-events"} {
		w := &safetyWrite{rows: 1}
		if status := cancelRequest(t, safetyApp(w, false), path, `{}`); status != 401 {
			t.Fatalf("%s status %d", path, status)
		}
		if w.calls != 0 {
			t.Fatal("unauthenticated write")
		}
	}
}
