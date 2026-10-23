-- Cruize Ride — Go V2 finance compatibility gate (READ ONLY)
-- Destination foksbnjtzubsjpeoorvo. Safe for repeated execution.
-- DO NOT use as a migration. Intended to stop unsafe blind installation of
-- backend/WALLET_LEDGER_SCHEMA.sql into the existing legacy Supabase schema.

WITH expected(table_name,column_name) AS (
 VALUES
 ('wallet_accounts','id'),
 ('wallet_accounts','owner_user_id'),
 ('wallet_accounts','cached_available_balance_minor'),
 ('wallet_ledger_entries','id'),
 ('wallet_ledger_entries','transaction_id'),
 ('wallet_ledger_entries','account_id'),
 ('wallet_ledger_entries','amount_minor'),
 ('wallet_transactions','id'),
 ('wallet_transactions','idempotency_key'),
 ('wallet_transactions','status'),
 ('wallet_transactions','currency'),
 ('wallet_transactions','total_amount'),
 ('wallet_transactions','source_type'),
 ('wallet_transactions','payment_intent_id'),
 ('payment_intents','id'),
 ('payment_intents','idempotency_key'),
 ('provider_events','id'),
 ('provider_events','provider_event_id')
)
SELECT e.table_name, e.column_name,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS compatibility
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema='public' AND c.table_name=e.table_name AND c.column_name=e.column_name
ORDER BY e.table_name,e.column_name;

-- Go V2 transaction table conflicts with the existing legacy transaction shape.
-- Empty table != compatible schema. Triggers, RLS, policies and foreign-key
-- dependencies must also be inspected before any staging-only schema cutover.
SELECT c.column_name,c.data_type,c.is_nullable,c.column_default
FROM information_schema.columns c
WHERE c.table_schema='public' AND c.table_name='wallet_transactions'
ORDER BY c.ordinal_position;

SELECT con.conname,con.contype,pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
WHERE con.conrelid='public.wallet_transactions'::regclass
ORDER BY con.conname;

-- Connected production status; no private row data returned.
SELECT (SELECT count(*) FROM public.wallet_transactions) AS legacy_transaction_count,
       (SELECT count(*) FROM public.wallets) AS legacy_wallet_count,
       (SELECT count(*) FROM public.driver_wallets) AS legacy_driver_wallet_count,
       to_regclass('public.wallet_accounts') AS go_v2_wallet_accounts,
       to_regclass('public.wallet_ledger_entries') AS go_v2_ledger_entries,
       has_table_privilege('authenticated','public.wallets','INSERT') AS user_can_create_wallet,
       has_column_privilege('authenticated','public.wallets','balance','UPDATE') AS user_can_edit_balance;

-- Review dependent objects before considering any table rename or replacement.
SELECT dependent_ns.nspname AS referencing_schema,
       dependent.relname AS referencing_relation,
       dependent.relkind AS referencing_kind,
       referenced.relname AS referenced_relation
FROM pg_depend dep
JOIN pg_class dependent ON dependent.oid=dep.objid
JOIN pg_namespace dependent_ns ON dependent.relnamespace=dependent_ns.oid
JOIN pg_class referenced ON referenced.oid=dep.refobjid
WHERE referenced.oid='public.wallet_transactions'::regclass
  AND dep.objid <> dep.refobjid
ORDER BY referencing_schema,referencing_relation;
