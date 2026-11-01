package rides

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
)

type cancellationDispatch struct {
	dispatchObserver
	ids []string
}

func (d *cancellationDispatch) SetDriverAvailability(_ context.Context, userID, availability, rideID string) {
	if availability != "available" || rideID != "" {
		panic("unexpected availability projection")
	}
	d.ids = append(d.ids, userID)
}

type cancellationReputation struct {
	reputationTracker
	ids []string
}

func (r *cancellationReputation) RecordRideCancelled(_ context.Context, userID, _ string) {
	r.ids = append(r.ids, userID)
}

func TestCancellationStateAndAssignedIdentity(t *testing.T) {
	for _, actor := range []string{"rider-user", "driver-user"} {
		for _, state := range []string{"pending", "scheduled", "accepted", "arrived", "in_progress", "completed", "cancelled", "expired"} {
			t.Run(actor+"/"+state, func(t *testing.T) {
				notifier := &fakeLifecycleNotifier{}
				dispatch := &cancellationDispatch{}
				reputation := &cancellationReputation{}
				currentState := state
				db := &fakeDB{queryRowFn: func(_ context.Context, sql string, args ...any) pgx.Row {
					if strings.Contains(sql, "UPDATE public.rides") {
						if args[1] != actor {
							t.Fatal("actor binding lost")
						}
						if !strings.Contains(sql, "d.id = public.rides.driver_id") {
							t.Fatal("assigned identity must resolve from driver row")
						}
						allowed := false
						for _, s := range args[3].([]string) {
							if s == currentState {
								allowed = true
							}
						}
						if !allowed {
							return &fakeRow{err: pgx.ErrNoRows}
						}
						currentState = "cancelled"
						return &fakeRow{values: []any{"rider-user", "driver-user"}}
					}
					if strings.Contains(sql, "SELECT NOT EXISTS") {
						return &fakeRow{values: []any{true}}
					}
					if actor == "rider-user" {
						return &fakeRow{err: pgx.ErrNoRows}
					}
					return &fakeRow{values: []any{"driver-row"}}
				}}
				h := makeHandlerWithDB(db)
				h.lifecycleNotifier = notifier
				h.dispatchObserver = dispatch
				h.reputationTracker = reputation
				app := makeAuthRideApp(http.MethodPost, "/test/:rideId/status", h.UpdateStatus, actor)
				want := 409
				if state == "pending" || state == "accepted" || state == "arrived" || state == "in_progress" {
					want = 200
				}
				resp := doRequest(t, app, "/test/ride-1/status", map[string]string{"status": "cancelled"})
				if resp.StatusCode != want {
					t.Fatalf("want %d got %d: %s", want, resp.StatusCode, readResponseBody(t, resp))
				}
				if want == 200 {
					if len(notifier.events) != 1 || notifier.events[0].driverID != "driver-user" || notifier.events[0].riderID != "rider-user" {
						t.Fatalf("wrong lifecycle identities: %#v", notifier.events)
					}
					if len(dispatch.ids) != 1 || dispatch.ids[0] != "driver-user" || len(reputation.ids) != 1 || reputation.ids[0] != "driver-user" {
						t.Fatal("wrong driver side effect identity")
					}
					if got := doRequest(t, app, "/test/ride-1/status", map[string]string{"status": "cancelled"}).StatusCode; got != 409 {
						t.Fatalf("repeat status=%d", got)
					}
					if len(notifier.events) != 1 || len(dispatch.ids) != 1 || len(reputation.ids) != 1 {
						t.Fatal("duplicate side effects")
					}
				} else if len(notifier.events) != 0 || len(dispatch.ids) != 0 || len(reputation.ids) != 0 {
					t.Fatal("terminal cancellation emitted effects")
				}
			})
		}
	}
}

func TestCancellationDoesNotReleaseAnotherActiveAssignment(t *testing.T) {
	for _, tc := range []struct {
		name string
		row  pgx.Row
	}{
		{"busy", &fakeRow{values: []any{false}}},
		{"unknown", &fakeRow{err: pgx.ErrNoRows}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			notifier := &fakeLifecycleNotifier{}
			dispatch := &cancellationDispatch{}
			h := makeHandlerWithDB(&fakeDB{queryRowFn: func(_ context.Context, _ string, args ...any) pgx.Row {
				if args[0] != "driver-user" {
					t.Fatal("wrong user queried")
				}
				return tc.row
			}})
			h.lifecycleNotifier = notifier
			h.dispatchObserver = dispatch
			h.NotifyRideCancelled(context.Background(), "ride-1", "rider-user", "driver-user")
			if len(dispatch.ids) != 0 {
				t.Fatal("unsafe availability release")
			}
			if len(notifier.events) != 1 {
				t.Fatal("committed cancellation notification missing")
			}
		})
	}
}

func TestUnassignedCancellationHasNoDriverEffects(t *testing.T) {
	notifier := &fakeLifecycleNotifier{}
	dispatch := &cancellationDispatch{}
	h := makeHandlerWithDB(&fakeDB{})
	h.lifecycleNotifier = notifier
	h.dispatchObserver = dispatch
	h.NotifyRideCancelled(context.Background(), "ride-1", "rider-user", "")
	if len(dispatch.ids) != 0 || len(notifier.events) != 1 || notifier.events[0].driverID != "" {
		t.Fatal("unassigned ride acquired driver identity")
	}
}
