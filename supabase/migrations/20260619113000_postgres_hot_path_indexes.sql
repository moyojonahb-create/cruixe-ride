-- Core indexes use the canonical public.rides/public.offers schema.
-- Backend ledger and dispatch schemas are optional and installed separately.
-- Emit a NOTICE when an optional table/column prerequisite is unavailable;
-- this is a deferred optimization, never proof that its feature is provisioned.

CREATE INDEX IF NOT EXISTS idx_rides_rider_status_created
  ON public.rides (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rides_driver_ride_status
  ON public.rides (driver_id, status, id);

CREATE INDEX IF NOT EXISTS idx_rides_requested_created
  ON public.rides (created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_offers_ride_pending_created
  ON public.offers (ride_id, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_offers_id_pending
  ON public.offers (id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_offers_driver_ride
  ON public.offers (driver_id, ride_id);

CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_updated
  ON public.driver_sessions (driver_id, went_online_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_devices_active_user_seen
  ON public.notification_devices (user_id, last_seen DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notification_history_failed_created
  ON public.notification_history (created_at DESC)
  WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS idx_risk_scores_score_updated
  ON public.risk_scores (risk_score DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_events_area_only
  ON public.risk_events (area);

DO $indexes$
BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='dispatch_shadow_runs' AND column_name IN ('ride_id','created_at')) = 2 THEN
    CREATE INDEX IF NOT EXISTS idx_dispatch_shadow_runs_ride_created
  ON public.dispatch_shadow_runs (ride_id, created_at DESC);
  ELSE
    RAISE NOTICE 'Deferred optional index: dispatch_shadow_runs requires columns ride_id,created_at';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='dispatch_shadow_candidates' AND column_name IN ('shadow_run_id','driver_id')) = 2 THEN
    CREATE INDEX IF NOT EXISTS idx_dispatch_shadow_candidates_run_driver
  ON public.dispatch_shadow_candidates (shadow_run_id, driver_id);
  ELSE
    RAISE NOTICE 'Deferred optional index: dispatch_shadow_candidates requires columns shadow_run_id,driver_id';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_intents' AND column_name IN ('user_id','provider','operation','idempotency_key')) = 4 THEN
    CREATE INDEX IF NOT EXISTS idx_payment_intents_scoped_idempotency
  ON public.payment_intents (user_id, provider, operation, idempotency_key);
  ELSE
    RAISE NOTICE 'Deferred optional index: payment_intents requires columns user_id,provider,operation,idempotency_key';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_intents' AND column_name IN ('provider','provider_reference')) = 2 THEN
    CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_reference
  ON public.payment_intents (provider, provider_reference)
  WHERE provider_reference IS NOT NULL;
  ELSE
    RAISE NOTICE 'Deferred optional index: payment_intents requires columns provider,provider_reference';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_intents' AND column_name IN ('idempotency_key')) = 1 THEN
    CREATE INDEX IF NOT EXISTS idx_payment_intents_idempotency
  ON public.payment_intents (idempotency_key);
  ELSE
    RAISE NOTICE 'Deferred optional index: payment_intents requires columns idempotency_key';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_accounts' AND column_name IN ('owner_user_id','account_type','currency')) = 3 THEN
    CREATE INDEX IF NOT EXISTS idx_wallet_accounts_owner_type_currency
  ON public.wallet_accounts (owner_user_id, account_type, currency);
  ELSE
    RAISE NOTICE 'Deferred optional index: wallet_accounts requires columns owner_user_id,account_type,currency';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_authorizations' AND column_name IN ('ride_id')) = 1 THEN
    CREATE INDEX IF NOT EXISTS idx_wallet_authorizations_ride
  ON public.wallet_authorizations (ride_id);
  ELSE
    RAISE NOTICE 'Deferred optional index: wallet_authorizations requires columns ride_id';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_transactions' AND column_name IN ('owner_user_id','created_at')) = 2 THEN
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_owner_created
  ON public.wallet_transactions (owner_user_id, created_at DESC);
  ELSE
    RAISE NOTICE 'Deferred optional index: wallet_transactions requires columns owner_user_id,created_at';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_ledger_entries' AND column_name IN ('transaction_id')) = 1 THEN
    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_transaction
  ON public.wallet_ledger_entries (transaction_id);
  ELSE
    RAISE NOTICE 'Deferred optional index: wallet_ledger_entries requires columns transaction_id';
  END IF;
END $indexes$;
