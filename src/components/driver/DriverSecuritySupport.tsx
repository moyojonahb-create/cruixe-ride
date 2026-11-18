import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import './driverOnboardingFonts.css';
import './DriverSecuritySupport.css';

export type DriverSecuritySupportScreen = 'security' | 'password' | 'password-review' | 'help' | 'support';
type HelpTarget = 'personal' | 'emergency' | 'documents' | 'wallet';
interface Props {
  initialScreen?: DriverSecuritySupportScreen;
  preview?: boolean;
  onBack: () => void;
  onNavigate?: (target: HelpTarget) => void;
}

const titles: Record<DriverSecuritySupportScreen, string> = {
  security: 'Account Security', password: 'Change Password', 'password-review': 'Password Change Review', help: 'Help Centre', support: 'Contact Support',
};
const backAssets: Record<DriverSecuritySupportScreen, string> = {
  security: '1478-269', password: '1478-319', 'password-review': '1478-369', help: '1478-329', support: '1478-334',
};
const icon = (node: string) => `/brand/driver-account/${node}.svg`;
const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;

function Note({ children, image, title, offset = false }: { children: ReactNode; image?: string; title?: string; offset?: boolean }) {
  return <div className={`dss-note ${offset ? 'dss-offset' : ''}`}>
    <span className={`dss-note-icon ${image === '1356-227' ? 'dss-note-icon-bare' : ''}`}>{image ? <img src={icon(image)} alt="" /> : 'i'}</span>
    <div>{title && <h2>{title}</h2>}<p>{children}</p></div>
  </div>;
}

