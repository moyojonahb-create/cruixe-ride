# Stage 2 — database security verification (22 October 2026)

**Status: BLOCKED / NO-GO.** Read-only catalog inspection only. No data mutations, deployments, migrations, or real-user auth impersonation performed.

## Environment identity
- GitHub repo `supabase/config.toml` declares project `jidfganntquilvsytslp`.
- Connected Supabase plugin exposes only project `foksbnjtzubsjpeoorvo` ("PickMe E-Hailing App", region us-east-1).
- The only listed branch is `main` and reports `MIGRATIONS_FAILED`.
- We cannot certify that the connected database is isolated staging. Do NOT perform destructive security or financial tests against it until the environment ownership and branch status are resolved.

## P0: authenticated wallet balance mutation permission
Read-only queries against the connected project's PostgreSQL catalog confirm:
- `authenticated` has INSERT and UPDATE table grants on `public.wallets`, including UPDATE on the `balance` column.
- `Users can insert their own wallet` is a permissive INSERT policy that checks `auth.uid() = user_id` and does not constrain the inserted balance to zero.
- `Users can update their own wallet` is a permissive UPDATE policy with `auth.uid() = user_id` for both USING and WITH CHECK.
- `No direct wallet balance updates` is **also permissive**, so its admin-only predicate does not override the owner UPDATE policy (permissive policies combine by OR).
- No before-write wallet balance guard was present among the enabled user triggers.
- The wallet `balance` column defaults to zero, which does not stop clients from explicitly supplying a nonzero value.

**Risk:** Authenticated owner sessions may be able to create a wallet with arbitrary balance or update their balance/lock state directly through the REST API. Verified access grants and policies establish the exposure, but no exploit requests were issued.

**Required fix (reviewed migration and staging test):**
1. Revoke user-facing INSERT and UPDATE privileges on sensitive wallet columns/tables, keeping settlement flows behind trusted Go and restricted server credentials.
2. Replace or remove permissive owner INSERT/UPDATE policies; retain only the SELECT policy for owner visibility, and require platform-controlled wallet creation with balance zero.
3. Confirm admin and wallet-service transactions still work. Update any client paths that legitimately created wallets directly.
4. Negative-test authenticated REST INSERT with nonzero balance and UPDATE of balance/is_locked; both must fail. Positive-test wallet creation and credit/debit via authorised server.
5. Validate true financial settlement invariants and idempotency after migration.

Do not apply permissions changes directly to a possible production project without migration review and rollback.

## Additional security observations
- RLS enabled on `rides`, `offers`, `wallets`, `wallet_transactions`, `platform_ledger` and `drivers`.
- `guard_rides_update` trigger is installed and enabled.
- Authenticated has INSERT privileges on `rides` and `offers`; the client Go-only changes do NOT revoke those direct API rights. Evaluate a staged revocation/deprecation plan.
- Authenticated can invoke the SECURITY DEFINER functions `accept_ride_offer`, `complete_trip_with_commission`, `admin_force_driver_offline` and `has_role`. Inspect function-level checks and revoke unused invocation rights.
- `guard_messages_update()` is a SECURITY DEFINER function executable by `anon`; review and revoke PUBLIC execution if not intended.
- Supabase security advisors report `public.spatial_ref_sys` with RLS disabled (PostGIS extension-owned table), public-schema PostGIS placement and additional definer-call notices. Review compatibility before remediation. See https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public

## Stage 2 acceptance tests still required
- Dedicated nonproduction Supabase project/branch, known schema version, and fake rider/driver identities.
- Live JWT role enforcement and RLS negative tests for unauthorized rider/driver/wallet access.
- PostgreSQL concurrent acceptance with isolated transactions and real row locks; exactly one accepted ride/offer, no duplicate settlement.
- Pricing-policy enforcement, webhook signature/replay tests, funding, capture, cancel/refund, and reconciliation with **sandbox** provider credentials only.
- Verify updated CI on release branch; no merge to main or production deployment.

## Already passing
Stage 2 branch GitHub Actions CI (commit `8386841b`) completed successfully, covering Go tests, frontend type-check/lint/Vitest/build and Docker image build/scan. See https://github.com/moyojonahb-create/cruixe-ride/actions/runs/39814135768 .

## Decision
Stage 2 **NO-GO** until wallet mutation rights are safely closed and audited, and the missing staging integration tests are executed on verified nonproduction infrastructure.
