import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowLeft, RefreshCw, CheckCircle2, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { lovable } from '@/integrations/lovable/index';
import { authDestination, authEntryPath } from '@/lib/authDestination';
import { updateMyProfile } from '@/lib/businessApi';
import RiderAuthFrame, { AuthFieldIcon, AuthForwardIcon, RiderAuthSocial, riderAuthInput, riderAuthSubmit } from '@/components/auth/RiderAuthFrame';

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name is required').max(100, 'Name too long'),
  nickname: z.string().trim().max(24, 'Nickname too long')
    .regex(/^[a-zA-Z0-9._-]*$/, 'Only letters, numbers, dots, dashes and underscores')
    .optional().or(z.literal('')),
  phone: z.string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(20, 'Phone number too long')
    .regex(/^(?:(?:\+263|0)[0-9\s-]{8,}|[1-9][0-9\s-]{8})$/, 'Enter a Zimbabwean mobile number'),
  email: z.string().trim().email('Enter a valid email address').max(255, 'Email too long').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/, 'Must include uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
}).refine((d) => d.confirmPassword === d.password, {
  path: ['confirmPassword'],
  message: 'Passwords must match',
}).refine((d) => !d.nickname || d.nickname.length >= 3, {
  path: ['nickname'],
  message: 'Nickname must be at least 3 characters',
});

type SignupFormData = z.infer<typeof signupSchema>;

