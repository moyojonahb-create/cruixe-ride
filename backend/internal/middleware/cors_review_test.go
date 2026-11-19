package middleware

import (
	"github.com/gofiber/fiber/v2"
	"net/http"
	"net/http/httptest"
	"pickme-backend/internal/config"
	"testing"
)

func reviewEnvironment(t *testing.T, extra string) {
	t.Helper()
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://localhost/test?sslmode=require")
	t.Setenv("SUPABASE_URL", "https://fixture.supabase.co")
	t.Setenv("CORS_ALLOW_ORIGINS", "https://existing.example.com,capacitor://localhost")
	t.Setenv("CORS_ADDITIONAL_ORIGINS", extra)
}

func TestReviewOriginPreservesExistingAccessAndRejectsOtherSites(t *testing.T) {
	preview := "https://review.example.com"
	reviewEnvironment(t, preview)
	cfg, err := config.Load()
	if err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	app.Use(CORS(cfg.CORS))
	app.Get("/test", func(c *fiber.Ctx) error { return c.SendStatus(200) })
	for _, tc := range []struct {
		origin  string
		allowed bool
	}{
		{"https://existing.example.com", true}, {"capacitor://localhost", true}, {preview, true}, {"https://attacker.example.com", false},
	} {
		req := httptest.NewRequest(http.MethodOptions, "/test", nil)
		req.Header.Set("Origin", tc.origin)
		req.Header.Set("Access-Control-Request-Method", "GET")
		resp, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		got := resp.Header.Get("Access-Control-Allow-Origin")
		resp.Body.Close()
		if tc.allowed && got != tc.origin {
			t.Fatalf("authorized origin %s rejected", tc.origin)
		}
		if !tc.allowed && got != "" {
			t.Fatalf("untrusted origin permitted: %s", got)
		}
	}
}

func TestReviewOriginCannotBroadenAccessWithWildcardOrCredentials(t *testing.T) {
	for _, extra := range []string{"https://*.example.com", "https://user:password@example.com", "https://example.com/path", "http://example.com"} {
		t.Run(extra, func(t *testing.T) {
			reviewEnvironment(t, extra)
			if _, err := config.Load(); err == nil {
				t.Fatal("unsafe review origin accepted")
			}
		})
	}
	reviewEnvironment(t, "https://review.example.com")
	t.Setenv("CORS_ALLOW_ORIGINS", "")
	if _, err := config.Load(); err == nil {
		t.Fatal("review origin bypassed required production base allowlist")
	}
}
