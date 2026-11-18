import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DriverProfile } from '@/lib/offerHelpers';

export type DriverDetailKind = 'personal' | 'contact' | 'vehicle';
export const DRIVER_DETAIL_TITLES = { personal: 'Personal details', contact: 'Contact details', vehicle: 'Vehicle details' };

/** Uses canonical account values. Missing values must never imply verification. */
export default function DriverDetailScreen({ kind, fullName, phone, email, profile, onBack, onDocuments }: {
  kind: DriverDetailKind;
  fullName: string;
  phone: string | null;
  email: string | null;
  profile: Pick<DriverProfile, 'gender' | 'status' | 'vehicle_make' | 'vehicle_model' | 'vehicle_color' | 'vehicle_type' | 'plate_number'>;
  onBack: () => void;
  onDocuments: () => void;
}) {
  const rows: [string, string | null][] = kind === 'personal'
    ? [['Full name', fullName], ['Gender', profile.gender], ['Application status', profile.status]]
    : kind === 'contact'
      ? [['Mobile number', phone], ['Email address', email]]
      : [['Make', profile.vehicle_make], ['Model', profile.vehicle_model], ['Colour', profile.vehicle_color], ['Registration plate', profile.plate_number], ['Service', profile.vehicle_type]];
  return <main className="mx-auto min-h-[100dvh] w-full max-w-lg bg-[#F2F4F7] px-5 pb-10 pt-5 text-[#1f2129]">
    <header className="mb-7 flex items-center gap-3">
      <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full" aria-label="Back to Driver profile" onClick={onBack}><ChevronLeft /></Button>
      <h1 className="text-2xl font-bold">{DRIVER_DETAIL_TITLES[kind]}</h1>
    </header>
    <dl className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white px-5 shadow-sm">
      {rows.map(([label, value]) => <div key={label} className="py-5"><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 break-words text-base font-semibold">{value || 'Not provided'}</dd></div>)}
    </dl>
    <p className="my-5 text-sm leading-6 text-slate-600">{kind === 'contact' ? 'These are your current account contact details. Contact support if they need correcting.' : 'These details come from your Driver account. Documents and approval are managed separately.'}</p>
    {kind === 'contact'
      ? <a href="mailto:support@pickme.co.zw" className="flex min-h-12 items-center justify-center rounded-xl bg-[#ff000d] px-4 font-semibold text-white">Contact support</a>
      : <Button className="min-h-12 w-full rounded-xl bg-[#ff000d] text-base text-white" onClick={onDocuments}>View application and documents</Button>}
  </main>;
}
