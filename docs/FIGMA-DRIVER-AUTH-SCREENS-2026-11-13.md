# Driver account security and verification methods — 13 November 2026

This increment implements Driver Account Security `1095:153` and Verification Methods `1097:106` in the existing shared signup flow. It does not establish authenticated staging acceptance or complete Driver onboarding.

## Implementation and design

`src/components/auth/DriverAuthFrame.tsx` supplies one shared responsive shell for the two screens: locally exported photo layer, original red wave/white curve/shield/back assets, and existing licensed Poppins fonts. Artwork wrappers adapt width while exported SVG root dimensions remain unchanged. Fields, descriptions and validation errors use document flow; the page scrolls and respects safe areas.

`src/pages/Signup.tsx` detects Driver signup from the sanitized destination pathname (`/driver` or `/driver/…`). The existing personal details fields advance to Account Security, which validates the same full schema and calls the same account lookup/SMS/signup services. Rider signup remains one page. One form retains identity and security values when moving back; changing the number returns Driver to Account Security. No passwords are persisted to browser storage.

A taken nickname returns to its visible details field. Back is disabled during submission. Heading focus and scroll reset announce new screens. Password requirements and errors use FormDescription/FormMessage associations. Existing duplicate guards, SMS errors, resend cooldown and verified-account creation retry remain in place.

Intentional differences from the prototype:

- Keep password confirmation and the existing 8–72-character uppercase/lowercase/number/special-character policy. The added confirmation and requirement text extend the security screen below the prototype's two-field layout; this is not exact pixel parity for its lower controls.
- Voice OTP is visibly unavailable and has no action. SMS wording describes the supported method; no successful call verification is simulated.
- Inputs use 16px text to avoid iOS focus zoom; prototype input text is smaller.

Initial personal details `1092:105` is **not migrated or accepted** here. Its Figma context was inspected, but date-of-birth persistence is still unresolved; the existing name/nickname/optional email fields are retained as the preceding step. Verify Phone `1093:105` remains the existing OTP presentation. No new approved state is fabricated for either.

## Review and validation

Independent agents reviewed design constraints, authored regression tests, reviewed the implementation, and exercised the browser fixture. Production implementation had one owner. Review found and corrected hidden nickname errors, active Back during lookup, password error associations and scroll/focus transitions.

Validation (Node 22.16.0):

- `Signup.verification.test.tsx`: 16 tests pass, including Rider regression, Driver split/validation/back, pending lookup/back guard, nickname collision, SMS transport/provider failure and retry, changed number, duplicate submissions, voice unavailable/cooldown, rejected OTP, preserved destination and verified account-creation retry without another SMS.
- Independent Chromium fixture: seven viewport scenarios pass at 360/375/390/400/430×845,414×896 and 402×874. No horizontal overflow, broken images or uncaught browser errors. All five artwork assets and Poppins 400/500/600/700 load. Screen callbacks and preserved values exercised.
- At 400px photo0,0,400×246; red wave0,216,400×65; paper0,237,400×608; arrow26.5,37.5,26×26; shield245,40,20×20; heading y276/h37. Screenshots at 360/400px of both states were visually inspected against Figma. The full security form scrolls to retain confirmation.
- Application TypeScript and changed-file ESLint checks pass with three existing Signup warnings (regex escapes/RPC any); no new lint errors. Production build passes. Final production build: 29.14 seconds.
- Final screenshots and fixture report were generated in scratch workspace; no fixture routes or fake backend data were added to the application. Network/auth fixtures are explicit mocks, not genuine SMS or staging account creation. Earlier baseline: 273 tests passed, eight wallet presentation tests failed, 12 skipped; no wallet code changes in this increment.

## Remaining acceptance gates

Authenticated staging SMS delivery, account creation, Driver application persistence and review require dedicated staging test access. No deployment was attempted. No production/main/database/RLS/backend/payment/wallet/Figma design edits are included. Draft PR #7 remains unmerged. Final acceptance stays UNVERIFIED until staging and the deliberate design differences are reviewed.
