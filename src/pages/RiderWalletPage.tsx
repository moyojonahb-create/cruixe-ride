import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, RefreshCw, Clock, CheckCircle, XCircle, Settings,
  ArrowDownLeft, ArrowUpRight, Send, History, Copy, Check,
  ShieldCheck, Lock, BadgeCheck, Eye, EyeOff, Smartphone, CreditCard,
} from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useWalletPin } from '@/hooks/useWalletPin';
import { usePickmeAccount } from '@/hooks/usePickmeAccount';
import { supabase } from '@/integrations/supabase/client';
import { listWalletDeposits } from '@/lib/walletApi';
import DepositModal from '@/components/wallet/DepositModal';
import WalletPinModal from '@/components/wallet/WalletPinModal';
import WalletSettings from '@/components/wallet/WalletSettings';
import TransactionsSheet from '@/components/wallet/TransactionsSheet';
import TransferMoneyModal from '@/components/wallet/TransferMoneyModal';
import WithdrawalModal from '@/components/wallet/WithdrawalModal';
import WalletCard from '@/components/wallet/WalletCard';
import MoneyAmount from '@/components/wallet/MoneyAmount';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface RiderDeposit {
  id: string;
  amount_usd: number;
  payment_method: string;
  reference: string;
  status: string;
  created_at: string;
}

const METHOD_LABELS: Record<string, string> = {
  ecocash: 'EcoCash', onemoney: 'OneMoney', telecash: 'Telecash',
  innbucks: 'InnBucks', zimswitch: 'ZimSwitch', mukuru: 'Mukuru',
  bank_transfer: 'Bank Transfer',
};

const PAYMENT_PROVIDERS: { key: string; label: string; sub: string; bg: string; fg: string }[] = [
  { key: 'ecocash',    label: 'EcoCash',    sub: 'Mobile money',   bg: 'from-red-500 to-rose-600',        fg: 'text-white' },
  { key: 'onemoney',   label: 'OneMoney',   sub: 'Mobile money',   bg: 'from-amber-400 to-orange-500',    fg: 'text-white' },
  { key: 'innbucks',   label: 'InnBucks',   sub: 'Digital wallet', bg: 'from-emerald-500 to-emerald-600', fg: 'text-white' },
  { key: 'visa',       label: 'Visa',       sub: 'Card · soon',    bg: 'from-blue-700 to-blue-900',       fg: 'text-white' },
  { key: 'mastercard', label: 'Mastercard', sub: 'Card · soon',    bg: 'from-orange-500 to-red-600',      fg: 'text-white' },
  { key: 'paypal',     label: 'PayPal',     sub: 'Global · soon',  bg: 'from-sky-500 to-blue-700',        fg: 'text-white' },
];

