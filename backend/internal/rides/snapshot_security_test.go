package rides

import (
	"context"
	"encoding/json"
	"github.com/jackc/pgx/v5"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestRideSnapshotPreservesDriverRowIDAndExposesAssignedAuthSubject(t *testing.T) {
	now := time.Now()
	db := &fakeDB{queryRowFn: func(_ context.Context, sql string, args ...any) pgx.Row {
		if args[1] != "driver-auth" || !strings.Contains(sql, "d.id=public.rides.driver_id AND d.user_id::text=$2") {
			t.Fatal("snapshot driver authorization does not resolve canonical identity")
		}
		return &fakeRow{values: []any{"trip", "rider-auth", "driver-row", "Pickup", "Dropoff", 1.0, 2.0, 3.0, 4.0, "12.50", "cash", "accepted", 5.0, 10, "", "economy", 1, "town", "any", now, now.Add(time.Hour), "driver-auth"}}
	}}
	h := makeHandlerWithDB(db)
	app := makeAuthRideApp("GET", "/api/rides/:rideId", h.GetRide, "driver-auth")
	response, err := app.Test(httptest.NewRequest("GET", "/api/rides/trip", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		t.Fatalf("status=%d", response.StatusCode)
	}
	var snapshot map[string]any
	if err := json.NewDecoder(response.Body).Decode(&snapshot); err != nil {
		t.Fatal(err)
	}
	if snapshot["driver_id"] != "driver-row" || snapshot["driver_user_id"] != "driver-auth" || snapshot["user_id"] != "rider-auth" {
		t.Fatalf("identity contract changed: %#v", snapshot)
	}
}
func TestRideSnapshotUnavailableToOutsider(t *testing.T) {
	h := makeHandlerWithDB(&fakeDB{queryRowFn: func(context.Context, string, ...any) pgx.Row { return &fakeRow{err: pgx.ErrNoRows} }})
	app := makeAuthRideApp("GET", "/api/rides/:rideId", h.GetRide, "outsider")
	response, err := app.Test(httptest.NewRequest("GET", "/api/rides/trip", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 404 {
		t.Fatalf("status=%d", response.StatusCode)
	}
}
