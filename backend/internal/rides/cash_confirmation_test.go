package rides

import (
	"context"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

func TestCashConfirmationAuthorizationAndRetry(t *testing.T) {
	first := time.Date(2026, 11, 11, 12, 0, 0, 0, time.UTC)
	for _, tc := range []struct {
		name, actor string
		dbErr       error
		want        int
	}{
		{"assigned driver", "driver-auth", nil, 200},
		{"rider denied", "rider-auth", pgx.ErrNoRows, 409},
		{"other driver denied", "other-driver", pgx.ErrNoRows, 409},
		{"before completion or noncash", "driver-auth", pgx.ErrNoRows, 409},
		{"storage failure", "driver-auth", errors.New("database unavailable"), 503},
		{"no authentication", "", nil, 401},
	} {
		t.Run(tc.name, func(t *testing.T) {
			calls := 0
			h := makeHandlerWithDB(&fakeDB{queryRowFn: func(_ context.Context, sql string, args ...any) pgx.Row {
				calls++
				for _, guard := range []string{"r.status = 'completed'", "COALESCE(r.payment_method, 'cash') = 'cash'", "d.id = r.driver_id", "d.user_id::text = $2", "COALESCE(r.driver_collected_at, NOW())"} {
					if !strings.Contains(sql, guard) {
						t.Fatalf("missing persistence guard %q", guard)
					}
				}
				if args[0] != "trip" || args[1] != tc.actor {
					t.Fatalf("incorrect identity binding: %#v", args)
				}
				return &fakeRow{values: []any{first}, err: tc.dbErr}
			}})
			app := makeAuthRideApp("POST", "/api/rides/:rideId/confirm-cash", h.ConfirmCash, tc.actor)
			for attempt := 0; attempt < 2; attempt++ {
				resp, err := app.Test(httptest.NewRequest("POST", "/api/rides/trip/confirm-cash", nil))
				if err != nil {
					t.Fatal(err)
				}
				if resp.StatusCode != tc.want {
					t.Fatalf("got %d, want %d", resp.StatusCode, tc.want)
				}
				if tc.want == 200 {
					var body map[string]any
					if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
						t.Fatal(err)
					}
					if body["driver_collected_at"] != first.Format(time.RFC3339) || body["payment_status"] != "paid" {
						t.Fatalf("confirmation lost: %#v", body)
					}
				}
				resp.Body.Close()
			}
			if tc.actor == "" && calls != 0 {
				t.Fatal("unauthenticated command reached storage")
			}
		})
	}
}

func TestCashSnapshotDoesNotClaimPaymentUntilConfirmed(t *testing.T) {
	for _, confirmed := range []bool{false, true} {
		ride := rideAPIRecord{PaymentMethod: "cash", Status: "completed", FareDecimal: "12.50"}
		want := "pending"
		if confirmed {
			ride.DriverCollectedAt = "2026-11-11T12:00:00Z"
			want = "paid"
		}
		snapshot := rideAPIResponse(ride)
		if snapshot["payment_status"] != want {
			t.Fatalf("payment_status=%v", snapshot["payment_status"])
		}
		if !confirmed && snapshot["driver_collected_at"] != nil {
			t.Fatal("unconfirmed ride gained a collection timestamp")
		}
	}
}

func TestCashSnapshotDoesNotInferWalletPaymentStatus(t *testing.T) {
	snapshot := rideAPIResponse(rideAPIRecord{PaymentMethod: "wallet", Status: "completed", FareDecimal: "12.50"})
	if snapshot["payment_status"] != nil {
		t.Fatal("cash state must not classify wallet settlement")
	}
}
