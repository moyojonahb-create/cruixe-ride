# Database security and GPS staging readiness

Status: **proposal only / staging NO-GO**. This document was prepared from the repository and does not confirm the effective state of any Supabase environment. No migration, database connection, deployment, or production change was performed.

## Release decision

Staging is **NO-GO for rider/driver acceptance testing until the four critical controls below are implemented together**:

1. Remove client control of driver approval, presence, eligibility, counters, and document-review state at both the PostgREST and Go API boundaries.
2. Make PostgreSQL the authority for accepting and ordering GPS fixes; do not publish rejected or unpersisted fixes to Redis or WebSocket clients.
3. Separate presence heartbeats from GPS acquisition timestamps and coordinates.
4. Run role-authenticated, two-account integration tests against the effective staging grants and policies.

The current frontend's conservative ETA behavior must remain. `RideMatching` intentionally has no authoritative GPS timestamp and suppresses ETA; `live_locations.updated_at` cannot be substituted because heartbeats refresh it.

## Confirmed repository findings

These findings are confirmed in source and migration history. Whether a direct PostgREST attack succeeds in a deployed project still depends on effective live grants, role inheritance, policy state, and triggers.

### Critical: driver and document state was client controlled at two layers (remediated locally)

- The initial owner policies constrain rows by `auth.uid() = user_id` but do not constrain columns. See `supabase/migrations/20260125160929_f5dbcea5-22a3-4053-b222-ac5d4dd68044.sql` lines 48-82. An owner insert can supply `status = 'approved'`; an owner update can target `status`, `is_online`, `trial_ends_at`, `rating_avg`, or `total_trips` if the role has the normal table privilege.
- `supabase/migrations/20260401_driver_registration_rls.sql` lines 11-18 creates additional permissive owner policies under different names. Its `DROP POLICY` names do not remove the original policies.
- `trial_ends_at` is used by `can_driver_operate` (`20260211064230_2a1e20bf-15fe-4f00-8c3f-c34825d487c4.sql` lines 2-42), making it an eligibility field.
- Driver-document insert policies verify ownership but permit any supplied insertable column. Review state is defined in the initial migration at lines 95-105. An attacker may insert an already-approved verification document if live INSERT grants cover `status`.
- The local Go remediation now allowlists profile fields, forces new applications to `pending`/offline, leaves protected fields out of upserts, and forces documents to `pending` (`backend/internal/business/handler.go` lines 415-507). Staging SQL must still enforce the same rule for direct PostgREST clients.
- The normal UI sends `pending`, but request payloads are attacker controlled. Examples are `src/components/driver/DriverRegistrationWizard.tsx` lines 167-187 and `src/components/driver/DriverSelfieCheck.tsx` lines 121-136.

### Critical: location publication required a complete availability gate (remediated locally)

- `CanUpdateLocation` ultimately checks only `drivers.status` (`backend/internal/authz/driver_authorization.go` lines 34-63 and `backend/internal/drivers/repository_authorization.go` lines 39-68).
- The local remediation now requires the driver row to be approved, already online, operable, and backed by an approved personal-photo/selfie document in the same conditional location write (`backend/internal/drivers/handler.go` lines 247-284).
- Database authorization or persistence failure now returns an error before Redis, reputation, or WebSocket publication. Staging must still prove the database role, function ACLs, and RLS/grants enforce the same boundary.

### High: heartbeats can impersonate GPS freshness

- Native stationary heartbeat handling replays cached coordinates (`src/lib/backgroundLocation.ts` lines 191-230).
- `DriverDashboard` sends every callback to the location endpoint before treating `isHeartbeat` as presence-only (`src/pages/DriverDashboard.tsx` lines 226-235).
- The location client intentionally resends unchanged coordinates after 25 seconds (`src/lib/driverLocation.ts` lines 24-67).
- The Go heartbeat updates `live_locations.updated_at` (`backend/internal/drivers/handler.go` lines 485-533). Therefore `updated_at` describes generic row activity, not acquisition of a new GPS fix.

### High: direct location writes and broad reads remain in migration history

- Owner INSERT and UPDATE policies for `live_locations` are whole-row (`20260125160929_f5dbcea5-22a3-4053-b222-ac5d4dd68044.sql` lines 152-169).
- `20260311213127_67b8cc71-bb54-428b-abf0-8f20ccdc27a8.sql` lines 11-16 permits every authenticated user to read every online driver location.
- The later bounded policy in `20260603095534_8c007527-9aa0-4ce5-8027-5dbc037f8ec4.sql` lines 20-40 drops a different policy name. PostgreSQL permissive policies are combined with OR, so the broad policy appears to remain effective in migration-derived state.

### Medium: no trigger protects sensitive fields

The driver, document, and location triggers only set `updated_at`. The function is at `20260125152047_4686c435-3d99-4ba6-b0f5-4aec93c6f1d4.sql` lines 88-95. Staging should also check for duplicate driver timestamp triggers: the initial trigger is named `update_drivers_updated_at`, while `20260308055738_272dd3b7-3a22-49e5-a39b-147c65089bea.sql` creates `tr_updated_at_drivers` without dropping the initial name.

## What requires live staging verification

Repository migrations contain no explicit GRANT or REVOKE for the three protected tables. Do not infer Supabase defaults. Before applying a candidate migration, capture:

