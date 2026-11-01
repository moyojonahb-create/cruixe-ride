package contracts

import (
	"encoding/json"
	"math"
	"testing"
	"time"
)

func TestEventEnvelopeRejectsUnreplayableOrMalformedMessages(t *testing.T) {
	base := Event{EventID: "event-1", CommandID: "command-1", AggregateID: "ride-1", AggregateVersion: 2, Type: "ride.cancelled", SchemaVersion: 1, OccurredAt: time.Date(2026, 10, 26, 0, 0, 0, 0, time.UTC), Payload: json.RawMessage(`{"state":"cancelled"}`)}
	if err := base.Validate(1024); err != nil {
		t.Fatal(err)
	}
	cases := map[string]func(*Event){
		"missing stable event ID":    func(e *Event) { e.EventID = " " },
		"missing command identity":   func(e *Event) { e.CommandID = "" },
		"missing aggregate identity": func(e *Event) { e.AggregateID = "" },
		"zero aggregate version":     func(e *Event) { e.AggregateVersion = 0 },
		"zero schema version":        func(e *Event) { e.SchemaVersion = 0 },
		"missing server timestamp":   func(e *Event) { e.OccurredAt = time.Time{} },
		"invalid JSON":               func(e *Event) { e.Payload = json.RawMessage(`{`) },
		"null payload":               func(e *Event) { e.Payload = json.RawMessage(`null`) },
		"array payload":              func(e *Event) { e.Payload = json.RawMessage(`[]`) },
	}
	for name, change := range cases {
		t.Run(name, func(t *testing.T) {
			e := base
			change(&e)
			if e.Validate(1024) == nil {
				t.Fatal("accepted invalid envelope")
			}
		})
	}
	if base.Validate(len(base.Payload)-1) == nil {
		t.Fatal("accepted oversized payload")
	}
	if base.Validate(0) == nil {
		t.Fatal("accepted missing payload bound")
	}
}

func TestLocationFreshnessAndNonFiniteValues(t *testing.T) {
	now := time.Date(2026, 10, 26, 0, 0, 0, 0, time.UTC)
	base := LocationSample{DriverID: "driver-1", SessionID: "session-1", SessionEpoch: 2, Sequence: 10, SampledAt: now, ReceivedAt: now, Latitude: -17.8, Longitude: 31, AccuracyM: 5}
	if err := base.Validate(time.Minute, time.Second); err != nil {
		t.Fatal(err)
	}
	cases := map[string]func(*LocationSample){
		"stale":              func(s *LocationSample) { s.SampledAt = now.Add(-time.Minute - time.Nanosecond) },
		"future":             func(s *LocationSample) { s.SampledAt = now.Add(time.Second + time.Nanosecond) },
		"nonfinite latitude": func(s *LocationSample) { s.Latitude = math.NaN() },
		"nonfinite accuracy": func(s *LocationSample) { s.AccuracyM = math.Inf(1) },
		"out of bounds":      func(s *LocationSample) { s.Longitude = 181 },
		"missing epoch":      func(s *LocationSample) { s.SessionEpoch = 0 },
	}
	for name, change := range cases {
		t.Run(name, func(t *testing.T) {
			s := base
			change(&s)
			if s.Validate(time.Minute, time.Second) == nil {
				t.Fatal("accepted invalid sample")
			}
		})
	}
}

func TestLocationOrderDoesNotCrossDriverOrSameEpochSession(t *testing.T) {
	previous := LocationSample{DriverID: "driver-1", SessionID: "new", SessionEpoch: 2, Sequence: 10}
	cases := []struct {
		name   string
		sample LocationSample
		want   bool
	}{
		{"duplicate", previous, false},
		{"next", LocationSample{DriverID: "driver-1", SessionID: "new", SessionEpoch: 2, Sequence: 11}, true},
		{"old device high sequence", LocationSample{DriverID: "driver-1", SessionID: "old", SessionEpoch: 1, Sequence: 999}, false},
		{"same epoch foreign session", LocationSample{DriverID: "driver-1", SessionID: "foreign", SessionEpoch: 2, Sequence: 999}, false},
		{"new authorized epoch", LocationSample{DriverID: "driver-1", SessionID: "next", SessionEpoch: 3, Sequence: 1}, true},
		{"other driver", LocationSample{DriverID: "driver-2", SessionID: "new", SessionEpoch: 3, Sequence: 99}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := c.sample.NewerThan(previous); got != c.want {
				t.Fatalf("got %v want %v", got, c.want)
			}
		})
	}
}
