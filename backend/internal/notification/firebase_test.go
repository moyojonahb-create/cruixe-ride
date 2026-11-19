package notification

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"io"
	"net/http"
	"strings"
	"testing"
)

type firebaseTransport func(*http.Request) (*http.Response, error)

func (f firebaseTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestFirebaseAcknowledgementAndTokenReuse(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	raw, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		t.Fatal(err)
	}
	credential, _ := json.Marshal(map[string]string{"type": "service_account", "project_id": "cruixe-test", "client_email": "push@cruixe-test.iam.gserviceaccount.com", "private_key": string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: raw})), "token_uri": googleTokenURL})
	p, err := newFirebaseProvider(PushProviderConfig{ProjectID: "cruixe-test", ServiceAccountJSON: string(credential)})
	if err != nil {
		t.Fatal(err)
	}
	oauth, sends := 0, 0
	rejected := false
	p.client.Transport = firebaseTransport(func(r *http.Request) (*http.Response, error) {
		body := `{"name":"projects/cruixe-test/messages/confirmed"}`
		status := 200
		switch r.URL.String() {
		case googleTokenURL:
			oauth++
			if err := r.ParseForm(); err != nil {
				t.Fatal(err)
			}
			if len(strings.Split(r.Form.Get("assertion"), ".")) != 3 {
				t.Fatal("missing signed OAuth assertion")
			}
			body = `{"access_token":"fixture-access","token_type":"Bearer","expires_in":3600}`
		case "https://fcm.googleapis.com/v1/projects/cruixe-test/messages:send":
			sends++
			if r.Header.Get("Authorization") != "Bearer fixture-access" {
				t.Fatal("missing access token")
			}
			var payload map[string]any
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				t.Fatal(err)
			}
			if payload["message"].(map[string]any)["token"] != "device-a" {
				t.Fatal("wrong target device")
			}
			if rejected {
				status = 503
				body = `{"error":"unavailable"}`
			}
		default:
			t.Fatalf("unexpected credential destination %s", r.URL)
		}
		return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: http.Header{}}, nil
	})
	req := DeliveryRequest{HistoryID: "history-1", DeviceTokens: []string{"device-a", "device-a"}, Title: "Test"}
	result, err := p.Send(context.Background(), req)
	if err != nil || result.ProviderID == "" {
		t.Fatalf("unconfirmed delivery: %v", err)
	}
	if _, err = p.Send(context.Background(), req); err != nil {
		t.Fatal(err)
	}
	if oauth != 1 || sends != 1 {
		t.Fatalf("duplicate delivery or OAuth refresh: oauth=%d sends=%d", oauth, sends)
	}
	rejected = true
	req.HistoryID = "history-2"
	if _, err = p.Send(context.Background(), req); err == nil {
		t.Fatal("provider rejection acknowledged as success")
	}
	if _, err = p.Send(context.Background(), DeliveryRequest{}); err == nil {
		t.Fatal("missing devices accepted")
	}
}

func TestPushConfigurationFailsClosed(t *testing.T) {
	if _, err := NewPushProvider(PushProviderConfig{ProjectID: "cruixe-test"}); err == nil {
		t.Fatal("missing credential accepted")
	}
	if _, err := NewPushProvider(PushProviderConfig{ProjectID: "cruixe-test", GatewayEndpoint: "https://example.com"}); err == nil {
		t.Fatal("ambiguous transport accepted")
	}
	p, _ := NewPushProvider(PushProviderConfig{})
	if _, err := p.Send(context.Background(), DeliveryRequest{}); err == nil {
		t.Fatal("unconfigured provider reported delivery")
	}
}
