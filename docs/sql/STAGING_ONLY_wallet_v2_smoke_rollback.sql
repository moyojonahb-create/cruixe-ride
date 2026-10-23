-- Cruize Ride V2 wallet smoke test — ISOLATED STAGING ONLY.
-- Requires docs/sql/STAGING_ONLY_wallet_v2_financial_core.sql already applied.
-- Runs transactional writes with synthetic UUIDs and always rolls back.
-- DO NOT execute on the existing live production project.
BEGIN;
SET LOCAL statement_timeout = '30s';
DO $$
DECLARE
  txn_id uuid := gen_random_uuid();
  debit_account uuid := gen_random_uuid();
  credit_account uuid := gen_random_uuid();
  debit_count integer;
  credit_count integer;
  net bigint;
BEGIN
  INSERT INTO public.wallet_accounts
    (id, owner_role, account_type, currency, status)
  VALUES
    (debit_account,'system','provider_clearing_wallet','USD','active'),
    (credit_account,'system','cash_liability_wallet','USD','active');

  INSERT INTO public.wallet_v2_transactions
    (id,transaction_type,status,idempotency_key,currency,total_amount,amount_minor)
  VALUES
    (txn_id,'admin_adjustment','posted','staging-smoke-' || txn_id,'USD',1.00,100);

  INSERT INTO public.wallet_ledger_entries
    (transaction_id,account_id,entry_type,amount,amount_minor,currency)
  VALUES
    (txn_id,debit_account,'debit',1.00,100,'USD'),
    (txn_id,credit_account,'credit',1.00,100,'USD');

  SELECT count(*) FILTER (WHERE entry_type='debit'),
         count(*) FILTER (WHERE entry_type='credit'),
         coalesce(sum(CASE WHEN entry_type='credit' THEN amount_minor ELSE -amount_minor END),0)
  INTO debit_count, credit_count, net
  FROM public.wallet_ledger_entries
  WHERE transaction_id=txn_id;

  IF debit_count <> 1 OR credit_count <> 1 OR net <> 0 THEN
    RAISE EXCEPTION 'staging ledger balance check failed: debit %, credit %, net %',debit_count,credit_count,net;
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege('anon','public.wallet_v2_transactions','INSERT')
   OR has_table_privilege('authenticated','public.wallet_v2_transactions','INSERT')
   OR has_table_privilege('authenticated','public.wallet_ledger_entries','INSERT')
   OR has_table_privilege('authenticated','public.wallet_accounts','UPDATE') THEN
     RAISE EXCEPTION 'V2 ledger directly writable by an untrusted API role';
  END IF;
END $$;
ROLLBACK;
-- A successful execution verifies schema SQL and minimal balanced test writes.
-- It does not establish settlement idempotency, overdraft checks, or production readiness.
