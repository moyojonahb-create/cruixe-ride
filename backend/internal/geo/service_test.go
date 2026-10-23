package geo

import (
	"context"
	"errors"
	"math"
	"testing"
	"time"
)

type fakeStore struct {
	enabled bool
	err     error
	hsets   map[string]map[string]string
	expires map[string]time.Duration
	geoAdds []geoAdd
	results []GeoResult
}

type geoAdd struct {
	key       string
	longitude float64
	latitude  float64
	member    string
}

func newFakeStore(enabled bool) *fakeStore {
	return &fakeStore{
		enabled: enabled,
		hsets:   map[string]map[string]string{},
		expires: map[string]time.Duration{},
	}
}

func (f *fakeStore) Enabled() bool {
	return f.enabled
}

func (f *fakeStore) HSet(ctx context.Context, key string, values map[string]string) error {
	if f.err != nil {
		return f.err
	}
	copied := map[string]string{}
	for field, value := range values {
		copied[field] = value
	}
	f.hsets[key] = copied
	return nil
}

func (f *fakeStore) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.hsets[key], nil
}

func (f *fakeStore) Expire(ctx context.Context, key string, ttl time.Duration) error {
	if f.err != nil {
		return f.err
	}
	f.expires[key] = ttl
	return nil
}

func (f *fakeStore) GeoAdd(ctx context.Context, key string, longitude float64, latitude float64, member string) error {
	if f.err != nil {
		return f.err
	}
	f.geoAdds = append(f.geoAdds, geoAdd{key: key, longitude: longitude, latitude: latitude, member: member})
	return nil
}

func (f *fakeStore) GeoSearch(ctx context.Context, key string, longitude float64, latitude float64, radiusKM float64, count int) ([]GeoResult, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.results, nil
}

func TestWriteDriverLocationAttemptsHashExpireAndGeo(t *testing.T) {
	store := newFakeStore(true)
	service := NewService(store, Config{LocationTTL: 45 * time.Second})

	err := service.WriteDriverLocation(context.Background(), DriverLocation{
		DriverID:    "driver-1",
		Latitude:    -17.826,
		Longitude:   31.034,
		Heading:     90,
		Speed:       30,
		City:        "Harare",
		VehicleType: "Economy",
	})
	if err != nil {
		t.Fatal(err)
	}

	location := store.hsets[DriverLocationKey("driver-1")]
	if location["latitude"] != "-17.826" || location["longitude"] != "31.034" {
		t.Fatalf("unexpected location hash: %#v", location)
	}
	if store.expires[DriverLocationKey("driver-1")] != 45*time.Second {
		t.Fatalf("expected location ttl to be set, got %s", store.expires[DriverLocationKey("driver-1")])
	}
	if len(store.geoAdds) != 1 {
		t.Fatalf("expected one geo add, got %d", len(store.geoAdds))
	}
	if store.geoAdds[0].key != "drivers:geo:harare:economy" || store.geoAdds[0].member != "driver-1" {
		t.Fatalf("unexpected geo add: %#v", store.geoAdds[0])
	}
}

func TestWriteDriverPresenceAttemptsHash(t *testing.T) {
	store := newFakeStore(true)
	service := NewService(store, Config{PresenceTTL: 75 * time.Second})

	err := service.WriteDriverPresence(context.Background(), DriverPresence{
		DriverID:     "driver-1",
		State:        "online",
		Availability: "available",
	})
	if err != nil {
		t.Fatal(err)
	}

	presence := store.hsets[DriverPresenceKey("driver-1")]
	if presence["state"] != "online" || presence["availability"] != "available" {
		t.Fatalf("unexpected presence hash: %#v", presence)
	}
	if store.expires[DriverPresenceKey("driver-1")] != 75*time.Second {
		t.Fatalf("expected presence ttl, got %s", store.expires[DriverPresenceKey("driver-1")])
	}
}

