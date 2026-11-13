import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateMyProfile } from '@/lib/businessApi';
import { saveRiderEmergencyContact, type RiderEmergencyContact } from '@/lib/riderEmergencyContact';
import '@/components/driver/driverOnboardingFonts.css';

export type DriverAccountFormsScreenName = 'personal-edit' | 'personal-review' | 'emergency' | 'emergency-edit' | 'emergency-review';
export interface DriverAccountFormValues { fullName: string; contactName: string; contactPhone: string }
export interface DriverAccountFormsScreenProps {
  screen: DriverAccountFormsScreenName;
  values: DriverAccountFormValues;
  onChange: (key: keyof DriverAccountFormValues, value: string) => void;
  onBack: () => void;
  onPrimary: () => void;
  busy?: boolean;
  error?: string | null;
  saved?: boolean;
}
const assets = (id: string) => `/brand/driver-account/${id.replace(':', '-')}.svg`;
const definitions = {
  'personal-edit': { title: 'Edit Personal Details', back: '1478:289', icon: null },
  'personal-review': { title: 'Profile Update Review', back: '1478:339', icon: '1367:151' },
  emergency: { title: 'Emergency Contact', back: '1478:264', icon: '1356:151' },
  'emergency-edit': { title: 'Edit Emergency Contact', back: '1478:314', icon: null },
  'emergency-review': { title: 'Emergency Contact Review', back: '1478:364', icon: '1367:379' },
};
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0 rounded-[13px] bg-[#f4f5f7] px-3 py-2 shadow-[-4px_0_0_#ff000d]"><label className="block text-[11px] font-semibold leading-5 text-[#737882]">{label}{children}</label></div>;
}
function Note({ children, icon }: { children: ReactNode; icon?: string }) {
  return <div className="flex min-h-[86px] items-start gap-3 rounded-[16px] bg-white px-[14px] py-4 shadow-[-6px_5px_0_#1a1c24]">
    <span className="grid h-[35px] w-[35px] shrink-0 place-items-center rounded-[11px] bg-[#fff0f2]">{icon ? <img src={assets(icon)} alt="" /> : <span className="text-base font-bold text-[#111]">i</span>}</span>
    <div className="text-[11px] leading-[18px] text-[#737882]">{children}</div>
  </div>;
}
export function DriverAccountFormsScreen({ screen, values, onChange, onBack, onPrimary, busy = false, error, saved = false }: DriverAccountFormsScreenProps) {
  const definition = definitions[screen];
  const personal = screen.startsWith('personal');
  const edit = screen.endsWith('edit');
  const review = screen.endsWith('review');
  const inputClass = 'h-[36px] min-w-0 border-0 bg-transparent px-0 text-base font-normal text-[#1f2129] shadow-none disabled:opacity-70';
  const primary = edit ? 'Save Changes' : review ? (personal ? 'Edit Personal Details' : 'Back to Contact') : 'Edit Contact';
  const reviewRows = personal
    ? [['Request', 'Personal information'], ['Save status', saved ? 'Saved' : 'Not submitted'], ['Driver profile', values.fullName || 'Not provided']]
    : [['Full name', values.contactName || 'Not provided'], ['Mobile number', values.contactPhone || 'Not provided'], ['Relationship', 'Not available']];
  return <main data-driver-account-screen={screen} className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col bg-[#f4f5f7] font-['Poppins',sans-serif] text-[#21242b] [&_h1]:font-[inherit] [&_h2]:font-[inherit] [&_h1]:tracking-normal [&_h2]:tracking-normal">
    <header className="flex min-h-[76px] items-center gap-2 bg-white px-[14px] py-3">
      <button type="button" disabled={busy} aria-label="Back to Profile" onClick={onBack} className="grid h-[47px] w-[47px] shrink-0 place-items-center rounded-full bg-white shadow-[0_3px_4px_rgba(0,0,0,0.07)] disabled:opacity-50"><img src={assets(definition.back)} alt="" /></button>
      <h1 className="min-w-0 flex-1 text-[18px] font-bold leading-[26px]">{definition.title}</h1>
      {definition.icon ? <span className="grid h-[33px] w-[33px] shrink-0 place-items-center rounded-[10px] bg-[#fff0f2]"><img src={assets(definition.icon)} alt="" /></span> : <span aria-hidden="true" className="h-[25px] w-[25px] shrink-0 rounded-[10px] bg-[#ff000d]" />}
    </header>
    <div className="min-w-0 flex-1 px-[18px] pb-8">
      {edit ? <>
        <p className="mb-[39px] mt-[17px] text-[12px] leading-[21px] text-[#737882]">Manage your driver account information.</p>
        <form id="driver-account-form" onSubmit={e => { e.preventDefault(); if (!busy) onPrimary(); }} className="space-y-3 rounded-[18px] bg-white p-[15px]">
          <h2 className="mb-1 text-[16px] font-bold">Account information</h2>
          <fieldset disabled={busy} className="min-w-0 space-y-3">
            {personal ? <>
              <Field label="Display name"><Input className={inputClass} value={values.fullName} readOnly aria-describedby="personal-limitations" /></Field>
              <Field label="Full legal name"><Input className={inputClass} value={values.fullName} autoComplete="name" maxLength={120} required onChange={e => onChange('fullName', e.target.value)} /></Field>
              <Field label="Date of birth"><Input className={inputClass} value="Not available" disabled /></Field>
              <Field label="Home address"><Input className={inputClass} value="Not available" disabled /></Field>
            </> : <>
              <Field label="Full name"><Input className={inputClass} value={values.contactName} maxLength={120} required autoComplete="name" placeholder="Enter contact name" onChange={e => onChange('contactName', e.target.value)} /></Field>
              <Field label="Mobile number"><Input className={inputClass} value={values.contactPhone} required type="tel" autoComplete="tel" placeholder="+263 7X XXX XXXX" onChange={e => onChange('contactPhone', e.target.value)} /></Field>
              <Field label="Relationship"><Input className={inputClass} value="Not available" disabled /></Field>
            </>}
          </fieldset>
        </form>
        <div className="mt-5"><Note><p id="personal-limitations">{personal ? 'Your display name uses your full legal name. Date of birth and address editing are not available yet.' : 'Only your contact’s name and mobile number are saved. Relationship editing is not available yet.'}</p></Note></div>
      </> : review ? <>
        <div className="relative mt-3 flex min-h-[86px] items-center gap-3 rounded-[20px] bg-[#ff000d] px-5 py-4 shadow-[0_-7px_0_#161118]">
          {!personal && <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[5px]" style={{ backgroundImage: 'linear-gradient(1.049deg, #ff000d 34.286%, #ffd11c 105.71%)' }} />}
          <img src={assets(personal ? '1382:50' : '1367:387')} alt="" />
          <div><h2 className={`text-[17px] font-bold ${personal ? 'text-[#111]' : 'text-white'}`}>{saved ? (personal ? 'Profile changes saved' : 'Emergency contact saved') : (personal ? 'Changes ready for review' : 'Contact update preview')}</h2><p className="mt-1 text-[11px] leading-5 text-[#111]">{saved ? 'Your account has been updated.' : 'Preview only. No changes have been submitted.'}</p></div>
        </div>
        <h2 className="mb-[18px] mt-9 text-[18px] font-bold">Review details</h2>
        <dl className="divide-y divide-[#e5e9ed] rounded-[17px] bg-white px-4 shadow-[-5px_0_0_#161118]">{reviewRows.map(([label, value]) => <div key={label} className="relative min-h-[79px] py-3">{personal && <span aria-hidden="true" className="absolute -left-[11px] top-4 h-[34px] w-[3.5px] rounded-[3px] bg-[#ff000d]" />}<dt className="text-[11px] text-[#737882]">{label}</dt><dd className="mt-2 break-words text-[13px] font-semibold">{value}</dd></div>)}</dl>
        <div className="mt-6"><Note icon={personal ? '1382:78' : '1367:404'}>{saved ? 'Saved account details do not change your Driver approval status.' : 'This is a visual review only. Details must not change until they are saved securely.'}</Note></div>
      </> : <>
        <p className="mb-[42px] mt-[17px] text-[12px] text-[#737882]">A trusted contact for urgent situations.</p>
        <div className="relative flex min-h-[86px] items-center gap-5 rounded-[20px] bg-[#ff000d] px-6 py-4 shadow-[0_-7px_0_#161118]"><span aria-hidden="true" className="absolute inset-x-4 top-0 h-[5px]" style={{ backgroundImage: 'linear-gradient(1.049deg, #ff000d 34.286%, #ffd11c 105.71%)' }} /><img src={assets('1356:166')} alt="" /><div><h2 className="text-[20px] font-bold text-white">Trusted Contact</h2><p className="text-[11px] text-[#111]">{values.contactPhone ? 'Contact saved' : 'No contact saved'}</p></div></div>
        <dl className="mb-6 mt-[45px] space-y-[14px]">{reviewRows.map(([label, value]) => <div key={label} className="min-h-[76px] rounded-[15px] px-[14px] py-2 shadow-[-4px_0_0_#ff000d]"><dt className="text-[11px] text-[#737882]">{label}</dt><dd className="mt-2 break-words text-[13px] font-semibold">{value}</dd></div>)}</dl>
        <Note icon="1356:181"><h2 className="mb-1 text-[13px] font-semibold text-[#21242b]">Emergency contact privacy</h2>Only authorized support staff should access this contact when legitimately required.</Note>
        <Button variant="outline" onClick={onPrimary} className="mt-6 min-h-12 w-full rounded-[13px] border-[#ff000d] bg-white text-[12px] font-semibold">Edit Emergency Contact</Button>
      </>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
    <footer className="sticky bottom-0 grid grid-cols-2 gap-[10px] bg-white px-[18px] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[13px]">
      <Button disabled={busy} variant="outline" className="min-h-[52px] whitespace-normal rounded-[14px] border-[#ff000d] bg-white px-1 text-[14px] font-semibold text-[#111]" onClick={onBack}>Back to Profile</Button>
      <Button disabled={busy} form={edit ? 'driver-account-form' : undefined} type={edit ? 'submit' : 'button'} onClick={edit ? undefined : onPrimary} className="min-h-[52px] whitespace-normal rounded-[14px] bg-[#ff000d] px-1 text-[14px] font-semibold text-white hover:bg-[#e0000c]">{busy ? 'Saving…' : primary}</Button>
    </footer>
  </main>;
}

export default function DriverAccountForms({ initialScreen = 'personal-edit', initialFullName = '', initialContact, onBack, onSaved }: {
  initialScreen?: 'personal-edit' | 'emergency' | 'emergency-edit';
  initialFullName?: string;
  initialContact?: RiderEmergencyContact | null;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [screen, setScreen] = useState<DriverAccountFormsScreenName>(initialScreen);
  const [values, setValues] = useState<DriverAccountFormValues>({ fullName: initialFullName, contactName: initialContact?.name || '', contactPhone: initialContact?.phone || '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);
  const primary = async () => {
    if (saving.current) return;
    if (screen === 'emergency') { setScreen('emergency-edit'); setSaved(false); return; }
    if (screen === 'emergency-review') { setScreen('emergency'); return; }
    if (screen === 'personal-review') { setScreen('personal-edit'); setSaved(false); return; }
    saving.current = true; setBusy(true); setError(null);
    try {
      if (screen === 'personal-edit') {
        const fullName = values.fullName.trim();
        if (fullName.length < 2 || fullName.length > 120) throw new Error('Enter your full name (2–120 characters).');
        await updateMyProfile({ full_name: fullName });
        setValues(v => ({ ...v, fullName })); setScreen('personal-review');
      } else {
        const contact = await saveRiderEmergencyContact({ name: values.contactName, phone: values.contactPhone });
        if (!contact) throw new Error('Your emergency contact was not saved. Please try again.');
        setValues(v => ({ ...v, contactName: contact.name, contactPhone: contact.phone })); setScreen('emergency-review');
      }
      setSaved(true); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'Your changes could not be saved. Please try again.'); }
    finally { saving.current = false; setBusy(false); }
  };
  return <DriverAccountFormsScreen screen={screen} values={values} busy={busy} saved={saved} error={error} onBack={onBack} onPrimary={primary} onChange={(key, value) => setValues(v => ({ ...v, [key]: value }))} />;
}
