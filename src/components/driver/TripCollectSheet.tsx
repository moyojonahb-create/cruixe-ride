import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowDown, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getDriverWalletSummary } from '@/lib/walletApi';
import { confirmCashCollection } from '@/lib/confirmCashCollection';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';
import RideGlassPanel from '@/components/ride/RideGlassPanel';
import { RIDE_RED, RIDE_TEXT, RIDE_TEXT_2 } from '@/components/ride/rideGlass';

interface TripCollectSheetProps {
  ride: { id: string; fare: number; payment_method: string; pickup_address?: string; dropoff_address: string; user_id: string };
  onDone: () => void;
}

const fmtUSD = (value: number) => `$${value.toFixed(2)}`;

export default function TripCollectSheet({ ride, onDone }: TripCollectSheetProps) {
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

  const actionStyle: CSSProperties = { minHeight: 48, minWidth: 0, borderRadius: 15, fontSize: 15, fontWeight: 700, flex: 1, whiteSpace: 'normal', lineHeight: 1.25, padding: '8px 10px' };
  return (
    <>
      <div className="fixed inset-0 z-[110]" style={{ background: 'rgba(17,17,17,.18)' }} />
      <div className="fixed left-0 right-0 bottom-0 z-[120]" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <RideGlassPanel panelStyle={{ background: '#fff' }} style={{ maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <section aria-label={collected ? 'Cash collected receipt' : 'Payment due'} className="overflow-y-auto p-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ alignSelf: 'flex-start', minWidth: 168, padding: '6px 12px', textAlign: 'center', borderRadius: 999, background: '#fff0f2', fontSize: 10, fontWeight: 700, color: RIDE_TEXT }}>
              {collected ? 'TRIP COMPLETED' : 'PAYMENT DUE'}
            </span>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: RIDE_TEXT }}>{collected ? 'Trip completed' : isCash ? 'Collect cash payment' : 'Confirm payment'}</h2>
              <p style={{ marginTop: 10, fontSize: 12, color: RIDE_TEXT_2 }}>{collected ? 'Thanks for completing this CruiXe ride.' : isCash ? 'Confirm payment only after receiving the cash.' : 'Confirm that this payment has been received.'}</p>
            </div>
            {collected ? (
              <>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 17, padding: 15 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: RIDE_TEXT_2 }}>TRIP SUMMARY</p>
                  <div className="flex items-center justify-between mt-3"><strong>{ride.pickup_address || 'Pickup'}</strong><ArrowDown aria-hidden="true" size={18} /></div>
                  <strong className="block mt-3">{ride.dropoff_address}</strong>
                  <p style={{ fontSize: 11, color: RIDE_TEXT_2 }}>{passengerName} · {isCash ? 'Cash collected' : 'Payment confirmed'}</p>
                </div>
                <div className="flex items-center justify-between" style={{ borderRadius: 15, background: '#202129', color: '#fff', padding: 15 }}>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>TOTAL FARE</span><strong style={{ fontSize: 26 }}>{fmtUSD(ride.fare)}</strong>
                </div>
                {settled ? (
                  <details style={{ fontSize: 12, color: RIDE_TEXT_2 }}><summary>Driver earnings</summary><div className="flex justify-between mt-2"><span>Platform fee</span><span>{fmtUSD(settled.commission)}</span></div><div className="flex justify-between mt-2"><span>Net earnings</span><span>{fmtUSD(settled.keep)}</span></div></details>
                ) : <p style={{ fontSize: 11, color: RIDE_TEXT_2 }}>Platform fees and driver net earnings require ledger data.</p>}
                {showRating && <div className="flex justify-center gap-3" aria-label="Rate rider">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} disabled={ratingSaved} style={{ minWidth: 44, minHeight: 44 }} aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`} onClick={() => void saveRating(value)}><Star fill={value <= rating ? '#ffdd00' : 'none'} color="#68717f" /></button>)}</div>}
                <div className="flex gap-3"><button type="button" style={{ ...actionStyle, border: `1px solid ${RIDE_RED}`, color: RIDE_TEXT }} onClick={() => setShowRating((value) => !value)}>Rate rider</button><button type="button" style={{ ...actionStyle, background: RIDE_RED, color: '#fff' }} onClick={onDone}>Return to Waiting Room</button></div>
              </>
            ) : (
              <>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 17, padding: 15 }}><p style={{ fontSize: 10, fontWeight: 700, color: RIDE_TEXT_2 }}>AMOUNT TO COLLECT</p><strong style={{ display: 'block', marginTop: 10, fontSize: 36, color: RIDE_TEXT }}>{fmtUSD(ride.fare)}</strong></div>
                <div style={{ borderRadius: 15, background: '#202129', color: '#fff', padding: 15, fontSize: 14, fontWeight: 600 }}>Payment method: {isCash ? 'Cash' : ride.payment_method}</div>
                <p style={{ fontSize: 11, color: RIDE_TEXT_2 }}>{notReceived ? 'Payment is still due. Keep this screen open until you receive the cash.' : 'Never mark the fare paid before collecting it.'}</p>
                <div className="flex gap-3"><button type="button" disabled={confirming} style={{ ...actionStyle, border: `1px solid ${RIDE_RED}`, color: RIDE_TEXT }} onClick={() => setNotReceived(true)}>Not received</button><button type="button" disabled={confirming} style={{ ...actionStyle, background: RIDE_RED, color: '#fff', opacity: confirming ? .7 : 1 }} onClick={() => void handleConfirm()}>{confirming ? 'Confirming…' : isCash ? 'Cash received' : 'Payment received'}</button></div>
              </>
            )}
          </section>
        </RideGlassPanel>
      </div>
    </>
  );
}
