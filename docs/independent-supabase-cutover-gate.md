# Cruize Ride — Independent Supabase Backend Cutover Decision
**Updated:** 2026-10-22  
**Branch:** release/cruize-v1-20261022  
**Status:** Backend transition in progress; NO-GO for production cutover.

## Decision
The owner accepts that inaccessible records remaining only inside paused Lovable Cloud might not be recoverable. Treat Supabase project `foksbnjtzubsjpeoorvo` as the only intended primary database **going forward**, without destroying the paused source or existing destination records. Lovable is no longer a required development/deployment dependency.

## Selected architecture
- PostgreSQL + PostGIS on existing Supabase project (authoritative relational store and geospatial queries)
- Supabase Auth and private Storage
- Go/Fiber API owns trip mutations, fare validation, driver eligibility, wallet settlement and provider callbacks
- Redis + Asynq for ephemeral driver presence, events and background jobs; never financial source of truth
- React/Vite web with Capacitor Android and iOS clients
- Grafana/Prometheus/Sentry for operations; review existing code integrations first
- Avoid adding Neon, AWS RDS or Firebase as a second primary database for launch.

## Verified live read-only findings
- Existing destination is ACTIVE_HEALTHY. Contains auth users=2, profiles=2, rides=87, offers=21, drivers=1, wallets=2, Storage objects=4 (as of prior verification).
- Connected database branch entry reports MIGRATIONS_FAILED despite project itself being healthy.
- `public.wallets` exists but `public.wallet_accounts` and `public.wallet_ledger_entries` do not. Go wallet repository references wallet_accounts; frontend driver screen reads public.wallets. **This is a payment/ledger schema compatibility blocker.**
- Authenticated client has INSERT/UPDATE on public.wallets including balance; owner INSERT/UPDATE policies are permissive. Never turn on wallet settlement until grants and policies are corrected and verified.
- Mirror outbox has 353 pending records as of audit; examine ownership and do not purge as migration step.
- `public.spatial_ref_sys` is PostGIS-related and not RLS enabled; review Supabase advisor guidance and extension compatibility rather than blindly enabling RLS.
- Legacy `SECURITY DEFINER` functions have client EXECUTE rights; inspect individual authorization checks.
- `supabase/config.toml` in this release branch already targets foksbnjtzubsjpeoorvo.
- CI successfully passed on previous Stage 2 commit; any later branch commits require their own tests.

## Concrete milestones in order
1. **Protect source and destination:** retain Lovable source for a recovery period, request private destination backup, test restoration to isolated staging. Owner acceptance of abandoned source does not authorize deleting production.
2. **Schema parity:** review production migration history and reconcile the wallet schema as a migration. Decide whether to implement `wallet_accounts` ledger exactly as Go code expects or adapt Go code after a thorough financial design review. Do not introduce incompatible duplicate balances.
3. **Staging:** create an isolated test database using a reviewed cost/branch plan; load synthetic fixtures only.
4. **Wallet P0 fix:** revoke owner direct INSERT/UPDATE permissions and remove permissive policies with verified trusted Go wallet creation + payment flows. Existing draft: `docs/sql/cruize-wallet-hardening-review.sql` (not applied).
5. **Rides and driver access:** test authenticated riders, unapproved/approved drivers, cross-user access, direct SQL REST mutations and full ride lifecycle.
6. **Money:** test idempotent payment webhooks, replay/reversal, wallet balances/ledger invariants, refunds and reconciliation; enable only successfully certified provider methods.
7. **Infrastructure:** configure deploy secrets from destination in cloud settings, never Git; Go, worker and Redis startup, secure networking, health probes, alerting, and backup/rollback; don't deploy multiple Go replicas until distributed WS routing is tested.
8. **Android/iOS:** generate/verify iOS native project and Android signing, rebuild with Supabase URL and publishable key, real-device Auth/Storage/GPS tests.
9. **Release:** documented NO-GO/GO evaluation with CI, soak/load tests, legal/operational readiness and app-store approvals.

## Non-destructive acceptance SQL
```sql
SELECT
  to_regclass('public.wallet_accounts') AS go_wallet_accounts,
  to_regclass('public.wallet_ledger_entries') AS go_wallet_ledger_entries,
  to_regclass('public.wallets') AS legacy_wallets,
  has_table_privilege('authenticated','public.wallets','INSERT') AS client_can_create_wallet,
  has_column_privilege('authenticated','public.wallets','balance','UPDATE') AS client_can_update_wallet_balance;
```

**Expected before remediation:** Go wallet_accounts and ledger_entries are NULL; client privileges currently TRUE.  
**Pass after remediation:** intended schema implemented & reconciled; unauthorized client write privileges FALSE; Go wallet and payment integration tests pass in staging.

## Safety
Never publish private database backups, share service keys, alter live wallet balances or delete Lovable without independent backups and explicit separate deletion action. No live production migrations were executed in preparation of this document.
