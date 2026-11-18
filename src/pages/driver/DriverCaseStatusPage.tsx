import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DriverWalletFrame, { walletAction, walletPanel } from '@/components/driver/DriverWalletFrame';

const caseTypes = {
  fare: { frame: '1376:140', title: 'Fare Dispute Status', category: 'fare_dispute', heading: 'Fare dispute updates', description: 'Track a fare correction or payment dispute.' },
  safety: { frame: '1376:206', title: 'Safety Case Status', category: 'safety_concern', heading: 'Safety first. Always.', description: 'Review status and authorized follow-up.' },
} as const;

export default function DriverCaseStatusPage() {
  const { kind } = useParams();
  if (kind !== 'fare' && kind !== 'safety') return <Navigate to="/driver/profile" replace />;
  return <DriverCaseStatus key={kind} kind={kind} />;
}

function DriverCaseStatus({ kind }: { kind: keyof typeof caseTypes }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const content = caseTypes[kind];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cases = useQuery({
    queryKey: ['driver-dispute-status', user?.id, content.category],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('disputes')
        .select('id, ride_id, status, admin_response')
        .eq('reporter_id', user.id)
        .eq('reporter_role', 'driver')
        .eq('category', content.category)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const ownCases = cases.data ?? [];
  const selected = ownCases.find(record => record.id === selectedId) ?? ownCases[0];
  const rows = selected ? [
    [kind === 'fare' ? 'Affected trip' : 'Case number', kind === 'fare' ? selected.ride_id : selected.id],
    ['Review status', selected.status],
    ['Resolution', selected.admin_response || 'No response recorded'],
  ] : [];
  const close = () => navigate('/driver/profile');

  return <DriverWalletFrame frame={content.frame} title={content.title} onBack={close} headerIcon={<span className="size-7 rounded-full bg-primary" aria-hidden="true" />}
    footer={<div className="grid grid-cols-2 gap-2">
      <button type="button" className="min-h-12 rounded-[14px] border border-primary px-2 text-sm font-semibold" onClick={close}>Back to Profile</button>
      <button type="button" className={walletAction} onClick={() => navigate(kind === 'fare' ? '/driver/trips' : '/driver/account/support')}>{kind === 'fare' ? 'View Trip History' : 'Contact Support'}</button>
    </div>}>
    <section className="rounded-[20px] border-t-[6px] border-[#161118] bg-primary p-5 text-center text-white">
      <h2 className="font-bold">{content.heading}</h2><p className="mt-3 text-xs">{content.description}</p>
    </section>
    <h2 className="pt-2 text-lg font-bold">Case overview</h2>
    <section className={`border-l-[5px] border-[#161118] ${walletPanel}`}>
      {cases.isPending ? <p role="status">Loading cases…</p> : cases.isError ? <div role="alert"><p>Cases could not be loaded.</p><button type="button" className="mt-2 min-h-11 text-sm font-semibold text-primary" onClick={() => void cases.refetch()}>Try again</button></div> : !selected ? <p>No {kind === 'fare' ? 'fare disputes' : 'safety cases'} found.</p> : <>
        {ownCases.length > 1 && <label className="mb-3 block text-xs font-semibold">Choose a case
          <select className="mt-1 block min-h-11 w-full rounded-lg border px-2" value={selected.id} onChange={event => setSelectedId(event.target.value)}>
            {ownCases.map(record => <option value={record.id} key={record.id}>{record.id.slice(0, 8)} · {record.status}</option>)}
          </select>
        </label>}
        <dl className="divide-y divide-[#e4e7ed]">{rows.map(([label, value]) => <div key={label} className="min-h-20 py-3">
          <dt className="border-l-[3px] border-primary pl-2 text-xs font-semibold">{label}</dt>
          <dd className="mt-2 whitespace-pre-line break-words pl-3 text-xs text-[#667080]">{value}</dd>
        </div>)}</dl>
      </>}
    </section>
    <p className={`text-xs leading-5 ${walletPanel}`}>{kind === 'safety' ? 'For immediate danger, contact local emergency services.' : 'Status updates appear here when recorded by the support team.'}</p>
  </DriverWalletFrame>;
}
