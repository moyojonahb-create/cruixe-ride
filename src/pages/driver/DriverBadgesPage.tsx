import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getDriverProfile } from '@/lib/offerHelpers';
import { supabase } from '@/lib/supabaseClient';
import DriverBadgeScreens, { type BadgeScreen } from '@/components/driver/DriverBadgeScreens';
export async function loadDriverBadgeActivity() {
  const profile = await getDriverProfile();
  if (!profile) throw new Error('Driver profile unavailable');
  const results = await Promise.all([
    supabase.from('rides').select('id', { count: 'exact', head: true }).eq('driver_id', profile.id).eq('status', 'completed').neq('vehicle_type', 'parcel'),
    supabase.from('rides').select('id', { count: 'exact', head: true }).eq('driver_id', profile.id).eq('status', 'completed').eq('vehicle_type', 'parcel'),
  ]);
  if (results.some(result => result.error || result.count === null)) throw new Error('Activity unavailable');
  return { rides: results[0].count!, parcels: results[1].count!, status: profile.status };
}
export default function DriverBadgesPage() {
  const { screen = 'progress' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['driver-badge-activity', user?.id], queryFn: loadDriverBadgeActivity, enabled: !!user });
  if (!['progress','achievements','requirements'].includes(screen)) return <Navigate to="/driver/badges/progress" replace />;
  return <DriverBadgeScreens screen={screen as BadgeScreen} activity={query.data ?? null} loading={query.isLoading} error={query.isError ? 'We couldn’t load your activity. Please try again.' : undefined} onRetry={() => void query.refetch()} onScreen={next => navigate(`/driver/badges/${next}`)} onProfile={() => navigate('/driver/profile')} />;
}
