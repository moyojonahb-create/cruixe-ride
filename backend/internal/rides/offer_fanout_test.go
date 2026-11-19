package rides

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

// The event is an invalidation signal: clients refetch the persisted offer
// through the existing authorized offers API, rather than trusting WS money.
func TestSubmitOfferPublishesOnlyPersistedParticipantEvent(t *testing.T) {
	for _, tc := range []struct {
		name         string
		status       string
		insertError  error
		lookupError  error
		forgedDriver string
		wantStatus   int
		wantEvents   int
	}{
		{name: "saved offer reaches owning rider", status: "pending", wantStatus: http.StatusCreated, wantEvents: 1},
		{name: "failed persistence never notifies", status: "pending", insertError: errors.New("write failed"), wantStatus: http.StatusInternalServerError},
		{name: "closed ride never notifies", status: "accepted", wantStatus: http.StatusConflict},
		{name: "missing ride never notifies", lookupError: pgx.ErrNoRows, wantStatus: http.StatusNotFound},
		{name: "failed lookup never notifies", lookupError: errors.New("read failed"), wantStatus: http.StatusInternalServerError},
		{name: "forged driver never notifies", forgedDriver: "other-driver", wantStatus: http.StatusForbidden},
	} {
		t.Run(tc.name, func(t *testing.T) {
			notifier := &fakeLifecycleNotifier{}
			persisted := false
			db := &fakeDB{queryRowFn: func(ctx context.Context, sql string, args ...any) pgx.Row {
				if len(notifier.events) != 0 {
					t.Fatal("notification preceded persistence")
				}
				if strings.Contains(sql, "FROM public.rides") {
					if args[0] != "ride-1" {
						t.Fatalf("wrong ride lookup: %#v", args)
					}
					if !strings.Contains(sql, "user_id::text") {
						t.Fatal("recipient must come from authoritative ride owner")
					}
					return &fakeRow{values: []any{tc.status, "cash", "owning-rider"}, err: tc.lookupError}
				}
				if strings.Contains(sql, "INSERT INTO public.offers") {
					if args[1] != "ride-1" || args[2] != "driver-1" {
						t.Fatalf("wrong persisted scope: %#v", args)
					}
					if tc.insertError != nil {
						return &fakeRow{err: tc.insertError}
					}
					persisted = true
					return &fakeRow{values: []any{time.Now()}}
				}
				return &fakeRow{err: pgx.ErrNoRows}
			}}
			h := makeHandlerWithDB(db)
			h.lifecycleNotifier = notifier
			app := makeAuthRideApp(http.MethodPost, "/test/:rideId/offers", h.SubmitOffer, "driver-1")
			resp := doRequest(t, app, "/test/ride-1/offers", SubmitOfferRequest{DriverID: tc.forgedDriver, Amount: 12.5, ETAMinutes: 4})
			defer resp.Body.Close()
			if resp.StatusCode != tc.wantStatus {
				t.Fatalf("status %d, want %d", resp.StatusCode, tc.wantStatus)
			}
			if len(notifier.events) != tc.wantEvents {
				t.Fatalf("events %d, want %d", len(notifier.events), tc.wantEvents)
			}
			if tc.wantEvents == 1 {
				if !persisted {
					t.Fatal("event without successful insert")
				}
				e := notifier.events[0]
				if e.riderID != "owning-rider" || e.driverID != "driver-1" || e.payload.Event != "ride_offer" || e.payload.RideID != "ride-1" || e.payload.DriverID != "driver-1" || e.payload.Room != "ride_ride-1" || e.payload.RideStatus != "pending" {
					t.Fatalf("wrong participant scope: %#v", e)
				}
			}
		})
	}
}
