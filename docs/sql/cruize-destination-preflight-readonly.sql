-- Cruize Ride: READ ONLY destination migration preflight
-- Run against project foksbnjtzubsjpeoorvo only after verifying the target.
-- No INSERT, UPDATE, DELETE, ALTER or grants.
SELECT 'auth.users' AS resource, COUNT(*) AS records FROM auth.users
UNION ALL SELECT 'public.profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'public.rides', COUNT(*) FROM public.rides
UNION ALL SELECT 'public.drivers', COUNT(*) FROM public.drivers
UNION ALL SELECT 'public.offers', COUNT(*) FROM public.offers
UNION ALL SELECT 'public.wallets', COUNT(*) FROM public.wallets
UNION ALL SELECT 'storage.objects', COUNT(*) FROM storage.objects
ORDER BY resource;

-- Orphan checks: destination may be a partial Lovable mirror.
SELECT
  (SELECT COUNT(*) FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.user_id WHERE u.id IS NULL) AS profiles_missing_auth,
  (SELECT COUNT(*) FROM public.rides r LEFT JOIN auth.users u ON u.id=r.user_id WHERE u.id IS NULL) AS rides_missing_auth,
  (SELECT COUNT(*) FROM public.offers o LEFT JOIN public.rides r ON r.id=o.ride_id WHERE r.id IS NULL) AS offers_missing_rides,
  (SELECT COUNT(*) FROM public.wallets w LEFT JOIN auth.users u ON u.id=w.user_id WHERE u.id IS NULL) AS wallets_missing_auth;

-- Inspect only the existence of protections, not any private user rows.
SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('rides','offers','drivers','wallets','wallet_transactions')
ORDER BY c.relname;

SELECT
  has_table_privilege('authenticated','public.wallets','INSERT') AS client_wallet_insert_granted,
  has_column_privilege('authenticated','public.wallets','balance','UPDATE') AS client_balance_update_granted;

-- Go V2 wallet ledger schema compatibility and money-path gates.
-- Missing tables mean WALLET_LEDGER_SCHEMA.sql must be reconciled with the
-- existing public.wallet_transactions schema before any migration is applied.
SELECT
  to_regclass('public.wallet_accounts') AS go_wallet_accounts,
  to_regclass('public.wallet_ledger_entries') AS go_wallet_ledger_entries,
  to_regclass('public.payment_intents') AS go_payment_intents,
  to_regclass('public.provider_events') AS go_provider_events,
  to_regclass('public.wallet_transactions') AS existing_transactions,
  to_regclass('public.wallets') AS legacy_wallets,
  has_table_privilege('authenticated','public.wallets','INSERT') AS client_wallet_insert_granted,
  has_column_privilege('authenticated','public.wallets','balance','UPDATE') AS client_balance_update_granted;

-- Verify current constraints so incompatible V2 wallet_transactions DDL
-- cannot silently replace the already populated legacy transaction type.
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.wallet_transactions'::regclass
  AND contype = 'c'
ORDER BY conname;
