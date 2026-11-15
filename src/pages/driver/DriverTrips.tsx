import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { getDriverProfile } from '@/lib/offerHelpers';
import DriverHistoryScreens, { type HistoryTrip } from '@/components/driver/DriverHistoryScreens';
export default function DriverTrips() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['driver-history', user?.id], enabled: !!user,
    queryFn: async () => {
      const profile = await getDriverProfile();
      if (!profile) throw new Error('A Driver profile is required.');
      const result = await supabase.from('rides').select('id,pickup_address,dropoff_address,fare,status,created_at,vehicle_type,payment_method,driver_collected_at,wallet_paid,payment_failed,distance_km,duration_minutes').eq('driver_id', profile.id).order('created_at', { ascending: false }).limit(50);
      if (result.error) throw result.error;
      return (result.data || []) as HistoryTrip[];
    },
  });
  if (isLoading || !user) return <main className="driver-records p-6" role="status">Loading trip history…</main>;
  if (error) return <main className="driver-records p-6"><p role="alert">Unable to load your trip history.</p><button className="dr-button mt-4" onClick={() => void refetch()}>Retry</button><button className="dr-button mt-4" onClick={() => navigate('/driver/profile')}>Back to Profile</button></main>;
  return <DriverHistoryScreens trips={data || []} onBack={() => navigate('/driver/profile')} />;
}
