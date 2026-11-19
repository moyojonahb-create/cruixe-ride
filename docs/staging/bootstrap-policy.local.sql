-- Run only against the disposable local replay cluster on port 55439.
-- This test uses rollback-only synthetic users and explicit fixture privileges.
\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF current_setting('port') <> '55439' OR current_database() <> 'postgres' THEN
    RAISE EXCEPTION 'This fixture test is restricted to the local replay cluster';
  END IF;
END $$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('00000000-0000-4000-8000-000000000001','replay-admin@example.invalid','{}'),
 ('00000000-0000-4000-8000-000000000002','replay-owner@example.invalid','{}'),
 ('00000000-0000-4000-8000-000000000003','replay-outsider@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES ('00000000-0000-4000-8000-000000000001','admin') ON CONFLICT DO NOTHING;
INSERT INTO public.notification_history(user_id,type,channel,title,body,status) VALUES
 ('00000000-0000-4000-8000-000000000002','ride_completed','email','fixture','fixture','queued'),
 ('00000000-0000-4000-8000-000000000003','ride_completed','email','fixture','fixture','queued');
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT,UPDATE ON public.notification_history,public.risk_rules TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.notification_history) <> 2 THEN RAISE EXCEPTION 'admin cannot read all notification rows'; END IF;
 IF (SELECT count(*) FROM public.risk_rules) <> 6 THEN RAISE EXCEPTION 'admin cannot read seeded risk rules'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
DO $$ DECLARE changed integer; BEGIN
 IF (SELECT count(*) FROM public.notification_history) <> 1 THEN RAISE EXCEPTION 'owner notification isolation failed'; END IF;
 IF EXISTS(SELECT FROM public.risk_rules) THEN RAISE EXCEPTION 'ordinary user sees admin risk rules'; END IF;
 UPDATE public.risk_rules SET enabled=false;
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'ordinary user changed admin risk rules'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
