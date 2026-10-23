package wallet

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// An embedded pgx.Tx satisfies the interface while the exercised methods are
// deliberately overridden. No external Postgres is required for these tests.
type recordingLedgerTx struct {
	pgx.Tx
	execs []string
	failAt int
	committed bool
	rolledBack bool
}

func (t *recordingLedgerTx) Exec(_ context.Context, query string, _ ...any) (pgconn.CommandTag, error) {
	t.execs = append(t.execs, query)
	if t.failAt > 0 && len(t.execs) == t.failAt {
		return pgconn.CommandTag{}, errors.New("simulated ledger entry failure")
	}
	return pgconn.NewCommandTag("INSERT 1"), nil
}

func (t *recordingLedgerTx) Commit(_ context.Context) error {
	t.committed = true
	return nil
}

func (t *recordingLedgerTx) Rollback(_ context.Context) error {
	t.rolledBack = true
	return nil
}

type recordingLedgerDB struct {
	*fakeDB
	tx *recordingLedgerTx
}
func (d *recordingLedgerDB) Begin(context.Context) (pgx.Tx, error) {
	return d.tx, nil
}

func TestLedgerPostingCommitsTransactionAsOneUnit(t *testing.T) {
	db := &recordingLedgerDB{fakeDB: &fakeDB{}, tx: &recordingLedgerTx{}}
	err := NewPostgresRepository(db).PostLedgerEntries(context.Background(), testTransaction(), testEntries())
	if err != nil {
		t.Fatal(err)
	}
	if !db.tx.committed {
		t.Fatal("expected transaction commit")
	}
	if len(db.tx.execs) != 3 || !strings.Contains(db.tx.execs[0], "INSERT INTO public.wallet_v2_transactions") ||
		!strings.Contains(db.tx.execs[1], "INSERT INTO public.wallet_ledger_entries") ||
		!strings.Contains(db.tx.execs[2], "INSERT INTO public.wallet_ledger_entries") {
		t.Fatalf("expected transaction and two entries within tx, got %#v", db.tx.execs)
	}
	if len(db.fakeDB.execs) != 0 {
		t.Fatal("must not write outside database transaction")
	}
}

func TestLedgerPostingRollsBackWhenOneEntryFails(t *testing.T) {
	db := &recordingLedgerDB{fakeDB: &fakeDB{}, tx: &recordingLedgerTx{failAt: 3}}
	err := NewPostgresRepository(db).PostLedgerEntries(context.Background(), testTransaction(), testEntries())
	if err == nil || !strings.Contains(err.Error(), "simulated ledger") {
		t.Fatalf("expected simulated failure, got %v", err)
	}
	if db.tx.committed || !db.tx.rolledBack {
		t.Fatal("failed entry should roll back and must not commit")
	}
	if len(db.fakeDB.execs) != 0 {
		t.Fatal("must not fall back to independent writes")
	}
}
