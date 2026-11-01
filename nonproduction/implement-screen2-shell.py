from pathlib import Path
ui=Path('nonproduction/approved-ride-ui/src')
def update(name,pairs):
 p=ui/name; raw=p.read_bytes(); s=raw.decode('utf-8-sig').replace('\r\n','\n')
 for old,new in pairs:
  if old not in s:raise ValueError(name+': '+old[:100])
  s=s.replace(old,new,1)
 eol='\r\n' if b'\r\n' in raw else '\n';p.write_bytes(s.replace('\n',eol).encode())
update('App.tsx',[
 ('import PageSkeleton from "./components/PageSkeleton";', 'import PageSkeleton from "./components/PageSkeleton";\nimport BottomNavBar from "./components/BottomNavBar";\nimport { RiderNavigationProvider } from "./components/RiderNavigationProvider";'),
 ('      <ErrorBoundary>\n        <Routes>', '      <ErrorBoundary>\n        <RiderNavigationProvider>\n        <Routes>'),
 ('        </Routes>\n      </ErrorBoundary>', '        </Routes>\n        <BottomNavBar persistent />\n        </RiderNavigationProvider>\n      </ErrorBoundary>')])
update('components/BottomNavBar.tsx',[
 ("import { Home, Clock, User, Car } from 'lucide-react';", "import { Home, Clock, User, Car, ClipboardList, Wallet, CarFront } from 'lucide-react';\nimport { useRiderNavigation } from './RiderNavigationProvider';\nimport { activeRiderTab, riderTabs, showRiderNavigation, type RiderTab } from '@/lib/riderNavigation';\nimport './riderNavigation.css';"),
 ('const BottomNavBar = React.forwardRef', 'const LegacyBottomNavBar = React.forwardRef'),
 ('export default BottomNavBar;', '''const icons = { home: Home, activity: ClipboardList, ride: CarFront, wallet: Wallet, account: User };

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
export default BottomNavBar;''')])
print('Installed one persistent route-driven rider navigation; legacy non-rider navigation retained')
