-- Cruize Ride financial migration safety gate. READ-ONLY. No DDL/DML.
-- Destination: foksbnjtzubsjpeoorvo. Audit on PostgreSQL with a privileged
-- read-only connection. Do NOT run backend/WALLET_LEDGER_SCHEMA.sql blindly.
--
-- Legacy public.wallet_transactions has NOT NULL wallet_id, user_id, amount
-- and CHECK transaction_type IN (deposit, withdrawal, trip_fee, refund).
-- Go V2 expects idempotency_key, currency, total_amount, owner_user_id,
-- payment_provider and V2 transaction statuses/types. CREATE TABLE IF NOT EXISTS
-- DOES NOT reconcile the existing table.

WITH critical(schema_name, table_name, column_name) AS (
  VALUES
    ('public','wallet_accounts','id'),
    ('public','wallet_accounts','owner_user_id'),
    ('public','wallet_ledger_entries','transaction_id'),
    ('public','wallet_ledger_entries','account_id'),
    ('public','wallet_transactions','wallet_id'),
    ('public','wallet_transactions','user_id'),
    ('public','wallet_transactions','amount'),
    ('public','wallet_transactions','idempotency_key'),
    ('public','wallet_transactions','currency'),
    ('public','wallet_transactions','total_amount'),
    ('public','payment_intents','idempotency_key'),
    ('public','provider_events','provider_event_id')
)
SELECT c.table_name, c.column_name,
       CASE WHEN col.column_name IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS observed,
       col.data_type, col.is_nullable, col.column_default
FROM critical c
LEFT JOIN information_schema.columns col
  ON col.table_schema = c.schema_name
 AND col.table_name = c.table_name
 AND col.column_name = c.column_name
ORDER BY c.table_name, c.column_name;

SELECT conrelid::regclass::text table_name, conname, pg_get_constraintdef(oid) definition
FROM pg_constraint
WHERE conrelid IN ('public.wallets'::regclass, 'public.wallet_transactions'::regclass)
ORDER BY table_name, conname;

SELECT
  has_table_privilege('authenticated','public.wallets','INSERT') AS client_insert,
  has_table_privilege('authenticated','public.wallets','UPDATE') AS client_update,
  has_column_privilege('authenticated','public.wallets','balance','UPDATE') AS client_balance_update,
  has_column_privilege('authenticated','public.wallets','is_locked','UPDATE') AS client_lock_update;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('wallets','wallet_transactions')
ORDER BY tablename, policyname;

SELECT name, setting FROM pg_settings
WHERE name IN ('server_version', 'default_transaction_isolation')
ORDER BY name;

-- Operator: obtain a proper encrypted backup + recovery drill, decide if
-- legacy wallet transactions are historical archive or need reconciliation,
-- design a NEW, distinct V2 transaction table or compatibility migration,
-- and pass cash/payment sandbox tests in staging before production changes.
