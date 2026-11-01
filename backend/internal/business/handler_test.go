package business

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"pickme-backend/internal/middleware"
)

func TestDriverApplicationFieldsIgnoreProtectedInput(t *testing.T) {
	row := driverApplicationFields(map[string]any{
		"vehicle_type":  "economy",
		"status":        "approved",
		"is_online":     true,
		"trial_ends_at": "2099-01-01",
	})
	if row["status"] != "pending" || row["is_online"] != false {
		t.Fatalf("expected server-owned pending/offline defaults, got %#v", row)
	}
	if _, ok := row["trial_ends_at"]; ok {
		t.Fatal("eligibility fields must not enter application writes")
	}
}

func TestDriverUpsertFieldsCannotDowngradeReviewedState(t *testing.T) {
	row := driverUpsertFields(map[string]any{
		"vehicle_make": "Toyota",
		"status":       "approved",
		"is_online":    true,
	})
	if _, ok := row["status"]; ok {
		t.Fatal("upsert must not update approval status")
	}
	if _, ok := row["is_online"]; ok {
		t.Fatal("upsert must not update presence")
	}
}

func TestDriverDocumentSubmissionForcesPendingAndDropsReviewFields(t *testing.T) {
	row := driverDocumentSubmissionFields(map[string]any{
		"driver_id":        "driver-1",
		"document_type":    "personal_photo",
		"file_url":         "https://example.invalid/photo",
		"status":           "approved",
		"rejection_reason": "forged",
		"reviewed_by":      "admin-1",
	})
	if row["status"] != "pending" {
		t.Fatalf("expected pending document, got %#v", row["status"])
	}
	if _, ok := row["rejection_reason"]; ok {
		t.Fatal("review metadata must not enter driver document writes")
	}
	if _, ok := row["reviewed_by"]; ok {
		t.Fatal("review actor must not enter driver document writes")
	}
}

func TestBusinessWriteRoutesValidateInput(t *testing.T) {
	app := fiber.New()
	requireAuth := func(c *fiber.Ctx) error {
		c.Locals(middleware.LocalsAuthSubject, "user-1")
		return c.Next()
	}
	RegisterRoutes(app, nil, requireAuth)

	cases := []struct {
		method string
		path   string
		body   string
		status int
	}{
		{method: http.MethodPost, path: "/api/messages", body: `{}`, status: fiber.StatusBadRequest},
		{method: http.MethodPost, path: "/api/call-sessions", body: `{}`, status: fiber.StatusBadRequest},
		{method: http.MethodPost, path: "/api/favorite-locations", body: `{}`, status: fiber.StatusBadRequest},
		{method: http.MethodPost, path: "/api/drivers/documents", body: `{}`, status: fiber.StatusBadRequest},
		{method: http.MethodPatch, path: "/api/drivers/me", body: `{}`, status: fiber.StatusBadRequest},
		{method: http.MethodPost, path: "/api/driver-sessions/fatigue-break", body: `{}`, status: fiber.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
			if resp.StatusCode != tc.status {
				t.Fatalf("expected status %d, got %d", tc.status, resp.StatusCode)
			}
		})
	}
}

func TestAdminMutationPolicyRejectsSensitiveRideFields(t *testing.T) {
	policy := adminMutationPolicies["rides"]
	_, err := policy.sanitize("update", map[string]any{
		"driver_id": "driver-1",
	})
	if err == nil {
		t.Fatal("expected sensitive ride field to be rejected")
	}
}

func TestAdminMutationPolicyAllowsLandmarkFields(t *testing.T) {
	policy := adminMutationPolicies["koloi_landmarks"]
	row, err := policy.sanitize("insert", map[string]any{
		"name":      "Harare CBD",
		"latitude":  -17.8292,
		"longitude": 31.0522,
	})
	if err != nil {
		t.Fatalf("expected landmark fields to be allowed: %v", err)
	}
	if len(row) != 3 {
		t.Fatalf("expected sanitized row to keep 3 fields, got %d", len(row))
	}
}
