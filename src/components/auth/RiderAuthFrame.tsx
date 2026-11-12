import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const brand = '/brand/auth';

export const riderAuthInput =
  'h-12 rounded-xl border-[#dbdee3] bg-[#f8f9fa] pl-12 text-[15px] text-[#1a1b21] shadow-[0_4px_14px_rgba(0,0,0,.13)] placeholder:text-[#6b707d]';

export const riderAuthSubmit =
  'relative min-h-12 w-full rounded-xl bg-[#ff000d] text-base font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,.16)] hover:bg-[#ff000d] hover:brightness-95';

export function AuthFieldIcon({ name }: { name: 'name' | 'email' | 'password' }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 grid w-5 place-items-center">
      <img src={`${brand}/${name}.svg`} alt="" />
    </span>
  );
}

export function AuthForwardIcon() {
  return <img src={`${brand}/forward.svg`} alt="" className="pointer-events-none absolute right-5" />;
}

export function RiderAuthSocial({
  signingUp = false,
  onSelect,
}: {
  signingUp?: boolean;
  onSelect: (provider: 'google' | 'apple') => void;
}) {
  const button = 'flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold shadow-[0_4px_14px_rgba(0,0,0,.16)]';

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-4 text-center text-xs font-semibold text-[#696e7a]">
        <span aria-hidden="true" className="h-px flex-1 bg-[#d7dbe3]" />
        Or sign {signingUp ? 'up' : 'in'} securely with
        <span aria-hidden="true" className="h-px flex-1 bg-[#d7dbe3]" />
      </div>
      <button type="button" className={`${button} border-[#d7dbe3] bg-white text-[#181a1f]`} onClick={() => onSelect('google')}>
        <img src={`${brand}/google.svg`} alt="" />
        Continue with Google
      </button>
      <button type="button" className={`${button} border-[#181a1f] bg-[#181a1f] text-white`} onClick={() => onSelect('apple')}>
        <img src={`${brand}/apple.svg`} alt="" />
        Continue with Apple
      </button>
    </div>
  );
}

export default function RiderAuthFrame({
  children,
  variant = 'login',
}: {
  children: ReactNode;
  variant?: 'login' | 'signup';
}) {
  const signingUp = variant === 'signup';
  return (
    <main className="min-h-[100dvh] bg-[#fffcfb] font-['Inter',system-ui,sans-serif] text-[#1a1b21]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[440px]">
        <div className={`relative overflow-hidden ${signingUp ? 'h-[205px]' : 'h-[261px]'}`}>
          <img
            src={`${brand}/${variant}-hero.webp`}
            alt=""
            fetchPriority="high"
            className={`h-full w-full object-cover ${signingUp ? 'object-[center_44%]' : 'object-[center_28%]'}`}
          />
          <Link
            to="/ride"
            aria-label="Back to rides"
            className="absolute left-2 top-[max(2rem,env(safe-area-inset-top))] grid size-12 place-items-center rounded-full"
          >
            <span className="grid size-8 place-items-center rounded-full bg-[#ff000d]">
              <img src={`${brand}/back.svg`} alt="" />
            </span>
          </Link>
        </div>

        <div className="relative isolate -mt-3">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-16 overflow-hidden">
            {signingUp && <div className="absolute inset-0 rounded-t-[40px] bg-[#ff000d]" />}
            <img
              src={`${brand}/${variant}-panel.svg`}
              alt=""
              className={`absolute inset-x-0 w-full ${signingUp ? 'top-4' : 'top-0'}`}
            />
            {signingUp && <span className="absolute left-1/2 top-3.5 h-[7px] w-[65px] -translate-x-1/2 rounded-full bg-[#d9d9d9]" />}
          </div>
          <div className="px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
