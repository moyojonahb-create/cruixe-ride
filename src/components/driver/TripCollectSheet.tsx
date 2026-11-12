import { useEffect, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getDriverWalletSummary } from '@/lib/walletApi';
import { confirmCashCollection } from '@/lib/confirmCashCollection';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';
import LazyMapboxMap from '@/components/map/LazyMapboxMap';
import RideGlassPanel from '@/components/ride/RideGlassPanel';
import { RIDE_FONT } from '@/components/ride/rideGlass';
import { isPlausibleRideCoord, type Coordinates } from '@/lib/osrm';

export interface CollectableRide {
  id: string;
  fare: number;
  payment_method: string;
  pickup_address?: string;
  dropoff_address: string;
  user_id: string;
  pickup_lat?: number | null;
  pickup_lon?: number | null;
  dropoff_lat?: number | null;
  dropoff_lon?: number | null;
}

interface TripCollectSheetProps {
  ride: CollectableRide;
  onDone: () => void;
  footer?: ReactNode;
}

const fmtUSD = (value: number) => `$${value.toFixed(2)}`;
const actionClass = 'min-h-12 min-w-0 flex-1 rounded-[14px] px-2.5 py-2 text-[15px] font-semibold leading-tight disabled:opacity-70';

function tripPoint(lat: number | null | undefined, lng: number | null | undefined): Coordinates | null {
  if (lat == null || lng == null) return null;
  const point = { lat, lng };
  return isPlausibleRideCoord(point) ? point : null;
}

