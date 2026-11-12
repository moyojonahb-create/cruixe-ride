import { CheckCircle2, MapPin, Users, X } from 'lucide-react';

interface DriverDestinationReachedProps {
  passengerName: string;
  passengerCount: number | null;
  destination: string;
  fare: number;
  paymentMethod: string;
  confirming: boolean;
  farFromDropoff: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * Figma CruiXe Driver / 29 · Destination Reached (1185:115).
 * Uses real trip props; confirmation calls the existing completeTrip flow.
 * The real map remains visible behind this mobile overlay.
 */
export default function DriverDestinationReached({
  passengerName, passengerCount, destination, fare, paymentMethod, confirming, farFromDropoff, onBack, onConfirm,
}: DriverDestinationReachedProps) {
  return (
    <section data-figma-node="1185:115" role="dialog" aria-modal="true" aria-labelledby="driver-destination-title"
      className="fixed inset-0 z-[130] flex flex-col justify-end bg-[#111111]/35 font-['Poppins',system-ui,sans-serif]">
      <div className="mx-auto flex max-h-[min(82dvh,720px)] w-full max-w-[440px] flex-col overflow-y-auto rounded-t-[30px] bg-white pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,.12)]">
        <div className="h-[5px] w-[54px] shrink-0 self-center rounded-full bg-[#e2e6ed] mt-3" aria-hidden="true" />
        <div className="px-[22px] pb-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[.1em] text-[#ff000d]">AT DESTINATION</p>
              <h1 id="driver-destination-title" className="mt-2 text-[24px] font-bold leading-tight text-[#1f2129]">You've reached {destination}</h1>
            </div>
            <button type="button" aria-label="Back to active trip" onClick={onBack} disabled={confirming}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#e2e6ed] text-[#1f2129] disabled:opacity-50">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#667080]">Confirm every passenger has safely exited.</p>
          <div className="mt-5 h-[4px] w-[34px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
          <div className="mt-5 flex items-start gap-3 rounded-[16px] border border-[#e2e6ed] p-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#ff000d]" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[#667080]">DROP-OFF POINT</p>
              <p className="mt-1 break-words text-[15px] font-semibold text-[#1f2129]">{destination}</p>
              <p className="mt-1 text-[12px] text-[#667080]">{passengerName}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-[#f7f8fa] p-4">
            <Users className="h-5 w-5 shrink-0 text-[#ff000d]" />
            <span className="flex-1 text-[12px] font-semibold text-[#1f2129]">{passengerCount ?? 'Passenger count unavailable'}{passengerCount === 1 ? ' passenger' : passengerCount != null ? ' passengers' : ''}</span>
            <span className="text-[15px] font-bold tabular-nums text-[#1f2129]">${fare.toFixed(2)}</span>
          </div>
          <p className="mt-3 text-[11px] text-[#667080]">Agreed fare · {paymentMethod || 'Payment method pending'}</p>
          <div className="mt-5 flex items-start gap-3 rounded-[16px] bg-[#fff8eb] px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#ae7208]" />
            <p className="text-[12px] leading-5 text-[#1f2129]">Check that everyone has exited and collected their belongings. Ending the trip may start the payment confirmation process.</p>
          </div>
          {farFromDropoff && <p role="alert" className="mt-3 text-[12px] font-semibold text-[#c32e1d]">You appear far from the drop-off. Select End trip again only if all passengers have safely exited.</p>}
          <div className="mt-6 flex gap-3">
            <button type="button" disabled={confirming} onClick={onBack}
              className="min-h-[55px] flex-1 rounded-[18px] border border-[#ff000d] bg-white px-3 text-[14px] font-semibold text-[#ff000d] disabled:opacity-50">
              Back
            </button>
            <button type="button" disabled={confirming} onClick={onConfirm}
              className="min-h-[55px] flex-[2] rounded-[18px] bg-[#ff000d] px-3 text-[15px] font-semibold text-white disabled:opacity-50">
              {confirming ? 'Ending trip…' : 'End trip'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
