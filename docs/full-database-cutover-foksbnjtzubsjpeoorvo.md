# Cruize Ride — Full data cutover to foksbnjtzubsjpeoorvo

Date: 2026-10-22
Status: BLOCKED on source data access and destination remediation. This runbook is a plan, not a completed transfer.

## Verified identity
Destination Supabase project: `foksbnjtzubsjpeoorvo` (Cruize-ride in dashboard; previously PickMe E-Hailing App via API).
Repository `supabase/config.toml` currently points to `jidfganntquilvsytslp`.
`MIRROR_SYNC_RUNBOOK.md` identifies foks... as a secondary write-behind mirror sourced from Lovable Cloud. That mirror covers **selected** public tables and does not migrate Supabase Auth users, passwords, Storage objects, or project settings.
The connected Supabase plugin has access to foks... and **no access** to jidf....
The destination is NOT empty; as of the read-only audit it contains auth.users=2, profiles=2, rides=87, drivers=1, offers=21, wallets=2. Never blindly restore OVER existing production data.
The destination branch listing has status `MIGRATIONS_FAILED`. Investigate before cutover.

## Source and backup first
1. Establish authoritative source of truth (Lovable Cloud original database or other Supabase ref) and obtain its **read-only** export/backup access through an approved secure connection; no access tokens in GitHub/chat.
2. Preserve a consistent, timestamped source snapshot: all application schemas, auth identities, storage bucket metadata, storage files, privileged functions, and migration history. Include edge functions/auth provider settings separately.
3. Preserve and test a full **destination** backup/restore plan. Record data checksum and counts per table for source and destination without exposing PII.
4. Freeze writes or implement a short dual-write/catch-up window for final cutover. Confirm mirror freshness, duplicate protection and source last-write timestamp.

## Migration design
5. Inventory overlaps using immutable UUID keys, and define collision resolution table-by-table. Use staging for merge rehearsals.
6. Move auth.users, auth.identities and related managed auth data using Supabase's official migration guidance; preserve UUIDs and credentials appropriately. Do not manually reset users unless chosen. A change in JWT signing keys may force re-login.
7. Migrate public data in dependency order (profiles, drivers, rides, offers, payment ledgers), with foreign-key consistency and reconciled sums.
8. Migrate actual Storage files alongside bucket definitions/metadata, then verify SHA/hash + permissions for driver documents, profile pictures and payment proofs.
9. Apply needed schema/RLS/functions/migration history and reconfigure webhooks, Edge Functions, Realtime, OAuth/SMS providers and domains.

## CRITICAL pre-cutover security issue
On destination, authenticated sessions have INSERT and UPDATE on public.wallets, including balance, with permissive owner policies and no blocking wallet balance guard trigger. Restrict write access and enforce trusted service-only settlement before enabling traffic. Audit all privileged SECURITY DEFINER RPC execution grants.
RLS on public.spatial_ref_sys is disabled (reported by security advisor); review compatibility with PostGIS before changing.

## Switch application only after data has moved
10. On the **release branch**: change `supabase/config.toml` project_id to foks...; set secure deploy environment variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`, `DATABASE_URL`, and mobile/Expo variables from destination settings. Never commit secrets. Ensure JWT validation accepts the destination issuer/keys.
11. Rebuild web/Android/iOS because client Supabase endpoints/keys are compiled into mobile bundles. Test sign in, refresh, document access, booking, offer race, settlement, reversals, push/realtime.
12. Hold old project read-only for rollback/retention after formal acceptance; do not drop original data.

## Acceptance gates
- Count/UUID/key integrity checks for all copied tables with source comparison.
- No lost user accounts or required documents; old passwords preserved or secure migration plan executed.
- Invalid authenticated REST request cannot create arbitrary wallet balance or modify balance, trip settlement, or another user's records.
- Real PostgreSQL concurrent offer accept returns only one winner; wallet/payment replay is idempotent.
- All intended environment references point to foks..., source project remains intact until signed off.

Official guides:
- https://supabase.com/docs/guides/platform/migrating-within-supabase
- https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/guides/platform/clone-project

**No data migration or production configuration update has been executed.**
