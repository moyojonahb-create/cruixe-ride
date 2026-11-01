-- PROPOSAL ONLY. DO NOT APPLY WITHOUT SEPARATE STAGING APPROVAL.
-- This file is deliberately guarded. It is not a Supabase migration.
-- Expected session setup for a separately approved review:
--   SET app.environment = 'staging';
--   SET app.change_ticket = '<approved-ticket>';

BEGIN;

DO $guard$
BEGIN
  IF current_setting('app.environment', true) IS DISTINCT FROM 'staging'
     OR NULLIF(current_setting('app.change_ticket', true), '') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: staging environment and approved change ticket are required';
  END IF;
END
$guard$;

-- Read-only preflight evidence. Capture results before changing staging.
SELECT current_user, session_user;

SELECT rolname, rolcanlogin, rolbypassrls, rolsuper
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role')
   OR rolname ILIKE '%backend%';

SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity, c.relforcerowsecurity,
       c.relowner::regrole AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('drivers', 'driver_documents', 'live_locations');

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('drivers', 'driver_documents', 'live_locations')
ORDER BY tablename, cmd, policyname;

SELECT grantee, table_name, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('drivers', 'driver_documents', 'live_locations')
ORDER BY table_name, grantee, privilege_type;

SELECT grantee, table_name, column_name, privilege_type, is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('drivers', 'driver_documents', 'live_locations')
ORDER BY table_name, column_name, grantee, privilege_type;

SELECT c.relname AS table_name, t.tgname, t.tgenabled,
       pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('drivers', 'driver_documents', 'live_locations')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

SELECT n.nspname, p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef, p.proowner::regrole AS owner, p.proacl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'can_driver_operate', 'is_user_driver', 'is_online_driver',
    'get_driver_id', 'admin_force_driver_offline', 'update_updated_at_column'
  );

-- Additive GPS metadata. Existing rows remain legacy/null and cannot enable ETA.
ALTER TABLE public.live_locations
  ADD COLUMN IF NOT EXISTS gps_fixed_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_sequence bigint,
  ADD COLUMN IF NOT EXISTS presence_last_seen_at timestamptz;

ALTER TABLE public.live_locations
  DROP CONSTRAINT IF EXISTS live_locations_accuracy_valid,
  DROP CONSTRAINT IF EXISTS live_locations_gps_metadata_complete;

ALTER TABLE public.live_locations
  ADD CONSTRAINT live_locations_accuracy_valid
    CHECK (accuracy IS NULL OR (accuracy >= 0 AND accuracy <= 1000)) NOT VALID,
  ADD CONSTRAINT live_locations_gps_metadata_complete
    CHECK (
      (gps_fixed_at IS NULL AND location_received_at IS NULL AND location_sequence IS NULL)
      OR
      (gps_fixed_at IS NOT NULL AND location_received_at IS NOT NULL
       AND location_sequence > 0
       AND gps_fixed_at <= location_received_at + interval '2 minutes')
    ) NOT VALID;

-- Client driver writes: table grants are removed before explicit column grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.drivers FROM anon, authenticated;
GRANT SELECT ON public.drivers TO authenticated;

-- Temporary old-client bridge. RLS below forces pending/offline.
GRANT INSERT (
  user_id, status, is_online, vehicle_type, plate_number, vehicle_make,
  vehicle_model, vehicle_year, vehicle_color, gender, avatar_url,
  preferred_service_area, earning_notifications, ecocash_number,
  is_wav, is_hearing_impaired, vehicle_photo_url
) ON public.drivers TO authenticated;

GRANT UPDATE (
  avatar_url, gender, preferred_service_area, earning_notifications,
  ecocash_number, is_wav, is_hearing_impaired
) ON public.drivers TO authenticated;

DROP POLICY IF EXISTS "Drivers can insert their own profile" ON public.drivers;
DROP POLICY IF EXISTS "Users can insert own driver record" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.drivers;
DROP POLICY IF EXISTS "Users can update own driver record" ON public.drivers;

CREATE POLICY "Drivers can insert their own profile"
ON public.drivers FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND COALESCE(is_online, false) = false
);

CREATE POLICY "Drivers can update their own profile"
ON public.drivers FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Documents: clients may submit evidence but may not review it.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.driver_documents FROM anon, authenticated;
GRANT SELECT ON public.driver_documents TO authenticated;
GRANT INSERT (driver_id, document_type, file_url, status)
  ON public.driver_documents TO authenticated;

DROP POLICY IF EXISTS "Drivers can upload their own documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Users can insert driver documents" ON public.driver_documents;

CREATE POLICY "Drivers can upload their own documents"
ON public.driver_documents FOR INSERT TO authenticated
WITH CHECK (
  status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND rejection_reason IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = driver_documents.driver_id
      AND d.user_id = auth.uid()
  )
);

-- Locations: all client writes move to the trusted backend path.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.live_locations FROM anon, authenticated;
GRANT SELECT ON public.live_locations TO authenticated;

DROP POLICY IF EXISTS "Users can update their own location" ON public.live_locations;
DROP POLICY IF EXISTS "Users can insert their own location" ON public.live_locations;
DROP POLICY IF EXISTS "Riders can view online driver locations" ON public.live_locations;
-- This policy was introduced by the March migration and is broader than the
-- later active-ride/bounding-box policy. It must be removed explicitly;
-- permissive PostgreSQL policies combine with OR.

-- Preserve the Supabase service role. Replace/add the inspected Go role here
-- only after proving its identity and least-privilege needs in staging.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_locations TO service_role;

CREATE OR REPLACE VIEW public.driver_locations
WITH (security_invoker = true) AS
SELECT user_id AS driver_user_id,
       latitude, longitude, accuracy, heading, speed, is_online, updated_at,
       gps_fixed_at, location_received_at, location_sequence,
       presence_last_seen_at
FROM public.live_locations
WHERE user_type = 'driver';

REVOKE ALL ON public.driver_locations FROM PUBLIC, anon;
GRANT SELECT ON public.driver_locations TO authenticated;

-- Validate only after inspecting staging rows. A failing validation aborts this
-- transaction and leaves staging unchanged.
ALTER TABLE public.live_locations
  VALIDATE CONSTRAINT live_locations_accuracy_valid;
ALTER TABLE public.live_locations
  VALIDATE CONSTRAINT live_locations_gps_metadata_complete;

-- Post-change assertions. These are necessary but do not replace JWT tests.
SELECT has_column_privilege('authenticated', 'public.drivers', 'status', 'UPDATE')
         AS authenticated_can_update_driver_status,
       has_column_privilege('authenticated', 'public.drivers', 'is_online', 'UPDATE')
         AS authenticated_can_update_driver_presence,
       has_column_privilege('authenticated', 'public.driver_documents', 'reviewed_by', 'INSERT')
         AS authenticated_can_insert_review_actor,
       has_table_privilege('authenticated', 'public.live_locations', 'UPDATE')
         AS authenticated_can_update_locations;

-- Review all evidence before replacing this ROLLBACK with COMMIT in a separately
-- approved, timestamped Supabase migration.
ROLLBACK;

