import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';
import homeIcon from '@/assets/rider-home/nav-home.svg';
import activityIcon from '@/assets/rider-home/nav-activity.svg';
import driveIcon from '@/assets/rider-home/nav-ride.svg';
import walletIcon from '@/assets/rider-home/nav-wallet.svg';
import accountIcon from '@/assets/rider-home/nav-account.svg';

const tabs = [
  { label: 'Home', icon: homeIcon, path: '/ride' },
  { label: 'Activity', icon: activityIcon, path: '/history' },
  { label: 'Drive', icon: driveIcon, path: '/driver' },
  { label: 'Wallet', icon: walletIcon, path: '/wallet' },
  { label: 'Account', icon: accountIcon, path: '/profile' },
];

const pathAliases: Record<string, string[]> = {
  '/history': ['/history', '/ride-history'],
  '/driver': ['/driver'],
  '/profile': ['/profile', '/edit-profile'],
};

const BottomNavBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function BottomNavBar(_props, ref) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMapp = location.pathname.startsWith('/mapp');

  const handleNav = (path: string) => {
    if (path === '/ride') {
      navigate(isMapp ? '/mapp/ride' : '/ride');
      return;
    }
    if (!user) {
      navigate(isMapp ? '/mapp/login' : '/auth');
      return;
    }
    const mappPaths: Record<string, string> = {
      '/history': '/mapp/ride-history',
      '/driver': '/mapp/driver',
      '/wallet': '/mapp/wallet',
      '/profile': '/mapp/profile',
    };
    navigate(isMapp ? mappPaths[path] || path : path);
  };

  const isActive = (path: string) => {
    if (path === '/ride') return location.pathname === '/ride' || location.pathname === '/mapp/ride';
    const aliases = pathAliases[path] || [path];
    return aliases.some(p => location.pathname.startsWith(p) || location.pathname.startsWith(`/mapp${p}`));
  };

  return (
    <nav
      ref={ref}
      aria-label="Rider navigation"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[360px] rounded-[22px] border border-[#e4e7ed] bg-white px-1.5 py-1.5 shadow-[0_5px_16px_#17172124]"
    >
      <div className="flex min-h-12 items-center justify-between gap-0.5">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              type="button"
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                haptic('light');
                handleNav(tab.path);
              }}
              className={cn(
                'relative flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full transition-colors',
                active ? 'flex-1 px-1 text-white sm:gap-2 sm:px-3' : 'text-[#20232a] hover:bg-[#f5f6f9]'
              )}
            >
              {active && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute inset-0 rounded-full bg-primary shadow-[0_0_9px_#ff000d45]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <img src={tab.icon} alt="" className={cn('relative z-10 shrink-0', active ? 'brightness-0 invert' : 'brightness-0')} />
              {active && <span className="relative z-10 text-[11px] font-semibold">{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNavBar;
