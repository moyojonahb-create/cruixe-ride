import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import AuthModalWrapper from '@/components/auth/AuthModalWrapper';

const brand = '/brand/driver-welcome';
const benefits = [
  { icon: 'safety', title: 'Safety built in', description: 'Verification and in-trip support.', delay: 0.10 },
  { icon: 'fares', title: 'Transparent fares', description: 'Review the fare before accepting a trip.', delay: 0.18 },
  { icon: 'schedule', title: 'Flexible work', description: 'Choose when you go online.', delay: 0.26 },
];

const actionClass = 'grid min-h-14 flex-1 place-items-center rounded-[19px] px-2 text-center text-sm font-semibold';

export default function DriverModeLanding() {
  const { user } = useAuth();
  const { isApproved, isDriver } = useDriverStatus();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleDriverAction = () => {
    if (isDriver && isApproved) {
      navigate('/driver/requests?view=home');
      return;
    }
    navigate(isDriver ? '/driver/application' : '/driver/register');
  };

  return (
    <main className="min-h-[100dvh] bg-[#fdfdfd] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col">
        <div className="relative h-[229px] shrink-0 overflow-hidden">
          <img src={`${brand}/hero.webp`} alt="" fetchPriority="high" className="h-full w-full object-cover object-[center_40%]" />
          <Link to="/ride" aria-label="Back to rides" className="absolute left-2 top-[max(1.5rem,env(safe-area-inset-top))] grid size-12 place-items-center rounded-full">
            <span className="grid size-8 place-items-center rounded-full bg-[#ff000d]">
              <img src="/brand/auth/back.svg" alt="" />
            </span>
          </Link>
        </div>

        <section className="relative isolate -mt-3 flex flex-1 flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-16 overflow-hidden" aria-hidden="true">
            <img src={`${brand}/red-wave.svg`} alt="" className="absolute inset-x-0 top-0 w-full" />
            <img src={`${brand}/paper.svg`} alt="" className="absolute inset-x-0 top-[21px] w-full" />
            <span className="absolute left-1/2 top-[11px] h-[5px] w-[54px] -translate-x-1/2 rounded-full bg-white" />
          </div>

          <h1 className="text-[21px] font-bold">Welcome to CruiXe Driver</h1>
          <p className="mt-1.5 text-[12.5px] text-[#68717f]">Work on your schedule. Earn with confidence.</p>
          <p className="mb-4 mt-6 flex items-center gap-2.5 text-[11px] font-semibold">
            <span className="h-1 w-[34px] rounded-full bg-[#ff000d]" aria-hidden="true" />
            WHY DRIVE WITH CRUIXE
          </p>

          <ul className="space-y-3">
            {benefits.map(({ icon, title, description, delay }) => (
              <motion.li key={icon}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay, duration: 0.26, ease: 'easeOut' }}
                className="relative isolate flex min-h-20 items-center gap-3.5 overflow-hidden rounded-[20px] border border-[#e5e8ed] bg-white px-3.5 py-3 shadow-[0_5px_8px_rgba(26,31,46,.09)]"
              >
                <img src={`${brand}/${icon === 'safety' ? 'safety-outline' : 'card-outline'}.svg`} alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
                <span className={`grid size-12 shrink-0 place-items-center rounded-[16px] ${icon === 'safety' ? 'bg-[#ff000d]' : 'bg-[#f0f1f3]'}`}>
                  <img src={`${brand}/${icon}.svg`} alt="" />
                </span>
                <div>
                  <h2 className="text-[14.5px] font-semibold">{title}</h2>
                  <p className="mt-1.5 text-xs text-[#636a77]">{description}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <div className="mt-auto pt-10">
            <div className="flex gap-3">
              {user ? (
                <button type="button" onClick={handleDriverAction} className={`${actionClass} bg-[#ff000d] text-white`}>
                  {isDriver && isApproved ? 'Let’s drive' : isDriver ? 'View application' : 'Register to drive'}
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }} className={`${actionClass} border border-[#ff000d] bg-white text-[#111]`}>Sign in</button>
                  <Link to="/signup?next=%2Fdriver%2Fregister" className={`${actionClass} bg-[#ff000d] text-white`}>Create account</Link>
                </>
              )}
            </div>
            <p className="mt-2.5 text-center text-xs text-[#68717f]">Your time. Your vehicle. Your journey.</p>
          </div>
        </section>
      </div>

      <AuthModalWrapper
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        onSwitchMode={() => setAuthMode((mode) => mode === 'login' ? 'signup' : 'login')}
      />
    </main>
  );
}
