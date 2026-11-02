package wallet

import (
 "os"
 "strings"
 "testing"
)

// Prevent accidental regression into the incompatible Lovable-era transaction
// table. Static tests complement, but do not replace, real Postgres rehearsals.
func TestV2CoreMigrationKeepsLegacyWalletsIntact(t *testing.T) {
 b,err:=os.ReadFile("../../../docs/sql/STAGING_ONLY_wallet_v2_financial_core.sql")
 if err!=nil {t.Fatal(err)}
 s:=string(b)
 for _,need:=range []string{
  "CREATE TABLE IF NOT EXISTS public.wallet_accounts",
  "CREATE TABLE IF NOT EXISTS public.wallet_v2_transactions",
  "CREATE TABLE IF NOT EXISTS public.wallet_ledger_entries",
  "CREATE TABLE IF NOT EXISTS public.payment_intents",
  "CREATE TABLE IF NOT EXISTS public.provider_events",
  "ALTER TABLE public.wallet_v2_transactions ENABLE ROW LEVEL SECURITY",
  "FROM PUBLIC, anon, authenticated",
 } {
  if !strings.Contains(s,need){t.Errorf("V2 migration missing %q",need)}
 }
 for _,unsafe:=range []string{
  "DROP TABLE public.wallets", "DROP TABLE public.wallet_transactions",
  "TRUNCATE public.wallets", "TRUNCATE public.wallet_transactions",
  "ALTER TABLE public.wallet_transactions",
  "CREATE TABLE IF NOT EXISTS public.wallet_transactions",
 } {
  if strings.Contains(s,unsafe){t.Errorf("V2 migration modifies legacy financial history: %q",unsafe)}
 }
}

func TestV2FinancialRepositoryAvoidsLegacyTransactionTable(t *testing.T) {
 for _,path:=range []string{"repository.go","reporting.go","admin_http.go"} {
  b,err:=os.ReadFile(path)
  if err!=nil {t.Fatal(err)}
  s:=string(b)
  if strings.Contains(s,"public.wallet_transactions"){t.Errorf("%s uses legacy wallet_transactions",path)}
 }
}

func TestV2CoreMigrationDoesNotGiveClientsMoneyWriteGrants(t *testing.T) {
 b,err:=os.ReadFile("../../../docs/sql/STAGING_ONLY_wallet_v2_financial_core.sql")
 if err!=nil {t.Fatal(err)}
 s:=string(b)
 for _,unsafe:=range []string{"GRANT INSERT","GRANT UPDATE","GRANT DELETE"} {
  if strings.Contains(s,unsafe){t.Errorf("financial core migration must not grant client write: %s",unsafe)}
 }
}
