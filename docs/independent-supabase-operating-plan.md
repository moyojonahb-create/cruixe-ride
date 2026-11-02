# Cruize Ride — Lovable-free database operating plan

**Destination:** `foksbnjtzubsjpeoorvo` (existing Cruize-ride project, not empty)
**Source:** paused Lovable Cloud, inaccessible for full export.
**Operational decision:** Supabase PostgreSQL + Auth + Storage + PostGIS is the primary persistence platform; Go owns sensitive writes; Redis handles driver presence, queues and ephemeral state.

## Preserve existing data
Do not create another empty primary database; destination already has tables, users, rides and files.
Never delete the Lovable project or data until a supported full source export and comparison has completed. Paused source may hold records/assets missing from the destination.
The existing destination mirror-outbox has 353 pending records observed during audit; they need ownership/freshness checks and should not be manually flushed or deleted.

## Security requirements (P0)
Connected database grants authenticated INSERT + UPDATE privileges on public.wallets, including balance. Its permissive owner policy allows owner updates and insert metadata without an initial-balance restriction.
See `docs/sql/cruize-wallet-hardening-review.sql` for a proposed migration; it is **not applied**. Must test on a staging clone using fake users before applying to production. Preserve ability of trusted Go wallet services to create balances and settle funds.
Inspect old SECURITY DEFINER RPCs and direct client writes, then remove unneeded grants behind Go.

## Go / React / Android / iOS
- `supabase/config.toml` on this release branch already points to foksbnjtzubsjpeoorvo.
- Do not place secrets in Git. In each deployment environment, set `SUPABASE_URL`, `DATABASE_URL`, JWT issuer and appropriate public/client key from destination configuration.
- Frontend variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are compiled into builds; rebuild Android/iOS after cutover.
- Keep Go API as sole writer for ride creation, offers, fare state, cancellations, wallet funds and settlement. Keep Supabase only for RLS-limited reads, Auth and Storage where appropriate.
- Disable any legacy Lovable fallbacks and old Edge Function URLs *only after* the equivalent Go endpoints are tested.
- Verify Realtime publication, signed-in sessions, storage bucket policies, rate limits and approved drivers.
- Redis must never become the durable financial source of truth.
- Do not scale Go above one replica until WebSocket presence/routing is distributed.

## Exit conditions for Lovable removal
1. Full source backup/owner-assisted export obtained, or user explicitly accepts that inaccessible source-only records are irrecoverable.
2. Destination backup and restore procedure tested; migration history conflicts understood.
3. Authentication identities and storage objects reconciled; no missing rider or driver documents.
4. Wallet P0 corrected via reviewed migration and negative client/positive server tests.
5. PostgreSQL offer acceptance race tests, 500-user load and payments sandbox settlement pass.
6. Web/Android/iOS login, rides and file uploads tested against destination.
7. After clean cutover, Lovable billing can be cancelled by the account owner; retain backups before deleting the original project.
