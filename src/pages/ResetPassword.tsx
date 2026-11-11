import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, CheckCircle2, Clock3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CruiXeLogo from '@/components/CruiXeLogo';

const SHELL_CLASS = 'min-h-[100dvh] bg-[#fdfdfd] px-4 py-6 flex items-center justify-center font-[\'Poppins\',system-ui,sans-serif] text-[#20252f]';
const SHELL_STYLE = { paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' } as const;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSucceeded, setResetSucceeded] = useState(false);

  // Supabase's client auto-detects the recovery token in the URL on load and
  // establishes a session for it; PASSWORD_RECOVERY fires once that happens.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setHasRecoverySession(!!session);
        setCheckingSession(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setFormError('Password must include uppercase, lowercase, number, and special character (e.g. !@#$%).');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError(error.message || 'Could not update your password. Please try again.');
        return;
      }
      toast({ title: 'Password updated', description: 'Your CruiXe account security has been updated.' });
      setResetSucceeded(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Verifying reset link…</span>
      </div>
    );
  }

  if (resetSucceeded) {
    return (
      <main className={SHELL_CLASS} style={SHELL_STYLE} data-figma-node="491:1082">
        <section className="w-full max-w-[400px] rounded-[28px] bg-white px-5 py-8 text-center shadow-sm">
          <h1 className="text-[22px] font-bold">Password updated</h1>
          <p className="mt-4 text-[12px] text-[#6c7684]">You can now continue securely to CruiXe.</p>
          <div className="mx-auto my-8 grid h-[132px] w-[132px] place-items-center rounded-full bg-[#ff000d]">
            <CheckCircle2 className="h-[72px] w-[72px] text-white" />
          </div>
          <p className="text-[13px] font-semibold">Your account security has been updated.</p>
          <p className="mt-2 text-[12px] text-[#6c7684]">Keep your password private.</p>
          <Button className="mt-8 h-[54px] w-full rounded-[18px] bg-[#ff000d] font-semibold text-white hover:bg-[#e9000d]" onClick={() => navigate('/ride', { replace: true })}>
            Continue to CruiXe
          </Button>
        </section>
      </main>
    );
  }

  if (!hasRecoverySession) {
    return (
      <main className={SHELL_CLASS} style={SHELL_STYLE} data-figma-node="491:1131">
        <section className="w-full max-w-[400px] rounded-[28px] bg-white px-5 py-8 text-center shadow-sm">
          <h1 className="text-[22px] font-bold">Code expired</h1>
          <p className="mt-4 text-[12px] text-[#6c7684]">Your recovery link is invalid or is no longer valid.</p>
          <div className="mx-auto my-8 grid h-[132px] w-[132px] place-items-center rounded-full bg-[#fff0f2]">
            <Clock3 className="h-[64px] w-[64px] text-[#ff000d]" />
          </div>
          <p className="text-[12px] leading-5 text-[#6c7684]">
            For your security, recovery links can only be used for a limited time.
          </p>
          <Button className="mt-8 h-[54px] w-full rounded-[18px] bg-[#ff000d] font-semibold text-white hover:bg-[#e9000d]" onClick={() => navigate('/auth')}>
            Back to sign in
          </Button>
        </section>
      </main>
    );
  }

  return (
    <div className={SHELL_CLASS} style={SHELL_STYLE} data-figma-node="491:1042">
      <Card className="w-full max-w-[400px] rounded-[28px] border border-[#e1e5ea] bg-white shadow-sm">
        <CardHeader className="text-center space-y-4">
          <Link to="/auth" className="mx-auto">
            <CruiXeLogo size="md" />
          </Link>
          <CardTitle className="text-[22px] font-bold text-[#20252f]">Set a new password</CardTitle>
          <CardDescription className="text-[12px] text-[#6c7684]">Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
                ⚠️ {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-[51px] rounded-[13px] border-[#e1e5ea] bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-[51px] rounded-[13px] border-[#e1e5ea] bg-white"
              />
            </div>
            <Button type="submit" className="h-[55px] w-full rounded-[18px] bg-[#ff000d] font-semibold text-white hover:bg-[#e9000d]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
