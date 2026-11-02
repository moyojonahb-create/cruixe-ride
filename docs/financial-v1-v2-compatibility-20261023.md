# Cruize Ride — Financial V1/V2 compatibility findings
**Audit:** 2026-10-23. **Destination:** `foksbnjtzubsjpeoorvo`. **Production changes:** none.

## Real schema mismatch
The connected Supabase project has `public.wallets` and `public.wallet_transactions`, but no `public.wallet_accounts` or `public.wallet_ledger_entries`.

The **existing legacy** `wallet_transactions` columns are:
`id`, `wallet_id`, `user_id`, `amount`, `transaction_type`, `description`, `ride_id`, `created_at`, `reference_code`.
Its `transaction_type` CHECK allows only `deposit`, `withdrawal`, `trip_fee`, and `refund`. `wallet_id`, `user_id` and `amount` are required.

The **Go V2** `backend/WALLET_LEDGER_SCHEMA.sql` declares the same table name `public.wallet_transactions` with a different set of required columns: e.g., `idempotency_key`, `currency`, `total_amount`, `status`, `owner_user_id`, and provider fields; Go repository inserts refer to these V2 columns.

`CREATE TABLE IF NOT EXISTS public.wallet_transactions (...)` **does not alter an existing legacy table**. Running the full V2 schema unreviewed would leave Go wallet writes incompatible and could conflict with other existing objects.

## Financial integrity code fix
The release branch changed `PostLedgerEntries` to require `Begin` and post transaction + debit and credit entries within one `pgx.Tx`; without transaction support it fails closed. Added commit and rollback tests, and CI Go tests passed. This does not fix missing production tables.

## Recommended architecture decision
Prefer **separate V2 financial tables and an explicit compatibility/data reconciliation plan**, not an in-place rename or destructive rewrite of legacy transaction rows. Determine exact table names after reviewing ALL Go V2 SQL references and backoffice/reporting dependencies. Preserve historic `wallet_transactions` and wallets read-only during cutover. Define source-of-truth, how rider/driver balances are initialized from trusted, reconciled ledger records, and how duplicate settlement is prevented with idempotency. Test with fake data in a disposable staging clone, then prepare an individually reviewed migration and rollback procedure.

## Unsafe permissions
Prior read-only check confirmed role `authenticated` can update `public.wallets.balance`; this must be removed before money use, but only after secure server-side replacement and a verified restore. The draft hardening SQL is in `docs/sql/cruize-wallet-hardening-review.sql`, **not executed**.

## Supporting commands
Run `docs/sql/cruize-financial-v2-compatibility-readonly.sql` against staging/destination with read-only permissions and save its output privately. Do not paste PII or financial transaction rows into issues/commits.

**GO/NO-GO:** NO-GO for production payment processing until schema reconciliation + wallet write privilege tests + real Postgres atomicity and provider sandbox tests pass.
