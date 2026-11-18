import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import DriverAuthFrame, { driverAuthSubmit } from './DriverAuthFrame';

export interface DriverPhoneVerificationProps {
  phone: string;
  otp: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onChangeNumber: () => void;
  onMethods: () => void;
  onRetrySignup: () => void;
  countdown: number;
  codeSent: boolean;
  isSending: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  isSubmitting: boolean;
  sendError: string | null;
  verificationError: string | null;
  signupError: string | null;
}

/** Driver1093:105, using the shared real OTP input and Signup-owned services. */
export default function DriverPhoneVerification(props: DriverPhoneVerificationProps) {
  const { isVerified, isSubmitting, signupError } = props;
  return (
    <DriverAuthFrame description={props.codeSent ? undefined : 'Request an SMS code to verify your phone.'} mode="otp" onBack={props.onChangeNumber} busy={props.isSending || props.isVerifying || isVerified}>
      {isVerified ? (
        <section className="mt-[27px] space-y-5" aria-live="polite" aria-busy={isSubmitting}>
          <h2 className="text-xl font-semibold">Phone verified</h2>
          <p className="text-sm text-[#667080]">{isSubmitting ? 'Creating your account…' : signupError ? 'Your phone is verified. Please retry creating your account.' : 'Completing registration…'}</p>
          {signupError && <>
            <p role="alert" className="text-sm text-destructive">{signupError}</p>
            <Button type="button" onClick={props.onRetrySignup} disabled={isSubmitting} className={driverAuthSubmit}>Try again</Button>
          </>}
        </section>
      ) : (
        <section aria-label="Phone verification">
          <p className="mt-[27px] min-h-[27px] px-0.5 text-[13px] font-medium leading-[27px]">{props.codeSent ? 'Code sent to the mobile number you entered.' : 'Request a code for your mobile number.'}</p>
          <p className="sr-only">Mobile number: {props.phone}</p>
          {props.sendError && <p role="alert" className="my-2 text-sm text-destructive">Could not send your code. {props.sendError} Please try again.</p>}
          {props.verificationError && <p id="driver-otp-error" role="alert" className="my-2 text-sm text-destructive">{props.verificationError}</p>}
          <div className="mt-[13px]">
            <InputOTP maxLength={6} value={props.otp} onChange={props.onOtpChange} disabled={props.isVerifying || props.isSending} pattern="^[0-9]*$" aria-label="Verification code" aria-invalid={!!props.verificationError} aria-describedby={props.verificationError ? 'driver-otp-error driver-otp-expiry' : 'driver-otp-expiry'} containerClassName="w-full" pushPasswordManagerStrategy="none">
              <InputOTPGroup className="w-full gap-[9px]">
                {Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="h-[62px] min-w-0 flex-1 rounded-[14px] border-[1.1px] border-[#e3e7ee] text-[24px] font-semibold first:rounded-[14px] last:rounded-[14px] data-[active=true]:border-[#ff000d] data-[active=true]:ring-0 data-[empty=true]:after:content-['—'] data-[empty=true]:after:text-[#e3e7ee] data-[active=true]:after:text-[#1f2129]" />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p id="driver-otp-expiry" className="mt-[11px] flex min-h-[27px] items-center px-0.5 text-[10.6px] text-[#667080]">For your security, codes expire after a short time.</p>
          <button type="button" disabled={props.countdown > 0 || props.isSending || props.isVerifying} onClick={props.onResend} className="mt-[18px] min-h-[45px] w-full text-center text-[12.5px] font-semibold disabled:cursor-not-allowed">{props.isSending ? 'Sending code…' : props.countdown > 0 ? `Resend in ${props.countdown}s` : "Didn't receive the code? Resend code"}</button>
          <Button type="button" onClick={props.onVerify} disabled={props.otp.length !== 6 || props.isVerifying || props.isSending} className={`${driverAuthSubmit} mt-8`}>{props.isVerifying ? 'Verifying…' : 'Verify & continue'}</Button>
          <button type="button" onClick={props.onMethods} disabled={props.isVerifying || props.isSending} className="mt-[14px] min-h-[45px] w-full text-center text-[12.5px] font-semibold">Use a different method</button>
          <p className="mt-[22px] flex min-h-6 items-center justify-center text-center text-[10.5px] text-[#667080]">Never share your OTP with anyone, including CruiXe.</p>
        </section>
      )}
    </DriverAuthFrame>
  );
}
