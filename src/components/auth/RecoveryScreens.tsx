import '@/components/driver/driverOnboardingFonts.css';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const assets = '/brand/recovery';
const primary = 'h-[50px] w-full rounded-[15px] bg-[#ff000d] text-[15px] font-semibold text-white hover:bg-[#e9000d]';
function RecoveryFrame({ title, subtitle, node, children }: { title: string; subtitle: string; node: string; children: ReactNode }) {
  return <main data-figma-node={node} className="mx-auto flex min-h-[max(100dvh,845px)] w-full max-w-[440px] flex-col bg-white px-4 pb-[max(44px,env(safe-area-inset-bottom))] pt-10 font-['Poppins',system-ui,sans-serif] text-[#20252f]">
    <header><div className="flex min-h-12 items-center gap-2.5"><Link to="/auth" aria-label="Back to sign in" className="grid size-[47px] shrink-0 place-items-center rounded-full bg-white shadow-[0_3px_4px_rgba(0,0,0,.07)]"><img src={`${assets}/back.svg`} alt="" /></Link><h1 className="text-[22px] font-bold leading-tight">{title}</h1></div><p className="mt-5 border-b border-[#e1e5ea] pb-3 text-[11px] leading-4 text-[#6c7684]">{subtitle}</p></header>
    {children}
  </main>;
}
export function NewPasswordScreen({ password, confirmation, onPassword, onConfirmation, onSubmit, busy, error }: {
  password: string; confirmation: string; onPassword: (value: string) => void; onConfirmation: (value: string) => void;
  onSubmit: (event: FormEvent) => void; busy: boolean; error: string | null;
}) {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase and lowercase letters', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    // Keep the existing account policy, even though the prototype says "or".
    { label: 'A number and special character', met: /\d/.test(password) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) },
  ];
  return <RecoveryFrame title="Set a new password" subtitle="Choose a strong password for your account." node="491:1042">
    <div className="mx-auto mt-4 grid size-[106px] shrink-0 place-items-center rounded-full bg-[#fff0f2]"><img src={`${assets}/security-lock.svg`} alt="" /></div>
    <form onSubmit={onSubmit} className="mt-10 flex flex-1 flex-col">
      <div className="space-y-7">{[
        { id: 'new-password', label: 'New password', placeholder: 'Enter new password', value: password, change: onPassword },
        { id: 'confirm-password', label: 'Confirm new password', placeholder: 'Re-enter new password', value: confirmation, change: onConfirmation },
      ].map((field) => <div key={field.id}><Label htmlFor={field.id} className="text-[12.5px] font-semibold">{field.label}</Label><div className="relative mt-3"><img src={`${assets}/field-lock.svg`} alt="" className="pointer-events-none absolute left-[15px] top-[16px]" /><Input id={field.id} type="password" autoComplete="new-password" required disabled={busy} value={field.value} onChange={(event) => field.change(event.target.value)} placeholder={field.placeholder} className="h-14 rounded-[17px] border-[#e1e5ea] bg-[#f8f9fa] pl-[55px] text-base placeholder:text-[12px]" /></div></div>)}</div>
      <section aria-label="Password requirements" className="mt-9 rounded-[17px] border border-[#e1e5ea] bg-[#f8f9fa] p-3.5"><h2 className="mb-5 text-[10.5px] font-semibold text-[#6c7684]">PASSWORD REQUIREMENTS</h2><ul className="space-y-3">{requirements.map(({label,met})=><li key={label} className="flex items-center gap-3 text-[11.2px]"><img src={`${assets}/${met ? 'check' : 'pending'}.svg`} alt={met ? 'Met:' : 'Required:'} />{label}</li>)}</ul></section>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className={`${primary} mb-[min(10dvh,88px)] mt-14`}>{busy ? 'Updating…' : 'Update password'}</Button>
    </form>
  </RecoveryFrame>;
}
export function PasswordUpdatedScreen({ onContinue, busy, error }: { onContinue: () => void; busy: boolean; error: string | null }) {
  return <RecoveryFrame title="Password updated" subtitle="You can now sign in with your new password." node="491:1082">
    <div className="mx-auto mt-7 grid size-[162px] shrink-0 place-items-center rounded-full bg-[#ff000d]"><img src={`${assets}/success.svg`} alt="" /></div>
    <h2 className="mt-6 text-center text-[21.5px] font-bold">Password changed</h2><p className="mt-2 text-center text-[11.8px] text-[#6c7684]">Your CruiXe account is ready to sign in.</p>
    <div className="mt-9 flex min-h-[116px] items-center rounded-[17px] border border-[#e1e5ea] px-7 text-[12.6px] font-medium leading-5">Your account security has been updated.<br />Keep your password private.</div>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <div className="mt-auto pt-12"><Button className={primary} disabled={busy} onClick={onContinue}>{busy ? 'Continuing…' : 'Continue to login'}</Button></div>
  </RecoveryFrame>;
}
