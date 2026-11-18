type Preview = { id: string; node: string; title: string };

export type AccountPreview = Preview & {
  layout: 'edit' | 'verify' | 'status' | 'case';
  heading?: string;
  subtitle: string;
  section: string;
  fields: [string, string][];
  notice: string;
  action: string;
  next?: string;
};

export const accountPreviews: AccountPreview[] = [
  { id: 'change-email', node: '1365:176', title: "Change Email", layout: 'edit', subtitle: "Manage your driver account information.", section: "Account information", fields: [["Current email","driver@example.com"],["New email","Enter your new email"],["Confirm email","Re-enter new email"]],
    notice: "The new email must be verified.", action: "Save Changes", next: 'verify-email' },
  { id: 'change-phone', node: '1365:209', title: "Change Phone", layout: 'edit', subtitle: "Manage your driver account information.", section: "Account information", fields: [["Current number","+263 77 *** ****"],["New number","+263 7X XXX XXXX"],["Country","Zimbabwe +263"]],
    notice: "A one-time code will be required.", action: "Save Changes", next: 'verify-phone' },
  { id: 'two-step-verification', node: '1365:380', title: "Two-Step Verification", layout: 'edit', subtitle: "Manage your driver account information.", section: "Account information", fields: [["Security method","Authenticator app"],["Recovery email","driver@example.com"],["Recovery codes","Available after setup"]],
    notice: "Two-step verification activates after secure confirmation.", action: "Save Changes", next: 'two-step-setup' },
  { id: 'verify-email', node: '1367:186', title: "Verify New Email", layout: 'verify', heading: "Verify your new email", subtitle: "Enter the code sent to your new address.", section: "Review details", fields: [["Email address","new-email@example.com"],["Verification code","—  —  —  —  —  —"],["Delivery","Email confirmation"]],
    notice: "The new email must be verified on the server before your login address changes.", action: "Confirm Code", next: 'email-verified' },
  { id: 'verify-phone', node: '1367:232', title: "Verify New Phone", layout: 'verify', heading: "Verify your mobile", subtitle: "Enter the one-time code sent by SMS.", section: "Review details", fields: [["New mobile","+263 7X XXX XXXX"],["Verification code","—  —  —  —  —  —"],["Delivery","SMS verification"]],
    notice: "Only a validated one-time code can authorize a phone-number update.", action: "Confirm Code", next: 'phone-verified' },
  { id: 'two-step-setup', node: '1367:460', title: "Two-Step Setup", layout: 'verify', heading: "Set up extra protection", subtitle: "Authenticator verification · Preview", section: "Review details", fields: [["Method","Authenticator app"],["Setup key","Available after secure setup"],["One-time code","—  —  —  —  —  —"]],
    notice: "Two-step protection activates only after the authenticator code is verified and recovery options are saved.", action: "Confirm Setup", next: 'two-step-enabled' },
  { id: 'email-verified', node: '1369:140', title: "Email Verified", layout: 'status', heading: "Email verification complete", subtitle: "Verified address · demonstration", section: "Details", fields: [["Account email","new-email@example.com"],["Verification","Confirmed in example state"],["Profile access","Available after secure update"]],
    notice: "Real verification must be confirmed by the authentication service.", action: "Contact Details" },
  { id: 'phone-verified', node: '1369:176', title: "Phone Verified", layout: 'status', heading: "Phone verification complete", subtitle: "SMS verification · demonstration", section: "Details", fields: [["Mobile number","+263 7X XXX XXXX"],["Verification","Confirmed in example state"],["Next sign in","Use verified contact"]],
    notice: "No account phone change occurs without server OTP verification.", action: "Contact Details" },
  { id: 'two-step-enabled', node: '1369:212', title: "Two-Step Enabled", layout: 'status', heading: "Extra protection ready", subtitle: "Two-step verification · demonstration", section: "Details", fields: [["Authenticator","Connected (example)"],["Recovery codes","Store securely"],["Next sign in","Second factor required"]],
    notice: "The real app must enforce this setting server-side.", action: "Account Security" },
  { id: 'account-recovery', node: '1369:248', title: "Recover Driver Account", layout: 'status', heading: "Recover your account", subtitle: "Start secure driver account recovery", section: "Details", fields: [["Recovery method","Email or mobile"],["Registered contact","Enter verified contact"],["Next step","Verify your identity"]],
    notice: "Never reveal whether an account exists before validating the recovery flow.", action: "Send Recovery Code", next: 'recovery-code' },
  { id: 'recovery-code', node: '1369:284', title: "Recovery Code", layout: 'status', heading: "Enter your recovery code", subtitle: "Six-digit security verification", section: "Details", fields: [["Delivery","Registered contact only"],["Recovery code","— — — — — —"],["Code validity","Time-limited and single-use"]],
    notice: "Rate-limit attempts and validate codes securely in production.", action: "Verify Code" },
  { id: 'wallet-dispute', node: '1376:239', title: "Wallet Transaction Dispute", layout: 'case', heading: "Review a transaction issue", subtitle: "Question a wallet charge or incorrect credit.", section: "Case overview", fields: [["Transaction","Choose wallet entry"],["Reason","Describe the discrepancy"],["Proof","Attach supporting information"]],
    notice: "This is a Figma example. Only confirmed server records should show received, approved, closed or resolved statuses.", action: "Review Dispute", next: 'wallet-dispute-status' },
  { id: 'wallet-dispute-status', node: '1376:272', title: "Wallet Dispute Status", layout: 'case', heading: "Wallet dispute preview", subtitle: "Track a wallet payment or deduction case.", section: "Case overview", fields: [["Case reference","Issued after submission"],["Current status","Ready to submit"],["Review outcome","Await official response"]],
    notice: "This is a Figma example. Only confirmed server records should show received, approved, closed or resolved statuses.", action: "Wallet Activity" },
];

export type StudentPreview = Preview & { layout: 'ride' | 'call' };

export const studentPreviews: StudentPreview[] = [
  { id: 'student-request', node: '1270:129', title: 'Student ride request', layout: 'ride' },
  { id: 'student-offer-waiting', node: '1270:239', title: 'Offer sent to student rider', layout: 'ride' },
  { id: 'student-offer-accepted', node: '1270:323', title: 'Your offer was accepted', layout: 'ride' },
  { id: 'student-call-ringing', node: '1270:823', title: 'Student call · Ringing', layout: 'call' },
  { id: 'student-call-active', node: '1270:867', title: 'Student call · Active', layout: 'call' },
  { id: 'student-call-ended', node: '1270:909', title: 'Student call · Ended', layout: 'call' },
  { id: 'student-call-failed', node: '1270:936', title: 'Student call · Failed', layout: 'call' },
];

export const driverPreviewBatch = [...accountPreviews, ...studentPreviews];
