import { useEffect, useRef, useState, type ReactNode } from 'react';
import '@/components/driver/driverOnboardingFonts.css';

const assets = '/brand/driver-auth';
export const driverAuthInput = 'h-[55px] rounded-[16px] border-[1.1px] border-[#e3e7ee] bg-white px-4 text-base text-[#1f2129] shadow-none placeholder:text-[#667080]';
export const driverAuthSubmit = 'h-[57px] w-full rounded-[18px] bg-[#ff000d] text-[15px] font-semibold text-white hover:bg-[#ff000d] hover:brightness-95';

/** Shared artwork and content geometry from Driver auth frames 1095:153/1097:106.
 * Only artwork is positioned; fields and error messages stay in document flow. */
export default function DriverAuthFrame({ children, mode, onBack, busy = false, description }: {
  children: ReactNode;
  mode: 'security' | 'methods' | 'otp';
  onBack: () => void;
  busy?: boolean;
  description?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    heading.current?.focus({ preventScroll: true });
  }, [mode]);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => { if (element.clientWidth) setWidth(element.clientWidth); };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  const artwork = { transform: `scaleX(${width / 400})`, transformOrigin: 'top left' };
  const security = mode === 'security';
  const otp = mode === 'otp';
  return (
    <div className="min-h-[100dvh] bg-white">
      <div ref={container} data-figma-node={security ? '1095:153' : otp ? '1093:105' : '1097:106'} className="relative isolate mx-auto min-h-[max(845px,100dvh)] w-full max-w-[440px] overflow-x-clip bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[246px]">
          <img src={`${assets}/hero.png`} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/[.12]" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-[216px] w-[400px]" style={artwork}><img src={`${assets}/red-wave.svg`} alt="" className="block max-w-none" /></div>
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-[237px] w-[400px]" style={artwork}><img src={`${assets}/paper.svg`} alt="" className="block max-w-none" /></div>
        <header className="relative h-[237px]">
          <button type="button" onClick={onBack} disabled={busy} aria-label={security ? 'Back to personal details' : otp ? 'Change number' : 'Back to phone verification'} className="absolute left-[19px] top-[max(27px,env(safe-area-inset-top))] h-[47px] w-[47px] rounded-full bg-white shadow-[0_3px_4px_rgba(0,0,0,.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff000d]">
            <img src={`${assets}/back.svg`} alt="" className="absolute left-[7.5px] top-[10.5px] block max-w-none" />
          </button>
          <span className="absolute right-[18px] top-[max(32px,env(safe-area-inset-top))] flex h-9 w-[148px] items-center gap-2 rounded-full bg-white pl-[11px] text-[10px] font-bold shadow-[0_4px_7px_rgba(0,0,0,.06)]">
            <img src={`${assets}/shield.svg`} alt="" className="block max-w-none" />{security ? 'STEP 2 OF 3' : otp ? 'STEP 3 OF 3' : 'OTP OPTIONS'}
          </span>
          <span aria-hidden="true" className="absolute left-1/2 top-[227px] h-[5px] w-[54px] -translate-x-1/2 rounded-full bg-white" />
        </header>
        <main className="relative px-5 pb-[max(48px,env(safe-area-inset-bottom))] pt-[39px]">
          <h1 ref={heading} tabIndex={-1} className="outline-none px-0.5 text-[26px] font-bold leading-[37px]">{security ? 'Secure your account' : otp ? 'Verify your phone' : 'Choose verification'}</h1>
          <p className="mt-1 min-h-6 px-0.5 text-[12.2px] leading-6 text-[#667080]">{description ?? (security ? 'Add a mobile number and create your password.' : otp ? 'Enter the SMS code sent to your registered phone.' : 'Use another method to verify your phone.')}</p>
          <div className="mt-[18px] flex min-h-[22px] items-center gap-[10px] px-0.5 text-[10.5px] font-semibold">
            <span aria-hidden="true" className="h-1 w-[34px] shrink-0 rounded bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />{security ? 'ACCOUNT SECURITY · STEP 2' : otp ? 'PHONE VERIFICATION' : 'VERIFICATION OPTIONS'}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function DriverVerificationMethods({ countdown, isSending, onSms, onBack }: {
  countdown: number; isSending: boolean; onSms: () => void; onBack: () => void;
}) {
  return (
    <DriverAuthFrame mode="methods" onBack={onBack}>
      <section aria-label="Verification methods">
        <p className="mt-[26px] min-h-[27px] px-0.5 text-[13px] font-medium leading-[27px]">Verify your mobile number by SMS.</p>
        <button type="button" onClick={onSms} disabled={countdown > 0 || isSending} className="mt-[21px] min-h-[90px] w-full rounded-[17px] border-[1.2px] border-[#ffd300] bg-white px-[17px] py-[10px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff000d] disabled:cursor-not-allowed">
          <span className="block min-h-7 text-[15px] font-semibold leading-7">Text message (SMS)</span>
          <span className="mt-1 block min-h-[30px] text-[11.4px] leading-[30px] text-[#667080]">{isSending ? 'Sending your code…' : countdown > 0 ? `You can request a new code in ${countdown}s` : 'Get a new one-time code by text.'}</span>
        </button>
        <div aria-disabled="true" className="mt-[11px] min-h-[90px] rounded-[17px] border-[1.2px] border-[#e3e7ee] bg-white px-[17px] py-[10px]">
          <span className="block min-h-7 text-[15px] font-semibold leading-7">Automated phone call</span>
          <span className="mt-1 block min-h-[30px] text-[11.4px] leading-[30px] text-[#667080]">Currently unavailable. Please use SMS.</span>
        </div>
        <p className="mt-[22px] flex min-h-[45px] items-center px-0.5 text-[10.5px] leading-4 text-[#667080]">Voice call availability depends on SMS/voice provider support.</p>
      </section>
    </DriverAuthFrame>
  );
}
