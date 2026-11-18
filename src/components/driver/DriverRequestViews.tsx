import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { EnrichedRideRequest } from '@/lib/driverRideRequests';

const assets = '/brand/driver-requests';
const primary = 'min-h-11 rounded-[14px] bg-[#ff000d] px-3 text-[15px] font-semibold text-white disabled:opacity-50';

/** The empty and populated states share the same approved Requests composition. */
export function DriverRequestsBody({ loading, hasRequests, online, kind, onKindChange, children }: {
  loading: boolean; hasRequests: boolean; online: boolean; kind: 'ride' | 'parcel' | null;
  onKindChange: (kind: 'ride' | 'parcel') => void; children?: ReactNode;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const node = card.current; if (!node) return;
    const measure = () => setWidth(node.clientWidth || 360); measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(node); return () => observer?.disconnect();
  }, []);
  return <>
    <h1 className="min-h-[30px] px-0.5 text-[21px] font-bold leading-[30px]">Ride requests</h1>
    <p className="mt-[3px] flex min-h-10 items-center px-0.5 text-[11px] leading-[17px] text-[#667080]">Requests arrive here when you’re online and approved.</p>
    {loading ? <div role="status" aria-label="Loading requests" className="mt-2 h-[88px] animate-pulse rounded-[17px] bg-[#f5f6f8]" /> : !hasRequests ? <div ref={card} className="relative mt-2 min-h-[88px] overflow-hidden rounded-[17px] bg-[#f5f6f8]">
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-[360px]" style={{ transform: `scaleX(${width / 360})`, transformOrigin: 'top left' }}><img src={`${assets}/empty-accent.svg`} alt="" className="block max-w-none" /></div>
      <div className="relative px-4 pb-2 pt-[15px]"><h2 className="min-h-[34px] text-[16px] font-semibold leading-[24px]">No active requests</h2><p className="mt-1 text-[11px] leading-[17px] text-[#667080]">{online ? 'New bookings will appear here.' : 'Go online on Home to receive offers.'}</p></div>
    </div> : <div className="mt-2 space-y-3">{children}</div>}
    <div className="mt-[18px] flex gap-3">
      {(['ride', 'parcel'] as const).map(value => <button key={value} type="button" aria-pressed={kind === value} onClick={() => onKindChange(value)} className={`min-h-11 rounded-[14px] px-3 text-[15px] font-semibold disabled:opacity-50 min-w-0 flex-1 border-[1.6px] border-[#ff000d] ${kind === value ? 'bg-[#ff000d] text-white' : 'bg-white text-[#111]'}`}>{value === 'ride' ? 'Ride request' : 'Parcel request'}</button>)}
    </div>
  </>;
}

function useRequestExpiry(expiresAt?: string | null) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { if (!expiresAt) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [expiresAt]);
  const expiry = expiresAt ? new Date(expiresAt).getTime() : NaN;
  return Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / 1000)) : null;
}

