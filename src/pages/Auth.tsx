import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import RiderAuthFrame, { AuthFieldIcon, AuthForwardIcon, RiderAuthSocial, riderAuthInput, riderAuthSubmit } from '@/components/auth/RiderAuthFrame';
import { updateMyProfile } from '@/lib/businessApi';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const defaultMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state - plain controlled inputs
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);


  useEffect(() => {
    if (!loading && user) {
      navigate('/ride', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email || !password) return;
    setIsSubmitting(true);

    const identifier = await loginIdentifierToEmail(email);
    const isNetworkError = (err: unknown) => {
      const m = (err as Error)?.message?.toLowerCase() ?? '';
      return m.includes('failed to fetch')
        || m.includes('networkerror')
        || m.includes('load failed')
        || m.includes('network request failed');
    };

    try {
      let lastError: Error | null = null;

      // Retry transient network failures; never retry a real credential rejection.
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await signIn(identifier, password);
        if (!error) {
          toast({ title: 'Welcome back!' });
          navigate('/ride', { replace: true });
          return;
        }
        lastError = error;
        if (!isNetworkError(error)) break;
        await new Promise((r) => setTimeout(r, 400 * 2 ** attempt)); // 400ms, 800ms
      }

      if (lastError && isNetworkError(lastError)) {
        setLoginError("Couldn't reach CruiXe. Check your connection and try again.");
      } else if (lastError) {
        setLoginError(
          lastError.message?.includes('Invalid login credentials')
            ? 'Incorrect email/phone or password.'
            : lastError.message || 'Sign in failed. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast({
        title: 'Enter your email',
        description: 'Password reset only works with an email address. Type the email you signed up with in the field above.',
        variant: 'destructive',
      });
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: 'Could not send reset email', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: `We sent a password reset link to ${trimmed}.` });
      }
    } finally {
      setIsResetting(false);
    }
  };

  const formatPhone = (p: string) => {
    let cleaned = p.replace(/[\s-]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+263' + cleaned.substring(1);
    if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
    return cleaned;
  };

  const loginIdentifierToEmail = async (identifier: string) => {
    const v = identifier.trim();
    if (v.includes('@')) return v;
    // Phone number → synthetic email used at signup
    if (/^\+?[0-9\s-]+$/.test(v)) {
      const formatted = formatPhone(v);
      return `${formatted.replace(/\+/g, '')}@pickme.phone`;
    }
    // Otherwise treat it as a nickname and resolve it to the account's email
    const { data } = await (supabase.rpc as any)('email_for_nickname', { _nickname: v });
    return (data as string | null) || v;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (!fullName || fullName.length < 2) {
      setSignupError('Name must be at least 2 characters.');
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setSignupError('Please enter a valid phone number.');
      return;
    }
    if (!password || password.length < 8) {
      setSignupError('Password must be at least 8 characters.');
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setSignupError('Password must include uppercase, lowercase, number, and special character (e.g. !@#$%).');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = formatPhone(phone);

      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (existingPhone) {
        setSignupError('This phone number is already linked to an account. Please sign in instead.');
        setIsSubmitting(false);
        return;
      }

      const signupEmail = email.trim() || `${formattedPhone.replace(/\+/g, '')}@pickme.phone`;

      const { error } = await signUp(signupEmail, password, fullName);
      if (error) {
        let message = error.message;
        if (message.includes('already registered') || message.includes('already been registered')) {
          message = 'An account with this email/phone already exists. Please sign in instead.';
        }
        if (message.includes('weak_password') || message.includes('Password should contain')) {
          message = 'Password must include uppercase, lowercase, number, and a special character (e.g. !@#$%).';
        }
        setSignupError(message);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await updateMyProfile({ phone: formattedPhone });
      }

      toast({ title: 'Account created!', description: 'Welcome to CruiXe.' });
      navigate('/ride', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Connecting to CruiXe…</span>
      </div>
    );
  }

  return (
    <RiderAuthFrame variant={mode}>
      <div className="mb-5 space-y-1.5">
        <h1 className="text-[25px] font-bold leading-tight">
          {mode === 'login' ? 'Welcome to CruiXe' : 'Create CruiXe Account'}
        </h1>
        <p className="text-[13.5px] font-semibold text-[#6b707d]">
          {mode === 'login' ? 'Book rides safely and confidently.' : 'Join CruiXe and book your first ride.'}
        </p>
      </div>

      {mode === 'login' && (
        <nav aria-label="Account access" className="mb-5 grid grid-cols-2 gap-2">
          <span aria-current="page" className="grid min-h-11 place-items-center rounded-xl bg-[#ff000d] text-sm font-semibold text-white shadow-md">
            Sign in
          </span>
          <Link to="/signup" className="grid min-h-11 place-items-center rounded-xl border border-[#dbdee3] bg-[#f8f9fa] text-sm font-semibold shadow-md">
            Sign up
          </Link>
        </nav>
      )}

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div role="alert" className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              ⚠️ {loginError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="login-email" className="sr-only">Email, nickname or phone</Label>
            <div className="relative">
              <AuthFieldIcon name="email" />
              <Input
                id="login-email"
                type="text"
                placeholder="Email, nickname or phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className={riderAuthInput}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password" className="sr-only">Password</Label>
            <div className="relative">
              <AuthFieldIcon name="password" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`${riderAuthInput} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-[#696e7a]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-5" /> : <img src="/brand/auth/password-visible.svg" alt="" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" className="min-h-11 text-[13px] font-bold text-[#111] disabled:opacity-60" onClick={handleForgotPassword} disabled={isResetting}>
              {isResetting ? 'Sending…' : 'Forgot password?'}
            </button>
          </div>

          <Button type="submit" className={riderAuthSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continue
            <AuthForwardIcon />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          {signupError && (
            <div role="alert" className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              ⚠️ {signupError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full Name</Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="h-12 rounded-xl border-border/50 bg-card/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-phone">Phone Number</Label>
            <Input
              id="signup-phone"
              type="tel"
              inputMode="tel"
              placeholder="+263 77 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="h-12 rounded-xl border-border/50 bg-card/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-12 rounded-xl border-border/50 bg-card/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password <span className="text-muted-foreground font-normal text-xs">(must include A-Z, a-z, 0-9, special char)</span></Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showSignupPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-12 rounded-xl border-border/50 bg-card/80 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
              >
                {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">Confirm Password <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="relative">
              <Input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-12 rounded-xl border-border/50 bg-card/80 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">By continuing, you agree to CruiXe safety and account policies.</p>

          <Button type="submit" className={riderAuthSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>
      )}

      <div className="mt-5">
        <RiderAuthSocial signingUp={mode === 'signup'} onSelect={async (provider) => {
          const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + '/ride' });
          if (result?.error) {
            toast({ title: 'Sign-in unavailable', description: 'Try your email or a different sign-in method.', variant: 'destructive' });
          }
        }} />
      </div>
      <div className="mt-2 text-center text-[13px]">
        {mode === 'login' ? (
          <p>
            Don’t have an account?{' '}
            <Link to="/signup" className="inline-flex min-h-11 items-center font-bold">Create One</Link>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('login'); setSignupError(null); }} className="min-h-11 font-bold">Sign in</button>
          </p>
        )}
      </div>
    </RiderAuthFrame>
  );
};

export default Auth;
