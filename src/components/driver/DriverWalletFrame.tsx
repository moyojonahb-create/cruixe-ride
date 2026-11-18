import type { ReactNode } from 'react';
import './driverOnboardingFonts.css';

export const walletPanel = 'rounded-[18px] bg-white p-4';
export const walletAction = 'flex min-h-12 w-full items-center justify-center rounded-[14px] bg-primary px-3 text-center text-sm font-semibold text-white disabled:opacity-60';

export default function DriverWalletFrame({ frame, title, onBack, children, footer }: {
  frame: string;
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return <main data-figma-node={frame} className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col bg-[#f2f3f5] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <header className="flex items-center gap-3 bg-white px-[18px] pb-3 pt-[max(38px,env(safe-area-inset-top))]">
      <button type="button" onClick={onBack} className="grid size-11 shrink-0 place-items-center rounded-full bg-white shadow-md" aria-label="Back"><img src="/brand/driver-hub/BackArrow.svg" alt="" /></button>
      <h1 className="flex-1 text-[20px] font-bold">{title}</h1>
      <img src="/brand/driver-hub/IconEarningsLock.svg" alt="" />
    </header>
    <div className="flex-1 space-y-4 p-[18px]">{children}</div>
    {footer && <footer className="sticky bottom-0 bg-white px-[18px] pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">{footer}</footer>}
  </main>;
}
