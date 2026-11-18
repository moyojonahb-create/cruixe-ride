import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cancellationIsByRider, usePickupNoShowReport } from './driverTripExceptionState';
import DriverExceptionLayout from './DriverExceptionLayout';

export function DriverCancelledRideScreen({ rideId, riderId, onBack, onProfile, onRequests }: {
  rideId: string; riderId: string | null; onBack: () => void; onProfile: () => void; onRequests: () => void;
}) {
  const [byRider, setByRider] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let stale = false;
    setByRider(false); setChecking(true);
    void (async () => {
      try {
        const { data, error } = await supabase.from('trip_events').select('actor_id, payload')
          .eq('ride_id', rideId).eq('event_type', 'ride_cancelled').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!stale && !error) setByRider(cancellationIsByRider(riderId, data));
      } catch { /* Missing evidence must never be attributed to the Rider. */ }
      finally { if (!stale) setChecking(false); }
    })();
    return () => { stale = true; };
  }, [rideId, riderId]);
  return <DriverExceptionLayout frameId="1373:374" title={byRider ? 'Rider Cancelled Ride' : 'Trip Cancelled'} heroTitle={byRider ? 'This rider cancelled.' : 'This trip was cancelled.'} heroDescription="The trip is no longer active." rows={[
    { label: 'Ride status', value: checking ? 'Checking saved cancellation details…' : byRider ? 'Cancelled by rider' : 'Cancelled · source not confirmed' },
    { label: 'Pickup destination', value: 'Previous pickup removed' },
    { label: 'Next step', value: 'Browse other requests' },
  ]} onBack={onBack} onProfile={onProfile} primaryLabel="Find New Requests" onPrimary={onRequests} />;
}

export function DriverPickupNoShowScreen({ rideId, status, onBack, onProfile, onContact, reportModel }: {
  rideId: string; status: string; onBack: () => void; onProfile: () => void; onContact: () => void; reportModel?: ReturnType<typeof usePickupNoShowReport>;
}) {
  const localModel = usePickupNoShowReport(rideId);
  const { pending, reported, error, report } = reportModel ?? localModel;
  const atPickup = status === 'arrived';
  return <DriverExceptionLayout frameId="1373:413" title="Pickup No-Show Resolution" heroTitle="Rider not at pickup?" heroDescription="Contact the rider and follow the waiting policy." rows={[
    { label: 'Arrival status', value: atPickup ? 'At pickup' : 'Pickup status changed · return to trip' },
    { label: 'Waiting allowance', value: 'Defined by platform policy' },
    { label: 'Resolution', value: reported ? 'Pickup report submitted for review' : 'Report absence or keep waiting' },
  ]} notice="A pickup report does not cancel the trip or approve a cancellation fee. Keep waiting or contact the rider while the platform reviews your report." onBack={onBack} onProfile={onProfile} primaryLabel={pending ? 'Submitting…' : reported ? 'Report Submitted' : 'Report Pickup Issue'} navigationDisabled={pending} primaryDisabled={!atPickup || pending || reported} onPrimary={() => void report(atPickup)}>
    <div className="mt-5 flex flex-wrap gap-2">
      <button type="button" onClick={onContact} disabled={pending} className="min-h-11 rounded-xl border border-[#ff000d] bg-white px-4 text-[12px] font-semibold">Contact rider</button>
      <button type="button" onClick={onBack} disabled={pending} className="min-h-11 rounded-xl bg-white px-4 text-[12px] font-semibold">Keep waiting</button>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {reported && <p role="status" className="mt-4 text-sm">Your report was submitted. The trip remains active; no fee has been approved by this report.</p>}
  </DriverExceptionLayout>;
}
