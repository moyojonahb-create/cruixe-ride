import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import WalletPinModal from '@/components/wallet/WalletPinModal';
import { useWalletPin } from '@/hooks/useWalletPin';
import { getDriverWalletSummary } from '@/lib/walletApi';
import DriverBottomNav from './DriverBottomNav';
import DriverEarningsDashboard from './DriverEarningsDashboard';
import './driverOnboardingFonts.css';

const asset = '/brand/driver-hub';

export default function DriverEarningsOverview({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { hasPin, loading, verifyPin } = useWalletPin();
  const [promptOpen, setPromptOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDriverWalletSummary>> | null>(null);
  const [summaryError, setSummaryError] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    let active = true;
    getDriverWalletSummary().then(data => { if (active) setSummary(data); }, () => { if (active) setSummaryError(true); });
    return () => { active = false; };
  }, [unlocked]);

  const toggleAmounts = () => {
    if (unlocked) {
      setUnlocked(false);
      setSummary(null);
      setSummaryError(false);
    } else if (hasPin) {
      setPromptOpen(true);
    } else {
      navigate('/driver/wallet');
    }
  };
  const balance = summary?.balance;
  return <main data-figma-node="1105:353" className="mx-auto min-h-[100dvh] max-w-[440px] bg-[#f2f3f5] pb-24 font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <header className="flex items-center gap-3 bg-white px-[18px] pb-3 pt-[max(36px,env(safe-area-inset-top))]">
      <button type="button" onClick={onClose} aria-label="Back to requests" className="grid size-11 place-items-center rounded-full bg-[#f2f3f5]"><img src={asset + '/BackArrow.svg'} alt="" /></button>
      <p className="flex-1 text-center text-xl font-bold">CruiXe Ride</p>
      <button type="button" onClick={() => navigate('/driver/profile')} aria-label="Driver profile" className="grid size-11 place-items-center rounded-full bg-[#fcebed]"><img src={asset + '/IconUser.svg'} alt="" /></button>
    </header>
    <div className="space-y-4 p-[18px]">
      <div><h1 className="text-[26px] font-bold">Earnings</h1><p className="text-xs text-[#667080]">Track your driver earnings.</p></div>
      <section className="relative overflow-hidden rounded-[22px] bg-primary p-[18px] text-white">
        <span aria-hidden="true" className="absolute -right-11 -top-11 size-32 rounded-full border-[9px] border-[#161118]" />
        <h2 className="flex items-center gap-3 text-[17px] font-bold"><img src={asset + '/IconWallet.svg'} alt="" /> Drive Wallet</h2>
        <p className="mt-2 text-xs">Available balance · USD</p>
        <div className="flex items-center justify-between gap-2 py-2">
          <p className="text-[28px] font-bold tabular-nums">{unlocked ? typeof balance === 'number' && Number.isFinite(balance) ? `$${balance.toFixed(2)}` : summaryError ? 'Unavailable' : 'Loading…' : '••••'}</p>
          <button type="button" onClick={toggleAmounts} disabled={loading} aria-label={unlocked ? 'Hide wallet balance' : 'View wallet balance'} className="grid size-11 place-items-center rounded-full"><img src={asset + '/IconVisibilityEye.svg'} alt="" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-white/60 pt-3">
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-2 text-xs font-semibold text-[#161118]" onClick={() => navigate('/driver/deposit')}><img src={asset + '/IconPlusCircle.svg'} alt="" /> Top Up Wallet</button>
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#161118] px-2 text-xs font-semibold" onClick={() => navigate('/driver/wallet')}><img src={asset + '/IconActivity.svg'} alt="" /> Wallet Activity</button>
        </div>
      </section>
      <section className="space-y-3 rounded-[18px] bg-white p-4">
        <h2 className="flex items-center gap-3 text-[17px] font-bold"><img src={asset + '/IconEarningsLock.svg'} alt="" /> Your Earnings</h2>
        <p className="text-[11px] text-[#667080]">Amounts are private · Wallet PIN required</p>
        <button type="button" disabled={loading} onClick={toggleAmounts} className="min-h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white">{unlocked ? 'Hide Amounts' : 'View Amount'}</button>
      </section>
      {unlocked ? <DriverEarningsDashboard /> : <section className="flex items-center justify-between gap-2 rounded-[18px] bg-white p-4"><h2 className="text-[17px] font-bold">Recent Earnings</h2><span className="text-xs">Private</span></section>}
    </div>
    <DriverBottomNav activeTab="Earnings" />
    <WalletPinModal isOpen={promptOpen} onClose={() => setPromptOpen(false)} mode="verify"
      onVerifyPin={async pin => { try { return await verifyPin(pin); } catch (error) { if (error instanceof Error) toast.error(error.message); return false; } }}
      onVerified={() => { setPromptOpen(false); setUnlocked(true); }}
    />
  </main>;
}
