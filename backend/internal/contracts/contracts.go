// Package contracts describes proposed, unwired integration boundaries.
// Validation does not establish persistence, authentication or authorization.
package contracts

import (
	"context"
	"encoding/json"
	"errors"
	"math"
	"strings"
	"time"
)

// Event is distinct from node-local socket sequence. Consumers must explicitly
// support Type/SchemaVersion before applying a domain payload.
type Event struct {
	EventID          string          `json:"event_id"`
	CommandID        string          `json:"command_id"`
	AggregateID      string          `json:"aggregate_id"`
	AggregateVersion uint64          `json:"aggregate_version"`
	Type             string          `json:"type"`
	SchemaVersion    uint32          `json:"schema_version"`
	OccurredAt       time.Time       `json:"occurred_at"`
	Payload          json.RawMessage `json:"payload"`
}

func (e Event) Validate(maxPayloadBytes int) error {
	if strings.TrimSpace(e.EventID) == "" || strings.TrimSpace(e.CommandID) == "" || strings.TrimSpace(e.AggregateID) == "" || strings.TrimSpace(e.Type) == "" {
		return errors.New("event identity is required")
	}
	if e.AggregateVersion == 0 || e.SchemaVersion == 0 || e.OccurredAt.IsZero() {
		return errors.New("event versions and server timestamp are required")
	}
	p := strings.TrimSpace(string(e.Payload))
	if maxPayloadBytes <= 0 || len(e.Payload) > maxPayloadBytes || !json.Valid(e.Payload) || len(p) == 0 || p[0] != '{' {
		return errors.New("event payload must be a bounded JSON object")
	}
	return nil
}

// Broker is a proposed outbox-to-durable-transport adapter. Success means durable
// responsibility, never client delivery. Retries preserve complete event identity
// and contents; consumers deduplicate EventID. No adapter is installed here.
type Broker interface {
	Publish(context.Context, Event) error
}

// LocationSample epoch and ReceivedAt are server assigned. Validate/NewerThan
// operate only after the authenticated session and current epoch are checked.
type LocationSample struct {
	DriverID     string
	SessionID    string
	SessionEpoch uint64
	Sequence     uint64
	SampledAt    time.Time
	ReceivedAt   time.Time
	Latitude     float64
	Longitude    float64
	AccuracyM    float64
}

func (s LocationSample) Validate(maxAge, futureSkew time.Duration) error {
	if strings.TrimSpace(s.DriverID) == "" || strings.TrimSpace(s.SessionID) == "" || s.SessionEpoch == 0 || s.Sequence == 0 {
		return errors.New("location identity, server epoch and sequence are required")
	}
	if s.SampledAt.IsZero() || s.ReceivedAt.IsZero() || maxAge <= 0 || futureSkew < 0 || s.ReceivedAt.Sub(s.SampledAt) > maxAge || s.SampledAt.Sub(s.ReceivedAt) > futureSkew {
		return errors.New("location sample is outside the freshness window")
	}
	if !finite(s.Latitude) || !finite(s.Longitude) || !finite(s.AccuracyM) || s.Latitude < -90 || s.Latitude > 90 || s.Longitude < -180 || s.Longitude > 180 || s.AccuracyM < 0 {
		return errors.New("invalid location coordinates or accuracy")
	}
	return nil
}

// NewerThan grants no session authority. Epoch replacement requires an
// independent server session check, including rejection of fabricated epochs.
func (s LocationSample) NewerThan(previous LocationSample) bool {
	if s.DriverID != previous.DriverID {
		return false
	}
	if s.SessionEpoch != previous.SessionEpoch {
		return s.SessionEpoch > previous.SessionEpoch
	}
	return s.SessionID == previous.SessionID && s.Sequence > previous.Sequence
}

func finite(n float64) bool { return !math.IsNaN(n) && !math.IsInf(n, 0) }

// Money uses exact minor units. Adapters must enforce the configured currency
// allowlist, exponent, amount bounds and rounding policy.
type Money struct {
	Minor    int64
	Currency string
}

// SettlementAdapter is a future boundary. Pending is not paid. Request identity
// must survive timeouts and retries; credentials never come from ride commands.
type SettlementAdapter interface {
	Request(context.Context, SettlementRequest) (SettlementResult, error)
	Reconcile(context.Context, string) (SettlementResult, error)
}
type SettlementRequest struct {
	PaymentID      string
	IdempotencyKey string
	Amount         Money
	Method         string
}
type SettlementResult struct {
	PaymentID         string
	ProviderReference string
	State             string
}
