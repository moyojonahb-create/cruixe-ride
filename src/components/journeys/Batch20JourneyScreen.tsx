import { ArrowLeft, Clock3, Link as LinkIcon, MapPin, ShieldCheck, Users } from 'lucide-react';
import type { JourneyScreenDefinition } from '@/lib/journeyBatch20Screens';

export interface JourneyData {
  pickup?: string;
  destination?: string;
  passenger?: string;
  driver?: string;
  bookedBy?: string;
  vehicle?: string;
  reference?: string;
  fare?: number | null;
  etaMinutes?: number | null;
  passengerCount?: number | null;
  boardingPin?: string | null;
  scheduledAt?: string | null;
  shareLink?: string | null;
  verifiedGuest?: boolean;
}
export interface JourneyActionProps {
  screen: JourneyScreenDefinition;
  journey: JourneyData;
  onPrimary: (screenId: string) => void;
  onSecondary: (screenId: string) => void;
}
/** 20 distinct approved frame states can share one layout without reproducing any Figma sample personally identifying values.
 * The parent must supply real data and authenticated callbacks; this renderer never creates bookings or credentials.
 */
export default function Batch20JourneyScreen({ screen, journey, onPrimary, onSecondary }: JourneyActionProps) {
  const isShared = screen.group === 'shared';
  const isGuest = screen.group === 'guest';
  const isSchedule = screen.group === 'schedule';
  const isInvalid = screen.id === 'guest-invalid-link';
  const showReference = isGuest && !isInvalid && Boolean(journey.reference);
  const showBoardingPin = screen.id === 'shared-boarding' && Boolean(journey.boardingPin);
  const showInvitationLink = screen.id === 'guest-share-link' && journey.verifiedGuest && Boolean(journey.shareLink);
  const showFare = journey.fare !== null && Number.isFinite(journey.fare);
  return (
    <section data-figma-node={screen.figmaNode} aria-label={screen.title}
      className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <header className="relative h-[222px] shrink-0 bg-[#1f2129] px-6 pt-[max(26px,env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => onSecondary(screen.id)} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#1f2129]">
            <ArrowLeft size={22}/>
          </button>
          <span className="rounded-full bg-white px-4 py-2 text-[10px] font-bold tracking-wider text-[#1f2129]">CruiXe RIDE</span>
        </div>
        <p className="mt-9 text-[23px] font-semibold tracking-tight">CruiXe</p>
        <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
        <div className="absolute inset-x-0 bottom-0 h-9 rounded-t-[50%] bg-[#ff000d]" aria-hidden="true" />
        <div className="absolute inset-x-0 -bottom-3 h-9 rounded-t-[50%] bg-white" aria-hidden="true" />
      </header>
      <main className="relative flex flex-1 flex-col px-[22px] pb-[max(26px,env(safe-area-inset-bottom))] pt-7">
        <h1 className="text-[24px] font-bold leading-[1.3]">{screen.title}</h1>
        <p className="mt-2 text-[12px] leading-5 text-[#667080]">{screen.description}</p>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-1 w-9 rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
          <span className="text-[10px] font-semibold tracking-wider text-[#1f2129]">
            {isShared ? 'SHARED RIDE' : isGuest ? 'GUEST BOOKING' : isSchedule ? 'SCHEDULED RIDE' : 'DRIVER MATCHING'}
          </span>
        </div>
        {isInvalid ? (
          <div className="mt-7 rounded-[18px] border border-[#ffe0e4] bg-[#fff6f7] px-4 py-5">
            <p className="text-[14px] font-semibold text-[#1f2129]">Private trip access is protected.</p>
            <p className="mt-2 text-[12px] leading-5 text-[#667080]">Ask the person who booked the ride for a new invitation. No trip or passenger details are disclosed from this invalid link.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {(journey.pickup || journey.destination) && (
              <div className="rounded-[18px] border border-[#e2e6ed] bg-white px-4 py-4">
                {journey.pickup && <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#ff000d]"/>
                  <div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#667080]">Pickup</p><p className="mt-1 text-[13px] font-semibold">{journey.pickup}</p></div>
                </div>}
                {journey.pickup && journey.destination && <div className="ml-[7px] my-2 h-4 border-l border-dashed border-[#d5d9df]" />}
                {journey.destination && <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#1f2129]"/>
                  <div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#667080]">Destination</p><p className="mt-1 text-[13px] font-semibold">{journey.destination}</p></div>
                </div>}
              </div>
            )}
            {isShared && (
              <div className="flex items-center justify-between gap-3 rounded-[17px] bg-[#f6f6f8] px-4 py-4">
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-[#ff000d]"/><span className="text-[12px] font-semibold">Shared ride</span></div>
                <span className="text-[12px] font-bold tabular-nums">{journey.passengerCount != null ? `${Math.min(2,journey.passengerCount)}/2 booked` : 'Seats pending'}</span>
              </div>
            )}
            {(journey.driver || journey.passenger || journey.bookedBy) && (
              <div className="rounded-[17px] border border-[#e2e6ed] p-4">
                {journey.driver && <p className="text-[13px] font-semibold">Driver: {journey.driver}</p>}
                {journey.passenger && <p className="mt-1 text-[12px] text-[#667080]">Passenger: {journey.passenger}</p>}
                {journey.bookedBy && <p className="mt-1 text-[12px] text-[#667080]">Booked by: {journey.bookedBy}</p>}
                {journey.vehicle && <p className="mt-2 text-[12px] text-[#667080]">{journey.vehicle}</p>}
                {journey.etaMinutes != null && <p className="mt-2 text-[12px] font-semibold text-[#ff000d]">{journey.etaMinutes} min estimated arrival</p>}
              </div>
            )}
            {showReference && <div className="rounded-[16px] bg-[#f6f6f8] px-4 py-3"><p className="text-[10px] font-semibold text-[#667080]">Booking reference</p><p className="mt-1 text-[14px] font-bold">{journey.reference}</p></div>}
            {showBoardingPin && <div className="rounded-[18px] bg-[#fff7dc] px-4 py-4 text-center"><p className="text-[10px] font-semibold tracking-wider">YOUR BOARDING PIN</p><p className="mt-2 text-[28px] font-bold tracking-[.2em]">{journey.boardingPin}</p><p className="mt-2 text-[11px]">Share this code only with your assigned driver.</p></div>}
            {showInvitationLink && <div className="rounded-[16px] bg-[#f6f6f8] p-4"><LinkIcon className="h-4 w-4 text-[#ff000d]"/><p className="mt-2 break-all text-[12px] font-semibold">{journey.shareLink}</p></div>}
            {journey.scheduledAt && isSchedule && <div className="flex items-center gap-3 rounded-[16px] bg-[#f6f6f8] p-4"><Clock3 className="h-5 w-5 text-[#ff000d]"/><p className="text-[13px] font-semibold">{new Date(journey.scheduledAt).toLocaleString('en-ZW',{dateStyle:'full',timeStyle:'short'})}</p></div>}
            {showFare && <div className="flex items-center justify-between rounded-[16px] bg-[#f6f6f8] px-4 py-4"><p className="text-[12px] font-semibold">Trip fare</p><p className="text-[19px] font-bold tabular-nums">${journey.fare!.toFixed(2)}</p></div>}
          </div>
        )}
        <div className="mt-auto pt-10">
          <div className="flex items-center gap-2 rounded-[14px] bg-[#f6f6f8] px-3 py-3 text-[#667080]">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#ff000d]"/>
            <p className="text-[11px] leading-5">{isInvalid ? 'Do not share personal details through an invalid link.' : isGuest ? 'Only authorised passengers should receive booking details.' : isShared ? 'A shared ride is limited to two passengers.' : isSchedule ? 'The request must be confirmed by the booking service.' : 'Driver availability is confirmed by the live dispatch service.'}</p>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => onSecondary(screen.id)} className="min-h-[54px] flex-1 rounded-[17px] border border-[#ff000d] bg-white px-2 text-[13px] font-semibold text-[#ff000d]">{screen.secondary}</button>
            <button type="button" onClick={() => onPrimary(screen.id)} className="min-h-[54px] flex-[2] rounded-[17px] bg-[#ff000d] px-3 text-[14px] font-semibold text-white">{screen.primary}</button>
          </div>
        </div>
      </main>
    </section>
  );
}
