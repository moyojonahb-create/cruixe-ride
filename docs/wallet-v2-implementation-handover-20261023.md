# Cruize Ride V2 finance: implementation and cutover gate
**Date:** 2026-10-23. **Branch:** release/cruize-v1-20261022.
**Production target:** foksbnjtzubsjpeoorvo. **Production database modification:** NONE.

## What changed in source
- Go V2 repository, reporting and finance admin SQL now target `public.wallet_v2_transactions` instead of the old `public.wallet_transactions`.
- V2 SQL schema and admin-flow schema use the same table name, preserving all existing legacy transaction consumers.
- Go transactional ledger entry inserts populate both `amount` (decimal currency units) and `amount_minor` (integer minor units), with conversions for USD/ZWG in applicable repository methods.
- `wallet_accounts` basic account create/read now uses `cached_*_balance_minor` columns, matching Go's integer minor-unit fields.
- Existing atomic ledger rollback tests remain; new staging SQL tests are prepared.

## Staging artifacts (do NOT run on production)
1. `docs/sql/STAGING_ONLY_wallet_v2_financial_core.sql`: creates five isolated V2 core tables, enables RLS, revokes unauthenticated/client table access. Leaves legacy `public.wallets` and `public.wallet_transactions` untouched.
2. `docs/sql/STAGING_ONLY_wallet_v2_smoke_rollback.sql`: inserts two synthetic system accounts, one V2 transaction and balanced debit/credit entries in a single transaction then rolls back; checks grants.
3. `docs/sql/cruize-financial-compatibility-readonly.sql`: baseline schema/privilege inventory.
4. `docs/sql/cruize-wallet-hardening-review.sql`: separate legacy client INSERT/UPDATE privilege remediation, not applied.

## IMPORTANT: migration incomplete by design
- The giant original `backend/WALLET_LEDGER_SCHEMA.sql` contains many more supporting tables than the five staged above. First-five migration does not make Go financial flows operational.
- Audit other repository writes/reads for minor-unit consistency; not all finance paths are certified. No actual PostgreSQL integration run is complete.
- Owner must arrange an isolated database restore (potential cost) before executing financial DDL. Supabase project's branch previously reported MIGRATIONS_FAILED; reconcile migration history.
- Reconcile actual balances of the two preexisting legacy wallets before any migration of funds. No balance copied, reset, or credited.
- Critical insecure legacy `authenticated` balance UPDATE and wallet INSERT grants remain on production. Remediate only after server wallet-creation path is tested.
- Payment providers require sandbox verification, webhook signatures/idempotency and reconciled ledger tests.
- Any green code CI checks indicate code-level regressions only, NOT financial production readiness.

## Gate order
1. Confirm latest Go CI and frontend CI, fix regressions.
2. Obtain secure Supabase backup, restore isolated staging.
3. Apply V2 core schema and rolled-back smoke SQL only in staging.
4. Extend remaining V2 tables/foreign keys and test complete Go repository with real PostgreSQL, including concurrent and idempotent writes.
5. Test Go-only wallet creation; apply legacy hardening in staging and prove signed-in client cannot mint money.
6. Evaluate permissions and final production migration under approved rollback.
7. Run payment sandbox certification and a city-limited rider/driver pilot.

**Current release status:** NO-GO for production payments or public release.

## 2026-10-23: staging cost gate and CI hardening
- The latest full CI run before this checkpoint (commit `92e16eb9ed0eef8cec4c2cdc530cb1abc41e0456`) completed successfully.
- `backend/internal/wallet/staged_migration_safety_test.go` adds test gates: the V2 staging core schema must preserve the legacy wallet tables, enable V2 RLS, omit direct client financial write grants, and Go V2 repositories must not reference the legacy transaction table.
- Attempt to create Supabase development branch `cruize-v2-finance-staging-20261023` was blocked by mandatory hourly billing confirmation. **No branch created.** Creating this branch requires organization ID, exact cost quote and explicit approval of the price.
- Supabase project main still reports `MIGRATIONS_FAILED`. Treat this as independent blocker; merging code is not equivalent to applying SQL migration.
- Production privileges remain vulnerable and unchanged; do not enable wallet payments or represent the financial upgrade as deployed.
