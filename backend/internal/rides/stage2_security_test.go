package rides

import (
    "context"
    "fmt"
    "strings"
    "net/http"
    "net/http/httptest"
    "sync"
    "sync/atomic"
    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgconn"
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

func TestOfferSubmissionRejectsOutOfBoundsPrice(t *testing.T) {
    for _, price := range []float64{0, 0.49, 500.01} {
        t.Run(fmt.Sprintf("price_%v", price), func(t *testing.T) {
            db := &fakeDB{queryRowFn: func(_ context.Context, sql string, _ ...any) pgx.Row {
                if strings.Contains(sql, "INSERT INTO public.offers") {
                    t.Fatal("invalid offer reached database INSERT")
                }
                return &fakeRow{values: []any{"pending", "cash"}}
            }}
            h := makeHandlerWithDB(db)
            app := makeAuthRideApp(http.MethodPost, "/api/rides/:rideId/offers", h.SubmitOffer, "driver-1")
            resp := doRequest(t, app, "/api/rides/ride-1/offers", map[string]any{"price": price})
            defer resp.Body.Close()
            if resp.StatusCode != http.StatusBadRequest {
                t.Fatalf("price %v: expected 400, got %d", price, resp.StatusCode)
            }
        })
    }
}

// Tests the optimistic UPDATE status='pending' guard under two concurrent
// requests with a thread-safe fake database. Real PostgreSQL lock behavior
// still needs a staging integration test.
func TestConcurrentOfferAcceptanceOnlyOneSucceeds(t *testing.T) {
    var accepted atomic.Bool
    db := &fakeDB{beginFn: func(context.Context) (Tx, error) {
        return &fakeTx{
            queryRowFn: offerAndDriverQueryRow([]any{"rider-1", "pending", "cash"}),
            execFn: func(_ context.Context, sql string, _ ...any) (pgconn.CommandTag, error) {
                if strings.Contains(sql, "UPDATE public.rides") {
                    if !accepted.CompareAndSwap(false, true) {
                        return pgconn.NewCommandTag("UPDATE 0"), nil
                    }
                }
                return pgconn.NewCommandTag("UPDATE 1"), nil
            },
            commitFn: func(context.Context) error { return nil },
            rollbackFn: func(context.Context) error { return nil },
        }, nil
    }}
    app := makeAuthApp(makeHandlerWithDB(db).AcceptOffer, "rider-1")
    results := make(chan int, 2)
    var wg sync.WaitGroup
    for i := 0; i < 2; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            req := httptest.NewRequest(http.MethodPost, "/test/ride-1/offer-1", nil)
            resp, err := app.Test(req)
            if err != nil {
                results <- 0
                return
            }
            defer resp.Body.Close()
            results <- resp.StatusCode
        }()
    }
    wg.Wait()
    close(results)
    success, conflict := 0, 0
    for code := range results {
        if code == http.StatusOK { success++ }
        if code == http.StatusConflict { conflict++ }
    }
    if success != 1 || conflict != 1 {
        t.Fatalf("expected one accepted offer and one conflict; got %d success, %d conflict", success, conflict)
    }
}

func TestRideCreationRejectsForgedLifecycleState(t *testing.T) {
    for _, status := range []string{"accepted", "in_progress", "completed", "cancelled"} {
        t.Run(status, func(t *testing.T) {
            h := makeHandlerWithDB(nil)
            app := makeAuthRideApp(http.MethodPost, "/api/rides", h.Request, "rider-1")
            resp := doRequest(t, app, "/api/rides", map[string]any{
                "pickup_location": "Pickup",
                "dropoff_location": "Dropoff",
                "fare": 5,
                "status": status,
            })
            defer resp.Body.Close()
            if resp.StatusCode != http.StatusBadRequest {
                t.Fatalf("status %s: expected 400, got %d", status, resp.StatusCode)
            }
        })
    }
}

func TestRideFarePatchRejectsOutOfBoundsBeforeDatabaseWrite(t *testing.T) {
    for _, amountMinor := range []int64{0, 49, 50001} {
        t.Run(fmt.Sprintf("minor_%d", amountMinor), func(t *testing.T) {
            app := makeAuthRideApp(http.MethodPatch, "/api/rides/:rideId", makeHandlerWithDB(nil).PatchRide, "rider-1")
            payload := fmt.Sprintf(`{"fare_minor":%d}`, amountMinor)
            req := httptest.NewRequest(http.MethodPatch, "/api/rides/ride-1", strings.NewReader(payload))
            req.Header.Set("Content-Type", "application/json")
            resp, err := app.Test(req)
            if err != nil { t.Fatal(err) }
            defer resp.Body.Close()
            if resp.StatusCode != http.StatusBadRequest {
                t.Fatalf("amount %d: expected 400, got %d", amountMinor, resp.StatusCode)
            }
        })
    }
}
