package rides

import (
    "context"
    "net/http"
    "testing"

    "github.com/gofiber/fiber/v2"
    "github.com/google/uuid"
    "pickme-backend/internal/middleware"
)

type rejectDriverAuthorization struct{}

func (rejectDriverAuthorization) CanReceiveOffers(context.Context, uuid.UUID) error {
    return errDriverNotApproved
}
func (rejectDriverAuthorization) CanAcceptRide(context.Context, uuid.UUID) error {
    return errDriverNotApproved
}

func TestRideRequestRejectsOutOfBoundsFareBeforeDatabaseWrites(t *testing.T) {
    tests := []struct{
        name string
        fare float64
    }{
        {"zero", 0},
        {"below_minimum", 0.49},
        {"above_maximum", 500.01},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // A nil DB forces a panic if validation unexpectedly reaches a write.
            h := makeHandlerWithDB(nil)
            app := makeAuthRideApp(http.MethodPost, "/api/rides", h.Request, "rider-1")
            resp := doRequest(t, app, "/api/rides", map[string]any{
                "pickup_location": "Pickup",
                "dropoff_location": "Dropoff",
                "fare": tt.fare,
                "payment_method": "cash",
            })
            defer resp.Body.Close()
            if resp.StatusCode != http.StatusBadRequest {
                t.Fatalf("fare=%v: expected 400, got %d", tt.fare, resp.StatusCode)
            }
        })
    }
}

func TestOpenRidesDeniedWithoutDriverAuthorization(t *testing.T) {
    h := makeHandlerWithDB(nil)
    h.authz = rejectDriverAuthorization{}
    app := fiber.New()
    app.Get("/api/rides/open", func(c *fiber.Ctx) error {
        c.Locals(middleware.LocalsAuthSubject, "ed21ea1d-c1b8-43fb-a948-17d941211997")
        return h.ListOpenRides(c)
    })
    // A missing authenticated subject must be rejected before database access.
    req, _ := http.NewRequest(http.MethodGet, "/api/rides/open", nil)
    resp, err := app.Test(req)
    if err != nil { t.Fatal(err) }
    defer resp.Body.Close()
    if resp.StatusCode != http.StatusForbidden {
        t.Fatalf("expected authorization rejection, got %d", resp.StatusCode)
    }
}
