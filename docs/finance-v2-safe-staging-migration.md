# Cruize Ride — V2 wallet schema migration and release gate
**Updated:** 2026-10-23. **Production project:** `foksbnjtzubsjpeoorvo`. **Status:** STAGING REQUIRED — DO NOT APPLY SQL TO PRODUCTION.

## Evidence (read-only Supabase SQL)
The live project has `public.wallets` (2 records) and `public.wallet_transactions` (0 records). `public.driver_wallets` and `public.platform_ledger` have 0. New Go wallet V2 expects `public.wallet_accounts`, `public.wallet_ledger_entries`, `public.payment_intents`, etc.; `wallet_accounts` and `wallet_ledger_entries` are absent. Existing legacy `wallet_transactions` has `wallet_id,user_id,amount,description,reference_code` and lacks the V2-required `status,idempotency_key,currency,total_amount,owner_user_id`. **Do not run `backend/WALLET_LEDGER_SCHEMA.sql` directly against live; `CREATE TABLE IF NOT EXISTS` will not upgrade that incompatible existing table.**
The authenticated role can still update `wallets.balance` via SQL privileges and permissive owner RLS. No production remediation has been applied.

## Migration sequence
1. Export private Supabase project backup including `auth`, public tables and Storage manifest. Test restoration to an **isolated staging project**, avoid creating charged resources without account-owner awareness.
2. Run [read-only contract audit](sql/cruize-finance-v2-parity-readonly.sql) on production and staging; capture exact columns, constraints, policies, triggers, grants and baseline counts. Check branch status `MIGRATIONS_FAILED` against applied migration history.
3. Identify **all writers and readers** for old `wallets`, `wallet_transactions`, `driver_wallets`, `platform_ledger` in web, edge functions and Go. Keep existing legacy reads functional until audited replacement routes exist.
4. Choose **one** balance authority. Prefer V2 double-entry ledger plus cache derived by verified settlement; prohibit simultaneous uncoordinated legacy and V2 authoritative balances.
5. Stage the incompatible table name using either (a) explicitly reviewed legacy archival rename and migration to V2 under the needed `public.wallet_transactions` name plus compatibility for legacy queries, **or** (b) renaming Go's V2 transaction table and repository SQL to a new permanent versioned name. Select only after auditing every foreign key/trigger/function and legacy API reader. Never drop or truncate records. Here 0 legacy transactions reduce data reconciliation work but do not remove dependency risk.
6. Load minimal fake rider/driver records into staging only. Apply reviewed DDL, explicit RLS, grants and foreign keys; ensure **no authenticated direct INSERT/UPDATE/DELETE** on wallet balance/accounts/ledger, and service-side operations are limited and auditable. Review `docs/sql/cruize-wallet-hardening-review.sql` prior to any staging execution.
7. Real Postgres tests: concurrent wallet opens, parallel authorization and capture, two same-idempotency provider callbacks, failed mid-ledger entry rollback, balanced credit/debit sums, authorized refunds, negative client writes, positive Go server writes, and read visibility for the owner only.
8. Verify EcoCash/OneMoney sandbox signatures, settlement, callback retry and reconciliation separately before enabling any live payment provider.
9. Cutover behind feature flag with kill switch, preapproved backup/rollback, monitoring and explicit human GO/NO-GO. Deactivate legacy writes only after acceptance tests.
10. Re-run audit after staging deployment and production rollout; confirm permission lock down and no orphan ledger references. Keep old data/backups for a defined retention period.

## Code hardening already committed
`backend/internal/wallet/repository.go` `PostLedgerEntries` now requires a transaction and refuses to fall back to separate writes, with `atomic_ledger_test.go` positive commit / negative rollback tests. This protects atomicity but **does not resolve the missing live schema, wallet permissions or real-money correctness by itself**.

## Production constraints
Keep Supabase project healthy, do not deploy or merge into `main`, do not use any user data as staging fixtures. Supabase credentials stay in secret managers. No fees or new projects without cost review.

**Definition of done:** separate real-PostgreSQL staging validation + negative-client/positive-server tests + passing CI + approved financial cutover checklist.
