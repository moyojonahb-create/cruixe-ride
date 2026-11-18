import { useEffect, useRef, useState, type ReactNode } from 'react';
import DriverBottomNav from './DriverBottomNav';
import { NotificationBell } from '@/components/NotificationCenter';
import './driverOnboardingFonts.css';

export interface DriverLifecycleLayoutProps {
  frameId: string;
  map?: ReactNode;
  children: ReactNode;
  onBack: () => void;
  onRecenter?: () => void;
  onNotifications?: () => void;
  notificationsOpen?: boolean;
  unreadCount?: number;
  mapTools?: ReactNode;
  footer?: ReactNode;
  sheetTop?: number;
  contentOffset?: number;
  activeTab?: 'Home' | 'Requests' | 'Drive' | 'Earnings' | 'Account' | null;
  busy?: boolean;
  mapHeight?: number;
}

/** Shared approved Driver trip composition. Map data stays live; no Figma
 * map screenshot is used as the application's routing surface. */
export default function DriverLifecycleLayout({ frameId, map, children, onBack, onRecenter, onNotifications, notificationsOpen = false, unreadCount = 0, mapTools, footer, sheetTop = 322, contentOffset = 30, activeTab = 'Requests', busy = false, mapHeight = 499 }: DriverLifecycleLayoutProps) {
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
  const artStyle = { transform: `scaleX(${width / 400})`, transformOrigin: 'top left' };
  const circle = 'grid h-[45px] w-[45px] place-items-center rounded-full bg-white text-[#1f2129] shadow-[0_3px_8px_rgba(0,0,0,.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff000d] disabled:opacity-60';
  return (
    <div ref={container} data-figma-node={frameId} data-map-screen="true" className={`relative isolate mx-auto flex h-[max(845px,100dvh)] w-full max-w-[440px] flex-col overflow-x-clip font-['Poppins',system-ui,sans-serif] text-[#1f2129] ${map ? 'bg-white' : 'bg-transparent'}`}>
      {map && <div data-lifecycle-map className="absolute inset-x-0 top-0 overflow-hidden" style={{height:mapHeight}}>{map}</div>}
      {mapTools ?? <>
        <div className="absolute left-[17px] top-[max(43px,env(safe-area-inset-top))] z-20 flex gap-[9px]">
          <button type="button" onClick={onBack} disabled={busy} aria-label="Back" className={circle}><img src="/brand/driver-auth/back.svg" alt="" className="block max-w-none" /></button>
          <span aria-hidden="true" className={circle}><img src="/brand/ride/map-location.svg" alt="" className="block max-w-none" /></span>
        </div>
        <div className="absolute right-[18px] top-[max(44px,env(safe-area-inset-top))] z-20">
          {notificationsOpen ? (
            <span className={circle} aria-hidden="true"><img src="/brand/ride/driver-notifications.svg" alt="" /></span>
          ) : onNotifications ? (
            <button type="button" onClick={onNotifications} disabled={busy} aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'} className={`relative ${circle}`}>
              <img src="/brand/ride/driver-notifications.svg" alt="" />
              {unreadCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
          ) : <NotificationBell iconSource="/brand/ride/driver-notifications.svg" className={circle} />}
        </div>
        <button type="button" onClick={onRecenter} disabled={!onRecenter || busy} aria-label="Recenter map" className={`absolute right-4 z-20 ${circle}`} style={{top:sheetTop-89}}><img src="/brand/ride/map-recenter.svg" alt="" className="block max-w-none" /></button>
      </>}
      <div aria-hidden="true" className="pointer-events-none absolute left-0 z-[1] w-[400px]" style={{top:sheetTop-21,...artStyle}}><img src="/brand/driver-lifecycle/red-wave.svg" alt="" className="block max-w-none" /></div>
      <div aria-hidden="true" className="pointer-events-none absolute left-0 z-[2] w-[400px]" style={{top:sheetTop,...artStyle}}><img src="/brand/driver-lifecycle/white-curve.svg" alt="" className="block max-w-none" /></div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[1] bg-white" style={{top:sheetTop+50}} />
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 z-[3] h-[5px] w-14 -translate-x-1/2 rounded-full bg-white" style={{top:sheetTop-5}} />
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 pb-2" style={{marginTop:sheetTop+contentOffset}}>{children}</main>
      <div className="relative z-10 mt-auto pt-2">{footer ?? <DriverBottomNav embedded activeTab={activeTab} disabled={busy} />}</div>
    </div>
  );
}