export default function TripCollectSheet({ ride, onDone, footer }: TripCollectSheetProps) {
  const [passengerName, setPassengerName] = useState('the passenger');
  const [confirming, setConfirming] = useState(false);
  const [collected, setCollected] = useState(false);
  const [notReceived, setNotReceived] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [settled, setSettled] = useState<{ commission: number; keep: number } | null>(null);
  const isCash = (ride.payment_method || 'cash').toLowerCase() === 'cash';

  useEffect(() => {
    let cancelled = false;
    supabase.from('profiles').select('full_name').eq('user_id', ride.user_id).maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.full_name) setPassengerName(data.full_name.split(' ')[0]); });
    return () => { cancelled = true; };
  }, [ride.user_id]);

  useEffect(() => {
    if (!collected) return;
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
        try {
          const { earnings } = await getDriverWalletSummary();
          const match = earnings.find((entry) => entry.ride_id === ride.id);
          if (match) {
            if (!cancelled) setSettled({ commission: match.platform_fee, keep: match.driver_earnings });
            return;
          }
        } catch { /* Receipt remains available when the optional ledger is unavailable. */ }
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    })();
    return () => { cancelled = true; };
  }, [ride.id, collected]);

  const handleConfirm = async () => {
    if (confirming || collected) return;
    setConfirming(true);
    try {
      await confirmCashCollection(ride.id, isCash);
      haptic('medium');
      setCollected(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not confirm payment. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const saveRating = async (value: number) => {
    if (ratingSaved) return;
    setRating(value);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { toast.error('Please sign in to rate the rider.'); return; }
    const { data: driver, error: driverError } = await supabase.from('drivers').select('id').eq('user_id', auth.user.id).maybeSingle();
    if (driverError || !driver) { toast.error('Could not identify your driver account.'); return; }
    const { error } = await supabase.from('ride_passenger_ratings')
      .insert({ ride_id: ride.id, driver_id: driver.id, rating: value });
    if (error) toast.error('Could not save rating. Your cash confirmation is already saved.');
    else setRatingSaved(true);
  };

  const pickup = tripPoint(ride.pickup_lat, ride.pickup_lon);
  const dropoff = tripPoint(ride.dropoff_lat, ride.dropoff_lon);
  const screenLabel = collected ? 'Cash collected receipt' : 'Payment due';

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/20" />
        <Dialog.Content
          aria-label={screenLabel}
          className="fixed inset-y-0 left-1/2 z-[120] flex w-full max-w-[480px] -translate-x-1/2 flex-col overflow-y-auto overscroll-contain bg-white text-[#1f2129]"
          style={{ fontFamily: RIDE_FONT }}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="relative h-[clamp(144px,37dvh,342px)] shrink-0 bg-[#f1f3f6]">
            {pickup || dropoff ? (
              <LazyMapboxMap pickup={pickup} dropoff={dropoff} height="100%" bottomInset={32} />
            ) : (
              <p className="grid h-full place-items-center text-sm text-[#667085]">Trip map unavailable</p>
            )}
          </div>
          <RideGlassPanel variant="ribbon" handleWidth={56} className="-mt-2 flex-[1_0_auto]">
            <div className="flex flex-1 flex-col gap-3 px-5 pb-3">
              <span className="min-w-[168px] self-start rounded-full bg-[#ffeff1] px-3 py-1.5 text-center text-[10px] font-bold leading-tight text-[#111]">
                {collected ? 'TRIP COMPLETED' : 'PAYMENT DUE'}
              </span>
              <Dialog.Title className="text-[21px] font-bold leading-tight">
                {collected ? 'Trip completed' : isCash ? 'Collect cash payment' : 'Confirm payment'}
              </Dialog.Title>
              <Dialog.Description className="text-[12px] text-[#667085]">
                {collected ? 'Thanks for completing this CruiXe ride.' : isCash ? 'Confirm payment only after receiving the cash.' : 'Confirm that this payment has been received.'}
              </Dialog.Description>
              {collected ? (
                <>
                  <div className="rounded-[17px] border border-[#e7eaf0] px-3.5 py-3">
                    <p className="text-[10px] font-bold text-[#667085]">TRIP SUMMARY</p>
                    <div className="mt-2.5 flex items-center justify-between gap-3 text-sm">
                      <strong className="min-w-0 break-words">{ride.pickup_address || 'Pickup'}</strong>
                      <ArrowDown aria-hidden="true" className="shrink-0" size={15} />
                    </div>
                    <strong className="mt-2 block break-words text-sm">{ride.dropoff_address}</strong>
                    <p className="text-[11px] text-[#667085]">{passengerName} · {isCash ? 'Cash collected' : 'Payment confirmed'}</p>
                  </div>
                  <div className="flex min-h-[57px] items-center justify-between gap-3 rounded-[15px] bg-[#1f2129] px-3.5 py-2.5 text-white">
                    <span className="text-[10px] font-bold">TOTAL FARE</span>
                    <strong className="text-[24px] leading-tight">{fmtUSD(ride.fare)}</strong>
                  </div>
                  {settled ? (
                    <details className="text-xs text-[#667085]">
                      <summary>Driver earnings</summary>
                      <div className="mt-2 flex justify-between"><span>Platform fee</span><span>{fmtUSD(settled.commission)}</span></div>
                      <div className="mt-2 flex justify-between"><span>Net earnings</span><span>{fmtUSD(settled.keep)}</span></div>
                    </details>
                  ) : <p className="text-[11px] text-[#667085]">Platform fees and driver net earnings require ledger data.</p>}
                  {showRating && <div className="flex justify-center gap-3" aria-label="Rate rider">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} disabled={ratingSaved} style={{ minWidth: 44, minHeight: 44 }} aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`} onClick={() => void saveRating(value)}><Star fill={value <= rating ? '#ffdd00' : 'none'} color="#68717f" /></button>)}</div>}
                  <div className="flex gap-3">
                    <button type="button" className={`${actionClass} border border-primary text-[#111]`} aria-expanded={showRating} onClick={() => setShowRating((value) => !value)}>Rate rider</button>
                    <button type="button" className={`${actionClass} bg-primary text-primary-foreground`} onClick={onDone}>Return to Waiting Room</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[101px] rounded-[17px] border border-[#e7eaf0] p-4">
                    <p className="text-[10px] font-bold text-[#667085]">AMOUNT TO COLLECT</p>
                    <strong className="mt-2 block text-[36px] leading-tight">{fmtUSD(ride.fare)}</strong>
                  </div>
                  <div className="flex min-h-12 items-center rounded-[15px] bg-[#1f2129] px-3.5 py-2.5 text-[13px] font-semibold text-white">
                    Payment method: {isCash ? 'Cash' : ride.payment_method}
                  </div>
                  <p className="text-[11px] text-[#667085]" aria-live="polite">
                    {notReceived ? 'Payment is still due. Keep this screen open until you receive the cash.' : 'Never mark the fare paid before collecting it.'}
                  </p>
                  <div className="flex gap-3">
                    <button type="button" disabled={confirming} className={`${actionClass} border border-primary text-[#111]`} onClick={() => setNotReceived(true)}>Not received</button>
                    <button type="button" disabled={confirming} className={`${actionClass} bg-primary text-primary-foreground`} onClick={() => void handleConfirm()}>
                      {confirming ? 'Confirming…' : isCash ? 'Cash received' : 'Payment received'}
                    </button>
                  </div>
                </>
              )}
            </div>
            {footer}
          </RideGlassPanel>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