func TestNearbyDriversReturnsCandidatesAndFiltersStaleLocations(t *testing.T) {
	store := newFakeStore(true)
	service := NewService(store, Config{LocationTTL: 60 * time.Second})
	now := time.Date(2026, 6, 1, 12, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return now }
	store.results = []GeoResult{
		{Member: "fresh-driver", DistanceKM: 1.2},
		{Member: "stale-driver", DistanceKM: 1.4},
		{Member: "missing-driver", DistanceKM: 1.6},
	}
	store.hsets[DriverPresenceKey("fresh-driver")] = map[string]string{
		"state": "online", "availability": "available",
		"last_seen_at": now.Add(-10 * time.Second).Format(time.RFC3339Nano),
	}
	store.hsets[DriverLocationKey("fresh-driver")] = map[string]string{
		"latitude": "-17.826", "longitude": "31.034", "heading": "10", "speed": "20",
		"city": "harare", "vehicle_type": "economy", "updated_at": now.Add(-20 * time.Second).Format(time.RFC3339Nano),
	}
	store.hsets[DriverLocationKey("stale-driver")] = map[string]string{
		"latitude": "-17.827", "longitude": "31.035", "heading": "10", "speed": "20",
		"city": "harare", "vehicle_type": "economy", "updated_at": now.Add(-2 * time.Minute).Format(time.RFC3339Nano),
	}

	drivers, err := service.NearbyDrivers(context.Background(), NearbyQuery{
		Latitude: -17.826, Longitude: 31.034, RadiusKM: 5, City: "harare", VehicleType: "economy",
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(drivers) != 1 || drivers[0].DriverID != "fresh-driver" || drivers[0].DistanceKM != 1.2 {
		t.Fatalf("unexpected nearby drivers: %#v", drivers)
	}
}

func TestNearbyDriversDisabledReturnsUnavailable(t *testing.T) {
	service := NewService(newFakeStore(false), Config{})

	drivers, err := service.NearbyDrivers(context.Background(), NearbyQuery{RadiusKM: 5})
	if !errors.Is(err, ErrUnavailable) {
		t.Fatalf("expected ErrUnavailable, got %v", err)
	}
	if drivers != nil {
		t.Fatalf("expected nil drivers, got %#v", drivers)
	}
}

func TestWriteDriverLocationRejectsInvalidTelemetry(t *testing.T) {
	for _, tc := range []struct {
		name string
		location DriverLocation
	}{
		{"zero coordinates", DriverLocation{DriverID: "d", Latitude: 0, Longitude: 0}},
		{"invalid latitude", DriverLocation{DriverID: "d", Latitude: -91, Longitude: 30}},
		{"invalid longitude", DriverLocation{DriverID: "d", Latitude: -17, Longitude: 181}},
		{"nan latitude", DriverLocation{DriverID: "d", Latitude: math.NaN(), Longitude: 30}},
		{"invalid speed", DriverLocation{DriverID: "d", Latitude: -17, Longitude: 30, Speed: -2}},
		{"invalid heading", DriverLocation{DriverID: "d", Latitude: -17, Longitude: 30, Heading: 500}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			store := newFakeStore(true)
			service := NewService(store, Config{})
			if err := service.WriteDriverLocation(context.Background(), tc.location); err == nil {
				t.Fatal("expected invalid GPS telemetry rejection")
			}
			if len(store.hsets) != 0 || len(store.geoAdds) != 0 {
				t.Fatal("invalid location must not be stored")
			}
		})
	}
}

func TestNearbyDriversIgnoresForeignCityVehicleFutureAndBadGPS(t *testing.T) {
	store := newFakeStore(true)
	service := NewService(store, Config{LocationTTL: 60 * time.Second})
	now := time.Date(2026, 10, 22, 12, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return now }
	store.results = []GeoResult{
		{Member: "correct", DistanceKM: 1},
		{Member: "moved-to-bulawayo", DistanceKM: 2},
		{Member: "different-class", DistanceKM: 3},
		{Member: "future-sample", DistanceKM: 4},
		{Member: "bad-gps", DistanceKM: 5},
	}
	for _, id := range []string{"correct", "moved-to-bulawayo", "different-class", "future-sample", "bad-gps"} {
		store.hsets[DriverLocationKey(id)] = map[string]string{
			"latitude": "-17.826", "longitude": "31.034",
			"city": "harare", "vehicle_type": "economy",
			"updated_at": now.Format(time.RFC3339Nano),
		}
	}
	for _, id := range []string{"correct", "moved-to-bulawayo", "different-class", "future-sample", "bad-gps"} {
		store.hsets[DriverPresenceKey(id)] = map[string]string{
			"state": "online", "availability": "available",
			"last_seen_at": now.Format(time.RFC3339Nano),
		}
	}
	store.hsets[DriverLocationKey("moved-to-bulawayo")]["city"] = "bulawayo"
	store.hsets[DriverLocationKey("different-class")]["vehicle_type"] = "premium"
	store.hsets[DriverLocationKey("future-sample")]["updated_at"] = now.Add(2*time.Minute).Format(time.RFC3339Nano)
	store.hsets[DriverLocationKey("bad-gps")]["latitude"] = "invalid"

	drivers, err := service.NearbyDrivers(context.Background(), NearbyQuery{
		Latitude: -17.825, Longitude: 31.03, RadiusKM: 6,
		City: "harare", VehicleType: "economy",
	})
	if err != nil { t.Fatal(err) }
	if len(drivers) != 1 || drivers[0].DriverID != "correct" {
		t.Fatalf("expected only matching valid driver, got %#v", drivers)
	}
}

func TestNearbyDriversFiltersBusyOfflineAndStalePresence(t *testing.T) {
	store := newFakeStore(true)
	service := NewService(store, Config{LocationTTL: 60 * time.Second, PresenceTTL: 45 * time.Second})
	now := time.Date(2026, 10, 22, 12, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return now }
	ids := []string{"eligible", "offline", "busy", "occupied", "stale", "no-presence"}
	for _, id := range ids {
		store.results = append(store.results, GeoResult{Member: id, DistanceKM: 1.2})
		store.hsets[DriverLocationKey(id)] = map[string]string{
			"latitude": "-17.82", "longitude": "31.03",
			"city": "harare", "vehicle_type": "economy",
			"updated_at": now.Format(time.RFC3339Nano),
		}
		if id != "no-presence" {
			store.hsets[DriverPresenceKey(id)] = map[string]string{
				"state": "online", "availability": "available",
				"last_seen_at": now.Format(time.RFC3339Nano),
			}
		}
	}
	store.hsets[DriverPresenceKey("offline")]["state"] = "offline"
	store.hsets[DriverPresenceKey("busy")]["availability"] = "busy"
	store.hsets[DriverPresenceKey("occupied")]["ride_id"] = "ride-123"
	store.hsets[DriverPresenceKey("stale")]["last_seen_at"] = now.Add(-2*time.Minute).Format(time.RFC3339Nano)
	got, err := service.NearbyDrivers(context.Background(), NearbyQuery{
		Latitude: -17.82, Longitude: 31.03, RadiusKM: 5,
		City: "harare", VehicleType: "economy",
	})
	if err != nil { t.Fatal(err) }
	if len(got) != 1 || got[0].DriverID != "eligible" {
		t.Fatalf("expected only eligible driver, got %#v", got)
	}
}

func TestWriteDriverPresenceRejectsMissingStateAndStaleHeartbeats(t *testing.T) {
	now := time.Date(2026, 10, 22, 12, 0, 0, 0, time.UTC)
	for _, tc := range []struct {
		name string
		presence DriverPresence
	}{
		{"missing state", DriverPresence{DriverID: "driver1", Availability: "available", LastSeenAt: now}},
		{"missing availability", DriverPresence{DriverID: "driver1", State: "online", LastSeenAt: now}},
		{"stale", DriverPresence{DriverID: "driver1", State: "online", Availability: "available", LastSeenAt: now.Add(-2*time.Minute)}},
		{"future", DriverPresence{DriverID: "driver1", State: "online", Availability: "available", LastSeenAt: now.Add(2*time.Minute)}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			store := newFakeStore(true)
			service := NewService(store, Config{PresenceTTL: 45 * time.Second})
			service.now = func() time.Time { return now }
			if err := service.WriteDriverPresence(context.Background(), tc.presence); err == nil {
				t.Fatal("expected rejected driver presence")
			}
			if len(store.hsets) != 0 {
				t.Fatal("invalid presence must never enter dispatch cache")
			}
		})
	}
}

func TestNearbyDriversRejectsMalformedRiderSearch(t *testing.T) {
	for _, tc := range []struct{
		name string
		latitude float64
		longitude float64
		radius float64
	}{
		{"invalid latitude", -91, 30, 5},
		{"invalid longitude", -17, 190, 5},
		{"missing position", 0, 0, 5},
		{"NaN latitude", math.NaN(), 30, 5},
		{"NaN radius", -17, 30, math.NaN()},
		{"infinite radius", -17, 30, math.Inf(1)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			store := newFakeStore(true)
			service := NewService(store, Config{})
			got, err := service.NearbyDrivers(context.Background(), NearbyQuery{
				Latitude: tc.latitude, Longitude: tc.longitude, RadiusKM: tc.radius,
			})
			if err == nil {
				t.Fatal("expected invalid rider search error")
			}
			if got != nil {
				t.Fatalf("expected nil candidates, got %#v", got)
			}
		})
	}
}
