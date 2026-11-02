# Cruize Ride — Financial schema reconciliation decision (review required)
**Target:** foksbnjtzubsjpeoorvo. **Release branch:** release/cruize-v1-20261022.
**Status:** Planning and read-only audit only, no changes made to live financial tables.

## Verified 2026-10-23
- `public.wallet_transactions` exists, with **0 rows**. Its columns include `wallet_id` (NOT NULL), `user_id` (NOT NULL), `amount` (NOT NULL), `transaction_type` and `reference_code`.
- Legacy `transaction_type` CHECK admits only `deposit`, `withdrawal`, `trip_fee`, `refund`; the Go V2 contract includes other types, statuses, idempotency keys, currency and ledger linkages.
- `public.wallets` has **2 rows**, and `public.driver_wallets` **0 rows**. Do not equate old `wallets.balance` values with available balance in the new ledger without a reconciled opening-balance transaction.
- Go V2 `public.wallet_accounts` and `public.wallet_ledger_entries` are absent.
- `authenticated` still has INSERT and balance UPDATE privilege on legacy wallets. **P0 exploit path remains.**
- `backend/WALLET_LEDGER_SCHEMA.sql` has `CREATE TABLE IF NOT EXISTS public.wallet_transactions`; this will silently skip redefining the incompatible table and cause application failures. Running the entire SQL against production without a diff and transaction rollback plan is forbidden.

## Recommended model
1. Preserve legacy wallet records and existing ledger references; do not drop, truncate, or overwrite tables.
2. In **isolated staging copied from a private destination backup**, first inventory dependent views, triggers, functions, RLS, grants, and external clients.
3. Decide between:
   - **Option A:** extend the existing legacy table with an additive and backward-compatible V2 schema, carefully updating constraints. Do not weaken money authorization or invalidate existing app queries.
   - **Option B:** create a separate dedicated V2 transactions table and update **all** Go financial reads/writes to target it; preserve the legacy table and data. This provides a cleaner boundary but requires a complete code search and more tests.
4. Favor the option validated by real data migrations and transactional/idempotency integration tests; do not select based solely on the row count of zero.
5. Build `wallet_accounts` and `wallet_ledger_entries` with owner/admin RLS not exposing writes to `authenticated`, and test double-entry invariants, overdraft protection, retries, partial failure rollback, and webhook replay.
6. Reconcile opening balances from the 2 existing wallets using verified financial evidence. They are not expendable demo data.
7. Migrate legitimate wallet creation and settlement to privileged Go endpoints. Only then revoke legacy authenticated INSERT/UPDATE, as proposed in `docs/sql/cruize-wallet-hardening-review.sql`.
8. Run `docs/sql/cruize-financial-compatibility-readonly.sql` before and after isolated staging rehearsal; get a separate backup and explicitly approved go/no-go before production cutover.

## Current go/no-go
**NO-GO for live-money enablement.** The successful Go unit and CI tests establish code-level atomic posting, not PostgreSQL schema compatibility or payment certification.

**Deliverables to verify next:** backup & restore proof, staging dataset, migration SQL with reversible rollback plan, real PostgreSQL ledger and wallet RLS tests, CI integration tests and provider sandbox reconciliation.
