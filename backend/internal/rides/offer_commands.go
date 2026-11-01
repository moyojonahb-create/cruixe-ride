package rides

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"

	"pickme-backend/internal/middleware"
	"pickme-backend/internal/observability"
)

// WithdrawDriverOffer is distinct from the rider's RejectOffer command. The
// legacy reject routes still accept the submitting driver as a compatibility
// adapter. Both commands retain the existing storage status, "rejected", until
// a reviewed migration can introduce a distinct withdrawn status.
func (h *Handler) WithdrawDriverOffer(c *fiber.Ctx) error {
	return h.closePendingOffer(c, c.Params("rideId"), c.Params("offerId"), true)
}

func (h *Handler) closePendingOffer(c *fiber.Ctx, rideID, offerID string, withdrawalOnly bool) error {
	ctx, span := observability.StartSpan(middleware.RequestContext(c), "Close Pending Offer")
	defer span.End()
	actorID, ok := middleware.AuthenticatedUserID(c)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Authentication required"})
	}
	if offerID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Offer id is required"})
	}
	tx, err := h.db.Begin(ctx)
	if err != nil {
		return c.Status(503).JSON(fiber.Map{"error": "Offer command unavailable"})
	}
	defer tx.Rollback(ctx)

	// This lookup is not authority: association and ownership are rechecked
	// under locks below. It preserves the existing offer-ID-only rider API.
	if rideID == "" {
		err = tx.QueryRow(ctx, `SELECT ride_id::text FROM public.offers WHERE id = $1`, offerID).Scan(&rideID)
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(fiber.Map{"error": "Offer not found"})
		}
		if err != nil {
			return c.Status(503).JSON(fiber.Map{"error": "Offer command unavailable"})
		}
	}
	var riderID, rideStatus string
	err = tx.QueryRow(ctx, `SELECT user_id::text, status FROM public.rides WHERE id = $1 FOR UPDATE`, rideID).Scan(&riderID, &rideStatus)
	if err == pgx.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Ride not found"})
	}
	if err != nil {
		return c.Status(503).JSON(fiber.Map{"error": "Offer command unavailable"})
	}
	var driverID, offerStatus string
	err = tx.QueryRow(ctx, `SELECT driver_id::text, status FROM public.offers WHERE id = $1 AND ride_id = $2 FOR UPDATE`, offerID, rideID).Scan(&driverID, &offerStatus)
	if err == pgx.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Offer not found for ride"})
	}
	if err != nil {
		return c.Status(503).JSON(fiber.Map{"error": "Offer command unavailable"})
	}
	operation := "reject"
	if withdrawalOnly || actorID != riderID {
		if actorID != driverID {
			return c.Status(403).JSON(fiber.Map{"error": "Cannot withdraw another driver's offer"})
		}
		operation = "withdraw"
	}
	if rideStatus != "pending" || offerStatus != "pending" {
		return c.Status(409).JSON(fiber.Map{"error": "Offer cannot be rejected", "code": "INVALID_STATE"})
	}
	tag, err := tx.Exec(ctx, `UPDATE public.offers SET status = 'rejected' WHERE id = $1 AND ride_id = $2 AND status = 'pending'`, offerID, rideID)
	if err != nil {
		return c.Status(503).JSON(fiber.Map{"error": "Offer command unavailable"})
	}
	if tag.RowsAffected() != 1 {
		return c.Status(409).JSON(fiber.Map{"error": "Offer cannot be rejected", "code": "INVALID_STATE"})
	}
	if err := tx.Commit(ctx); err != nil {
		return c.Status(503).JSON(fiber.Map{"error": "Offer command outcome unavailable"})
	}
	// Closing a bid does not release an assignment or change global presence.
	return c.JSON(fiber.Map{"message": "Offer declined successfully", "offer_id": offerID, "status": "rejected", "operation": operation})
}
