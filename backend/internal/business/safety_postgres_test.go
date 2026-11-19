package business

import (
	"context"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"pickme-backend/internal/middleware"
)

// Uses the same guarded disposable-local database fixture as cancellation.
// Only relation names are rewritten; SQL types, authorization and inserts run
// unchanged against PostgreSQL, with no notification/provider invocation.
type isolatedSafetyWriter struct {
	pool   *pgxpool.Pool
	schema string
}

func (w isolatedSafetyWriter) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	for _, name := range []string{"rides", "drivers", "disputes", "emergency_alerts"} {
		sql = strings.ReplaceAll(sql, "public."+name, w.schema+".safety_"+name)
	}
	return w.pool.Exec(ctx, sql, args...)
}

func TestPostgresSafetyAuthorizationAndRoleDerivation(t *testing.T) {
	f := cancellationPostgres(t)
	ctx := context.Background()
	_, err := f.pool.Exec(ctx, `CREATE TABLE `+f.schema+`.safety_drivers(id uuid PRIMARY KEY,user_id uuid NOT NULL);
CREATE TABLE `+f.schema+`.safety_rides(id uuid PRIMARY KEY,user_id uuid NOT NULL,driver_id uuid);
CREATE TABLE `+f.schema+`.safety_disputes(ride_id uuid,reporter_id uuid,reporter_role text,category text,description text);
CREATE TABLE `+f.schema+`.safety_emergency_alerts(ride_id uuid,user_id uuid,latitude double precision,longitude double precision);
INSERT INTO `+f.schema+`.safety_drivers VALUES('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002');
INSERT INTO `+f.schema+`.safety_rides VALUES('00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004');`)
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name, subject, role string
		status              int
	}{
		{"rider", "00000000-0000-4000-8000-000000000001", "rider", 200},
		{"assigned-driver", "00000000-0000-4000-8000-000000000002", "driver", 200},
		{"unrelated", "00000000-0000-4000-8000-000000000003", "", 403},
		{"driver-row-is-not-auth", "00000000-0000-4000-8000-000000000004", "", 403},
	} {
		t.Run(tc.name, func(t *testing.T) {
			h := &Handler{safetyWriter: isolatedSafetyWriter{f.pool, f.schema}}
			app := fiber.New(fiber.Config{ErrorHandler: func(c *fiber.Ctx, err error) error {
				t.Logf("handler response: %v", err)
				return fiber.DefaultErrorHandler(c, err)
			}})
			app.Use(func(c *fiber.Ctx) error { c.Locals(middleware.LocalsAuthSubject, tc.subject); return c.Next() })
			app.Post("/disputes", h.CreateDispute)
			app.Post("/emergency-events", h.CreateEmergencyEvent)
			body := `{"ride_id":"00000000-0000-4000-8000-000000000005","reporter_role":"admin","category":"fare","description":"test","latitude":-20,"longitude":29}`
			for _, path := range []string{"/disputes", "/emergency-events"} {
				if status := cancelRequest(t, app, path, body); status != tc.status {
					t.Fatalf("%s: got %d want %d", path, status, tc.status)
				}
			}
			var count int
			if err := f.pool.QueryRow(ctx, "SELECT count(*) FROM "+f.schema+".safety_disputes WHERE reporter_id=$1", tc.subject).Scan(&count); err != nil {
				t.Fatal(err)
			}
			expect := 0
			if tc.status == 200 {
				expect = 1
			}
			if count != expect {
				t.Fatalf("dispute effects %d want %d", count, expect)
			}
			if expect == 1 {
				var role string
				if err := f.pool.QueryRow(ctx, "SELECT reporter_role FROM "+f.schema+".safety_disputes WHERE reporter_id=$1", tc.subject).Scan(&role); err != nil {
					t.Fatal(err)
				}
				if role != tc.role {
					t.Fatalf("stored role %s want %s", role, tc.role)
				}
			}
			if err := f.pool.QueryRow(ctx, "SELECT count(*) FROM "+f.schema+".safety_emergency_alerts WHERE user_id=$1", tc.subject).Scan(&count); err != nil {
				t.Fatal(err)
			}
			if count != expect {
				t.Fatalf("emergency effects %d want %d", count, expect)
			}
			if status := cancelRequest(t, app, "/emergency-events", `{"latitude":-20,"longitude":29}`); status != 200 {
				t.Fatalf("no-ride emergency status %d", status)
			}
		})
	}
}
