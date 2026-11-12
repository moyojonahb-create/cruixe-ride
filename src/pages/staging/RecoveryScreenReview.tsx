import { useState } from 'react';
import { NewPasswordScreen, PasswordUpdatedScreen } from '@/components/auth/RecoveryScreens';
export default function RecoveryScreenReview() {
  const [screen, setScreen] = useState<'password' | 'updated'>('password');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  return <><aside className="bg-slate-100 p-3 text-center text-sm"><p>Screen preview only. No password is changed. Use sample text here.</p><nav className="mt-2 flex justify-center gap-4" aria-label="Recovery screen previews"><button className="min-h-11 underline" onClick={()=>setScreen('password')}>New password</button><button className="min-h-11 underline" onClick={()=>setScreen('updated')}>Password updated</button></nav></aside>{screen === 'password' ? <NewPasswordScreen password={password} confirmation={confirmation} onPassword={setPassword} onConfirmation={setConfirmation} busy={false} error={notice} onSubmit={(event)=>{event.preventDefault();setNotice('Preview only: no password was changed.');}} /> : <PasswordUpdatedScreen busy={false} error={notice} onContinue={()=>{setNotice(null);setScreen('password');}} />}</>;
}
