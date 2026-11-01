package rides

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"pickme-backend/internal/middleware"
)

func TestClosePendingOfferCompatibility(t *testing.T) {
	for _, tc := range []struct {
		name, actor, path, rideState, offerState, operation string
		missingOffer, failedCommit                          bool
		want                                                int
	}{
		{"rider rejects", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "pending", "pending", "reject", false, false, 200},
		{"rider offer only", "rider-1", "/api/rides/offers/offer-1/reject", "pending", "pending", "reject", false, false, 200},
		{"legacy withdrawal", "driver-user", "/api/rides/ride-1/offers/offer-1/reject", "pending", "pending", "withdraw", false, false, 200},
		{"explicit withdrawal", "driver-user", "/api/rides/ride-1/offers/offer-1/withdraw", "pending", "pending", "withdraw", false, false, 200},
		{"rider cannot withdraw", "rider-1", "/api/rides/ride-1/offers/offer-1/withdraw", "pending", "pending", "", false, false, 403},
		{"outsider", "outsider", "/api/rides/ride-1/offers/offer-1/reject", "pending", "pending", "", false, false, 403},
		{"unauthenticated", "", "/api/rides/ride-1/offers/offer-1/reject", "pending", "pending", "", false, false, 401},
		{"mismatched ride", "rider-1", "/api/rides/other-ride/offers/offer-1/reject", "pending", "pending", "", true, false, 404},
		{"already rejected", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "pending", "rejected", "", false, false, 409},
		{"already accepted", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "pending", "accepted", "", false, false, 409},
		{"accepted ride", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "accepted", "pending", "", false, false, 409},
		{"completed ride", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "completed", "pending", "", false, false, 409},
		{"cancelled ride", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "cancelled", "pending", "", false, false, 409},
		{"expired ride", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "expired", "pending", "", false, false, 409},
		{"commit failure", "rider-1", "/api/rides/ride-1/offers/offer-1/reject", "pending", "pending", "", false, true, 503},
	} {
		t.Run(tc.name, func(t *testing.T) {
			updates, commits := 0, 0
			locks := []string{}
			tx := &fakeTx{
				queryRowFn: func(_ context.Context, sql string, args ...any) pgx.Row {
					if strings.Contains(sql, "SELECT ride_id") {
						return &fakeRow{values: []any{"ride-1"}}
					}
					if strings.Contains(sql, "FROM public.rides") {
						locks = append(locks, "ride")
						return &fakeRow{values: []any{"rider-1", tc.rideState}}
					}
					locks = append(locks, "offer")
					if len(args) != 2 || args[0] != "offer-1" {
						t.Fatalf("association not supplied: %#v", args)
					}
					if tc.missingOffer {
						return &fakeRow{err: pgx.ErrNoRows}
					}
					return &fakeRow{values: []any{"driver-user", tc.offerState}}
				},
				execFn: func(_ context.Context, sql string, _ ...any) (pgconn.CommandTag, error) {
					if !strings.Contains(sql, "status = 'pending'") {
						t.Fatal("missing pending guard")
					}
					updates++
					return pgconn.NewCommandTag("UPDATE 1"), nil
				},
				commitFn: func(context.Context) error {
					commits++
					if tc.failedCommit {
						return errors.New("commit failed")
					}
					return nil
				},
				rollbackFn: func(context.Context) error { return nil },
			}
			h := makeHandlerWithDB(&fakeDB{beginFn: func(context.Context) (Tx, error) { return tx, nil }})
			// Any accidental global availability mutation fails rather than being ignored.
			h.dispatchObserver = &offerCloseDispatchGuard{t: t}
			app := fiber.New()
			RegisterCompatibilityRoutes(app, h, func(c *fiber.Ctx) error { c.Locals(middleware.LocalsAuthSubject, tc.actor); return c.Next() })
			resp := doRequest(t, app, tc.path, nil)
			if resp.StatusCode != tc.want {
				t.Fatalf("want %d got %d: %s", tc.want, resp.StatusCode, readResponseBody(t, resp))
			}
			if tc.want == 200 {
				body := string(readResponseBody(t, resp))
				if !strings.Contains(body, `"operation":"`+tc.operation+`"`) || !strings.Contains(body, `"status":"rejected"`) {
					t.Fatal(body)
				}
				if updates != 1 || commits != 1 {
					t.Fatal("successful command must commit one update")
				}
			} else if tc.want != 503 && (updates != 0 || commits != 0) {
				t.Fatal("denied command mutated storage")
			}
			if len(locks) > 0 && locks[0] != "ride" {
				t.Fatal("ride lock must precede offer lock")
			}
		})
	}
}