export default function DriverSecuritySupport({ initialScreen = 'security', preview = false, onBack, onNavigate }: Props) {
  const [screen, setScreen] = useState(initialScreen);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirmation: '' });
  const [support, setSupport] = useState({ category: '', trip: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [changed, setChanged] = useState(false);
  const inFlight = useRef(false);
  const go = (next: DriverSecuritySupportScreen) => { if (inFlight.current) return; setError(''); setNotice(''); setScreen(next); };
  const savePassword = async () => {
    if (inFlight.current) return;
    if (preview) { setNotice('Preview only. No password has been changed.'); return; }
    setError('');
    if (!passwords.current) { setError('Enter your current password.'); return; }
    if (passwords.next.length < 8 || passwords.next.length > 72 || !passwordPolicy.test(passwords.next)) {
      setError('Use 8–72 characters with uppercase, lowercase, a number and a special character.'); return;
    }
    if (passwords.next !== passwords.confirmation) { setError('Passwords do not match.'); return; }
    if (passwords.current === passwords.next) { setError('Choose a different password.'); return; }
    inFlight.current = true; setBusy(true);
    try {
      const identity = await supabase.auth.getUser();
      const user = identity.data.user;
      if (identity.error || !user || (!user.email && !user.phone)) throw new Error('Sign in again before changing your password.');
      const credentials = user.email ? { email: user.email, password: passwords.current } : { phone: user.phone!, password: passwords.current };
      const verified = await supabase.auth.signInWithPassword(credentials);
      if (verified.error || verified.data.user?.id !== user.id) throw new Error('Your current password could not be verified. Please try again.');
      const result = await supabase.auth.updateUser({ password: passwords.next });
      if (result.error) throw new Error('Your password was not changed. Please try again or use account recovery.');
      setPasswords({ current: '', next: '', confirmation: '' });
      setChanged(true); setScreen('password-review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change your password. Check your connection and try again.');
    } finally { inFlight.current = false; setBusy(false); }
  };
  const openSupport = () => {
    if (preview) { setNotice('Preview only. No email was opened or request submitted.'); return; }
    if (!support.category || !support.subject.trim() || !support.message.trim()) { setError('Choose a category and enter a subject and message.'); return; }
    setError('');
    const subject = encodeURIComponent(`[CruiXe Driver] ${support.subject.trim()}`);
    const body = encodeURIComponent(`Category: ${support.category}\nTrip reference: ${support.trip.trim() || 'Not provided'}\n\n${support.message.trim()}`);
    window.location.href = `mailto:support@pickme.co.zw?subject=${subject}&body=${body}`;
    setNotice('Continue in your mail app to send the draft. No support ticket has been created here.');
  };
  const fields = <div className="dss-fields">{([
    ['current', 'Current password', 'Enter current password', 'current-password'],
    ['next', 'New password', 'Enter strong password', 'new-password'],
    ['confirmation', 'Confirm password', 'Repeat new password', 'new-password'],
  ] as const).map(([name, label, placeholder, autoComplete]) => <label className="dss-field" key={name}>
    <span>{label}</span><Input type="password" autoComplete={autoComplete} maxLength={72} value={passwords[name]} placeholder={placeholder} disabled={busy} onChange={e => setPasswords(p => ({ ...p, [name]: e.target.value }))} />
  </label>)}</div>;
  const footerLabel = screen === 'help' ? 'Contact Support' : screen === 'support' ? 'Open email draft' : screen === 'password-review' ? 'Account Security' : busy ? 'Saving…' : 'Save Changes';
  const primary = () => {
    if (screen === 'help') go('support');
    else if (screen === 'support') openSupport();
    else if (screen === 'password-review') go('security');
    else void savePassword();
  };
  return <section className="dss-screen" data-driver-account-screen={screen}>
    <header className="dss-header">
      <Button type="button" variant="ghost" size="icon" className="dss-back" aria-label="Back to Profile" disabled={busy} onClick={onBack}><img src={icon(backAssets[screen])} alt="" /></Button>
      <h1>{titles[screen]}</h1>
      <span className={`dss-marker ${screen === 'security' || screen === 'password-review' ? 'dss-marker-icon' : ''}`} aria-hidden="true">{screen === 'security' ? <img src={icon('1356-197')} alt="" /> : screen === 'password-review' ? <img src={icon('1367-425')} alt="" /> : null}</span>
    </header>
    <main className="dss-main">
      {screen === 'security' && <>
        <p className="dss-intro">Manage access to your account and private earnings.</p>
        <div className="dss-hero dss-security-hero"><img src={icon('1356-212')} alt="" /><div><h2>Account Protection</h2><p>Keep your password secure</p></div></div>
        <div className="dss-security-fields">{fields}</div>
        <Note image="1356-227" title="Secure changes" offset>Your current password is checked before a password change is saved.</Note>
        <Button variant="outline" className="dss-wide" onClick={() => go('password')} disabled={busy}>Change Password</Button>
        <Button variant="outline" className="dss-wide" disabled>Two-Step Verification · unavailable</Button>
      </>}
      {screen === 'password' && <>
        <p className="dss-intro">Manage your driver account information.</p>
        <div className="dss-card"><h2>Account information</h2>{fields}</div>
        <Note offset>Your current password must be checked securely. Use 8–72 characters with uppercase, lowercase, a number and a special character.</Note>
      </>}
      {screen === 'password-review' && <>
        <div className="dss-hero dss-review-hero"><img src={icon('1367-433')} alt="" /><div><h2>Protect your new password</h2><p>{changed && !preview ? 'Security update · Confirmed' : 'Security update · Preview only'}</p></div></div>
        <h2 className="dss-review-title">Review details</h2>
        <dl className="dss-review-card dss-offset">{[
          ['Current password', changed && !preview ? 'Verified' : 'Verification required'],
          ['New password', changed && !preview ? 'Updated successfully' : 'Strong password required'],
          ['Account sessions', 'Review after update'],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <Note image="1367-450" offset>{changed && !preview ? 'Your password change was confirmed. Keep your password private and sign out on any shared device.' : 'No password has been changed. This preview does not perform credential verification or update your account.'}</Note>
      </>}
      {screen === 'help' && <>
        <p className="dss-intro">Get answers to common questions.</p>
        <div className="dss-card"><h2>Help topics</h2><div className="dss-fields">{([
          ['Driver profile', 'Verification and account', 'documents'], ['Rides and requests', 'Trips, offers and pickup', null],
          ['Drive Wallet', 'Top-ups and charges', 'wallet'], ['Safety', 'Help and support', 'emergency'],
        ] as const).map(([label, value, target]) => <button type="button" className="dss-field dss-topic" key={label} onClick={() => { if (preview) { setNotice('Preview only. Open Help Centre from your Driver account to continue.'); } else if (target && onNavigate) onNavigate(target); else { setSupport(s => ({ ...s, category: label })); go('support'); } }}><span>{label}</span><strong>{value}</strong></button>)}</div></div>
        <Note>Contact our team if you need more assistance.</Note>
      </>}
      {screen === 'support' && <>
        <p className="dss-intro">Tell our support team what happened.</p>
        <div className="dss-card"><h2>Account information</h2><div className="dss-fields">
          <label className="dss-field"><span>Issue category</span><select value={support.category} onChange={e => setSupport(s => ({ ...s, category: e.target.value }))}><option value="">Choose category</option>{['Driver profile', 'Rides and requests', 'Drive Wallet', 'Safety', 'Other'].map(v => <option key={v}>{v}</option>)}</select></label>
          {(['trip', 'subject'] as const).map(name => <label className="dss-field" key={name}><span>{name === 'trip' ? 'Trip reference' : 'Subject'}</span><Input maxLength={name === 'trip' ? 100 : 120} value={support[name]} placeholder={name === 'trip' ? 'Optional' : 'Describe your issue'} onChange={e => setSupport(s => ({ ...s, [name]: e.target.value }))} /></label>)}
          <label className="dss-field"><span>Message</span><textarea rows={2} maxLength={1500} placeholder="What happened?" value={support.message} onChange={e => setSupport(s => ({ ...s, message: e.target.value }))} /></label>
        </div></div>
        <Note>This opens an email draft to support@pickme.co.zw. You must send it from your mail app. In-app ticket tracking is not available.</Note>
      </>}
      {error && <p className="dss-error" role="alert">{error}</p>}
      {notice && <p className="dss-notice" role="status">{notice}</p>}
    </main>
    <footer className="dss-footer"><Button variant="outline" disabled={busy} onClick={onBack}>Back to Profile</Button><Button disabled={busy} onClick={primary}>{footerLabel}</Button></footer>
  </section>;
}
