-- CRUIZE RIDE - DRAFT financial access hardening for foksbnjtzubsjpeoorvo
-- NOT EXECUTED. Review app dependencies, backup destination and rehearse on staging.
-- Must run from a privileged migration session; rollback plan must be validated.
-- Existing Postgres wallet settlement/Go service-role operations must be tested.
BEGIN;

-- Users may READ their own wallet using existing SELECT RLS policies,
-- but all wallet creation, balance, lock and owner updates must be server-owned.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.wallets FROM anon, authenticated;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;

-- These permissive 'No direct...' policies are misleading OR rules.
-- With INSERT/UPDATE revoked they are not sufficient as financial controls;
-- retain administrator policies for server operations only after verifying roles.
-- IMPORTANT: Do not grant authenticated any wallet write rights later.

-- Remove remote execution of trigger-only function, if it exists.
-- Only after reviewing whether a legitimate RPC client calls this function.
REVOKE EXECUTE ON FUNCTION public.guard_messages_update() FROM PUBLIC, anon, authenticated;

COMMIT;

-- Verification, run after a staging execution:
SELECT has_table_privilege('authenticated','public.wallets','INSERT') AS authenticated_wallet_insert,
       has_table_privilege('authenticated','public.wallets','UPDATE') AS authenticated_wallet_update,
       has_column_privilege('authenticated','public.wallets','balance','UPDATE') AS authenticated_balance_update,
       has_table_privilege('authenticated','public.wallets','SELECT') AS authenticated_wallet_select;

-- Pass when first three are false and SELECT remains true.
-- Also validate signed-in client cannot POST arbitrary non-zero wallet or PATCH balance;
-- verify server creates and settles wallet funds successfully and RLS owner SELECT works.