type SignupStep = 'details' | 'verify-phone' | 'complete';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const next = useMemo(() => authDestination(searchParams.get('next')), [searchParams]);
  const [step, setStep] = useState<SignupStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false });
  const [formData, setFormData] = useState<SignupFormData | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Timer refs so navigating away during countdown / deferred signup
  // cancels the work instead of writing state to an unmounted component.
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // OTP state
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      nickname: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+263' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+263' + cleaned;
    }
    return cleaned;
  };

  // Start countdown timer
  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send OTP via omniflex-otp edge function (unauthenticated - we haven't signed up yet)
  const sendOtp = async (phoneNumber: string) => {
    if (countdown > 0) return;
    setIsSendingOtp(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/omniflex-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: 'send', phone: phoneNumber }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to send OTP');
      }
      toast({ title: 'Code sent!', description: `Verification code sent to ${phoneNumber}` });
      startCountdown();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send code';
      toast({ title: 'Failed to send code', description: message, variant: 'destructive' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (otp.length !== 6 || !formData) return;
    setIsVerifying(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/omniflex-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: 'verify', phone: formData.phone, code: otp }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast({ title: 'Invalid code', description: data.message || 'Please try again', variant: 'destructive' });
        setOtp('');
        return;
      }
      setIsVerified(true);
      toast({ title: 'Phone verified!' });
      // Proceed to create account
      signupTimeoutRef.current = setTimeout(() => completeSignup(formData), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      toast({ title: 'Verification failed', description: message, variant: 'destructive' });
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmitDetails = async (data: SignupFormData) => {
    const formattedData = {
      ...data,
      nickname: data.nickname?.trim() || '',
      phone: formatPhoneNumber(data.phone),
    };

    // Check if phone number is already registered
    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedData.phone)
      .maybeSingle();

    if (existingPhone) {
      toast({ title: 'Phone already registered', description: 'This phone number is already linked to an account. Please sign in instead.', variant: 'destructive' });
      return;
    }

    // Nickname must be unique (it doubles as a sign-in identifier)
    if (formattedData.nickname) {
      const { data: taken } = await (supabase.rpc as any)('nickname_is_taken', { _nickname: formattedData.nickname });
      if (taken) {
        form.setError('nickname', { message: 'That nickname is already taken.' });
        return;
      }
    }

    // Email uniqueness is enforced by Supabase Auth at signup time

    setFormData(formattedData);
    setStep('verify-phone');
    // Send OTP immediately
    await sendOtp(formattedData.phone);
  };

  const completeSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const email = data.email?.trim() || `${data.phone.replace(/\+/g, '')}@pickme.phone`;
      const { error } = await signUp(email, data.password, data.fullName, {
        nickname: data.nickname || undefined,
        phone: data.phone,
      });
      if (error) {
        let message = error.message;
        if (message.includes('already registered')) {
          message = 'An account with this email/phone already exists. Please sign in.';
        }
        if (message.includes('weak_password') || message.includes('Password should contain')) {
          message = 'Password must include uppercase, lowercase, number, and a special character (e.g. !@#$%).';
        }
        toast({ title: 'Signup failed', description: message, variant: 'destructive' });
        return;
      }
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await updateMyProfile({ phone: data.phone });
      }
      toast({ title: 'Account created!', description: 'Welcome to CruiXe.' });
      navigate(next);
    } catch {
      toast({ title: 'Sign up failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel any timers on unmount so they don't write state to a dead component.
  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (signupTimeoutRef.current) clearTimeout(signupTimeoutRef.current);
  }, []);

  // OTP Verification Step
  if (step === 'verify-phone' && formData) {
    if (isVerified) {
      return (
        <div className="min-h-[100dvh] bg-primary flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] bg-background rounded-3xl p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-accent" />
              </div>
              <p className="text-lg font-semibold text-foreground">Phone Verified!</p>
              <p className="text-sm text-muted-foreground">
                {isSubmitting ? 'Creating your account...' : 'Completing registration...'}
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[100dvh] bg-primary flex items-center justify-center p-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[520px] bg-background rounded-3xl p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Verify your phone</h2>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium">{formData.phone}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isVerifying}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || isVerifying}
              className="w-full h-12 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-black text-base"
            >
              {isVerifying ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>
              ) : (
                'Verify Code'
              )}
            </Button>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => { setStep('details'); setOtp(''); }}
                disabled={isVerifying}
                className="text-muted-foreground"
              >
                Change number
              </Button>
              <Button
                variant="ghost"
                onClick={() => sendOtp(formData.phone)}
                disabled={countdown > 0 || isSendingOtp}
                className="text-accent"
              >
                {isSendingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RiderAuthFrame variant="signup">
      <div className="mb-4 space-y-1.5">
        <h1 className="text-[25px] font-bold leading-tight">Create CruiXe Account</h1>
        <p className="text-[13.5px] font-semibold text-[#6b707d]">Join CruiXe and book your first ride.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitDetails)} className="space-y-3">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Full name</FormLabel>
              <div className="relative">
                <AuthFieldIcon name="name" />
                <FormControl><Input placeholder="Full name" autoComplete="name" className={riderAuthInput} {...field} /></FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="nickname" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold">
                Nickname <span className="text-muted-foreground font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. jonahb" autoComplete="username" className={riderAuthInput} {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">This is the name shown in the app. You can also sign in with it.</p>
              <FormMessage />
            </FormItem>
          )} />


          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Email address (optional)</FormLabel>
              <div className="relative">
                <AuthFieldIcon name="email" />
                <FormControl>
                  <Input type="email" inputMode="email" autoComplete="email" placeholder="Email address (optional)" className={riderAuthInput} {...field} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Mobile number</FormLabel>
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center gap-2 text-sm">
                  <img src="/brand/auth/zimbabwe.svg" alt="" /> +263
                </span>
                <FormControl><Input type="tel" inputMode="tel" placeholder="Mobile number" autoComplete="tel" className={`${riderAuthInput} pl-28`} {...field} /></FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )} />

          {(['password', 'confirmPassword'] as const).map((name) => {
            const label = name === 'password' ? 'Password' : 'Confirm password';
            const visible = visiblePasswords[name];
            return (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">{label}</FormLabel>
                  <div className="relative">
                    <AuthFieldIcon name="password" />
                    <FormControl>
                      <Input type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder={label} className={`${riderAuthInput} pr-12`} {...field} />
                    </FormControl>
                    <button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                      className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-[#696e7a]"
                      onClick={() => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))}
                    >
                      {visible ? <EyeOff className="size-5" /> : <img src="/brand/auth/password-visible.svg" alt="" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            );
          })}

          <Button type="submit" className={riderAuthSubmit} disabled={isSubmitting}>
            {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending code...</>) : 'Create Account'}
            <AuthForwardIcon />
          </Button>
        </form>
      </Form>

      <div className="mt-5">
        <RiderAuthSocial signingUp onSelect={async (provider) => {
          const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + authEntryPath('/auth', next) });
          if (result?.error) {
            toast({ title: 'Sign-in unavailable', description: 'Try your email or a different sign-in method.', variant: 'destructive' });
          }
        }} />
      </div>
      <p className="mt-2 text-center text-[13px] text-[#6b707d]">
        Already have an account?{' '}
        <Link to={authEntryPath('/auth', next)} className="inline-flex min-h-11 items-center font-bold text-[#111]">Sign in</Link>
      </p>
      <p className="text-center text-xs text-[#6b707d]">
        By continuing you agree to CruiXe’s <Link to="/terms" className="underline">terms of use</Link>.
      </p>
    </RiderAuthFrame>
  );
};

export default Signup;
