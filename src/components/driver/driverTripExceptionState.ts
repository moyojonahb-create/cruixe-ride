import { useRef, useState } from 'react';
import { submitDispute } from '@/lib/businessApi';

export function cancellationIsByRider(riderId: string | null | undefined, event: { actor_id: string | null; payload?: unknown } | null): boolean {
  if (!riderId || !event || event.actor_id !== riderId) return false;
  const payload = event.payload;
  return !(payload && typeof payload === 'object' && 'cancelled_by' in payload && payload.cancelled_by === 'driver');
}

export function usePickupNoShowReport(rideId: string) {
  const [state, setState] = useState({ rideId, pending: false, reported: false, error: null as string | null });
  const lock = useRef({ rideId, pending: false, reported: false });
  if (lock.current.rideId !== rideId) lock.current = { rideId, pending: false, reported: false };
  const current = state.rideId === rideId ? state : { rideId, pending: false, reported: false, error: null };
  const report = async (atPickup: boolean) => {
    if (!atPickup || lock.current.pending || lock.current.reported) return;
    lock.current.pending = true;
    setState({ rideId, pending: true, reported: false, error: null });
    try {
      const result = await submitDispute({ ride_id: rideId, reporter_role: 'driver', category: 'other', description: 'Pickup no-show: driver reports that the rider is not at pickup. Please review the trip records and applicable waiting policy.' });
      if (result?.success !== true) throw new Error('Report was not confirmed.');
      if (lock.current.rideId === rideId) {
        lock.current.reported = true;
        setState({ rideId, pending: false, reported: true, error: null });
      }
    } catch {
      if (lock.current.rideId === rideId) setState({ rideId, pending: false, reported: false, error: 'Could not submit your pickup report. Please check your connection and try again.' });
    } finally { if (lock.current.rideId === rideId) lock.current.pending = false; }
  };
  return { ...current, report };
}
