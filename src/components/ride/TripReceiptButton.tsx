import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Content as DialogViewport } from '@radix-ui/react-dialog';
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import LazyMapboxMap from '@/components/map/LazyMapboxMap';
import type { Coords } from '@/components/MapboxMap';
import { fetchAssignedDriver, fetchRideById, type MatchingRide } from '@/lib/rideMatching';
import { isPlausibleRideCoord } from '@/lib/osrm';
import backIcon from '@/assets/ride-receipt/back.svg';
import cardIcon from '@/assets/ride-receipt/card.svg';
import carIcon from '@/assets/ride-receipt/car.svg';
import peopleIcon from '@/assets/ride-receipt/people.svg';
import personIcon from '@/assets/ride-receipt/person.svg';
import pinIcon from '@/assets/ride-receipt/pin.svg';
import receiptIcon from '@/assets/ride-receipt/receipt.svg';
import recenterIcon from '@/assets/ride-receipt/recenter.svg';
import ribbon from '@/assets/ride-receipt/ribbon.svg';
import surface from '@/assets/ride-receipt/surface.svg';
import walletIcon from '@/assets/ride-receipt/wallet.svg';
import { RIDE_FONT } from './rideGlass';

export interface TripReceiptData {
  rideId: string;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  distanceKm: number;
  durationMinutes: number;
  driverName?: string;
  vehicleInfo?: string;
  plateNumber?: string;
  paymentMethod?: string;
  completedAt?: string;
  tripDate?: string;
  riderName?: string;
  paymentConfirmed?: boolean;
  bookedBy?: string;
  pickup?: Coords;
  dropoff?: Coords;
  routeGeometry?: string | null;
}