export default function RiderWalletPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, transactions, refresh: refreshWallet, loading: walletLoading } = useWallet();
  const { hasPin, loading: pinLoading, setPin, verifyPin, refresh: refreshPin } = useWalletPin();
  const { full_name, pickme_account } = usePickmeAccount();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [deposits, setDeposits] = useState<RiderDeposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [pinVerified, setPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    if (!pinLoading && !pinVerified) setShowPinModal(true);
  }, [pinLoading, pinVerified]);

  const handleVerifyPin = async (enteredPin: string): Promise<boolean> => {
    try { return await verifyPin(enteredPin); }
    catch (err) { if (err instanceof Error) toast.error(err.message); return false; }
  };

  const handleSetPin = async (newPin: string): Promise<boolean> => {
    const ok = await setPin(newPin);
    if (ok) { setPinVerified(true); refreshPin(); }
    return ok;
  };

  const loadDeposits = useCallback(async () => {
    if (!user) return;
    setLoadingDeposits(true);
    try {
      const data = await listWalletDeposits({ type: 'rider', limit: 20 });
      setDeposits(data.map((d) => ({
        id: d.id,
        amount_usd: d.amount_usd,
        payment_method: d.payment_method ?? 'deposit',
        reference: d.reference ?? d.ecocash_reference ?? '',
        status: d.status,
        created_at: d.created_at,
      })));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to load deposits');
      setDeposits([]);
    }
    setLoadingDeposits(false);
  }, [user]);

  useEffect(() => {
    if (!user || !pinVerified) return;
    (async () => {
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .eq('status', 'completed');
      setReferralEarnings((count || 0) * 2);
    })();
  }, [user, pinVerified]);

  useEffect(() => { if (pinVerified) loadDeposits(); }, [loadDeposits, pinVerified]);

  const handleRefresh = () => {
    refreshWallet();
    loadDeposits();
    setLastUpdated(new Date());
  };

  const pendingBalance = deposits
    .filter((d) => d.status === 'pending')
    .reduce((sum, d) => sum + Number(d.amount_usd || 0), 0);

  const copyAccount = async () => {
    if (!pickme_account) return;
    try {
      await navigator.clipboard.writeText(pickme_account);
      setCopied(true);
      toast.success('Account number copied');
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error('Could not copy'); }
  };

  const statusIcon = (s: string) => {
    if (s === 'approved') return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (s === 'rejected') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  useEffect(() => { if (!user) navigate('/auth'); }, [user, navigate]);

  if (pinLoading || !pinVerified) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
        <WalletPinModal
          isOpen={showPinModal}
          onClose={() => { if (!pinVerified) navigate(-1); }}
          onVerified={() => { setPinVerified(true); setShowPinModal(false); }}
          mode={hasPin ? 'verify' : 'setup'}
          onVerifyPin={handleVerifyPin}
          onSetPin={handleSetPin}
        />
        <div className="opacity-30 max-w-sm w-full">
          <WalletCard fullName={full_name || 'User'} balance={0} pickmeAccount={pickme_account} hidden />
        </div>
      </div>
    );
  }

  const displayName = (full_name || 'User').split(' ').slice(0, 2).join(' ');

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Figma Wallet / Dashboard 285:27 — header visual migration.
          Preserve the real wallet hooks, PIN gate, transaction and payment actions. */}
      <header className="sticky top-0 z-20 border-b border-[#f6f6f8] bg-white/95 backdrop-blur-md">
        <div
          className="mx-auto flex w-full max-w-lg items-start gap-3 px-4 pb-4 pt-7"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 28px)' }}
        >
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate(-1)} className="mt-1 shrink-0 rounded-2xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-['Poppins'] text-[26px] font-semibold leading-[39px] tracking-[-0.02em] text-[#1f2126]">
              CruiXe Wallet
            </h1>
            <p className="font-['Poppins'] text-[13px] leading-5 text-[#61666e]">
              Your money, your rides.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Wallet security settings" onClick={() => setShowSettings((v) => !v)} className="mt-1 h-11 w-11 shrink-0 rounded-2xl bg-[#f6f6f8]">
            <Settings className="h-5 w-5 text-[#1f2126]" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Refresh wallet" onClick={handleRefresh} disabled={walletLoading} className="mt-1 h-11 w-11 shrink-0 rounded-2xl bg-[#f6f6f8]">
            <RefreshCw className={`h-5 w-5 text-[#1f2126] ${walletLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5 max-w-lg mx-auto pb-28">
        {/* Wallet balance: Figma 285:30. Values and actions remain connected to useWallet. */}
        <section aria-label="Available wallet balance" className="rounded-[20px] bg-[#f6f6f8] px-4 py-4 font-['Poppins'] text-[#1f2126]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#61666e]">Available balance</span>
            <span className="text-[10px] font-medium text-[#61666e]">USD</span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-[32px] font-semibold leading-[48px] tabular-nums" aria-live="polite">
              {hideBalance ? '••••••' : `$${balance.toFixed(2)}`}
            </p>
            <button
              type="button"
              onClick={() => setHideBalance((v) => !v)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e31b23]"
              aria-label={hideBalance ? 'Show wallet balance' : 'Hide wallet balance'}
              aria-pressed={hideBalance}
            >
              {hideBalance ? <EyeOff className="h-[22px] w-[22px]" /> : <Eye className="h-[22px] w-[22px]" />}
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#e5e5e8] pt-3 text-[11px] text-[#61666e]">
            <span>Pending: {hideBalance ? '••••' : `$${pendingBalance.toFixed(2)}`}</span>
            <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
          </div>
        </section>

        {/* Existing account identifier remains usable without replacing the Figma balance figure. */}
        {pickme_account && (
          <button
            type="button"
            onClick={copyAccount}
            className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-[#f0f0f2] bg-white px-4 py-3 text-left text-[#1f2126]"
            aria-label="Copy wallet account number"
          >
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-[#61666e]">Wallet account</span>
              <span className="block truncate font-mono text-[13px] font-semibold">{pickme_account}</span>
            </span>
            {copied ? <Check className="h-5 w-5 shrink-0 text-[#e31b23]" /> : <Copy className="h-5 w-5 shrink-0" />}
          </button>
        )}

        {/* Figma 285:31 quick actions. Keep all existing money operations reachable. */}
        <section aria-label="Wallet quick actions" className="grid grid-cols-4 gap-2 font-['Poppins']">
          {[
            { label: 'Top Up', icon: Plus, onClick: () => setShowDeposit(true), disabled: false },
            { label: 'Pay for Ride', icon: Send, onClick: () => navigate('/ride'), disabled: false },
            { label: 'Transactions', icon: History, onClick: () => setShowTransactions(true), disabled: false },
            { label: 'More', icon: Settings, onClick: () => setShowSettings((v) => !v), disabled: false },
          ].map(({ label, icon: Icon, onClick, disabled }) => (
            <button
              type="button"
              key={label}
              onClick={onClick}
              disabled={disabled}
              className="flex min-w-0 flex-col items-center gap-2 rounded-xl px-0.5 py-2 text-[#1f2126] transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e31b23] disabled:opacity-50"
            >
              <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-[18px] ${label === 'Pay for Ride' ? 'bg-[#fecf04]' : 'bg-[#f6f6f8]'}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-h-[30px] text-center text-[10px] font-medium leading-[15px]">{label}</span>
            </button>
          ))}
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setShowWithdraw(true)} disabled={balance < 5} className="rounded-[14px] border border-[#e5e5e8] bg-white px-3 py-3 text-[12px] font-semibold text-[#1f2126] disabled:opacity-50">
            Withdraw
          </button>
          <button type="button" onClick={() => setShowTransfer(true)} disabled={balance <= 0} className="rounded-[14px] border border-[#e5e5e8] bg-white px-3 py-3 text-[12px] font-semibold text-[#1f2126] disabled:opacity-50">
            Transfer
          </button>
        </div>

        {/* ===== Payment Providers ===== */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-bold text-foreground">Payment Methods</h2>
            <span className="text-[11px] text-muted-foreground">Top up & cash out</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {PAYMENT_PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => setShowDeposit(true)}
                className="relative overflow-hidden rounded-2xl p-3 text-left active:scale-[0.97] transition-transform"
                style={{ boxShadow: '0 6px 16px -8px rgba(15,23,42,0.18)' }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${p.bg}`} />
                <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/15 blur-xl" />
                <div className={`relative ${p.fg}`}>
                  <div className="h-7 w-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                    {p.key === 'visa' || p.key === 'mastercard' || p.key === 'paypal'
                      ? <CreditCard className="h-3.5 w-3.5" />
                      : <Smartphone className="h-3.5 w-3.5" />}
                  </div>
                  <p className="text-[12px] font-extrabold mt-2 leading-none">{p.label}</p>
                  <p className="text-[9px] opacity-85 mt-1 leading-none">{p.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {showSettings && (
          <WalletSettings hasPin={hasPin} onSetPin={handleSetPin} onVerifyPin={handleVerifyPin} />
        )}

        {/* ===== Recent Transactions ===== */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[19px] font-semibold text-[#1f2126]">Recent Activity</h2>
            <button
              onClick={() => setShowTransactions(true)}
              className="text-[12px] font-medium text-[#e31b23]"
            >
              View all
            </button>
          </div>

          <div className="rounded-[18px] bg-white border border-[#f0f0f2] overflow-hidden"
               style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.05)' }}>
            {transactions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="h-12 w-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-semibold text-foreground mt-3">No transactions yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Top up your wallet to get started</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx, i) => {
                const isPositive = Number(tx.amount) > 0;
                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 px-3.5 py-3 ${i !== 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isPositive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate capitalize">
                        {tx.description || tx.transaction_type.replace('_', ' ')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(tx.created_at), 'dd MMM, HH:mm')} · <span className="text-emerald-600 font-medium">Completed</span>
                      </p>
                    </div>
                    <span className={`text-[14px] font-extrabold ${isPositive ? 'text-emerald-600' : 'text-foreground'}`}>
                      <MoneyAmount amount={tx.amount} currency={'currency' in tx && typeof tx.currency === 'string' ? tx.currency : undefined} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ===== Deposit History ===== */}
        {(deposits.length > 0 || loadingDeposits) && (
          <section>
            <h2 className="text-[13px] font-bold text-foreground mb-2.5">Deposit Requests</h2>
            <div className="space-y-2">
              {deposits.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl p-3 border border-slate-100 flex items-center gap-3"
                  style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}
                >
                  {statusIcon(d.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-foreground">${Number(d.amount_usd).toFixed(2)}</span>
                      <span className="text-[10px] bg-slate-100 text-foreground px-1.5 py-0.5 rounded-full font-semibold">
                        {METHOD_LABELS[d.payment_method] || d.payment_method}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Ref: {d.reference} · {format(new Date(d.created_at), 'dd MMM, HH:mm')}
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold capitalize ${
                    d.status === 'approved' ? 'text-emerald-600'
                      : d.status === 'rejected' ? 'text-destructive'
                      : 'text-amber-600'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
              {loadingDeposits && <div className="text-center text-muted-foreground text-[12px] py-3">Loading…</div>}
            </div>
          </section>
        )}

        {/* ===== Trust Section ===== */}
        <section className="rounded-2xl bg-white border border-slate-100 p-4"
                 style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.05)' }}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">Your money is safe</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: ShieldCheck, label: 'Wallet Protected', tint: 'bg-blue-50 text-blue-700' },
              { icon: Lock,        label: 'Encrypted',        tint: 'bg-violet-50 text-violet-700' },
              { icon: BadgeCheck,  label: 'Verified Payments',tint: 'bg-emerald-50 text-emerald-700' },
            ].map(({ icon: Icon, label, tint }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1.5">
                <span className={`h-9 w-9 rounded-xl ${tint} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[10.5px] font-semibold text-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>
          {referralEarnings > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-foreground">Referral earnings</span>
              <span className="text-[12px] font-bold text-emerald-600">+${referralEarnings.toFixed(2)}</span>
            </div>
          )}
        </section>

        <p className="text-center text-[10px] text-muted-foreground pt-2">
          CruiXe Wallet · Secured by 256-bit encryption
        </p>
      </div>

      <DepositModal
        isOpen={showDeposit}
        onClose={() => { setShowDeposit(false); handleRefresh(); }}
        currentBalance={balance}
      />

      <TransactionsSheet
        isOpen={showTransactions}
        onClose={() => setShowTransactions(false)}
        transactions={transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
          transaction_type: t.transaction_type as 'deposit' | 'withdrawal' | 'trip_fee' | 'refund',
        }))}
        title="All Transactions"
      />

      <TransferMoneyModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        balance={balance}
        onSuccess={refreshWallet}
      />

      <WithdrawalModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={balance}
        onSuccess={refreshWallet}
      />

      <BottomNavBar />
    </div>
  );
}
