-- PROPOSAL ONLY. Do not apply to production.
-- Apply only in an approved staging ticket after the private broadcast publisher exists.
BEGIN;

DO $guard$
BEGIN
  IF current_setting('app.environment', true) IS DISTINCT FROM 'staging'
     OR NULLIF(current_setting('app.change_ticket', true), '') IS NULL THEN
    RAISE EXCEPTION 'Refusing to run: staging environment and approved change ticket are required';
  END IF;
END
$guard$;

-- Raw live_locations changes must not be exposed through the shared publication.
-- UPDATE/DELETE payloads contain coordinates and driver identifiers; DELETE old_record
-- is not protected by the table SELECT policy after the row has been removed.
DO $publication$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'live_locations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.live_locations';
  END IF;
END
$publication$;

-- Keep direct client writes closed. Trusted backend/service_role remains the writer.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.live_locations FROM anon, authenticated;

-- Do not add live_locations back to supabase_realtime. Publish only the
-- relationship-authorized, minimum-field events described in the contract.

COMMIT;