// Embedding the interface supplies unrelated methods; the changed command must
// never call any dispatch method, particularly a global availability release.
type offerCloseDispatchGuard struct {
	dispatchObserver
	t *testing.T
}

func (g *offerCloseDispatchGuard) SetDriverAvailability(context.Context, string, string, string) {
	g.t.Fatal("bid closure released driver availability")
}

func TestRepeatedRiderRejectionDoesNotCommitAgain(t *testing.T) {
	state, commits := "pending", 0
	tx := &fakeTx{
		queryRowFn: func(_ context.Context, sql string, _ ...any) pgx.Row {
			if strings.Contains(sql, "public.rides") {
				return &fakeRow{values: []any{"rider-1", "pending"}}
			}
			return &fakeRow{values: []any{"driver-user", state}}
		},
		execFn: func(context.Context, string, ...any) (pgconn.CommandTag, error) {
			return pgconn.NewCommandTag("UPDATE 1"), nil
		},
		commitFn: func(context.Context) error { state = "rejected"; commits++; return nil }, rollbackFn: func(context.Context) error { return nil },
	}
	h := makeHandlerWithDB(&fakeDB{beginFn: func(context.Context) (Tx, error) { return tx, nil }})
	app := makeAuthApp(h.RejectOffer, "rider-1")
	for _, want := range []int{http.StatusOK, http.StatusConflict} {
		if got := doRequest(t, app, "/test/ride-1/offer-1", nil).StatusCode; got != want {
			t.Fatalf("want %d got %d", want, got)
		}
	}
	if commits != 1 {
		t.Fatalf("commits=%d", commits)
	}
}

func TestAcceptanceLocksRideBeforeOffers(t *testing.T) {
	var locks []string
	tx := &fakeTx{
		queryRowFn: func(_ context.Context, sql string, _ ...any) pgx.Row {
			switch {
			case strings.Contains(sql, "FROM public.rides"):
				if !strings.Contains(sql, "FOR UPDATE") {
					t.Fatal("ride is not locked")
				}
				locks = append(locks, "ride")
				return &fakeRow{values: []any{"rider-1", "pending", "cash"}}
			case strings.Contains(sql, "FROM public.offers"):
				locks = append(locks, "offer")
				return &fakeRow{values: []any{"offer-1", "ride-1", "driver-user", 12.5, "pending"}}
			default:
				return &fakeRow{values: []any{"driver-row"}}
			}
		},
		execFn: func(context.Context, string, ...any) (pgconn.CommandTag, error) {
			return pgconn.NewCommandTag("UPDATE 1"), nil
		},
		commitFn: func(context.Context) error { return nil }, rollbackFn: func(context.Context) error { return nil },
	}
	h := makeHandlerWithDB(&fakeDB{beginFn: func(context.Context) (Tx, error) { return tx, nil }})
	app := makeAuthApp(h.AcceptOffer, "rider-1")
	if got := doRequest(t, app, "/test/ride-1/offer-1", nil).StatusCode; got != 200 {
		t.Fatalf("status=%d", got)
	}
	if strings.Join(locks, ",") != "ride,offer" {
		t.Fatalf("accept/reject lock order differs: %v", locks)
	}
}
