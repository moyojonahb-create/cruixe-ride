import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDriverApplication } from '@/hooks/useDriverApplication';
import DriverRecords from '@/components/driver/DriverRecords';
import { RECORD_SCREENS, type RecordsScreen } from '@/components/driver/DriverRecordsScreen';
export default function DriverRecordsPage() {
  const { screen = 'verification' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { driverProfile, documents, isLoading, error, refetchDriver } = useDriverApplication();
  const back = () => navigate('/driver/profile');
  if (isLoading) return <main className="driver-records p-6" role="status">Loading Driver records…</main>;
  if (error) return <main className="driver-records p-6"><p role="alert">Unable to load Driver records.</p><button className="dr-button mt-4" onClick={() => { void refetchDriver(); void queryClient.invalidateQueries({ queryKey: ['driver-documents'] }); }}>Retry</button><button className="dr-button mt-4" onClick={back}>Back to Profile</button></main>;
  if (!driverProfile) return <main className="driver-records p-6"><p>Create your Driver profile before managing records.</p><button className="dr-button mt-4" onClick={() => navigate('/driver/application')}>Open application</button></main>;
  const valid = RECORD_SCREENS.slice(0, 7).some(row => row[0] === screen) ? screen as RecordsScreen : 'verification';
  return <DriverRecords key={`${driverProfile.id}-${valid}`} initialScreen={valid} profile={driverProfile} documents={documents} userId={user?.id} onBack={back} onRefresh={() => { void queryClient.invalidateQueries({ queryKey: ['driver-profile'] }); void queryClient.invalidateQueries({ queryKey: ['driver-documents'] }); }} />;
}
