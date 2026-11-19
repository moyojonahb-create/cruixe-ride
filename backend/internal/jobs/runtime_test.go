package jobs

import (
	"context"
	"errors"
	"github.com/hibiken/asynq"
	"testing"
)

func TestUnregisteredFinancialWorkCannotReportSuccess(t *testing.T) {
	err := processJob(context.Background(), asynq.NewTask(TypeWalletReconciliation, []byte(`{}`)))
	if !errors.Is(err, asynq.SkipRetry) {
		t.Fatalf("unsupported work must be archived, got %v", err)
	}
}
