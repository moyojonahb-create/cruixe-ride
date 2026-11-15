import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getDriverWalletSummary } from '@/lib/walletApi';
import { confirmCashCollection } from '@/lib/confirmCashCollection';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';
import LazyMapboxMap from '@/components/map/LazyMapboxMap';
import DriverLifecycleLayout from './DriverLifecycleLayout';
import { DriverCashBody, DriverReceiptBody } from './DriverFinishBodies';
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
  const isCash = (ride.payment_method || '').toLowerCase() === 'cash';
  const confirmationLock = useRef(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

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
          if (match && Number.isFinite(match.platform_fee) && Number.isFinite(match.driver_earnings)) {
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
    if (confirmationLock.current || collected || !isCash || !Number.isFinite(ride.fare)) return;
    confirmationLock.current = true;
    setConfirmationError(null);
    setConfirming(true);
    try {
      await confirmCashCollection(ride.id, isCash);
      haptic('medium');
      setCollected(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not confirm payment. Please try again.';
      setConfirmationError(message);
      toast.error(message);
    } finally {
      confirmationLock.current = false;
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
          <Dialog.Title className="sr-only">{collected ? 'Saved trip receipt' : 'Confirm cash payment'}</Dialog.Title>
          <Dialog.Description className="sr-only">Confirm actual cash received and review the saved trip receipt.</Dialog.Description>
          <DriverLifecycleLayout frameId={collected ? '1185:281' : '1185:198'} map={pickup || dropoff ? <LazyMapboxMap pickup={pickup} dropoff={dropoff} height="100%" bottomInset={32} /> : <p className="grid h-full place-items-center bg-[#f1f3f6] text-sm text-[#667085]">Trip map unavailable</p>} onBack={collected ? onDone : () => setNotReceived(true)} busy={confirming} footer={footer}>
            {collected ? <DriverReceiptBody pickup={ride.pickup_address || 'Pickup'} destination={ride.dropoff_address} passengerName={passengerName} fare={ride.fare} settled={settled} onRate={() => setShowRating(value => !value)} showRating={showRating} onDone={onDone}>
              {showRating && <div className="my-2 flex justify-center gap-3" aria-label="Rate rider">{[1,2,3,4,5].map(value => <button type="button" key={value} disabled={ratingSaved} className="min-h-11 min-w-11" aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`} onClick={() => void saveRating(value)}><Star fill={value <= rating ? '#ffdd00' : 'none'} color="#68717f" /></button>)}</div>}
            </DriverReceiptBody> : <DriverCashBody fare={ride.fare} isCash={isCash} paymentMethod={ride.payment_method} confirming={confirming} notReceived={notReceived} error={confirmationError} onNotReceived={() => setNotReceived(true)} onConfirm={() => void handleConfirm()} />}
          </DriverLifecycleLayout>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
