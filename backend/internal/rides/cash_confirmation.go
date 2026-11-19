package rides

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"pickme-backend/internal/middleware"
)

func nullableString(value string) any {
	if value == "" {
		return nil
	}
	return value
}

// ConfirmCash records the assigned driver's acknowledgement, independently of
// trip completion. COALESCE preserves the first server timestamp on retries.
func (h *Handler) ConfirmCash(c *fiber.Ctx) error {
	actor, ok := middleware.AuthenticatedUserID(c)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Authentication required"})
	}
	var collectedAt time.Time
	err := h.db.QueryRow(middleware.RequestContext(c), `
		UPDATE public.rides r
		SET driver_collected_at = COALESCE(r.driver_collected_at, NOW()),
		    updated_at = CASE WHEN r.driver_collected_at IS NULL THEN NOW() ELSE r.updated_at END
		WHERE r.id = $1 AND r.status = 'completed' AND COALESCE(r.payment_method, 'cash') = 'cash'
		  AND EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = r.driver_id AND d.user_id::text = $2)
		RETURNING r.driver_collected_at
	`, c.Params("rideId"), actor).Scan(&collectedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(409).JSON(fiber.Map{"error": "Cash confirmation requires a completed cash ride assigned to this driver"})
	}
	if err != nil {
		return c.Status(503).JSON(fiber.Map{"error": "Cash confirmation could not be saved; retry"})
	}
	return c.JSON(fiber.Map{"ride_id": c.Params("rideId"), "status": "completed", "payment_method": "cash", "payment_status": "paid", "driver_collected_at": collectedAt.UTC()})
}
