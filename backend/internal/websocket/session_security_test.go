package websocket

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"github.com/gofiber/fiber/v2"
	"net/http/httptest"
	"pickme-backend/internal/auth"
	"pickme-backend/internal/config"
	"testing"
	"time"
)

func sessionJWT(t *testing.T, expires int64) string {
	header := encodeJSON(t, map[string]string{"alg": "HS256"})
	claims := encodeJSON(t, map[string]any{"sub": "rider-auth", "aud": "authenticated", "iss": "test-issuer", "exp": expires, "session_id": "session-1"})
	input := header + "." + claims
	mac := hmac.New(sha256.New, []byte("test-secret"))
	mac.Write([]byte(input))
	return input + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
func TestHandshakeRequiresExpiryAndRetainsSessionIdentity(t *testing.T) {
	verifier, err := auth.NewSupabaseJWT(config.AuthConfig{SupabaseJWTSecret: "test-secret", Audience: "authenticated", Issuer: "test-issuer"})
	if err != nil {
		t.Fatal(err)
	}
	for _, expires := range []int64{0, time.Now().Add(-time.Minute).Unix(), time.Now().Add(time.Hour).Unix()} {
		app := fiber.New()
		app.Get("/ws", func(c *fiber.Ctx) error {
			id, status, err := AuthenticateRequest(c, verifier, &fakeRoomAuthorizer{allowed: true})
			if err != nil {
				return c.SendStatus(status)
			}
			SetAuthenticatedLocals(c, id)
			stored := c.Locals(LocalsIdentity).(AuthenticatedConnection)
			if stored.UserID != "rider-auth" || stored.SessionID != "session-1" || stored.ExpiresAt.Unix() != expires || !stored.RegisterAsRider {
				t.Fatal("verified identity metadata lost")
			}
			return c.SendStatus(200)
		})
		response, err := app.Test(httptest.NewRequest("GET", "/ws?token="+sessionJWT(t, expires), nil))
		if err != nil {
			t.Fatal(err)
		}
		response.Body.Close()
		want := 401
		if expires > time.Now().Unix() {
			want = 200
		}
		if response.StatusCode != want {
			t.Fatalf("exp=%d status=%d", expires, response.StatusCode)
		}
	}
}

type inactiveSession struct{}

func (inactiveSession) IsSessionActive(context.Context, string, string) (bool, error) {
	return false, nil
}
func TestOptionalVerifiedSessionAdapterFailsClosed(t *testing.T) {
	m, conn, _ := secureClient(t, &fakeRoomAuthorizer{allowed: true}, AuthenticatedConnection{UserID: "rider-auth", SessionID: "session-1", ExpiresAt: time.Now().Add(time.Hour), RegisterAsRider: true})
	m.WithSessionAuthorizer(inactiveSession{})
	if m.Send(conn, []byte(`{"event":"pong"}`)) || m.ClientCount() != 0 {
		t.Fatal("inactive session retained access")
	}
}
