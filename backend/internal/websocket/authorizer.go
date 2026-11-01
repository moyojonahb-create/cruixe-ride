package websocket

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type roomQuery interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}
type PostgresRoomAuthorizer struct {
	db      roomQuery
	drivers DriverAuthorizer
}

func NewPostgresRoomAuthorizer(db roomQuery, drivers ...DriverAuthorizer) *PostgresRoomAuthorizer {
	a := &PostgresRoomAuthorizer{db: db}
	if len(drivers) > 0 {
		a.drivers = drivers[0]
	}
	return a
}
func (a *PostgresRoomAuthorizer) participants(ctx context.Context, rideID string) (string, string, string, error) {
	var rider, driver, status string
	err := a.db.QueryRow(ctx, `SELECT r.user_id::text, COALESCE(d.user_id::text,''), r.status
 FROM public.rides r LEFT JOIN public.drivers d ON d.id=r.driver_id WHERE r.id=$1 AND (r.status <> 'pending' OR r.expires_at IS NULL OR r.expires_at > clock_timestamp())`, rideID).Scan(&rider, &driver, &status)
	return rider, driver, status, err
}
func activeTrip(status string) bool {
	return status == "accepted" || status == "arrived" || status == "in_progress"
}
func activeRequest(status string) bool {
	return status == "pending" || status == "scheduled" || activeTrip(status)
}
func (a *PostgresRoomAuthorizer) eligible(ctx context.Context, userID string) bool {
	id, err := uuid.Parse(userID)
	return err == nil && a.drivers != nil && a.drivers.CanActAsDriver(ctx, id) == nil
}
func (a *PostgresRoomAuthorizer) CanJoinRideRoom(ctx context.Context, rideID, userID string) (bool, error) {
	rider, driver, status, err := a.participants(ctx, rideID)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return activeRequest(status) && userID != "" && (rider == userID || (activeTrip(status) && driver == userID && a.eligible(ctx, driver))), nil
}

// Location ownership is rechecked at delivery, including queued remote events.
func (a *PostgresRoomAuthorizer) CanReceiveRideLocation(ctx context.Context, rideID, userID, driverID string) (bool, error) {
	rider, driver, status, err := a.participants(ctx, rideID)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return activeTrip(status) && driver != "" && driverID == driver && (userID == rider || userID == driver) && a.eligible(ctx, driver), nil
}

// A committed final lifecycle notification is the only terminal data exception.
func (a *PostgresRoomAuthorizer) CanReceiveTerminalRideEvent(ctx context.Context, rideID, userID, event string) (bool, error) {
	rider, driver, status, err := a.participants(ctx, rideID)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	expected := ""
	if event == "ride_cancelled" {
		expected = "cancelled"
	}
	if event == "ride_completed" {
		expected = "completed"
	}
	return expected != "" && status == expected && userID != "" && (userID == rider || userID == driver), nil
}
