package websocket

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"os"
	"strings"
	"testing"
	"time"
)

type isolatedRoomQuery struct {
	pgx.Tx
	schema string
}

func (q isolatedRoomQuery) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	sql = strings.ReplaceAll(sql, "public.rides", q.schema+".rides")
	sql = strings.ReplaceAll(sql, "public.drivers", q.schema+".drivers")
	return q.Tx.QueryRow(ctx, sql, args...)
}

// Opt-in only: real canonical FK/state/expiry SQL in a rollback-only schema.
// Driver eligibility is stubbed; this is not deployed-session/RLS evidence.
func TestPostgresCanonicalRoomAuthorization(t *testing.T) {
	dsn := os.Getenv("CRUIZE_P02_TEST_DSN")
	if dsn == "" {
		t.Skip("set CRUIZE_P02_TEST_DSN for disposable loopback cruize_p02_test")
	}
	cfg, err := pgx.ParseConfig(dsn)
	if err != nil {
		t.Fatal("invalid test database configuration")
	}
	local := func(host string) bool { return host == "localhost" || host == "127.0.0.1" || host == "::1" }
	if !local(cfg.Host) || cfg.Database != "cruize_p02_test" {
		t.Fatal("refusing non-disposable database")
	}
	for _, f := range cfg.Fallbacks {
		if !local(f.Host) {
			t.Fatal("refusing remote fallback")
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	conn, err := pgx.ConnectConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(context.Background())
	tx, err := conn.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(context.Background())
	schema := pgx.Identifier{"p02_" + strings.ReplaceAll(uuid.NewString(), "-", "")}.Sanitize()
	if _, err := tx.Exec(ctx, "CREATE SCHEMA "+schema+"; CREATE TABLE "+schema+".drivers(id uuid PRIMARY KEY,user_id uuid NOT NULL); CREATE TABLE "+schema+".rides(id uuid PRIMARY KEY,user_id uuid NOT NULL,driver_id uuid REFERENCES "+schema+".drivers(id),status text NOT NULL,expires_at timestamptz)"); err != nil {
		t.Fatal(err)
	}
	rider := "33333333-3333-4333-8333-333333333333"
	row := "44444444-4444-4444-8444-444444444444"
	ride := "55555555-5555-4555-8555-555555555555"
	if _, err := tx.Exec(ctx, "INSERT INTO "+schema+".drivers VALUES ($1,$2)", row, driverSubject); err != nil {
		t.Fatal(err)
	}
	if _, err := tx.Exec(ctx, "INSERT INTO "+schema+".rides VALUES ($1,$2,$3,'pending',now()+interval '1 hour')", ride, rider, row); err != nil {
		t.Fatal(err)
	}
	eligibility := &fakeDriverAuthorizer{allowed: true}
	a := NewPostgresRoomAuthorizer(isolatedRoomQuery{Tx: tx, schema: schema}, eligibility)
	for _, status := range []string{"pending", "scheduled", "accepted", "arrived", "in_progress", "completed", "cancelled", "expired"} {
		if _, err := tx.Exec(ctx, "UPDATE "+schema+".rides SET status=$1 WHERE id=$2", status, ride); err != nil {
			t.Fatal(err)
		}
		for _, actor := range []string{rider, driverSubject, row, "66666666-6666-4666-8666-666666666666"} {
			ok, err := a.CanJoinRideRoom(ctx, ride, actor)
			want := (actor == rider && activeRequest(status)) || (actor == driverSubject && activeTrip(status))
			if err != nil || ok != want {
				t.Fatalf("state=%s actor=%s got=%v want=%v err=%v", status, actor, ok, want, err)
			}
		}
	}
	if _, err := tx.Exec(ctx, "UPDATE "+schema+".rides SET status='pending',expires_at=now()-interval '1 minute' WHERE id=$1", ride); err != nil {
		t.Fatal(err)
	}
	if ok, err := a.CanJoinRideRoom(ctx, ride, rider); ok || err != nil {
		t.Fatal("expired pending request authorized")
	}
	if _, err := tx.Exec(ctx, "UPDATE "+schema+".rides SET status='accepted' WHERE id=$1", ride); err != nil {
		t.Fatal(err)
	}
	eligibility.allowed = false
	if ok, _ := a.CanJoinRideRoom(ctx, ride, driverSubject); ok {
		t.Fatal("suspended driver authorized")
	}
	if ok, _ := a.CanReceiveRideLocation(ctx, ride, rider, driverSubject); ok {
		t.Fatal("suspended driver location authorized")
	}
}
