import { useState } from 'react';
import { ChevronLeft, ChevronRight, Layers3, ShieldAlert } from 'lucide-react';
import { JOURNEY_BATCH_20 } from '@/lib/journeyBatch20Screens';
import Batch20JourneyScreen from '@/components/journeys/Batch20JourneyScreen';

/** Internal, staging-only visual QA surface. This does not create trips, invitations or payments.
 * Real Rider/Driver journeys still use their current authorised backend handlers.
 */
export default function Batch20ScreenReview() {
  const [index, setIndex] = useState(0);
  const [actionMessage, setActionMessage] = useState('');
  const screen = JOURNEY_BATCH_20[index];
  const show = (next: number) => { setIndex(Math.max(0,Math.min(JOURNEY_BATCH_20.length - 1,next))); setActionMessage(''); };
  const onAction = (id: string) => setActionMessage(`Visual review only: action on "${id}" requires its authenticated ride handler. No booking was created or modified.`);
  // Intentionally generic staging fixture, never a real user, ride, boarding code or share token.
  const fixture = {
    pickup: 'Pickup location',
    destination: 'Selected destination',
    passenger: 'Passenger name',
    driver: 'Assigned driver',
    bookedBy: 'Booker',
    vehicle: 'Driver vehicle',
    fare: null,
    passengerCount: null,
    etaMinutes: null,
    boardingPin: null,
    reference: undefined,
    shareLink: null,
    verifiedGuest: false,
    scheduledAt: null,
  };
  return (
    <div className="min-h-[100dvh] bg-[#f4f5f7] text-[#1f2129]">
      <header className="sticky top-0 z-50 border-b border-[#d9dde3] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-[#ff000d]"/><div><h1 className="text-[14px] font-bold">CruiXe · 20-screen Figma batch</h1><p className="text-[11px] text-[#667080]">Internal staging design QA · not a live booking flow</p></div></div>
          <div className="flex gap-2"><button type="button" onClick={()=>show(index-1)} disabled={index===0} className="flex min-h-11 items-center gap-1 rounded-xl border px-3 disabled:opacity-30"><ChevronLeft size={16}/> Previous</button><button type="button" onClick={()=>show(index+1)} disabled={index===19} className="flex min-h-11 items-center gap-1 rounded-xl bg-[#ff000d] px-3 text-white disabled:opacity-30">Next <ChevronRight size={16}/></button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1100px] gap-5 px-3 py-5 md:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Figma screens" className="max-h-[70dvh] overflow-y-auto rounded-2xl border border-[#e2e6ed] bg-white p-2">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold text-[#667080]">Select a Figma state · {index+1}/20</p>
          {JOURNEY_BATCH_20.map((item,i)=>(
            <button type="button" key={item.id} onClick={()=>show(i)} aria-current={i===index?'page':undefined}
              className={`mb-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-[12px] ${i===index?'bg-[#fff1f2] font-semibold text-[#d6000c]':'hover:bg-[#f6f6f8]'}`}>
              <span className="w-6 shrink-0 tabular-nums">{String(i+1).padStart(2,'0')}</span><span className="min-w-0 flex-1 truncate">{item.title}</span>
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full max-w-[440px] items-start gap-2 rounded-xl border border-[#ffe0e5] bg-white px-3 py-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#d6000c]"/>
            <p className="text-[11px] leading-5">Design-state preview only. Buttons do not alter a live trip. Passenger and payment details are deliberately withheld until the related backend flow is securely integrated.</p>
          </div>
          {actionMessage && <p role="status" className="w-full max-w-[440px] rounded-xl bg-[#fff5e6] p-3 text-[12px]">{actionMessage}</p>}
          <div className="w-full max-w-[440px] overflow-hidden rounded-[30px] border-[5px] border-[#1f2129] shadow-xl">
            <Batch20JourneyScreen key={screen.id} screen={screen} journey={fixture} onPrimary={onAction} onSecondary={onAction}/>
          </div>
        </div>
      </div>
    </div>
  );
}
