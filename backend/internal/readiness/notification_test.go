package readiness

import "testing"

func TestValidatedNativePushConfiguration(t *testing.T) {
	missing := NewChecker(Config{Profile: "production"}).checkNotification()
	if missing.Ready {
		t.Fatal("missing providers reported ready")
	}
	configured := NewChecker(Config{Profile: "production", NotificationPushConfigured: true}).checkNotification()
	if !configured.Ready {
		t.Fatal("validated native provider not recognized")
	}
}
