import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { walletPanel } from './DriverWalletFrame';
import './driverOnboardingFonts.css';

const asset = '/brand/driver-balance';

export default function DriverWorkBalanceAlert({ minimumCents, onClose }: {
  minimumCents: number;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const goTo = (destination: 'earnings' | 'top-up') => {
    onClose();
    if (destination === 'earnings') navigate('/driver/dashboard', { state: { openEarnings: true } });
    else navigate('/driver/deposit');
  };

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent data-figma-node="1342:140" className="max-h-[95dvh] max-w-[440px] gap-0 overflow-y-auto rounded-[22px] bg-[#f4f5f7] p-0 font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <header className="flex items-center gap-2 bg-white px-[18px] py-5 pr-12">
        <DialogTitle className="flex-1 text-xl font-bold">Work Balance Alert</DialogTitle>
        <img src={asset + '/IconAlertTriangle.svg'} alt="" />
      </header>
      <div className="space-y-5 p-[18px]">
        <section className="flex items-center gap-3 rounded-[20px] border-t-[7px] border-[#161118] bg-primary p-5 text-white">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white"><img src={asset + '/IconWarning.svg'} alt="" /></span>
          <h2 className="text-xl font-bold">Your Work Balance is Low</h2>
        </section>
        <section>
          <h2 className="text-lg font-bold">What happens next?</h2>
          <DialogDescription className="mt-2 text-xs leading-5 text-[#667080]">Add funds before going online to receive requests. Check your available balance in the PIN-protected Wallet.</DialogDescription>
        </section>
        <section className={`flex items-start gap-3 ${walletPanel}`}>
          <img src={asset + '/IconShieldAlert.svg'} alt="" />
          <div><h2 className="text-sm font-semibold">Online eligibility</h2><p className="mt-2 text-xs">Minimum required balance: USD {(minimumCents / 100).toFixed(2)}</p></div>
        </section>
        <section className={`flex items-start gap-3 ${walletPanel}`}>
          <img src={asset + '/IconWalletPlus.svg'} alt="" />
          <div><h2 className="text-sm font-semibold">Add funds to keep working</h2><p className="mt-2 text-xs text-[#667080]">Your balance updates after payment confirmation.</p></div>
        </section>
      </div>
      <footer className="grid grid-cols-2 gap-2 bg-white px-[18px] pt-3 pb-[max(18px,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => goTo('earnings')} className="min-h-[52px] rounded-[14px] border border-primary px-2 text-sm font-semibold">Return to Earnings</button>
        <button type="button" onClick={() => goTo('top-up')} className="min-h-[52px] rounded-[14px] bg-primary px-2 text-sm font-semibold text-white">Top Up Drive Wallet</button>
      </footer>
    </DialogContent>
  </Dialog>;
}
