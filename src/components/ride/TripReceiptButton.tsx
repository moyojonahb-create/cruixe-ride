import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchRideById } from '@/lib/rideMatching';

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
      <DialogContent className="max-h-[85dvh] overflow-y-auto bg-white text-foreground">
        <DialogTitle>Trip receipt</DialogTitle>
        <DialogDescription>Saved trip and payment details</DialogDescription>
        <p className="break-all text-xs">Ride {latest.rideId}</p>
        <p>{latest.tripDate || latest.completedAt ? new Date(latest.completedAt || latest.tripDate!).toLocaleString() : 'Trip date unavailable'}</p>
        <div className="rounded-xl border p-4 space-y-2">
          <p>Pickup: {latest.pickupAddress}</p><p>Drop-off: {latest.dropoffAddress}</p>
          {latest.driverName && <p>Driver: {latest.driverName}</p>}
          {latest.vehicleInfo && <p>{latest.vehicleInfo} {latest.plateNumber}</p>}
          <p>Payment method: {latest.paymentMethod || 'Cash'}</p>
          <p role="status">{latest.paymentConfirmed ? 'Payment confirmed' : 'Payment pending confirmation'}</p>
        </div>
        <p className="flex justify-between font-bold text-xl"><span>Accepted fare</span><span>${latest.fare.toFixed(2)}</span></p>
        <Button onClick={() => void downloadTripReceipt(latest)}>Download receipt</Button>
      </DialogContent>
    </Dialog>);
  } catch {
    toast.error('Could not load receipt. Please try again.');
  }
}

export async function refreshTripReceiptPayment(rideId: string): Promise<Partial<TripReceiptData>> {
  const latest = await fetchRideById(rideId);
  if (!latest) throw new Error('Could not refresh receipt');
  return {
    fare: latest.fare,
    paymentMethod: latest.payment_method,
    paymentConfirmed: !latest.payment_failed && (latest.payment_method === 'cash' ? !!latest.driver_collected_at : latest.wallet_paid === true),
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
