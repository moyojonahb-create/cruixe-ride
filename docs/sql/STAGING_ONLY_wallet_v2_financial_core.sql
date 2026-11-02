-- CRUIZE RIDE — V2 financial core, isolated STAGING rehearsal only.
-- Do NOT apply directly to production. The legacy public.wallet_transactions
-- and legacy public.wallets / balances are intentionally untouched.
-- Apply after encrypted backup + isolated restore and verify Go repository
-- matches all SQL columns and types. This is ONLY the initial core schema.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  owner_role text NOT NULL CHECK (owner_role IN ('rider', 'driver', 'platform', 'system')),
  account_type text NOT NULL CHECK (account_type IN (
    'rider_wallet',
    'driver_wallet',
    'platform_wallet',
    'cash_liability_wallet',
    'pending_deposit_wallet',
    'provider_clearing_wallet'
  )),
  currency text NOT NULL CHECK (currency IN ('USD', 'ZWG')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  cached_available_balance numeric(18,2) NOT NULL DEFAULT 0,
  cached_pending_balance numeric(18,2) NOT NULL DEFAULT 0,
  cached_liability_balance numeric(18,2) NOT NULL DEFAULT 0,
  cached_available_balance_minor bigint NOT NULL DEFAULT 0,
  cached_pending_balance_minor bigint NOT NULL DEFAULT 0,
  cached_liability_balance_minor bigint NOT NULL DEFAULT 0,
  last_ledger_entry_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, account_type, currency)
);

CREATE TABLE IF NOT EXISTS public.wallet_v2_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'ride_settlement',
    'cash_liability',
    'deposit',
    'withdrawal',
    'refund',
    'reversal',
    'admin_adjustment',
    'shadow_settlement',
    'cash_platform_fee',
    'wallet_settlement'
  )),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'posted',
    'reversed',
    'failed',
    'cancelled',
    'requires_approval'
  )),
  idempotency_key text NOT NULL UNIQUE,
  currency text NOT NULL CHECK (currency IN ('USD', 'ZWG')),
  total_amount numeric(18,2) NOT NULL CHECK (total_amount > 0),
  amount_minor bigint NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  source_type text,
  source_id text,
  owner_user_id uuid,
  ride_id uuid,
  payment_provider text CHECK (payment_provider IS NULL OR payment_provider IN ('cash', 'wallet', 'onemoney', 'ecocash', 'innbucks', 'card', 'visa', 'mastercard', 'paypal', 'internal')),
  payment_intent_id uuid,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.wallet_v2_transactions(id),
  account_id uuid NOT NULL REFERENCES public.wallet_accounts(id),
  entry_type text NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  amount_minor bigint NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency text NOT NULL CHECK (currency IN ('USD', 'ZWG')),
  ride_id uuid,
  source_type text,
  source_id text,
  payment_provider text CHECK (payment_provider IS NULL OR payment_provider IN ('cash', 'wallet', 'onemoney', 'ecocash', 'innbucks', 'card', 'visa', 'mastercard', 'paypal', 'internal')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  amount_minor bigint NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency text NOT NULL CHECK (currency IN ('USD', 'ZWG')),
  provider text NOT NULL CHECK (provider IN ('onemoney', 'ecocash', 'innbucks', 'card', 'visa', 'mastercard', 'paypal')),
  payment_method text NOT NULL CHECK (payment_method IN ('onemoney', 'ecocash', 'innbucks', 'card', 'visa', 'mastercard', 'paypal')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_admin_approval', 'pending_provider_payment', 'authorized', 'captured', 'voided', 'refunded', 'approved', 'completed', 'rejected', 'failed', 'cancelled', 'expired')),
  wallet_account_type text CHECK (wallet_account_type IS NULL OR wallet_account_type IN ('rider_wallet', 'driver_wallet')),
  provider_reference text,
  operation text NOT NULL DEFAULT 'legacy',
  idempotency_key text NOT NULL,
  expires_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason text,
  wallet_transaction_id uuid REFERENCES public.wallet_v2_transactions(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, operation, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('onemoney', 'ecocash', 'innbucks', 'card', 'visa', 'mastercard', 'paypal')),
  provider_event_id text NOT NULL,
  provider_reference text,
  event_type text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  payload_hash text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'duplicate', 'ignored', 'failed')),
  UNIQUE (provider, provider_event_id),
  UNIQUE (provider, payload_hash)
);


-- No direct PostgREST public or signed-in access to financial posting tables.
-- Trusted Go Postgres role owns inserts/updates; explicit owner-scoped reads
-- need a separate security-reviewed API / policy rollout.
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_v2_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallet_accounts, public.wallet_v2_transactions,
  public.wallet_ledger_entries, public.payment_intents, public.provider_events
  FROM PUBLIC, anon, authenticated;
COMMIT;

-- Required staging-only postflight:
-- SELECT to_regclass('public.wallet_v2_transactions');
-- SELECT has_table_privilege('authenticated','public.wallet_v2_transactions','INSERT');
-- SELECT has_column_privilege('authenticated','public.wallets','balance','UPDATE');
-- Last query still TRUE until separate reviewed legacy hardening is applied.
