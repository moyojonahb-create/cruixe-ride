import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/** Recover accepted trips and unpaid cash when mobile Realtime drops events. */
export function useDriverTripRecovery(driverRowId: string | null, onRecover: () => void) {
  useEffect(() => {
    if (!driverRowId) return;
    let cancelled = false;
    let checking = false;
    let recovered = false;
    const checkTrip = async () => {
      if (cancelled || checking || recovered || document.visibilityState === 'hidden') return;
      checking = true;
      try {
        const { data, error } = await supabase.from('rides').select('id')
          .eq('driver_id', driverRowId)
          .or('status.in.(accepted,arrived,in_progress),and(status.eq.completed,payment_method.eq.cash,driver_collected_at.is.null)')
          .limit(1).maybeSingle();
        if (!cancelled && !recovered && !error && data) {
          recovered = true;
          onRecover();
        }
      } catch { /* Retry on the next mobile connection event or fallback poll. */ }
      finally { checking = false; }
    };
    void checkTrip();
    const channel = supabase.channel(`driver-active-trip-${driverRowId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `driver_id=eq.${driverRowId}` }, () => { void checkTrip(); })
      .subscribe();
    const timer = window.setInterval(() => { void checkTrip(); }, 5000);
    const resume = () => { void checkTrip(); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      void supabase.removeChannel(channel);
    };
  }, [driverRowId, onRecover]);
}
