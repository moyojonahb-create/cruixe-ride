import { useEffect, useRef, type ReactNode } from 'react';
import './driverOnboardingFonts.css';

export interface DriverExceptionLayoutProps {
  frameId?: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
  rows: Array<{ label: string; value: ReactNode }>;
  notice?: string;
  onBack: () => void;
  onProfile: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  navigationDisabled?: boolean;
  children?: ReactNode;
}

/** Shared composition for Driver exception frames1373:374–491.
 * Native/browser status UI owns the clock and signal indicators. */
export default function DriverExceptionLayout(props: DriverExceptionLayoutProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    heading.current?.closest('[data-exception-scroll]')?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [props.frameId]);
  return (
    <div data-figma-node={props.frameId} className="mx-auto flex min-h-[max(845px,100dvh)] w-full max-w-[440px] flex-col bg-[#fcfbf9] font-['Poppins',system-ui,sans-serif] text-[#262933]">
      <header className="relative flex min-h-[100px] items-start gap-[7px] bg-white px-[15px] pb-[9px] pt-[max(44px,env(safe-area-inset-top))]">
        <button type="button" onClick={props.onBack} disabled={props.navigationDisabled} aria-label="Back" className="relative h-[47px] w-[47px] shrink-0 rounded-full bg-white shadow-[0_3px_4px_rgba(0,0,0,.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff000d]">
          <img src="/brand/driver-auth/back.svg" alt="" className="absolute left-[7.5px] top-[10.5px] block max-w-none" />
        </button>
        <h1 ref={heading} tabIndex={-1} className="min-w-0 flex-1 text-[18px] font-bold leading-[27px] outline-none">{props.title}</h1>
        <span aria-hidden="true" className="mr-[6px] mt-[5px] h-[26px] w-[26px] shrink-0 rounded-[11px] bg-[#ff000d]" />
      </header>
      <main className="flex-1 px-[18px] pb-8 pt-3">
        <section className="relative isolate min-h-[86px] rounded-[17px] bg-[#ff000d] shadow-[0_-7px_0_#161118]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[17px]"><span className="absolute -right-3 -top-2 h-[90px] w-[90px] rounded-full bg-[#161118]/[.17]" /></div>
          <div className="relative pb-[5px] pl-[min(20vw,81px)] pr-4 pt-[13px]">
            <h2 className="min-h-[39px] text-[16px] font-bold leading-6 text-white">{props.heroTitle}</h2>
            <p className="min-h-[29px] text-[10.5px] leading-4 text-white">{props.heroDescription}</p>
          </div>
        </section>
        <h2 className="mb-3 mt-[30px] min-h-8 px-[3px] text-[17px] font-bold leading-8">Status overview</h2>
        <dl className="rounded-[17px] border border-[#e3e5eb] bg-white px-3 pt-[11px] pb-[9px] shadow-[-5px_0_0_#161118]">
          {props.rows.map(({ label, value }, index) => <div key={label} className={`${index ? 'mt-[7px] border-t border-[#e3e5eb] pt-[7px]' : ''} relative min-h-[76px] px-4 pb-[6px] pt-[6px]`}>
            <span aria-hidden="true" className="absolute left-0 top-[14px] h-[37px] w-1 rounded-[3px] bg-[#ff000d]" />
            <dt className="min-h-[26px] text-[12px] font-semibold leading-[18px]">{label}</dt>
            <dd className="min-h-[38px] break-words text-[11px] leading-[17px] text-[#737a87]">{value}</dd>
          </div>)}
        </dl>
        <p className="mt-[25px] min-h-[78px] rounded-[16px] bg-white px-[18px] py-[13px] text-[10.5px] leading-4 shadow-[-6px_6px_0_#1a1c24]">{props.notice ?? 'Live values, payment approvals and account status must be confirmed by the platform before taking action.'}</p>
        {props.children}
      </main>
      <footer className="grid min-h-[94px] grid-cols-2 gap-[10px] bg-white px-[18px] pb-[max(28px,env(safe-area-inset-bottom))] pt-[14px]">
        <button type="button" onClick={props.onProfile} disabled={props.navigationDisabled} className="min-h-[52px] rounded-[14px] border-[1.5px] border-[#ff000d] bg-white px-1 text-[14px] font-semibold text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff000d]">Back to Profile</button>
        <button type="button" onClick={props.onPrimary} disabled={props.primaryDisabled} className="min-h-[52px] rounded-[14px] bg-[#ff000d] px-1 text-[14px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#262933] disabled:opacity-60">{props.primaryLabel}</button>
      </footer>
    </div>
  );
}
