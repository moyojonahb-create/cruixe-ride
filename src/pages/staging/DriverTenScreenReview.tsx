import { useState } from 'react';
import DriverRegistrationWizard from '@/components/driver/DriverRegistrationWizard';
import DriverDetailScreen, { type DriverDetailKind } from '@/components/driver/DriverDetailScreen';
import '@/components/driver/driverOnboardingFonts.css';

const screens = ['Profile photo', 'Identity', 'Licence', 'Vehicle details', 'Vehicle documents', 'Vehicle photos', 'Application review', 'Personal details', 'Contact details', 'Vehicle profile'];
const kinds: DriverDetailKind[] = ['personal', 'contact', 'vehicle'];
const sample = { gender: null, status: 'Preview only', vehicle_make: null, vehicle_model: null, vehicle_color: null, vehicle_type: null, plate_number: null };

export default function DriverTenScreenReview() {
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState('');
  return <div className="min-h-screen bg-[#f2f4f7]">
    <aside className="mx-auto max-w-lg space-y-2 p-4 text-sm">
      <p className="font-bold">Driver screens · staging review</p>
      <p>Preview only. No application, upload or account change is submitted. Figma comparison is pending.</p>
      <label className="block" htmlFor="driver-screen">Screen {index + 1} of 10</label>
      <select id="driver-screen" className="min-h-12 w-full rounded-xl border bg-white px-3 text-base" value={index} onChange={e => { setIndex(Number(e.target.value)); setNotice(''); }}>
        {screens.map((name, i) => <option key={name} value={i}>{i + 1}. {name}</option>)}
      </select>
      {notice && <p role="status">{notice}</p>}
    </aside>
    {index < 7
      ? <DriverRegistrationWizard key={index} previewStep={index + 1} onSuccess={() => {}} onClose={() => setIndex(0)} />
      : <DriverDetailScreen kind={kinds[index - 7]} fullName="Sample Driver" phone={null} email={null} profile={sample} onBack={() => setIndex(0)} onDocuments={() => setNotice('Preview only. Sign in to staging to view your application.')} />}
  </div>;
}
