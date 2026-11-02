-- Cruize Ride financial schema parity — READ ONLY.
-- Run against foksbnjtzubsjpeoorvo or an isolated staging clone.
-- Must not modify balances, privileges, migrations or live transactions.
-- V2 Go's WALLET_LEDGER_SCHEMA.sql is NOT directly deployable over the
-- legacy public.wallet_transactions table.

SELECT current_database() AS database_name, now() AS checked_at;

-- Existing live wallet tables and required V2 tables. Null means absent.
SELECT name, to_regclass('public.' || name) IS NOT NULL AS exists_in_public
FROM (VALUES
 ('wallets'), ('driver_wallets'), ('wallet_transactions'),
 ('platform_ledger'), ('wallet_accounts'), ('wallet_ledger_entries'),
 ('payment_intents'), ('provider_events'),
 ('wallet_authorizations'), ('settlement_records'),
 ('financial_jobs'), ('reconciliation_runs')
) AS t(name)
ORDER BY name;

-- Exact column contract. Do not assume CREATE TABLE IF NOT EXISTS migrates
-- an existing table: it will leave legacy column layout unchanged.
SELECT c.table_name, c.ordinal_position, c.column_name, c.data_type,
       c.is_nullable, c.column_default
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('wallets','wallet_transactions','wallet_accounts',
                       'wallet_ledger_entries','driver_wallets','platform_ledger')
ORDER BY c.table_name,c.ordinal_position;

-- V2 wallet_transactions required names. If false, the current Go insert
-- cannot be used against the legacy table.
WITH required(column_name) AS (
 VALUES ('id'),('transaction_type'),('status'),('idempotency_key'),('currency'),
        ('total_amount'),('source_type'),('source_id'),('owner_user_id'),
        ('ride_id'),('payment_provider'),('payment_intent_id'),('created_by'),
        ('approved_by'),('approved_at'),('created_at'),('updated_at')
)
SELECT r.column_name,
       EXISTS (SELECT 1 FROM information_schema.columns c
               WHERE c.table_schema='public'
                 AND c.table_name='wallet_transactions'
                 AND c.column_name=r.column_name) AS available_in_live_table
FROM required r ORDER BY r.column_name;

-- Current grants, not proof that RLS prevents abuse. A TRUE on wallet
-- balance UPDATE means privilege hardening is still required.
SELECT has_table_privilege('authenticated','public.wallets','INSERT') AS wallet_insert,
       has_table_privilege('authenticated','public.wallets','UPDATE') AS wallet_update,
       has_column_privilege('authenticated','public.wallets','balance','UPDATE') AS balance_update,
       has_table_privilege('authenticated','public.wallets','SELECT') AS wallet_select;

-- Non-sensitive aggregate row counts: never print individual users/balances.
SELECT (SELECT count(*) FROM public.wallets) AS legacy_wallets,
       (SELECT count(*) FROM public.wallet_transactions) AS legacy_transactions,
       (SELECT count(*) FROM public.driver_wallets) AS legacy_driver_wallets,
       (SELECT count(*) FROM public.platform_ledger) AS legacy_platform_ledger;
