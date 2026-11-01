package rides

import (
	"context"
	"log"
)

// NotifyRideCancelled consumes identities returned by a committed guarded
// cancellation. driverUserID is drivers.user_id, never rides.driver_id or the
// cancelling rider's subject. It is also the business cancellation callback.
func (h *Handler) NotifyRideCancelled(ctx context.Context, rideID, riderUserID, driverUserID string) {
	h.emitRideLifecycle("ride_cancelled", rideID, driverUserID, "cancelled", riderUserID)
	if driverUserID == "" {
		return
	}
	h.recordReputationRideCancelled(ctx, driverUserID, rideID)
	// Legacy data may contain another active ride for this driver. Never mark
	// that driver available merely because one bid/ride was closed. This is a
	// conservative projection guard, not the P0.3 assignment reservation.
	var available bool
	err := h.db.QueryRow(ctx, `
		SELECT NOT EXISTS (
			SELECT 1 FROM public.rides r
			JOIN public.drivers d ON d.id = r.driver_id
			WHERE d.user_id = $1 AND r.status IN ('accepted', 'arrived', 'in_progress')
		)
	`, driverUserID).Scan(&available)
	if err != nil {
		log.Printf("cancellation availability reconciliation required: ride_id=%s", rideID)
		return
	}
	if available {
		h.setDispatchDriverAvailability(ctx, driverUserID, "available", "")
	}
}
