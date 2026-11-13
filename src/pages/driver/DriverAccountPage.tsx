import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import DriverAccountForms from '@/components/driver/DriverAccountForms';
import DriverSecuritySupport from '@/components/driver/DriverSecuritySupport';

const formScreens = ['personal-edit', 'emergency', 'emergency-edit'] as const;
const securityScreens = ['security', 'password', 'help', 'support'] as const;

export default function DriverAccountPage() {
  const { screen = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isForm = formScreens.some(value => value === screen);
  const profile = useQuery({
    queryKey: ['driver-account-fields', user?.id],
    enabled: Boolean(user?.id) && isForm,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles')
        .select('full_name, emergency_contact_name, emergency_contact_phone')
        .eq('user_id', user!.id).maybeSingle();
      if (error || !data) throw new Error('Could not load your account details.');
      return data as unknown as { full_name: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null };
    },
  });
  const back = () => navigate('/driver/profile');
  if (isForm) {
    if (profile.isError) return <main className="mx-auto max-w-lg space-y-4 p-6"><h1 className="text-xl font-bold">Account details unavailable</h1><p>Please try again before editing.</p><button className="min-h-11 rounded-xl border px-4" onClick={() => profile.refetch()}>Try again</button><button className="ml-3 min-h-11 underline" onClick={back}>Back to profile</button></main>;
    if (!profile.data) return <p role="status" className="p-6">Loading account details…</p>;
    return <DriverAccountForms key={`${screen}-${user?.id}`} initialScreen={screen as typeof formScreens[number]} initialFullName={profile.data.full_name || ''} initialContact={profile.data.emergency_contact_phone ? { name: profile.data.emergency_contact_name || '', phone: profile.data.emergency_contact_phone } : null} onBack={back} onSaved={() => { void profile.refetch(); }} />;
  }
  if (securityScreens.some(value => value === screen)) return <DriverSecuritySupport key={screen} initialScreen={screen as typeof securityScreens[number]} onBack={back} onNavigate={target => navigate({ personal: '/driver/account/personal-edit', emergency: '/driver/account/emergency', documents: '/driver/application', wallet: '/driver/wallet' }[target])} />;
  // A copied review URL must never manufacture a successful account change.
  return <Navigate to="/driver/profile" replace />;
}
