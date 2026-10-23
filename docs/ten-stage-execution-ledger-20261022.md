# Cruize Ride — Ten-stage execution ledger
**Date:** 2026-10-22. **Branch:** release/cruize-v1-20261022. **Destination:** Supabase foksbnjtzubsjpeoorvo. **Decision rights:** owner requested ten stages at once; engineering may implement and test on release branch. **No unsupported claims of production readiness**.

Statuses: VERIFIED = examined from live read-only query or source; CODED = committed to release branch, pending tests; BLOCKED = cannot safely activate yet.

| # | Stage | Current verified or coded work | Gate to mark complete |
|---|---|---|---|
| 1 | Database foundation | VERIFIED Supabase project ACTIVE_HEALTHY; release `supabase/config.toml` points to destination. | Backed-up restore, migration-history parity, secure deploy env, zero old endpoints |
| 2 | Auth / RLS | VERIFIED 2 auth users; checked ride/profile/wallet foreign user refs. | Real JWT cross-user negative tests, signed-in session revalidation and storage access |
| 3 | Financial safety | CODED: double-entry ledger posting now requires a database transaction (non-atomic fallback removed) with commit/rollback unit tests; VERIFIED `authenticated` still has `wallets.balance` UPDATE and Go wallet_accounts/ledger_entries are absent. | Isolated database ledger migration, service wallet integration tests, privilege hardening, sandbox payment reconciliation |
| 4 | Realtime driver location | CODED reject invalid/expired/future GPS; CODED reject stale/offline/busy/occupied presence; unit regression tests. Redis GEOSEARCH present. | GitHub CI passing for latest commit and end-to-end real Redis/driver approvals |
| 5 | Ride dispatch and matching | Earlier release branch code enforces Go-only ride/offer writes, fare bounds and driver eligibility. | Real Postgres race test, offer expiration, dispatch retry latency and stale driver exclusions |
| 6 | Background jobs and push | Existing Redis/Asynq configuration and Web Push code inspected. | Worker Redis replay/DLQ tests; native Android FCM & iOS APNs killed-app delivery; credentials securely configured |
| 7 | Routes / pricing | Google Routes function found; old function uses longest alternative route for pricing. | Go-owned routes adapter with price/ETA policy, quota, rate limiting, Zimbabwe coverage testing |
| 8 | Monitoring / operations | Existing Sentry frontend integration, Prometheus metrics, Grafana dashboards and alerts identified. | Real staging event delivery, PII redaction, protected scraper, alert drill and disaster restore |
| 9 | Mobile packaging / field QA | Capacitor Android in repo; iOS native project not checked in per earlier audit. | Signed test Android build, iOS build, GPS background permissions, low-connectivity field tests |
| 10 | Release / scale | Draft PR #3 isolated from main; CI previously passed code jobs before latest changes. | All current CI green, load/soak, backup/recovery, compliance, payments certification, human-approved release |

## Today's durable delivery
- `backend/internal/geo/service.go`: GPS coordinates/telemetry validated on ingestion, future/stale timestamps disallowed, geo search returns only matching recent locations AND fresh online/available/unoccupied presence. Old GEO member leftovers are filtered, not served as bookable.
- `backend/internal/geo/service_test.go`: added invalid telemetry, foreign-city/vehicle, impossible/future GPS and offline/busy/stale/no-presence regression tests.
- Earlier Stage 2 release work: Go-only ride and offer mutations, Go fare/request authorization checks; CI workflow includes Vitest.
- No production database writes, app deployment, Lovable deletion, paid third-party account creation or merge into `main`.

## Risks requiring special attention
1. Go wallet V2 SQL defines existing `wallet_transactions` table with a potentially different shape; a naive `CREATE TABLE IF NOT EXISTS` does NOT upgrade it and leaves code broken. Reconcile constraints & columns before writing staged migration.
2. Public `wallets` permits authenticated financial balance mutation. Privilege removal is necessary but may break existing user wallet-creation flows; stage and replace trusted server paths first.
3. Redis GEOSEARCH index entries may persist after location expires; candidate filtering now fails closed on location/presence but index garbage collection needs further load test and cleanup strategy.
4. Driver status filtering in Redis is NOT equivalent to database verification/approval. Ensure the Go matching/offer endpoints continue enforcing authoritative approved status.
5. Cross-city coordinates, route providers and signed native push need real-device testing; code presence alone is not deployment.
6. Supabase main branch API showed MIGRATIONS_FAILED; project's healthy status does not mean migrations are healthy.
7. Existing `mirror_outbox` has 353 pending records; do not replay/purge until origin and desired data direction are known.

**GO / NO GO:** NO-GO for public launch and financial operations until the above gates are verified in a separate staging environment. Continue parallel development on the release branch.

## Additional financial integrity hardening
- `backend/internal/wallet/repository.go`: `PostLedgerEntries` rejects a DB implementation that cannot `Begin` a transaction; removed nontransactional independent-entry writes.
- `backend/internal/wallet/repository_test.go`: test asserts no writes when `Begin` unsupported.
- `backend/internal/wallet/atomic_ledger_test.go`: test successful posting/commit and simulated ledger-entry failure rollback, all through a pgx transaction fake.
- Integration gate remains: real PostgreSQL transaction rollback, concurrent balance and idempotency tests, wallet schema parity and removal of client balance UPDATE permissions. Tests should pass in latest CI before marking this code VERIFIED.

## Network-resumption continuation — 2026-10-22
- Dispatch: `WriteDriverPresence` now rejects missing state or availability and heartbeats older than the presence TTL or more than 30 seconds in the future; it no longer defaults missing state to online/available. Regression tests added to `backend/internal/geo/service_test.go`.
- Go CI for the presence change completed successfully (latest overall workflow still requires frontend and Docker results).
- Financial schema read-only preflight expanded in `docs/sql/cruize-destination-preflight-readonly.sql` to flag missing Go V2 tables/columns and legacy NOT NULL constraints. Production read-only check found absent Go-required columns and tables including payment_intents, provider_events, wallet_accounts, wallet_ledger_entries and V2-required fields on legacy wallet_transactions.
- No financial RLS/grants migration or production ledger creation performed: live database wallet compatibility is **still NO-GO** until staging migration and signed-in user authorization tests.

## 2026-10-23 recovery from network interruption and live finance audit
- Prior CI runs **39856343622** and **39856447333** succeeded; atomic wallet-ledger posting unit tests had passing Go CI.
- Live, **read-only** Supabase query: legacy `wallet_transactions` = **0 rows**, `wallets` = **2 rows**, `driver_wallets` = **0 rows**, `mirror_outbox` pending = **353**. No rows deleted or balances modified.
- Live `wallet_transactions` columns require `wallet_id`, `user_id`, `amount` and permit only `deposit`, `withdrawal`, `trip_fee`, `refund`. V2 expects `idempotency_key`, `currency`, `status`, `total_amount` and different ledger semantics. Blank transaction data does not make the shapes compatible.
- Missing Go V2 finance tables include `wallet_accounts`, `wallet_ledger_entries`, `payment_intents`, `provider_events`. `authenticated` continues to have financial balance UPDATE permission. **Production money release is blocked.**
- Committed `docs/sql/cruize-financial-compatibility-readonly.sql` and `docs/financial-schema-reconciliation-decision.md` to make this gate reproducible.
- Latest CI must independently complete; no successful CI claim until jobs conclude.
