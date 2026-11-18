import { useState } from 'react';
import { DriverAccountFormsScreen, type DriverAccountFormValues, type DriverAccountFormsScreenName } from '@/components/driver/DriverAccountForms';
import DriverSecuritySupport from '@/components/driver/DriverSecuritySupport';

const screens = [
  ['personal-edit', 'Edit personal details'], ['personal-review', 'Profile update review'],
  ['emergency', 'Emergency contact'], ['emergency-edit', 'Edit emergency contact'], ['emergency-review', 'Emergency contact review'],
  ['security', 'Account security'], ['password', 'Change password'], ['password-review', 'Password change review'],
  ['help', 'Help Centre'], ['support', 'Contact Support'],
] as const;

export default function DriverAccountScreenReview() {
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const [values, setValues] = useState<DriverAccountFormValues>({ fullName: 'Sample Driver', contactName: '', contactPhone: '' });
  const name = screens[index][0];
  const preview = () => setNotice('Preview only. No account changes were saved.');
  return <div className="bg-[#f4f5f7]">
    <aside className="mx-auto max-w-lg space-y-2 px-4 py-3 text-sm">
      <h1 className="font-bold">Driver account · 10 new screens</h1>
      <p>Staging visual review with sample values. No account changes, passwords or support requests are submitted.</p>
      <label htmlFor="account-screen" className="block">Screen {index + 1} of 10</label>
      <select id="account-screen" className="min-h-12 w-full rounded-xl border bg-white px-3 text-base" value={index} onChange={e => { setIndex(Number(e.target.value)); setNotice(''); }}>
        {screens.map(([id, title], i) => <option key={id} value={i}>{i + 1}. {title}</option>)}
      </select>
      {notice && <p role="status">{notice}</p>}
    </aside>
    {index < 5
      ? <DriverAccountFormsScreen screen={name as DriverAccountFormsScreenName} values={values} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} onBack={() => setIndex(0)} onPrimary={preview} saved={false} />
      : <DriverSecuritySupport key={name} initialScreen={name as 'security' | 'password' | 'password-review' | 'help' | 'support'} preview onBack={() => setIndex(0)} onNavigate={preview} />}
  </div>;
}
