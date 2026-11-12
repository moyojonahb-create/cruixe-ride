import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, RefreshCw, CheckCircle2, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { lovable } from '@/integrations/lovable/index';
import { authDestination, authEntryPath } from '@/lib/authDestination';
import { updateMyProfile } from '@/lib/businessApi';
import DriverPhoneVerification from '@/components/auth/DriverPhoneVerification';
import DriverAuthFrame, { DriverVerificationMethods, driverAuthInput, driverAuthSubmit } from '@/components/auth/DriverAuthFrame';
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

type SignupStep = 'details' | 'security' | 'verify-phone' | 'complete';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const next = useMemo(() => authDestination(searchParams.get('next')), [searchParams]);
  const destinationPath = next.split(/[?#]/)[0];
  const isDriverSignup = destinationPath === '/driver' || destinationPath.startsWith('/driver/');
  const [step, setStep] = useState<SignupStep>('details');
  const detailsHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (isDriverSignup && step === 'details') {
      window.scrollTo({ top: 0, behavior: 'auto' });
      detailsHeading.current?.focus({ preventScroll: true });
    }
  }, [isDriverSignup, step]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupCompletionError, setSignupCompletionError] = useState<string | null>(null);
  const [showVerificationMethods, setShowVerificationMethods] = useState(false);
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
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const verificationRef = useRef(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSendError, setOtpSendError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const detailsSubmissionRef = useRef(false);
  const otpSendRef = useRef(false);
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
    if (countdown > 0 || otpSendRef.current) return;
    otpSendRef.current = true;
    setOtpSendError(null);
    setVerificationError(null);
    setShowVerificationMethods(false);
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
      setCodeSent(true);
      setOtp('');
      toast({ title: 'Code sent!', description: `Verification code sent to ${phoneNumber}` });
      startCountdown();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send code';
      setOtpSendError(message);
      toast({ title: 'Failed to send code', description: message, variant: 'destructive' });
    } finally {
      otpSendRef.current = false;
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (otp.length !== 6 || !formData || verificationRef.current || isVerified || isSendingOtp) return;
    verificationRef.current = true;
    setVerificationError(null);
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
        setVerificationError(data.message || 'Invalid code. Please try again.');
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
      setVerificationError(message);
      toast({ title: 'Verification failed', description: message, variant: 'destructive' });
      setOtp('');
    } finally {
      verificationRef.current = false;
      setIsVerifying(false);
    }
  };

  const onSubmitDetails = async (data: SignupFormData) => {
    if (detailsSubmissionRef.current) return;
    detailsSubmissionRef.current = true;
    let advancedToVerification = false;
    setIsSubmitting(true);
    try {
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
          if (isDriverSignup) setStep('details');
          return;
        }
      }

      // Email uniqueness is enforced by Supabase Auth at signup time

      advancedToVerification = true;
      setFormData(formattedData);
      setShowVerificationMethods(false);
      setStep('verify-phone');
      // A changed number needs its own code; never retain an old countdown.
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = null;
      setCountdown(0);
      setCodeSent(false);
      setOtpSendError(null);
      await sendOtp(formattedData.phone);
    } catch {
      toast({ title: 'Unable to continue', description: 'Please check your connection and try again.', variant: 'destructive' });
    } finally {
      // Keep stale resolver callbacks from resubmitting after the step changes.
      if (!advancedToVerification) detailsSubmissionRef.current = false;
      setIsSubmitting(false);
    }
  };

  const completeSignup = async (data: SignupFormData) => {
    setSignupCompletionError(null);
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
        setSignupCompletionError(message);
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
      setSignupCompletionError('Account creation could not be completed. Please try again.');
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

  const changePhoneNumber = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(0); setCodeSent(false); setOtpSendError(null); setVerificationError(null);
    detailsSubmissionRef.current = false;
    setStep(isDriverSignup ? 'security' : 'details'); setOtp(''); setShowVerificationMethods(false);
  };

  // OTP Verification Step
  if (step === 'verify-phone' && formData) {
    if (isDriverSignup) {
      if (showVerificationMethods && !isVerified) {
        return <DriverVerificationMethods countdown={countdown} isSending={isSendingOtp} onSms={() => void sendOtp(formData.phone)} onBack={() => setShowVerificationMethods(false)} />;
      }
      return <DriverPhoneVerification phone={formData.phone} otp={otp} onOtpChange={setOtp} onVerify={() => void verifyOtp()} onResend={() => void sendOtp(formData.phone)} onChangeNumber={changePhoneNumber} onMethods={() => setShowVerificationMethods(true)} onRetrySignup={() => void completeSignup(formData)} countdown={countdown} codeSent={codeSent} isSending={isSendingOtp} isVerifying={isVerifying} isVerified={isVerified} isSubmitting={isSubmitting} sendError={otpSendError} verificationError={verificationError} signupError={signupCompletionError} />;
    }
    if (isVerified) {
      return (
        <div className="min-h-[100dvh] bg-primary flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] bg-background rounded-3xl p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-accent" />
              </div>
              <p className="text-lg font-semibold text-foreground">Phone Verified!</p>
              {signupCompletionError ? (
                <>
                  <p role="alert" className="text-center text-sm text-destructive">{signupCompletionError}</p>
                  <Button type="button" onClick={() => void completeSignup(formData)} disabled={isSubmitting} className="min-h-11 w-full rounded-xl">
                    {isSubmitting ? 'Retrying account creation...' : 'Try again'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isSubmitting ? 'Creating your account...' : 'Completing registration...'}
                  </p>
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </>
              )}
            </div>
          </div>
        </div>
      );
    }


    return (
      <div className="min-h-[100dvh] bg-primary flex items-center justify-center p-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[520px] bg-background rounded-3xl p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="space-y-6">
            {showVerificationMethods ? (
              <section aria-label="Verification methods" data-node-id="1097:106" className="space-y-4 font-['Poppins',sans-serif]">
                <button type="button" onClick={() => setShowVerificationMethods(false)} className="grid size-11 place-items-center rounded-full border bg-white text-xl" aria-label="Back to phone verification">‹</button>
                <h2 className="text-[26px] font-bold text-[#1f2129]">Choose verification</h2>
                <p className="text-[12px] text-[#667080]">Use another method to verify your phone.</p>
                <div className="flex items-center gap-3 text-[11px] font-semibold"><span className="h-1 w-9 rounded bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />VERIFICATION OPTIONS</div>
                <p className="text-[13px]">Both methods use your registered mobile number.</p>
                <button type="button" onClick={() => void sendOtp(formData.phone)} disabled={countdown > 0 || isSendingOtp} className="w-full rounded-[17px] border border-[#ffd300] bg-white px-4 py-4 text-left disabled:opacity-60">
                  <span className="block text-[15px] font-semibold">Text message (SMS)</span>
                  <span className="block text-[11px] text-[#667080]">{countdown > 0 ? `You can request a new code in ${countdown}s` : 'Get a new one-time code by text.'}</span>
                </button>
                <div aria-disabled="true" className="w-full rounded-[17px] border border-[#e3e7ee] bg-[#f8f9fa] px-4 py-4 text-left opacity-70">
                  <span className="block text-[15px] font-semibold">Automated phone call</span>
                  <span className="block text-[11px] text-[#667080]">Unavailable until voice verification is supported.</span>
                </div>
                <p className="text-[11px] text-[#667080]">Voice call availability depends on SMS/voice provider support.</p>
              </section>
            ) : <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Verify your phone</h2>
              <p className="text-sm text-muted-foreground">
                {codeSent ? 'We sent a 6-digit code to ' : 'Request a 6-digit code for '}<span className="font-medium">{formData.phone}</span>
              </p>
            </div>

            {otpSendError && <p role="alert" className="text-center text-sm text-destructive">Could not send your code. {otpSendError} Please try again.</p>}

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
                onClick={changePhoneNumber}
                disabled={isVerifying || isSendingOtp}
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
            <button type="button" className="w-full min-h-11 text-center text-sm font-semibold text-[#1f2129] underline" onClick={() => setShowVerificationMethods(true)}>Other verification methods</button>
            </>}
          </div>
        </div>
      </div>
    );
  }

  if (isDriverSignup && step === 'security') {
    return (
      <DriverAuthFrame mode="security" busy={isSubmitting} onBack={() => setStep('details')}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitDetails, (errors) => {
            if (errors.fullName || errors.nickname || errors.email) setStep('details');
          })} className="mt-4">
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem className="space-y-[5px]">
                <FormLabel className="block min-h-[23px] px-0.5 text-[12.5px] font-semibold leading-[23px]">Mobile number</FormLabel>
                <FormControl><Input type="tel" inputMode="tel" autoComplete="tel" placeholder="+263 | Enter your phone number" className={driverAuthInput} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {(['password', 'confirmPassword'] as const).map((name) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem className="mt-[25px] space-y-[5px]">
                  <FormLabel className="block min-h-[23px] px-0.5 text-[12.5px] font-semibold leading-[23px]">{name === 'password' ? 'Create password' : 'Confirm password'}</FormLabel>
                  <FormControl><Input type="password" autoComplete="new-password" placeholder={name === 'password' ? 'At least 8 characters' : 'Enter your password again'} className={driverAuthInput} {...field} /></FormControl>
                  {name === 'password' && <FormDescription className="px-0.5 text-[10.2px] leading-4 text-[#667080]">Use 8–72 characters with uppercase, lowercase, a number and a special character.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            <p className="mt-2 px-0.5 text-[10.2px] font-medium leading-7 text-[#667080]">Your one-time code will be sent by SMS to this phone.</p>
            <Button type="submit" disabled={isSubmitting} className={`${driverAuthSubmit} mt-[10px]`}>{isSubmitting ? 'Sending code...' : 'Continue'}</Button>
          </form>
        </Form>
        <div className="mt-[10px] flex min-h-[46px] items-center justify-between px-1 text-[12.3px] text-[#667080]">
          <span>Already registered?</span><Link to={authEntryPath('/auth', next)} className="flex min-h-11 items-center font-semibold text-[#111]">Sign in</Link>
        </div>
      </DriverAuthFrame>
    );
  }

  return (
    <RiderAuthFrame variant="signup">
      <div className="mb-4 space-y-1.5">
        <h1 ref={detailsHeading} tabIndex={-1} className="outline-none text-[25px] font-bold leading-tight">Create CruiXe Account</h1>
        <p className="text-[13.5px] font-semibold text-[#6b707d]">{isDriverSignup ? 'Start your driver registration.' : 'Join CruiXe and book your first ride.'}</p>
      </div>

      <Form {...form}>
        <form onSubmit={isDriverSignup ? async (event) => {
          event.preventDefault();
          if (await form.trigger(['fullName', 'nickname', 'email'])) setStep('security');
        } : form.handleSubmit(onSubmitDetails)} className="space-y-3">
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

          {!isDriverSignup && <>
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

          </>}

          <Button type="submit" className={riderAuthSubmit} disabled={isSubmitting}>
            {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending code...</>) : isDriverSignup ? 'Continue' : 'Create Account'}
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
