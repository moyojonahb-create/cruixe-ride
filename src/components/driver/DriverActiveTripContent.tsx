import { useEffect, useRef, useState } from 'react';
import { formatWaitingLabel, useMinutesSince } from '@/hooks/useMinutesSince';
import './driverOnboardingFonts.css';

const assets = '/brand/driver-lifecycle';
const button = 'min-h-[49px] w-full rounded-[16px] bg-[#ff000d] px-4 text-[15px] font-semibold text-white disabled:opacity-50';

function Artwork({ name, width = 360 }: { name: string; width?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setScale(element.clientWidth / width);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure); observer?.observe(element);
    return () => observer?.disconnect();
  }, [width]);
  return <div ref={container} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"><div style={{ transform: `scaleX(${scale})`, transformOrigin: 'top left', width }}><img src={`${assets}/${name}.svg`} alt="" className="block max-w-none" /></div></div>;
}

function Rider({ name, avatar, count, note, onboard = false, tall = false }: { name: string; avatar?: string | null; count: number | null; note?: string | null; onboard?: boolean; tall?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('');
  return <div className={`relative flex items-center gap-3 rounded-[17px] border border-[#e9eaf0] bg-white px-3 py-[10px]`} style={{ minHeight: tall ? 104 : onboard ? 64 : 74 }}>
    {!onboard && <Artwork name={tall ? 'arrived-rider-stroke' : 'accepted-rider-stroke'} />}
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full ${onboard ? 'h-[52px] w-[52px] bg-[#fff1f2]' : tall ? 'h-[54px] w-[54px] bg-[#ffe7e9]' : 'h-12 w-12 bg-[#ffe7e9]'} text-[15px] font-bold`}>
      {onboard ? <img src={`${assets}/onboard-check.svg`} alt="" className="block max-w-none" /> : avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
    <div className="relative min-w-0 flex-1">
      <p className={`${onboard ? 'text-[17px]' : tall ? 'text-[16px]' : 'text-[15px]'} break-words font-bold leading-6`}>{name}</p>
      <p className="mt-1 break-words text-[10.5px] leading-4 text-[#667085]">{count == null ? 'Passenger count unavailable' : `${count} passenger${count === 1 ? '' : 's'}`}{onboard ? ' · Ready for departure' : note ? ` · ${note}` : ''}</p>
    </div>
  </div>;
}

function ContactActions({ onCall, onMessage, callDisabled, unreadMessages = 0 }: { unreadMessages?: number; onCall: () => void; onMessage: () => void; callDisabled: boolean }) {
  return <div className="grid grid-cols-2 gap-[11px]">
    <button type="button" onClick={onCall} disabled={callDisabled} className="flex min-h-[48px] items-center justify-center gap-3 rounded-[13px] bg-[#f4f5f8] text-[13px] font-semibold disabled:opacity-50"><img src={`${assets}/navigation-call.svg`} alt="" className="block max-w-none" />Call</button>
    <button type="button" onClick={onMessage} className="flex min-h-[48px] items-center justify-center gap-3 rounded-[13px] bg-[#f4f5f8] text-[13px] font-semibold"><img src={`${assets}/navigation-message.svg`} alt="" className="block max-w-none" />Message{unreadMessages > 0 && <span className="rounded-full bg-[#ff000d] px-2 text-white">{unreadMessages}</span>}</button>
  </div>;
}

export interface DriverActiveTripContentProps {
  phase: 'accepted' | 'arrived' | 'onboard';
  passengerName: string;
  avatarUrl?: string | null;
  passengerCount: number | null;
  pickup: string;
  destination: string;
  fare: number;
  paymentMethod: string;
  riderNote?: string | null;
  arrivedAt?: string | null;
  busy: boolean;
  callDisabled: boolean;
  unreadMessages?: number;
  onNavigate: () => void;
  onOnboard: () => void;
  onStart: () => void;
  onBackToWaiting: () => void;
  onNoShow: () => void;
  onCall: () => void;
  onMessage: () => void;
  onCancel: () => void;
  onSafety: () => void;
}

export default function DriverActiveTripContent(props: DriverActiveTripContentProps) {
  const { phase, passengerName, pickup, destination, fare, paymentMethod, busy } = props;
  const waitingMinutes = useMinutesSince(props.arrivedAt);
  return <section className="pb-3 pt-2 font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex min-h-6 items-center rounded-full bg-[#fff2f3] px-5 text-[10px] font-semibold">{phase === 'accepted' ? 'OFFER ACCEPTED' : phase === 'arrived' ? 'ARRIVED AT PICKUP' : 'RIDER ONBOARD'}</span>
      {phase === 'arrived' && <button type="button" onClick={props.onNoShow} disabled={busy} className="min-h-11 rounded-full bg-[#f4f5f8] px-4 text-[10px] font-semibold">Can't find rider?</button>}
    </div>
    <h1 className={`mt-2 min-h-[41px] ${phase === 'arrived' ? 'text-[24px]' : 'text-[21.4px]'} font-bold leading-[1.7]`}>{phase === 'accepted' ? 'Your offer was accepted' : phase === 'arrived' ? "You've arrived" : 'Passenger onboard'}</h1>
    <div className="flex min-h-6 items-center justify-between gap-3">
      <p className="min-w-0 break-words text-[11.6px] leading-5 text-[#667085]">{phase === 'accepted' ? `${passengerName} confirmed your offer.` : phase === 'arrived' ? `Waiting for ${passengerName} at ${pickup}.` : 'Confirm every passenger is safely seated.'}</p>
      {phase === 'accepted' && <span className="rounded-full bg-[#1f2129] px-5 py-1 text-[14px] font-bold text-white">${fare.toFixed(2)}</span>}
    </div>
    {phase === 'accepted' ? <>
      <div className="relative mt-[11px] min-h-[99px] rounded-[17px] border border-[#e9edf2] bg-white py-[9px] pl-[46px] pr-4">
        <Artwork name="accepted-route-stroke" />
        <div aria-hidden="true" className="absolute left-[13px] top-[16px]"><img src={`${assets}/route-connector.svg`} alt="" className="block max-w-none" /></div>
        <img aria-hidden="true" src={`${assets}/route-pickup.svg`} alt="" className="absolute left-[13px] top-[17px] block max-w-none" />
        <img aria-hidden="true" src={`${assets}/route-destination.svg`} alt="" className="absolute left-[13px] top-[60px] block max-w-none" />
        <p className="relative text-[9px] font-semibold text-[#647080]">PICKUP</p><p className="relative break-words text-[15px] font-bold leading-6">{pickup}</p>
        <p className="relative mt-[5px] text-[9px] font-semibold text-[#647080]">DROP-OFF</p><p className="relative break-words text-[14.5px] font-bold leading-6">{destination}</p>
      </div>
      <div className="mt-2"><Rider name={passengerName} avatar={props.avatarUrl} count={props.passengerCount} note={props.riderNote} /></div>
      <p className="my-[9px] text-[11.5px] leading-[22px] text-[#667085]">Arrive at the agreed pickup point.</p>
      <button type="button" onClick={props.onNavigate} disabled={busy} className={button}>Navigate to pickup</button>
    </> : phase === 'arrived' ? <>
      <div className="mt-3"><Rider name={passengerName} avatar={props.avatarUrl} count={props.passengerCount} note={props.riderNote || pickup} tall /></div>
      <div className="relative mt-2 min-h-[49px] rounded-[17px] border border-[#ffe69b] bg-[#1f2129] px-[14px] py-1 text-white">
        <Artwork name="arrived-wait-stroke" />
        <p className="relative text-[13px] font-semibold leading-[23px]">Waiting for {passengerName}</p>
        <p className="relative text-[9.5px] leading-[19px]">{props.arrivedAt ? formatWaitingLabel(waitingMinutes) : 'Waiting timer will update after server confirmation.'}</p>
      </div>
      <div className="mt-[11px]"><ContactActions onCall={props.onCall} onMessage={props.onMessage} callDisabled={props.callDisabled} unreadMessages={props.unreadMessages} /></div>
      <button type="button" onClick={props.onOnboard} disabled={busy} className={`${button} mt-[6px]`}>Passenger onboard · Continue</button>
    </> : <>
      <div className="mt-2"><Rider name={passengerName} count={props.passengerCount} onboard /></div>
      <div className="mt-[10px] min-h-[69px] rounded-[15px] border border-[#e7eaf0] bg-white px-[14px] py-[8px]"><p className="text-[9.7px] font-bold text-[#667085]">DESTINATION</p><p className="mt-1 break-words text-[17px] font-bold leading-6">{destination}</p></div>
      <div className="mt-[9px] flex min-h-[43px] items-center rounded-[13px] bg-[#1f2129] px-[13px] text-[12px] font-semibold text-white">Agreed fare · {paymentMethod || 'Payment pending'} · ${fare.toFixed(2)}</div>
      <p className="my-[8px] text-[10.7px] leading-5 text-[#667085]">Only start after every passenger is safely seated.</p>
      <button type="button" onClick={props.onStart} disabled={busy} className={button}>{busy ? 'Starting trip…' : 'Start trip'}</button>
      <button type="button" onClick={props.onBackToWaiting} disabled={busy} className="mt-2 min-h-11 w-full text-[12px] font-semibold">Back to waiting</button>
    </>}
    <div className="mt-3 flex flex-wrap gap-x-5 text-[11px] font-semibold">
      <button type="button" onClick={props.onSafety} className="min-h-11">Safety</button>
      {phase !== 'onboard' && <button type="button" onClick={props.onCancel} disabled={busy} className="min-h-11">Cancel ride</button>}
    </div>
  </section>;
}

export function DriverNavigationDock({ destinationPhase, passengerName, address, etaMinutes, distanceKm, paymentMethod, busy, callDisabled, unreadMessages, onCall, onMessage, onArrive, onSafety, onDestination, onCancel }: {
  destinationPhase: boolean; passengerName: string; address: string; etaMinutes: number | null; distanceKm: number | null; paymentMethod: string;
  busy: boolean; callDisabled: boolean; unreadMessages?: number; onCall: () => void; onMessage: () => void; onArrive: () => void; onSafety: () => void; onDestination: () => void; onCancel: () => void;
}) {
  return <section data-figma-node={destinationPhase ? '1182:281' : '1153:165'} className="absolute inset-x-0 bottom-0 z-20 max-h-[55dvh] overflow-y-auto rounded-t-[27px] bg-white px-5 pb-[max(13px,env(safe-area-inset-bottom))] pt-[22px] font-['Poppins',system-ui,sans-serif] text-[#1f2129] shadow-[0_-8px_15px_rgba(0,0,0,.14)]">
    <Artwork name="navigation-dock-stroke" width={400} />
    <span aria-hidden="true" className="absolute left-1/2 top-[9px] h-[5px] w-[52px] -translate-x-1/2 rounded-full bg-[#d0d5dd]" />
    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1"><p className="text-[10.2px] font-bold leading-[18px] text-[#667085]">{destinationPhase ? 'EN ROUTE TO DESTINATION' : `PICKING UP ${passengerName.toUpperCase()}`}</p><h1 className="mt-1 break-words text-[16px] font-bold leading-7">{address}</h1></div>
      <span className="flex min-h-[34px] min-w-[89px] items-center justify-center rounded-full bg-[#fff2f3] px-2 text-[13.7px] font-bold">{etaMinutes == null ? 'ETA pending' : `${etaMinutes} min`}</span>
    </div>
    <p className="relative min-h-5 text-[12.2px] font-semibold">{distanceKm == null ? 'Waiting for GPS' : `${distanceKm.toFixed(1)} km left`}</p>
    {destinationPhase ? <>
      <p className="relative mt-[6px] flex min-h-9 items-center rounded-xl bg-[#f3f4f7] px-3 text-[11px] font-semibold">TRIP ACTIVE · {paymentMethod ? `${paymentMethod.toUpperCase()} FARE` : 'PAYMENT PENDING'}</p>
      <div className="relative mt-[9px] grid grid-cols-[2fr_3fr] gap-[10px]"><button type="button" onClick={onSafety} className="min-h-11 rounded-[13px] bg-[#1f2129] text-[12px] font-semibold text-white">Safety</button><button type="button" onClick={onDestination} disabled={busy} className="min-h-11 rounded-[13px] bg-[#ff000d] px-2 text-[11.5px] font-bold text-white">Destination reached</button></div>
    </> : <>
      <div className="relative mt-[10px]"><ContactActions onCall={onCall} onMessage={onMessage} callDisabled={callDisabled} unreadMessages={unreadMessages} /></div>
      <button type="button" disabled={busy} onClick={onArrive} className={`${button} relative mt-2`}>{busy ? 'Confirming arrival…' : "I've arrived"}</button>
      <div className="relative mt-1 flex gap-5 text-[11px] font-semibold"><button type="button" onClick={onSafety} className="min-h-11">Safety</button><button type="button" onClick={onCancel} disabled={busy} className="min-h-11">Cancel ride</button></div>
    </>}
  </section>;
}
