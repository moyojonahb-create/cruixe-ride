import type { DriverProfile } from '@/lib/offerHelpers';
import './driverOnboardingFonts.css';

export type DriverDetailKind = 'personal' | 'contact' | 'vehicle';
export const DRIVER_DETAIL_TITLES = { personal: 'Personal details', contact: 'Contact details', vehicle: 'Vehicle details' };
const frameIds = { personal: '1349:140', contact: '1349:188', vehicle: '1349:234' };
const asset = '/brand/driver-hub';
const card = 'rounded-[18px] bg-white px-4 py-4';

export default function DriverDetailScreen({ kind, fullName, phone, email, profile, onBack, onEdit }: {
  kind: DriverDetailKind;
  fullName: string;
  phone: string | null;
  email: string | null;
  profile: Pick<DriverProfile, 'gender' | 'status' | 'vehicle_make' | 'vehicle_model' | 'vehicle_color' | 'vehicle_type' | 'plate_number'>;
  onBack: () => void;
  onEdit: () => void;
}) {
  const personal = kind === 'personal';
  const vehicle = kind === 'vehicle';
  const model = [profile.vehicle_make, profile.vehicle_model].filter(Boolean).join(' ');
  const rows = personal
    ? [['Full name', fullName], ['Gender', profile.gender], ['Application status', profile.status]]
    : vehicle
      ? [['Vehicle model', model], ['Registration plate', profile.plate_number], ['Vehicle color', profile.vehicle_color], ['Vehicle category', profile.vehicle_type]]
      : [['Email address', email], ['Phone number', phone]];
  const intro = personal ? 'Review the personal information associated with your driver account.' : vehicle ? 'Your registered vehicle information and verification.' : 'Keep your email and mobile contact information current.';
  const title = personal ? 'Protecting your identity' : vehicle ? 'Document changes' : 'Security & verification';
  const description = personal ? 'Changes to identity details may require verification before approval.' : vehicle ? 'Document and vehicle changes are reviewed before the updated vehicle is approved.' : 'Contact changes may require verification before becoming active.';

  return <main data-figma-node={frameIds[kind]} className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col bg-[#f2f3f5] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <header className="flex items-center gap-2 bg-white px-4 pb-3 pt-[max(36px,env(safe-area-inset-top))]">
      <button type="button" aria-label="Back to Driver profile" onClick={onBack} className="grid size-11 shrink-0 place-items-center rounded-full shadow-md"><img src={asset + '/BackArrow.svg'} alt="" /></button>
      <h1 className="flex-1 text-[20px] font-bold capitalize">{DRIVER_DETAIL_TITLES[kind]}</h1>
      {(personal || vehicle) && <img src={asset + (personal ? '/IconUser.svg' : '/IconCar.svg')} alt="" />}
    </header>
    <div className="flex-1 space-y-6 px-[18px] py-4">
      <p className="text-xs leading-5 text-[#667080]">{intro}</p>
      {(personal || vehicle) && <div className={`flex items-center gap-4 rounded-[18px] border-t-[5px] px-4 py-5 text-white ${vehicle ? 'border-[#161118] bg-primary' : 'border-[#c78453] bg-[#703a21]'}`}>
        {vehicle ? <img src={asset + '/IconCar1.svg'} alt="" /> : <span aria-hidden="true" className="grid size-[65px] shrink-0 place-items-center rounded-full bg-[#fff3e0] text-2xl font-bold text-[#703a21]">{fullName.trim().charAt(0).toUpperCase()}</span>}
        <div className="min-w-0">
          <p className="break-words text-[21px] font-bold">{vehicle ? model || 'Vehicle' : fullName}</p>
          <p className="mt-1 text-xs">{vehicle ? 'Registered vehicle' : profile.status === 'approved' ? 'Verified driver' : 'Driver account'}</p>
        </div>
      </div>}
      <section className={card}>
        <h2 className="text-[15px] font-bold">{personal ? 'Identity' : vehicle ? 'Vehicle information' : 'Contact information'}</h2>
        <dl className="divide-y divide-[#e4e7ed]">
          {rows.map(([label, value]) => <div key={label} className="min-h-[67px] py-3"><dt className="text-[10px] text-[#667080]">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value || 'Not provided'}</dd></div>)}
        </dl>
      </section>
      <section className={`flex items-start gap-3 ${card}`}>
        <img src={asset + '/IconInformation.svg'} alt="" />
        <div><h2 className="text-[13px] font-semibold">{title}</h2><p className="mt-2 text-[11px] leading-4 text-[#667080]">{description}</p></div>
      </section>
      {kind === 'contact' && <section className={`flex items-start gap-3 ${card}`}>
        <img src={asset + '/IconMail.svg'} alt="" />
        <div><h2 className="text-[13px] font-semibold">Contact verification</h2><p className="mt-2 text-[11px] leading-4 text-[#667080]">Manage verification through Account security.</p><a className="mt-2 inline-block text-xs font-semibold text-primary underline" href="mailto:support@pickme.co.zw">Contact support</a></div>
      </section>}
    </div>
    <footer className="sticky bottom-0 grid grid-cols-2 gap-2 bg-white px-[18px] pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
      <button type="button" onClick={onBack} className="min-h-[52px] rounded-[14px] border border-primary px-2 text-sm font-semibold">Back to Profile</button>
      <button type="button" onClick={onEdit} className="min-h-[52px] rounded-[14px] bg-primary px-2 text-sm font-semibold text-white">{personal ? 'Edit details' : vehicle ? 'Vehicle records' : 'Account security'}</button>
    </footer>
  </main>;
}