export function escapeReceiptText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export async function downloadTripReceipt(data: TripReceiptData, refresh?: () => Promise<Partial<TripReceiptData>>): Promise<void> {

  try {

    const refreshed = refresh ? await refresh() : {};
    data = { ...data, ...refreshed };
    data = { ...data, ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? escapeReceiptText(value) : value])) };

    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Trip Receipt - CruiXe</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
    .receipt { max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .logo { text-align: center; font-size: 24px; font-weight: 900; color: #0B3D91; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #888; font-size: 12px; margin-bottom: 24px; }
    .divider { border: none; border-top: 1px dashed #e0e0e0; margin: 16px 0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .row .label { color: #666; }
    .row .value { font-weight: 600; color: #111; text-align: right; max-width: 60%; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 20px; font-weight: 800; }
    .total-row .label { color: #111; }
    .total-row .value { color: #0B3D91; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 700; margin: 16px 0 8px; }
    .footer { text-align: center; margin-top: 24px; color: #aaa; font-size: 11px; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; }
    @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">CruiXe</div>
    <div class="subtitle">Trip Receipt</div>
    
    <div class="section-title">Trip Details</div>
    <div class="row"><span class="label">Receipt #</span><span class="value">${data.rideId.substring(0, 8).toUpperCase()}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${(data.completedAt || data.tripDate) ? new Date(data.completedAt || data.tripDate!).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString()}</span></div>
    
    <hr class="divider">
    
    <div class="section-title">Route</div>
    <div class="row"><span class="label">Pickup</span><span class="value">${data.pickupAddress}</span></div>
    <div class="row"><span class="label">Drop-off</span><span class="value">${data.dropoffAddress}</span></div>
    <div class="row"><span class="label">Distance</span><span class="value">${data.distanceKm.toFixed(1)} km</span></div>
    <div class="row"><span class="label">Duration</span><span class="value">${Math.round(data.durationMinutes)} min</span></div>
    
    <hr class="divider">
    
    ${data.driverName ? `
    <div class="section-title">Driver</div>
    <div class="row"><span class="label">Name</span><span class="value">${data.driverName}</span></div>
    ${data.vehicleInfo ? `<div class="row"><span class="label">Vehicle</span><span class="value">${data.vehicleInfo}</span></div>` : ''}
    ${data.plateNumber ? `<div class="row"><span class="label">Plate</span><span class="value">${data.plateNumber}</span></div>` : ''}
    <hr class="divider">
    ` : ''}
    
    <div class="section-title">Payment</div>
    <div class="row"><span class="label">Method</span><span class="value">${data.paymentMethod || 'Cash'} <span class="badge">${data.paymentConfirmed ? 'Paid' : 'Payment pending confirmation'}</span></span></div>
    
    <hr class="divider">
    
    <div class="total-row">
      <span class="label">Total</span>
      <span class="value">$${data.fare.toFixed(2)}</span>
    </div>
    
    <div class="footer">
      <p>Thank you for riding with CruiXe!</p>
      <p style="margin-top:4px;">support@pickmeapp.co.zw</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CruiXe-Receipt-${data.rideId.substring(0, 8)}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Receipt generation failed:', err);
    toast.error('Failed to generate receipt');
  }
}

function TripReceipt({ data }: { data: TripReceiptData }) {
  const [mapVersion, setMapVersion] = useState(0);
  const fare = `$${data.fare.toFixed(2)}`;
  const date = data.completedAt || data.tripDate;
  const paymentStatus = data.paymentConfirmed ? 'Payment confirmed' : 'Payment pending confirmation';
  const hasMap = data.pickup && data.dropoff;
  const details = [
    { label: 'Driver', value: data.driverName, icon: personIcon },
    { label: 'Vehicle', value: [data.vehicleInfo, data.plateNumber].filter(Boolean).join(' · '), icon: carIcon },
    { label: 'Booked by', value: data.bookedBy, icon: personIcon },
    { label: 'Passenger / Recipient', value: data.riderName, icon: peopleIcon },
    { label: 'Payment method', value: data.paymentMethod || 'Cash', icon: cardIcon },
  ].filter(({ value }) => Boolean(value));
  const mapButtonClass = 'grid size-12 place-items-center rounded-full bg-white shadow-sm';
  const actionClass = 'min-h-[50px] flex-1 rounded-full border border-[#ff000d] px-3 text-sm font-semibold';

  return (
    <DialogPortal>
      <DialogOverlay className="z-[60]" />
      <DialogViewport
        className="fixed inset-y-0 left-1/2 z-[61] w-full max-w-[430px] -translate-x-1/2 overflow-y-auto overscroll-contain bg-white text-[#20232a] sm:rounded-[30px]"
        style={{ fontFamily: RIDE_FONT }}
      >
        <div className="relative h-[clamp(15rem,42dvh,29rem)] bg-[#f1f3f5]">
          {hasMap ? (
            <LazyMapboxMap
              key={mapVersion}
              pickup={data.pickup}
              dropoff={data.dropoff}
              routeGeometry={data.routeGeometry}
              height="100%"
            />
          ) : (
            <p className="grid h-full place-items-center p-12 text-center text-sm text-[#58616f]">
              Map unavailable for this ride
            </p>
          )}
          <div className="pointer-events-none absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] flex justify-between">
            <DialogClose asChild>
              <button type="button" aria-label="Close receipt" className={`pointer-events-auto ${mapButtonClass}`}>
                <img src={backIcon} alt="" />
              </button>
            </DialogClose>
            {hasMap && (
              <button
                type="button"
                aria-label="Recenter ride map"
                className={`pointer-events-auto ${mapButtonClass}`}
                onClick={() => setMapVersion((version) => version + 1)}
              >
                <img src={recenterIcon} alt="" />
              </button>
            )}
          </div>
        </div>

        <div className="relative -mt-4">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[58px] overflow-hidden">
            <img src={ribbon} alt="" className="absolute inset-x-0 top-0 w-full" />
            <img src={surface} alt="" className="absolute inset-x-0 top-[15px] w-full" />
            <span className="absolute left-[42%] top-[12px] h-1.5 w-[16%] rounded-full bg-white" />
          </div>
          <section className="relative space-y-4 px-4 pt-10" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            <DialogTitle className="text-xl font-bold">Ride receipt</DialogTitle>
            <DialogDescription className="sr-only">Saved trip and payment details</DialogDescription>

            <div className="rounded-2xl border border-[#e0e3e9] bg-[#f8f9fb] p-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="flex items-start gap-2 text-sm font-semibold">
                    <img src={pinIcon} alt="" className="shrink-0" />
                    <span className="sr-only">Pickup</span>
                    <span className="break-words">{data.pickupAddress}</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm font-semibold">
                    <img src={pinIcon} alt="" className="shrink-0" />
                    <span className="sr-only">Drop-off</span>
                    <span className="break-words">{data.dropoffAddress}</span>
                  </p>
                </div>
                <strong className="border-l border-[#e0e3e9] py-3 pl-3 text-xl text-[#ff000d]">{fare}</strong>
              </div>
              <p className="mt-3 flex items-center gap-2 border-t border-[#e0e3e9] pt-2 text-xs text-[#58616f]">
                <img src={receiptIcon} alt="" className="shrink-0" />
                <span className="break-all">{date ? `${new Date(date).toLocaleString('en-ZW')} · ` : ''}{data.rideId}</span>
              </p>
            </div>

            <dl className="divide-y divide-[#e0e3e9] rounded-2xl border border-[#e0e3e9] bg-white px-3">
              {details.map(({ label, value, icon }) => (
                <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 py-2.5 text-xs">
                  <dt className="flex items-center gap-2 text-[#58616f]">
                    <span className="shrink-0 border-r border-[#e0e3e9] pr-2"><img src={icon} alt="" /></span>
                    {label}
                  </dt>
                  <dd className="break-words text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center gap-3 rounded-[14px] border border-[#ff000d] bg-[#f8f9fb] p-3">
              <img src={walletIcon} alt="" />
              <span className="flex-1 text-sm font-semibold">{data.paymentConfirmed ? 'Total paid' : 'Accepted fare'}</span>
              <strong className="text-xl text-[#ff000d]">{fare}</strong>
            </div>
            <p role="status" className="rounded-xl bg-[#161118] p-3 text-sm text-white">{paymentStatus}</p>

            <div className="flex gap-2.5">
              <button type="button" className={`${actionClass} bg-white text-[#111]`} onClick={() => void downloadTripReceipt(data)}>
                Download receipt
              </button>
              <DialogClose asChild>
                <button type="button" className={`${actionClass} bg-[#ff000d] text-white`}>Done</button>
              </DialogClose>
            </div>
          </section>
        </div>
      </DialogViewport>
    </DialogPortal>
  );
}

export async function openTripReceipt(data: TripReceiptData, refresh?: () => Promise<Partial<TripReceiptData>>): Promise<void> {
  const previousFocus = document.activeElement as HTMLElement | null;
  try {
    const latest = { ...data, ...(refresh ? await refresh() : {}) };
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const close = () => queueMicrotask(() => {
      root.unmount();
      container.remove();
      previousFocus?.focus();
    });
    root.render(<Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <TripReceipt data={latest} />
    </Dialog>);
  } catch {
    toast.error('Could not load receipt. Please try again.');
  }
}

export async function refreshTripReceiptPayment(rideId: string, onRefresh?: (ride: MatchingRide) => void): Promise<Partial<TripReceiptData>> {
  const latest = await fetchRideById(rideId);
  if (!latest) throw new Error('Could not refresh receipt');
  onRefresh?.(latest);
  const pickup = { lat: latest.pickup_lat, lng: latest.pickup_lon };
  const dropoff = { lat: latest.dropoff_lat, lng: latest.dropoff_lon };
  const driver = !onRefresh && latest.driver_id
    ? await fetchAssignedDriver(latest.driver_id).catch(() => null)
    : null;
  return {
    fare: latest.fare,
    paymentMethod: latest.payment_method,
    paymentConfirmed: !latest.payment_failed && (latest.payment_method === 'cash' ? !!latest.driver_collected_at : latest.wallet_paid === true),
    ...(latest.created_at ? { tripDate: latest.created_at } : {}),
    ...(isPlausibleRideCoord(pickup) && isPlausibleRideCoord(dropoff) ? { pickup, dropoff, routeGeometry: latest.route_polyline } : {}),
    ...(driver ? {
      driverName: driver.full_name ?? undefined,
      vehicleInfo: [driver.vehicle_make, driver.vehicle_model, driver.vehicle_color].filter(Boolean).join(' ') || undefined,
      plateNumber: driver.plate_number ?? undefined,
    } : {}),
  };
}

export default function TripReceiptButton({ data, refresh }: { data: TripReceiptData; refresh?: () => Promise<Partial<TripReceiptData>> }) {
  const [generating, setGenerating] = useState(false);

  const generateReceipt = async () => {
    setGenerating(true);
    try {
      await openTripReceipt(data, refresh);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={generateReceipt} disabled={generating}>
      {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
      Receipt
    </Button>
  );
}
