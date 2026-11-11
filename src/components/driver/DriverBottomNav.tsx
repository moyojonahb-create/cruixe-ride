import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

const tabs = [
  { label: 'Home', asset: 'driver-home.svg', path: '/driver/requests?view=home' },
  { label: 'Requests', asset: 'driver-requests.svg', path: '/driver/requests' },
  { label: 'Drive', asset: 'driver-drive.svg', path: '/driver/requests?view=drive' },
  { label: 'Earnings', asset: 'driver-earnings.svg', path: '/driver/dashboard', state: { openEarnings: true } },
  { label: 'Account', asset: 'driver-account.svg', path: '/driver/profile' },
] as const;

type DriverTab = (typeof tabs)[number]['label'];

interface DriverBottomNavProps {
  requestBadgeCount?: number;
  activeTab?: DriverTab;
  embedded?: boolean;
  disabled?: boolean;
}

export default function DriverBottomNav({
  requestBadgeCount = 0,
  activeTab,
  embedded = false,
  disabled = false,
}: DriverBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const view = new URLSearchParams(location.search).get('view');

  const currentTab = activeTab ?? (
    location.pathname === '/driver/profile' ? 'Account' :
    location.pathname === '/driver/dashboard' && location.state?.openEarnings ? 'Earnings' :
    location.pathname === '/driver/trips' || view === 'drive' ? 'Drive' :
    view === 'home' || view === 'waiting' ? 'Home' : 'Requests'
  );

  return (
    <nav
      aria-label="Driver navigation"
      className={cn(
        'mx-auto w-full max-w-[480px] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-2',
        !embedded && 'fixed inset-x-0 bottom-0 z-50'
      )}
    >
      <div className="flex h-[61px] items-center justify-center gap-1 rounded-full border border-[#e4e7ed] bg-white px-2 shadow-[0_5px_9px_rgba(23,23,33,0.14)]">
        {tabs.map((tab) => {
          const active = currentTab === tab.label;
          return (
            <button
              key={tab.label}
              type="button"
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              disabled={disabled}
              onClick={() => {
                haptic('light');
                navigate(tab.path, 'state' in tab ? { state: tab.state } : undefined);
              }}
              className={cn(
                'relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2 text-[#1f2129] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                active && 'min-w-0 max-w-[116px] flex-1 bg-primary text-primary-foreground shadow-[0_0_7px_rgba(255,0,13,0.27)]'
              )}
            >
              <span
                aria-hidden="true"
                className="block size-5 shrink-0 bg-current"
                style={{
                  mask: `url('/brand/ride/${tab.asset}') center / contain no-repeat`,
                  WebkitMask: `url('/brand/ride/${tab.asset}') center / contain no-repeat`,
                }}
              />
              {active && <span className="truncate text-[11px] font-semibold">{tab.label}</span>}
              {tab.label === 'Requests' && requestBadgeCount > 0 && (
                <span
                  className={cn(
                    'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                    active ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'
                  )}
                >
                  {requestBadgeCount > 9 ? '9+' : requestBadgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
