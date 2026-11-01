# Driver presence and GPS authority proposal

Status: staging-only design. Do not apply to production without database review, a rollback plan, and real-account verification.

The consolidated assessment, guarded SQL candidate, and versioned GPS contract are in:

- `docs/staging/DATABASE-SECURITY-GPS-READINESS.md`
- `docs/staging/driver-security-gps.staging.sql`
- `docs/staging/driver-location-v2-contract.yaml`

## Problem

The Go presence endpoint now evaluates approved driver state, approved identity evidence, and `can_driver_operate` in the same SQL statement that changes presence. The browser no longer falls back to direct Supabase writes. Existing database policies still allow an authenticated driver to update their own `drivers` row, so a modified client may be able to write protected fields such as `status` or `is_online` without using the Go transition. `live_locations.updated_at` is also changed by heartbeats and cannot represent GPS freshness.

## Staging RLS and privilege change

1. Inventory effective grants and policies for `drivers`, `driver_documents`, and `live_locations` in the staging database.
2. Revoke authenticated direct writes to security-owned columns: `drivers.status`, `drivers.is_online`, `drivers.trial_ends_at`, all review fields on `driver_documents`, and presence/freshness fields on `live_locations`.
3. Grant authenticated updates only to an explicit allowlist of driver-editable profile and vehicle columns. Keep online/offline transitions behind the authenticated Go endpoint.
4. Keep identity-document inserts user-bound through `driver_documents.driver_id -> drivers.id -> drivers.user_id = auth.uid()`. Only an admin or trusted verification service may change `status`, `reviewed_by`, `reviewed_at`, or `rejection_reason`.
5. Add policy tests proving a driver cannot self-approve, change protected eligibility fields, or write presence directly, while legitimate profile edits and document uploads still work.

Use column privileges or a guarded trigger in addition to RLS. A row-level `USING (auth.uid() = user_id)` expression alone does not restrict which columns the owner can change.

## Authoritative GPS contract

Add these nullable/server-owned fields in a separately reviewed migration:

- `gps_fixed_at timestamptz`: device fix time accepted by the location endpoint. Heartbeats never update it.
- `location_received_at timestamptz NOT NULL DEFAULT now()`: server receipt time for the accepted fix.
- `location_sequence bigint`: monotonic sequence scoped to the authenticated driver (and ride when a ride ID is present).
- Optional `accuracy_m double precision` and `ride_id uuid` for quality and assignment checks.

The Go location endpoint should validate finite coordinate ranges, accuracy bounds, authenticated driver ownership, ride assignment, maximum fix age, future clock skew, and monotonic sequence. Its conditional upsert must reject a sample unless its sequence is newer than the stored sequence. Presence heartbeats should update a separate `presence_last_seen_at` field and must not change coordinates, GPS timestamps, or location sequence.

Realtime and polling responses should expose `gps_fixed_at`, `location_received_at`, and `location_sequence`. The client should order samples by `location_sequence`, calculate freshness only from `gps_fixed_at`, preserve the last known marker when disconnected, and suppress distance/ETA when the fix is missing or stale.

## Staging verification

- Attempt protected direct Supabase updates as a driver and expect denial.
- Verify pending/rejected identity evidence cannot bring a driver online; approved user-bound evidence can, subject to trial/wallet eligibility.
- Race online/offline requests and confirm the latest serialized intent wins.
- Send duplicate, late, stale, future-dated, inaccurate, and wrong-ride GPS samples and expect rejection.
- Confirm heartbeats do not refresh `gps_fixed_at` or `location_sequence`.
- Exercise Android pause/resume and reconnect with two test accounts before preview promotion.

## Rollback

Prepare inverse grants/policies before staging. Roll back the application and database change together if legitimate profile edits, registration uploads, or driver availability fail. Do not restore direct client presence writes as a fallback.
