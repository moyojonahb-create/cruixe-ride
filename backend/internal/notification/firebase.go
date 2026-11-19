package notification

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

const googleTokenURL = "https://oauth2.googleapis.com/token"

// PushProviderConfig contains server-only credentials, never Vite/client settings.
type PushProviderConfig struct {
	ProjectID          string
	ServiceAccountJSON string
	GatewayEndpoint    string
	GatewayToken       string
}

// NewPushProvider keeps the existing custom gateway protocol distinct from FCM HTTP v1.
// An explicitly selected Firebase project must have valid service-account credentials.
func NewPushProvider(cfg PushProviderConfig) (Provider, error) {
	if cfg.ServiceAccountJSON != "" || cfg.ProjectID != "" {
		if cfg.GatewayEndpoint != "" {
			return nil, errors.New("configure Firebase or a push gateway, not both")
		}
		return newFirebaseProvider(cfg)
	}
	return NewHTTPProvider(HTTPProviderConfig{Name: "push_gateway", Endpoint: cfg.GatewayEndpoint, Token: cfg.GatewayToken}), nil
}

// ValidatePushProvider authenticates native Firebase credentials without sending a message.
// The gateway transport has its own provider-specific authentication contract.
func ValidatePushProvider(ctx context.Context, provider Provider) error {
	if firebase, ok := provider.(*firebaseProvider); ok {
		_, err := firebase.accessToken(ctx)
		return err
	}
	return nil
}

type firebaseProvider struct {
	projectID   string
	email       string
	key         *rsa.PrivateKey
	client      *http.Client
	now         func() time.Time
	mu          sync.Mutex
	token       string
	tokenExpiry time.Time
	// Suppress already confirmed token sends on an in-process partial-batch retry.
	// Delivery remains at-least-once across process restarts; this is not a durable outbox.
	confirmed map[string]time.Time
}

func newFirebaseProvider(cfg PushProviderConfig) (*firebaseProvider, error) {
	var credential struct {
		Type       string `json:"type"`
		ProjectID  string `json:"project_id"`
		Email      string `json:"client_email"`
		PrivateKey string `json:"private_key"`
		TokenURI   string `json:"token_uri"`
	}
	if json.Unmarshal([]byte(cfg.ServiceAccountJSON), &credential) != nil || credential.Type != "service_account" {
		return nil, errors.New("Firebase requires a valid service-account JSON credential")
	}
	if !regexp.MustCompile(`^[a-z][a-z0-9-]{4,28}[a-z0-9]$`).MatchString(credential.ProjectID) || (cfg.ProjectID != "" && cfg.ProjectID != credential.ProjectID) {
		return nil, errors.New("Firebase credential project does not match the configured project")
	}
	if !strings.HasSuffix(credential.Email, ".iam.gserviceaccount.com") || strings.ContainsAny(credential.Email, "\r\n ") {
		return nil, errors.New("Firebase credential requires a service-account email")
	}
	// Never send a signed assertion to a URL supplied by a credential file.
	if credential.TokenURI != "" && credential.TokenURI != googleTokenURL {
		return nil, errors.New("Firebase credential token URI must be Google's OAuth endpoint")
	}
	block, rest := pem.Decode([]byte(credential.PrivateKey))
	if block == nil || len(bytes.TrimSpace(rest)) != 0 {
		return nil, errors.New("Firebase credential private key is invalid")
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, errors.New("Firebase credential requires a PKCS8 RSA key")
	}
	key, ok := parsed.(*rsa.PrivateKey)
	if !ok || key.N.BitLen() < 2048 {
		return nil, errors.New("Firebase credential requires an RSA key of at least 2048 bits")
	}
	return &firebaseProvider{projectID: credential.ProjectID, email: credential.Email, key: key,
		client: &http.Client{Timeout: 10 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }},
		now:    time.Now, confirmed: map[string]time.Time{}}, nil
}

