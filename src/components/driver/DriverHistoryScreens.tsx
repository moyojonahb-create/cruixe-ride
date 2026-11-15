import { useState } from 'react';
import { RecordsShell, RecordsHero, RecordsRows, RecordsNote } from './DriverRecordsScreen';
import { openTripReceipt, refreshTripReceiptPayment, type TripReceiptData } from '@/components/ride/TripReceiptButton';
export interface HistoryTrip { id: string; pickup_address: string; dropoff_address: string; fare: number; status: string; created_at: string; vehicle_type: string; payment_method: string; driver_collected_at: string | null; wallet_paid: boolean | null; payment_failed: boolean | null; distance_km: number; duration_minutes: number }
export function historyPayment(trip: HistoryTrip) { return !trip.payment_failed && (trip.payment_method === 'cash' ? !!trip.driver_collected_at : trip.wallet_paid === true); }
export function historyReceipt(trip: HistoryTrip): TripReceiptData {
  return { rideId: trip.id, pickupAddress: trip.pickup_address, dropoffAddress: trip.dropoff_address, fare: Number(trip.fare), distanceKm: Number(trip.distance_km || 0), durationMinutes: Number(trip.duration_minutes || 0), tripDate: trip.created_at, paymentMethod: trip.payment_method, paymentConfirmed: historyPayment(trip) };
}
export default function DriverHistoryScreens({ trips, onBack, initialScreen = 'rides', preview = false }: { trips: HistoryTrip[]; onBack: () => void; initialScreen?: 'rides' | 'parcels' | 'trip'; preview?: boolean }) {
  const [kind, setKind] = useState<'rides' | 'parcels'>(initialScreen === 'parcels' ? 'parcels' : 'rides');
  const [selected, setSelected] = useState<HistoryTrip | null>(initialScreen === 'trip' ? trips[0] || null : null);
  const [opening, setOpening] = useState(false);
  const visible = trips.filter(trip => kind === 'parcels' ? trip.vehicle_type === 'parcel' : trip.vehicle_type !== 'parcel');
  const receipt = async () => {
    if (!selected || opening) return;
    setOpening(true);
    try { await openTripReceipt(historyReceipt(selected), preview ? undefined : () => refreshTripReceiptPayment(selected.id)); }
    finally { setOpening(false); }
  };
  return <RecordsShell screen={selected ? 'trip' : kind} onBack={onBack} busy={opening} action={selected?.status === 'completed' ? () => void receipt() : undefined} actionLabel="View Receipt">
    <RecordsHero title={selected ? 'Your journey record.' : kind === 'parcels' ? 'Deliveries at a glance.' : 'Every ride, one place.'}>{selected ? 'Trip status and fare details for this trip.' : kind === 'parcels' ? 'Inspect past parcel collections and drop-offs.' : 'Review your recent trips.'}</RecordsHero>
    {selected ? <><h2>Status overview</h2><RecordsRows rows={[
      ['Trip status', selected.status], ['Route', `${selected.pickup_address} → ${selected.dropoff_address}`], ['Accepted fare', `$${Number(selected.fare).toFixed(2)}`],
      ['Payment', historyPayment(selected) ? (selected.payment_method === 'cash' ? 'Cash collected' : 'Paid') : 'Pending confirmation'],
      ['Cash confirmation', selected.driver_collected_at ? new Date(selected.driver_collected_at).toLocaleString() : 'Not confirmed'], ['Trip reference', selected.id],
    ]} /><div className="dr-links"><button className="dr-button" onClick={() => setSelected(null)}>Back to History</button></div></> : <>
      <div className="dr-links"><button className="dr-button" aria-pressed={kind === 'rides'} onClick={() => setKind('rides')}>Rides</button><button className="dr-button" aria-pressed={kind === 'parcels'} onClick={() => setKind('parcels')}>Parcels</button></div>
      <h2>Recent activity</h2><div className="dr-card">{visible.length ? visible.map(trip => <button key={trip.id} onClick={() => setSelected(trip)}><strong>{trip.status} {kind === 'parcels' ? 'parcel' : 'ride'}</strong><small>{trip.pickup_address} → {trip.dropoff_address} · ${Number(trip.fare).toFixed(2)}</small><small>{new Date(trip.created_at).toLocaleString()}</small></button>) : <div>No {kind === 'parcels' ? 'deliveries' : 'rides'} yet.</div>}</div>
    </>}
    <RecordsNote>{preview ? 'Sample records for visual review only.' : 'The most recent 50 trips are shown. Payment stays pending until confirmed. Receipts reopen in-app with download available as an additional action.'}</RecordsNote>
  </RecordsShell>;
}
