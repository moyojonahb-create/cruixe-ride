# Driver account security and verification — incremental migration assessment (2026-11-12)

Source: [CruiXe Ride Main](https://www.figma.com/design/YLDdDmUNi4qbEb3mFfwpkB/CruiXe-Ride-Fronted?node-id=0-1). Target branch: `codex/figma-frontend-foundation`. This is an evidence and recovery increment, **not** a declaration of two completed or accepted screen migrations.

## Figma nodes reviewed
- `1095:153` — Driver / 03B Account Security. Phone input with +263 convention, password, Continue to SMS, Sign in and back. Design uses the existing branded photo, red wave, white centre-dip curve, shield and back-arrow assets.
- `1097:106` — Driver / 04B Verification Methods. SMS and automated voice call options, both associated with the registered number; Figma itself notes voice availability is provider dependent.

## Existing code and behavior
- `src/pages/Signup.tsx` is the existing authenticated-account signup and OTP implementation, using `omniflex-otp` for SMS verification before account creation. It enforces a stricter password policy than the Figma prototype (uppercase, lowercase, digit, special character, eight characters minimum). Preserve that policy and the existing signup/verification contracts.
- `src/pages/Auth.tsx` is the shared login screen. Do not create a second diverging driver login implementation.
- There is no confirmed voice-call OTP backend contract in the inspected files. **Do not expose a working-looking voice verification option until an authorized service has been implemented and tested.** No fabricated successful OTP flows.
- Existing Figma visual assets must be exported into local files and checked for exact geometry before marking visual parity. The current source investigation does not meet that gate.

## Delivered code improvement
- The phone-verified signup completion state previously had an indefinite spinner on signup failure: `completeSignup` could set a toast and return without providing a retry control.
- `Signup.tsx` now records the account-creation failure and displays a Try again action in the already-verified state. The retry uses the existing verified signup data, without asking for a second SMS code or claiming an account was created.
- Backend, database, payment, wallet, driver approval, and Figma files were not changed.

## Acceptance status
- **Functional recovery patch: committed; automated and authenticated tests pending.**
- **Two reviewed Figma screens: design context captured; full visual implementation pending.**
- Explicitly test first-time OTP verification -> account creation rejection -> retry -> success without extra OTP; rejected retry; repeated click disabled while submitting; and unmount before deferred signup.
- Run React/Vitest tests, TypeScript, lint, staging browser checks at 360/375/390/400/430 px with actual locally hosted asset dimensions. Do not mark accepted without this evidence.
- Keep Wallet migration deferred and PR #6 unmerged. No staging/production deployment is implied.