export function DriverOfferBody({ ride, busy, note, onNoteChange, onSkip, trustText }: {
  ride: EnrichedRideRequest; busy: boolean; note: string; onNoteChange: (value: string) => void;
  onSkip: () => void; trustText?: string | null;
}) {
  const [luggageOpen, setLuggageOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const route = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const seconds = useRequestExpiry(ride.expires_at);
  useEffect(() => {
    const node = route.current; if (!node) return;
    const measure = () => setWidth(node.clientWidth || 360); measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure); observer?.observe(node); return () => observer?.disconnect();
  }, []);
  const preferences = [ride.preferences?.quiet_ride && 'Quiet ride', ride.preferences?.cool_temperature && 'Cool temperature', ride.preferences?.wav_required && 'Wheelchair accessible', ride.preferences?.hearing_impaired && 'Hearing impaired'].filter(Boolean);
  const name = ride.passenger_display_name || 'Rider';
  return <>
    <div className="flex min-h-[25px] items-center justify-between gap-2">
      <p className="text-[10.5px] font-semibold text-[#6b7280]">{(ride.vehicle_type || 'economy').toUpperCase()} REQUEST</p>
      <span className="flex min-h-[25px] shrink-0 items-center gap-2 rounded-[13px] bg-[#f5f6f8] px-2 text-[10.5px] font-semibold"><img src={`${assets}/clock.svg`} alt="" className="block max-w-none" />{seconds === null ? 'Request active' : seconds > 0 ? `${seconds}s left` : 'Expired'}</span>
    </div>
    <h1 className="min-h-[38px] text-[22px] font-bold leading-[38px]">New ride request</h1>
    <div className="flex min-h-[25px] items-center justify-between gap-2">
      <p className="min-w-0 break-words text-[11.5px] font-medium text-[#6b7280]">{name}{ride.passenger_count != null ? ` · ${ride.passenger_count} passenger${ride.passenger_count === 1 ? '' : 's'}` : ''}</p>
      <button type="button" disabled={busy} onClick={onSkip} className="min-h-[34px] shrink-0 rounded-[17px] bg-[#1f2129] px-5 text-[11.5px] font-medium text-white disabled:opacity-50">Skip</button>
    </div>
    <div ref={route} className="relative mt-0.5 min-h-[94px] rounded-[17px] border border-[#e9edf2] bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute -left-px -top-px w-[360px]" style={{ transform: `scaleX(${width / 360})`, transformOrigin: 'top left' }}><img src={`${assets}/route-accent.svg`} alt="" className="block max-w-none" /></div>
      <img src={`${assets}/route-markers.svg`} alt="" className="absolute left-3 top-2 block max-w-none" />
      <dl className="relative pb-2 pl-[47px] pr-3 pt-1"><dt className="text-[9px] font-semibold leading-[17px] text-[#667085]">PICKUP</dt><dd className="min-h-[23px] break-words text-[14.5px] font-bold leading-[23px]">{ride.pickup_address}</dd><dt className="mt-1 text-[9px] font-semibold leading-[17px] text-[#667085]">DROP-OFF</dt><dd className="break-words text-[14.2px] font-bold leading-[25px]">{ride.dropoff_address}</dd></dl>
    </div>
    <p className="flex min-h-[25px] items-center px-0.5 text-[10.8px] font-medium text-[#6b7280]">{Number.isFinite(ride.distance_km) ? `${ride.distance_km.toFixed(1)} km` : 'Distance unavailable'} · {Number.isFinite(ride.duration_minutes) ? `${ride.duration_minutes} min estimated trip` : 'Duration unavailable'}</p>
    <div className="flex min-h-10 gap-[14px]">
      <span className="flex min-h-10 min-w-[118px] items-center justify-center gap-2 rounded-[12px] bg-[#161118] px-3 text-[13px] font-semibold text-white"><img src={`${assets}/cash.svg`} alt="" className="block max-w-none" />{ride.payment_method === 'cash' ? 'Cash' : ride.payment_method === 'wallet' ? 'Wallet' : 'Payment pending'}</span>
      <button type="button" aria-expanded={luggageOpen} onClick={() => setLuggageOpen(value => !value)} className={`${primary} flex min-w-0 flex-1 items-center justify-center gap-3 rounded-[12px]`}><img src={`${assets}/luggage.svg`} alt="" className="block max-w-none" />View luggage</button>
    </div>
    {luggageOpen && <p className="my-2 rounded-xl border border-[#e3e7ee] bg-white p-3 text-[12px]">{ride.hasLuggage ? 'The rider has indicated luggage for this request.' : 'No luggage has been indicated for this request.'}</p>}
    <div className="mt-1 flex min-h-[34px] items-center gap-2 rounded-[11px] bg-[#f5f6f8] px-3"><img src={`${assets}/note.svg`} alt="" className="block max-w-none" /><strong className="text-[9px] text-[#667080]">NOTE</strong><p className="min-w-0 break-words text-[10.2px] font-medium">{ride.rider_note || 'No rider note provided.'}</p></div>
    <button type="button" aria-expanded={preferencesOpen} onClick={() => setPreferencesOpen(value => !value)} className="mt-1 flex min-h-10 w-full items-center gap-[10px] rounded-[13px] border border-[#e3e7ee] bg-white px-3 text-left text-[11.5px] font-semibold"><img src={`${assets}/preferences.svg`} alt="" className="block max-w-none" /><span className="flex-1">View rider preferences</span><img src={`${assets}/chevron.svg`} alt="" className="block max-w-none" /></button>
    {preferencesOpen && <div className="mt-2 rounded-xl border border-[#e3e7ee] p-3 text-[12px] leading-5">
      <p>{preferences.length ? preferences.join(' · ') : 'No additional rider preferences provided.'}</p>
      {trustText && <p className="mt-2 text-[#667085]">{trustText}</p>}
      {ride.passenger_name && <p className="mt-2">Booked for {ride.passenger_name} by another person.</p>}
      <label className="mt-3 block text-[11px] font-semibold">Note with your offer<input value={note} maxLength={120} onChange={event => onNoteChange(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-[#e3e7ee] px-3 text-base font-normal" placeholder="Optional message to the rider" /></label>
    </div>}
  </>;
}

export function DriverFareControl({ fare, busy, onDecrease, onIncrease, onSend }: { fare: number; busy: boolean; onDecrease: () => void; onIncrease: () => void; onSend: () => void }) {
  return <div className="mx-auto flex min-h-[62px] w-[calc(100%_-_82px)] max-w-[360px] items-center gap-[9px] rounded-[17px] bg-[#f5f6f8] px-[9px] py-[5px]">
    <button type="button" aria-label="Decrease offer" disabled={busy || fare <= 0.5} onClick={onDecrease} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[18px] border border-[#e4e7ed] bg-white disabled:opacity-40"><img src={`${assets}/minus.svg`} alt="" className="block max-w-none" /></button>
    <button type="button" onClick={onSend} disabled={busy || !Number.isFinite(fare) || fare <= 0} className="min-h-[52px] min-w-0 flex-1 rounded-[18px] bg-[#ff000d] px-1 text-[14px] font-semibold text-white disabled:opacity-50">{busy ? 'Sending…' : `Send offer $${Number.isFinite(fare) ? fare.toFixed(2) : '—'}`}</button>
    <button type="button" aria-label="Increase offer" disabled={busy} onClick={onIncrease} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[18px] border border-[#e4e7ed] bg-white disabled:opacity-40"><img src={`${assets}/plus.svg`} alt="" className="block max-w-none" /></button>
  </div>;
}
