import { useEffect, useState } from 'react';
import type { EnrichedRideRequest } from '@/lib/driverRideRequests';
import type { Offer } from '@/lib/offerHelpers';
import { supabase } from '@/lib/supabaseClient';

type Decision = Offer['status'] | 'unavailable';

export default function DriverOfferWaiting({ offer, ride, driverRowId, onAccepted }: {
  offer: Offer;
  ride: EnrichedRideRequest;
  driverRowId: string | null;
  onAccepted: () => void;
}) {
  const [decision, setDecision] = useState<Decision>(offer.status);

  useEffect(() => {
    let active = true;
    let checking = false;

    const check = async () => {
      if (!active || checking || document.visibilityState === 'hidden') return;
      checking = true;
      try {
        const { data, error } = await supabase.from('offers').select('status')
          .eq('id', offer.id).eq('ride_id', offer.ride_id).eq('driver_id', offer.driver_id).maybeSingle();
        if (!active) return;
        if (error || !data) {
          setDecision('unavailable');
          return;
        }
        if (data.status === 'accepted') {
          setDecision('accepted');
          if (!driverRowId) return;
          const result = await supabase.from('rides').select('status')
            .eq('id', offer.ride_id).eq('driver_id', driverRowId).maybeSingle();
          if (active && !result.error && ['accepted', 'arrived', 'in_progress'].includes(result.data?.status ?? '')) {
            active = false;
            onAccepted();
          }
        } else if (data.status === 'rejected' || data.status === 'pending') {
          setDecision(data.status);
        } else {
          setDecision('unavailable');
        }
      } catch {
        if (active) setDecision('unavailable');
      } finally {
        checking = false;
      }
    };

    const timer = window.setInterval(() => { void check(); }, 5000);
    const resume = () => { void check(); };
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [driverRowId, offer.driver_id, offer.id, offer.ride_id, onAccepted]);

  const guest = Boolean(ride.passenger_name);
  const statusText = {
    pending: 'Awaiting decision',
    accepted: 'Offer accepted',
    rejected: 'Offer declined',
    unavailable: 'Status unavailable',
  }[decision];
  const explanation = {
    pending: 'Waiting for rider response.',
    accepted: 'Waiting for trip confirmation.',
    rejected: 'Return to Requests to view other bookings.',
    unavailable: 'The offer was sent. We’ll check again for the latest status.',
  }[decision];

  return (
    <section aria-labelledby="driver-offer-waiting-title" className="space-y-2.5">
      <p role="status" className="inline-flex min-h-[25px] items-center rounded-full bg-[#fceff0] px-6 text-[10px] font-bold uppercase">{statusText}</p>
      <h1 id="driver-offer-waiting-title" className="text-[22px] font-bold">{guest ? 'Offer sent to the booker' : 'Offer sent to rider'}</h1>
      {decision === 'pending' && <p className="text-xs text-[#667080]">{ride.passenger_display_name ? `${ride.passenger_display_name} is reviewing your fare.` : 'The rider is reviewing your fare.'}</p>}
      <div className="relative overflow-hidden rounded-[17px] border border-[#e4e7ed] bg-white">
        <img src="/brand/driver-offer-waiting/route-accent.svg" alt="" className="pointer-events-none absolute -left-px -top-px max-w-none" />
        <img src="/brand/driver-offer-waiting/markers.svg" alt="" className="absolute left-3.5 top-3 max-w-none" />
        <dl className="relative space-y-1.5 py-1.5 pl-[47px] pr-3">
          <div><dt className="text-[9px] font-semibold text-[#667080]">PICKUP</dt><dd className="break-words text-[14px] font-bold">{ride.pickup_address}</dd></div>
          <div><dt className="text-[9px] font-semibold text-[#667080]">DROP-OFF</dt><dd className="break-words text-[14px] font-bold">{ride.dropoff_address}</dd></div>
        </dl>
      </div>
      <div className="relative flex min-h-[52px] items-center justify-between overflow-hidden rounded-[14px] bg-[#1f2129] px-3.5 text-white">
        <img src="/brand/driver-offer-waiting/fare-accent.svg" alt="" className="pointer-events-none absolute left-0 top-0 max-w-none" />
        <strong className="relative text-[10px]">YOUR OFFER</strong>
        <span className="relative text-[23px] font-bold tabular-nums">${offer.price.toFixed(2)}</span>
      </div>
      <p className="text-[11px] text-[#667080]">{explanation}</p>
      {guest && <p className="text-[11px] font-semibold">Booked for someone else</p>}
    </section>
  );
}