- current and session database roles, role inheritance, `rolsuper`, and `rolbypassrls`;
- table and column privileges for `anon`, `authenticated`, `service_role`, and the Go database role;
- `pg_policies` rows including roles, command, `qual`, and `with_check`;
- all non-internal triggers and their definitions;
- function ownership, `SECURITY DEFINER`, `search_path`, and execute ACLs;
- the `driver_locations` view owner and `security_invoker` option.

The exact read-only catalog queries are in `driver-security-gps.staging.sql`. Run them only in approved staging and retain their output as release evidence.

## Least-privilege rollout

Apply the proposal in this order after review:

1. Fix the Go application and document endpoints to discard protected input, force driver/document status to `pending`, and force initial presence offline. Keep review transitions behind the existing admin-authorized path.
2. Change the GPS endpoint to perform an eligibility-gated conditional write and fail closed before Redis or WebSocket publication.
3. Deploy backend support for nullable GPS metadata while ETA remains suppressed.
4. Apply the staging privilege/RLS migration. Keep temporary compatibility for older clients that explicitly send `status: pending`; RLS must require `pending` and offline. Remove that compatibility after the minimum supported app version changes its payload.
5. Run the complete two-account suite and inspect Realtime behavior.
6. Enable v2 GPS writes in staging, then v2 reads. Restore ETA only after the gates in the contract pass.

Genuinely self-service fields are limited initially to `avatar_url`, `gender`, `preferred_service_area`, `earning_notifications`, `ecocash_number`, `is_wav`, and `is_hearing_impaired`. Vehicle identity, plate, vehicle photo, approval, presence, trial, ratings, trip totals, review metadata, GPS metadata, timestamps, IDs, and ownership need a reviewed server path. Current direct `vehicle_photo_url` update at `src/pages/driver/DriverProfile.tsx` lines 176-188 must move behind that path before the stricter grant is applied.

## Backend integration plan

- Replace generic request maps for driver applications and documents with typed request DTOs that do not expose protected fields.
- On create/upsert, assign `status = 'pending'` and `is_online = false` on the server. An existing reviewed record must not be downgraded, overwritten, or re-approved by an application upsert.
- For documents, assign `status = 'pending'` and null review metadata. Review transitions remain admin-only and must log actor, old state, new state, and reason.
- Require the authenticated driver to be approved, already online, operable, and backed by approved selfie evidence inside the same database statement that accepts a GPS fix.
- Return 403 without PostgreSQL, Redis, reputation, or WebSocket mutation when eligibility fails.
- Return 409 for equal/older fixes and 422 for invalid, expired, future, or poor-quality fixes. Only a committed database row may be written to Redis or broadcast.
- Use database-returned coordinates and metadata for downstream publication. Never echo uncommitted request values as authoritative.

## Automated staging suite

Use a disposable local Supabase/PostgreSQL job first, then the same suite against staging with synthetic accounts A and B:

1. Direct driver `status`, `is_online`, `trial_ends_at`, rating, and trip-count insert/update attempts fail with 42501 or preserve the protected value.
2. Direct `live_locations` insert/update/delete fails for authenticated clients.
3. Account A can update every approved self-service field, cannot update B, and cannot change ownership.
4. Account A can insert only a pending document bound to its own driver; it cannot bind to B or set review metadata. Trusted review can approve and reject.
5. Malicious Go application/document payloads cannot set protected fields. No token, rider token, invalid token, and A acting for B return 401/403 with no side effects.
6. Pending, rejected, suspended, banned, offline, financially ineligible, or selfie-unverified drivers cannot publish GPS.
7. A valid fix is accepted; duplicate/equal/older fixes return 409; expired/future/invalid/poor-accuracy fixes return 422; concurrent reversed requests retain the newer fix.
8. Heartbeats change only presence time. Coordinates, accuracy, `gps_fixed_at`, `location_received_at`, and `location_sequence` remain byte-for-byte unchanged.
9. Account B cannot read A's location without the bounded nearby or active-ride relationship. Verify the broad March policy is absent.
10. Realtime and polling cannot regress sequence. Null/stale metadata keeps ETA hidden; only a fresh, accurate, higher-sequence assigned-driver fix restores it.

Existing mock tests are useful but insufficient. `backend/internal/drivers/handler_test.go` covers eligibility SQL shape, wrong-ride denial, validation, throttling, and impossible jumps. Frontend tests cover availability concurrency, selfie failure, tracking state, and ETA suppression. None proves effective PostgreSQL grants or RLS.

## Rollback

Before apply, export exact staging grants, policies, trigger definitions, view definition/options, and function ACLs. Keep the migration forward-only and additive.

If staging profile or registration flows regress, stop v2 writers/readers, redeploy the prior compatible backend, and restore only the captured prior grants/policies needed for staging recovery. Do not restore direct client presence writes. Leave nullable GPS columns in place until no deployed binary references them; remove functions or columns only in a later reviewed cleanup. After rollback, rerun A/B isolation, pending document upload, online/offline, legacy location compatibility, heartbeat isolation, and Realtime checks.

## Dependencies and residual risks

- The exact Go database role and whether it bypasses RLS are unknown until staging inspection.
- Existing mobile versions may send explicit pending fields or legacy location requests without acquisition timestamps.
- Device clocks can drift; the initial contract permits 30 seconds future skew and rejects fixes older than 120 seconds. Tune with staging telemetry, never by treating receipt time as fix time.
- In-memory speed/rate checks do not coordinate across backend instances. Database ordering remains mandatory.
- The current `driver_locations` view and generated Supabase types must be regenerated after the approved schema change.
- No wallet, payment, ledger, or settlement rule is changed by this proposal. `can_driver_operate` remains the existing eligibility authority.

