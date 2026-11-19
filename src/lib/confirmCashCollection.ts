import { goBackend } from '@/lib/goBackendClient';
import { isGoBackendConfigured } from '@/lib/rideMatching';
import { supabase } from '@/lib/supabaseClient';

/** Only dismiss collection after the driver's acknowledgement is persisted. */
export async function confirmCashCollection(rideId: string, isCash = true): Promise<void> {
  // This marker acknowledges physical cash only. A wallet/card completion must
  // be established by its payment service, never by this legacy write path.
  if (!isCash) {
    throw new Error('Non-cash payments must be confirmed by the payment service.');
  }

  if (isGoBackendConfigured()) {
    const result = await goBackend.post<{ driver_collected_at?: string; payment_status?: string }>(
      `/api/rides/${encodeURIComponent(rideId)}/confirm-cash`,
    );
    if (!result.driver_collected_at || result.payment_status !== 'paid') {
      throw new Error('Cash confirmation was not saved. Please try again.');
    }
    return;
  }

  // Legacy deployments retain their existing RLS-protected collection marker.
  // Guard the write so retrying a saved confirmation preserves its timestamp.
  const { error } = await supabase.from('rides')
    .update({ driver_collected_at: new Date().toISOString() } as never)
    .eq('id', rideId).eq('status', 'completed').eq('payment_method', 'cash').is('driver_collected_at', null);
  if (error) throw new Error(error.message);
  const { data, error: readError } = await supabase.from('rides')
    .select('driver_collected_at').eq('id', rideId).eq('status', 'completed').eq('payment_method', 'cash').maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!(data as { driver_collected_at?: string } | null)?.driver_collected_at) {
    throw new Error('Payment confirmation was not saved. Please try again.');
  }
}
