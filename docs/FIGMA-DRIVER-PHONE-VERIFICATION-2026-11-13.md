# Driver phone verification and staging — 13 November 2026

## Scope

New Figma mapping: `1093:105` Verify Phone. `DriverPhoneVerification.tsx` uses the existing shared DriverAuthFrame artwork, Poppins fonts, InputOTP widget and Signup-owned services. No new independent auth client or mock backend was introduced.

The code-sent state matches the approved shell and six-digit row (400px reference: y448, h62, gap9), resend hit area, Verify & continue action, methods entry and safety footer. Native disabled states reflect incomplete codes/in-flight operations. Failed sends use truthful conditional subtitle/helper text and an inline retryable error; rejected/failed verification shows an associated alert and aria-invalid. Successful resends clear stale input and verification feedback. Concurrent verification is guarded synchronously.

Phone-verified, account-creation-pending and account-creation-error/retry states now retain the Driver shell and existing backend behavior; these are functional states, **not additional newly accepted Figma frames**. Back returns to Account Security with the existing number and resets the cooldown. Rider OTP retains its presentation and services. Live account creation still requires real successful verification; fixture data is confined to tests/scratch browser QA.

Changes: `src/components/auth/DriverPhoneVerification.tsx`, `src/components/auth/DriverAuthFrame.tsx`, `src/pages/Signup.tsx`, `src/components/ui/input-otp.tsx` (slot active/empty data attributes), and `src/test/Signup.verification.test.tsx`. Docs/acceptance ledger record the evidence.

## Verification

- Node22.16.0:18 signup regression tests pass; application TypeScript passes; changed-file lint has no errors and only the three pre-existing Signup regex/RPC warnings.
- Production build passed (35.79s). All 29 staging environment/build-guard regression tests pass.
- Independent agents reviewed screens, authored tests, inspected staging setup and exercised browser fixtures. Corrected unconditional sent-copy and stale resend feedback found during review.
- Browser QA covers the real components with explicit network/auth fixtures; screenshots at360/400px are compared with the Figma render. Final independent browser run passes all seven requested viewports (360/375/390/400/430×845, XR414×896,16Pro402×874), including successful fixture verification, rejected OTP and account-creation retry without another code. This is not live SMS acceptance or a physical iPhone/Safari result.

## Staging access reconciliation

Earlier local notes claiming API/WSS were unset are stale. Connected Vercel reads confirm existing `cruixe-staging`, project `prj_F6em9zDGv7TUF0LmbWObgYoyZfkW`, team `team_cRNzOCgbNp4VukxLDCEzR9yh`, Node22/Vite and SSO protection. Its previous READY deployment was at74cb3d4b.

The previous deployed application bundle uses API `https://cruixe-go-staging-staging.up.railway.app`, WSS on that host at `/ws`, and Supabase `https://sgqqhrrdfyrebqreodfl.supabase.co`; known production API/Supabase identities were absent from that JavaScript bundle. Backend liveness/readiness succeeds and reports PostgreSQL, Redis and Asynq healthy and authoritative dispatch. Email/push/SMS notification providers report `noop`; host identities/readiness do not prove genuine OTP delivery or effective database/schema isolation.

User explicitly authorized deploying the next frontend increment to this existing staging project. Deployment uses an exact pushed commit and the configured preview/staging environment guard. No production project/branch/domain/environment/schema changes or merge are authorized or performed. Deployment outcome will be recorded after Vercel completes.