func (p *firebaseProvider) accessToken(ctx context.Context) (string, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.token != "" && p.now().Add(time.Minute).Before(p.tokenExpiry) {
		return p.token, nil
	}
	now := p.now()
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","typ":"JWT"}`))
	claims, _ := json.Marshal(map[string]any{"iss": p.email, "scope": "https://www.googleapis.com/auth/firebase.messaging", "aud": googleTokenURL, "iat": now.Unix(), "exp": now.Add(time.Hour).Unix()})
	unsigned := header + "." + base64.RawURLEncoding.EncodeToString(claims)
	digest := sha256.Sum256([]byte(unsigned))
	signature, err := rsa.SignPKCS1v15(rand.Reader, p.key, crypto.SHA256, digest[:])
	if err != nil {
		return "", errors.New("Firebase assertion signing failed")
	}
	form := url.Values{"grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"}, "assertion": {unsigned + "." + base64.RawURLEncoding.EncodeToString(signature)}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, googleTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := p.client.Do(req)
	if err != nil {
		return "", errors.New("Firebase OAuth request failed")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Firebase OAuth returned status %d", resp.StatusCode)
	}
	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		TokenType   string `json:"token_type"`
	}
	if json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&result) != nil || result.AccessToken == "" || result.ExpiresIn <= 60 || !strings.EqualFold(result.TokenType, "Bearer") {
		return "", errors.New("Firebase OAuth response is invalid")
	}
	p.token = result.AccessToken
	p.tokenExpiry = now.Add(time.Duration(result.ExpiresIn) * time.Second)
	return p.token, nil
}

func (p *firebaseProvider) Send(ctx context.Context, req DeliveryRequest) (DeliveryResult, error) {
	if p == nil {
		return DeliveryResult{}, errors.New("Firebase provider is nil")
	}
	if len(req.DeviceTokens) == 0 {
		return DeliveryResult{}, errors.New("Firebase delivery requires registered device tokens")
	}
	data := map[string]string{}
	for k, v := range req.Data {
		if s, ok := v.(string); ok {
			data[k] = s
		} else {
			b, err := json.Marshal(v)
			if err != nil {
				return DeliveryResult{}, errors.New("Firebase notification data is invalid")
			}
			data[k] = string(b)
		}
	}
	if req.HistoryID != "" {
		data["notification_id"] = req.HistoryID
	}
	data["type"] = string(req.Type)
	token, err := p.accessToken(ctx)
	if err != nil {
		return DeliveryResult{}, err
	}
	seen := map[string]bool{}
	ids := []string{}
	for _, device := range req.DeviceTokens {
		if device == "" {
			return DeliveryResult{}, errors.New("Firebase device token is empty")
		}
		if seen[device] {
			continue
		}
		seen[device] = true
		cacheKey := req.HistoryID + "\x00" + device
		p.mu.Lock()
		expires := p.confirmed[cacheKey]
		p.mu.Unlock()
		if req.HistoryID != "" && p.now().Before(expires) {
			continue
		}
		payload := map[string]any{"message": map[string]any{"token": device, "notification": map[string]string{"title": req.Title, "body": req.Body}, "data": data}}
		raw, err := json.Marshal(payload)
		if err != nil {
			return DeliveryResult{}, errors.New("Firebase notification is invalid")
		}
		// Fixed Google host and validated project ID prevent credentials leaking to custom endpoints.
		endpoint := "https://fcm.googleapis.com/v1/projects/" + p.projectID + "/messages:send"
		request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(raw))
		if err != nil {
			return DeliveryResult{}, err
		}
		request.Header.Set("Authorization", "Bearer "+token)
		request.Header.Set("Content-Type", "application/json")
		response, err := p.client.Do(request)
		if err != nil {
			return DeliveryResult{}, errors.New("Firebase delivery request failed")
		}
		var result struct {
			Name string `json:"name"`
		}
		decodeErr := json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&result)
		response.Body.Close()
		if response.StatusCode < 200 || response.StatusCode >= 300 {
			if response.StatusCode == http.StatusUnauthorized {
				p.mu.Lock()
				p.token = ""
				p.mu.Unlock()
			}
			return DeliveryResult{}, fmt.Errorf("Firebase delivery returned status %d", response.StatusCode)
		}
		if decodeErr != nil || result.Name == "" {
			return DeliveryResult{}, errors.New("Firebase delivery was not acknowledged")
		}
		ids = append(ids, result.Name)
		if req.HistoryID != "" {
			p.mu.Lock()
			for k, v := range p.confirmed {
				if !p.now().Before(v) {
					delete(p.confirmed, k)
				}
			}
			if len(p.confirmed) < 10000 {
				p.confirmed[cacheKey] = p.now().Add(time.Hour)
			}
			p.mu.Unlock()
		}
	}
	return DeliveryResult{Provider: "firebase_fcm", ProviderID: strings.Join(ids, ",")}, nil
}
