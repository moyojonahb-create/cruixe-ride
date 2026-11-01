import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, User, Car, ClipboardList, Wallet, CarFront } from 'lucide-react';
import { useRiderNavigation } from './RiderNavigationProvider';
import { activeRiderTab, riderTabs, showRiderNavigation } from '@/lib/riderNavigation';
import './riderNavigation.css';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';

const tabs = [
  { label: 'Home', icon: Home, path: '/ride' },
  { label: 'Trips', icon: Clock, path: '/history' },
  { label: 'Drive', icon: Car, path: '/driver' },
  { label: 'Profile', icon: User, path: '/profile' },
];

const pathAliases: Record<string, string[]> = {
  '/history': ['/history'],
  '/driver': ['/driver'],
  '/profile': ['/profile', '/edit-profile'],
};

const LegacyBottomNavBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function BottomNavBar(_props, ref) {
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => {
                haptic('light');
                handleNav(tab.path);
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all relative',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon className={cn('h-5 w-5 relative z-10', active && 'stroke-[2.5px]')} />
              <span className={cn('text-[10px] font-medium relative z-10', active && 'font-bold')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

const icons = { home: Home, activity: ClipboardList, ride: CarFront, wallet: Wallet, account: User };

function FloatingRiderNavigation({ forwardedRef }: { forwardedRef: React.ForwardedRef<HTMLDivElement> }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = activeRiderTab(location.pathname, location.search);
  const visible = showRiderNavigation(location.pathname, location.search);
  const [homeExit, setHomeExit] = React.useState(false);
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  React.useEffect(() => {
    if (!homeExit) return;
    const timer = window.setTimeout(() => setHomeExit(false), 260);
    return () => window.clearTimeout(timer);
  }, [homeExit]);
  React.useEffect(() => {
    const viewport = window.visualViewport;
    const measure = () => {
      const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
      setKeyboardOpen(Boolean(editing && viewport && window.innerHeight - viewport.height > 150));
    };
    viewport?.addEventListener('resize', measure);
    document.addEventListener('focusin', measure);
    document.addEventListener('focusout', measure);
    return () => {
      viewport?.removeEventListener('resize', measure);
      document.removeEventListener('focusin', measure);
      document.removeEventListener('focusout', measure);
    };
  }, []);
  return (
    <nav ref={forwardedRef} aria-label="Rider navigation"
      hidden={(!visible && !(homeExit && active === 'home')) || keyboardOpen}
      className={cn('rider-navigation', homeExit && active === 'home' && 'rider-navigation--home-exit')}
      data-active-tab={active ?? undefined}>
      <div className="rider-navigation__card">
        {riderTabs.map(tab => {
          const Icon = icons[tab.id];
          const selected = active === tab.id;
          return <button key={tab.id} type="button" className="rider-navigation__tab"
            aria-label={tab.label} aria-current={selected ? 'page' : undefined}
            data-selected={selected ? 'true' : 'false'}
            onClick={() => {
              if (selected) return;
              haptic('light');
              if (tab.id === 'home') setHomeExit(true);
              // Destination pages retain their existing AuthGuard. Never bypass it here.
              navigate(tab.path);
            }}>
            <span className="rider-navigation__icon" aria-hidden="true"><Icon strokeWidth={1.8} /></span>
            <span className="rider-navigation__label" aria-hidden="true">{tab.label}</span>
          </button>;
        })}
      </div>
    </nav>
  );
}

/** The app owns one persistent bar; legacy callers on rider pages become no-ops. */
const BottomNavBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { persistent?: boolean }>(function BottomNavBar({ persistent = false, ...props }, ref) {
  const { managed } = useRiderNavigation();
  const location = useLocation();
  if (persistent) return <FloatingRiderNavigation forwardedRef={ref} />;
  if (managed && activeRiderTab(location.pathname, location.search)) return null;
  return <LegacyBottomNavBar {...props} ref={ref} />;
});
export default BottomNavBar;
