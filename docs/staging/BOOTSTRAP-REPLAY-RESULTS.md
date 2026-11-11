# Staging schema replay results — 11 November 2026

The isolated Supabase project `sgqqhrrdfyrebqreodfl` remains healthy with an empty public application schema. No application migrations or account fixtures were applied to that hosted project during this verification. Existing production data was not changed.

## Local verification

The managed Docker daemon was reachable, but both Supabase PostgreSQL and PostgreSQL container pulls failed during VFS layer registration with `no space left on device`. Official Debian PostgreSQL 17.11 server/client packages were instead extracted under `/workspace/work/staging-replay/pg`; a disposable cluster listened only on loopback and a workspace socket, port 55439. This matches the hosted staging major/minor version, not its Supabase patch packaging.

A clean local replay executed all **135 repository migrations in sorted filename order**, one transaction per file, successfully after the five corrections below. No application migration or tail section was skipped. **Two platform statements were excluded locally:** `CREATE EXTENSION pg_net` in `20260326001810` and `20260528141424`. The fixture does not install pg_net; these migrations do not invoke its HTTP functions. A read-only query on hosted staging confirmed pg_net 0.20.4 and pg_cron 1.6.4 are available; neither was installed by this inspection. Local pg_cron 1.6.5 was installed and preloaded.

Local Auth, Storage, and Realtime metadata/functions were minimal fixtures, not complete Supabase services. Consequently, this result proves application SQL replay against the fixture, **not managed Auth/Storage/Realtime behavior or hosted schema parity**. Runtime work files are `/workspace/work/staging-replay/clean-replay.py`, `platform-fixture.sql`, and `clean-results.json`; they are intermediate evidence, not deployment scripts. The replay script resets only its disposable local cluster and must not target hosted databases.

## Actual clean-replay blockers corrected

1. `20260619090000_notification_platform.sql`: admin notification policy referenced nonexistent `profiles.role`. Replaced with canonical `public.has_role(auth.uid(), 'admin'::public.app_role)`.
2. `20260619100000_risk_engine.sql`: five admin policies had the same invalid profile-role dependency. Replaced their USING/WITH CHECK expressions with canonical role checks.
3. `20260619113000_postgres_hot_path_indexes.sql`: indexes referenced nonexistent `rides.rider_id`, `rides.ride_status`, offer expiry fields, and driver-session update timestamps. Core indexes now use `rides.user_id/status`, the actual `offers` table and its creation time, and `driver_sessions.went_online_at`. Backend-only table indexes are guarded by required columns and emit explicit deferred notices. Nine optional index definitions were deferred in the base migration replay; this does not certify those backend features.
4. `20260822082407_create_ride_passenger_contacts.sql`: earlier migration already created the table, policies, and trigger and dropped source PII columns. The correction adds missing payer/notification columns explicitly, replaces policies/trigger idempotently, and guards the legacy-column backfill.
5. `20260830135801_74da538b-662b-4df8-8777-4db828aa5907.sql`: earlier migration already created passenger ratings. The correction preserves its one-rating-per-ride key, adds optional new columns, makes table/index creation compatible, and retains the earlier completed-trip insertion restriction instead of adding a permissive alternate INSERT policy.

These historical-file corrections affect **fresh replays**. They do not modify already-applied hosted migrations or repair existing database state automatically.

## Authorization test

`docs/staging/bootstrap-policy.local.sql` passed against the fully replayed local schema. It uses rollback-only synthetic users and explicit local fixture grants. It verifies that the canonical admin can read both users' notification history and all six seeded risk rules; an ordinary user reads only their own notification, sees no admin risk rules, and cannot update those rules. The script rejects any cluster whose port/database differs from the disposable test target. This tests the corrected RLS predicates, not effective hosted grants.

## Separate backend schema prerequisites

After the base application schema, the following ordered sequence passed in a rollback-only local transaction:

1. `backend/DISPATCH_SHADOW_SCHEMA.sql`
2. `backend/DRIVER_REPUTATION_SCHEMA.sql`
3. `backend/REPUTATION_CALIBRATION_SCHEMA.sql`

Calibration requires the reputation schema first. Re-running the hot-path index migration after optional compatible schemas are installed can create their deferred indexes.

`backend/WALLET_LEDGER_SCHEMA.sql` **does not replay cleanly over the legacy application schema**: `wallet_transactions` already exists with legacy columns, so `CREATE TABLE IF NOT EXISTS` does not create the expected `idempotency_key` column and subsequent ledger DDL fails. `backend/WALLET_ADMIN_FLOW_SCHEMA.sql` depends on ledger `payment_intents`. Do not blindly apply these two files or represent active ledger settlement as provisioned. Reconcile the legacy/V2 wallet boundary separately; leave active wallet/ledger features disabled for the Economy cash bootstrap until that integration is verified.

## Hosted bootstrap path

The read-only hosted preflight confirmed zero Auth users and zero public tables, plus the presence of `auth.users`, `storage.buckets`, `storage.objects`, `realtime.messages`, `realtime.topic()`, and the `supabase_realtime` publication. A scan of all 135 application migrations found no HTTP/WSS URLs, external project references, `cron.schedule`, network HTTP invocations, Vault access, dblink, or foreign-data-wrapper calls. pg_cron/pg_net appear only as extension declarations. Mirror triggers enqueue local outbox rows; the migration history does not install a transport or scheduled sender. Top-level seeds are pricing/FX, landmarks, institutions, risk rules, and Storage bucket metadata; user-related backfills have no source users in fresh staging.

The supported hosted strategy is to apply the reviewed files individually, in their existing sorted order, using Supabase's migration API and source-derived migration names; this does not require inventing a consolidated migration filename. Record each result, stop at the first failure, and verify effective hosted state rather than treating the local fixture as complete platform parity. No production project ID belongs in this operation.

Before hosted schema application, re-check the exact project reference `sgqqhrrdfyrebqreodfl`, its empty application schema and platform primitives, and use the reviewed corrected migration commit. Apply the complete ordered application migrations through the approved migration workflow, with actual pg_cron/pg_net enabled and no local fixture substitutions. Follow with the three compatible backend schemas in the order above if needed by the selected backend feature configuration. Retain optional-index notices and effective grants/RLS/advisor evidence. Verify schema contracts, especially `driver_collected_at`, application signup triggers, Storage buckets/policies, Realtime publication and channel authorization, and driver operability.

Do not provision Rider/Driver test accounts until the isolated API/WSS/DB mapping and effective schema pass. The Go server uses process-local WebSocket registries and expects one persistent instance; its workers/scheduler are separate processes. Vercel supports containers and WebSockets, but deploying this backend unchanged to a stateless autoscaling function environment without connection affinity does not preserve these assumptions. A persistent single-instance staging backend with securely bound database credentials remains the concrete hosting prerequisite; no redesign is included here.
