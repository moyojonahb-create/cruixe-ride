# Signup verification recovery — 13 November 2026

## Branch and scope

Fetched `codex/figma-frontend-foundation` from GitHub. Its actual HEAD is `74cb3d4bb519407d425bfc541cf8038cf620ea24`, exactly the supplied reference; no newer migration commits exist at fetch time. The clean workspace started on unrelated branch `work` at `3ffe639a`; created `codex/driver-onboarding-continuation` from fetched migration HEAD without changing that branch or main.

Read the reconciliation, acceptance matrix, onboarding, account security and recovery records. The matrix inventories 341 frames with zero final acceptances; it does not establish 341 missing screens. Existing registration wizard, capture guides, application outcomes, shared signup/Auth and recovery components already implement parts of onboarding. Date of birth/licence persistence and authenticated application acceptance remain unresolved as documented by the earlier increment. No new complete migration inventory is claimed.

Figma connector reads succeeded for Account Security `1095:153` and Verification Methods `1097:106`, including full design context and renders. Their exact photo, red wave, white curve, shield and back-arrow URLs were provided by the connector, but every direct asset download returned HTTP 403. A header check identified a CONNECT tunnel 403 from envoy. `whoami` succeeded, so this is an asset-download access boundary, not proof of missing Figma file permission. No domain configuration was changed. Existing local artwork was not assumed identical without evidence.

## Implemented

Changed `src/pages/Signup.tsx` in the existing shared signup flow:

- Only claim a code was sent after the existing `omniflex-otp` send endpoint reports success. Show an inline alert and permit retry on HTTP or transport failure.
- Guard the account lookup/submission and SMS request against duplicate concurrent calls, including delayed React Hook Form resolver callbacks after moving to verification.
- Disable changing the number while SMS is in flight. Returning to details clears the prior number's cooldown; resubmitting sends to the normalized new number while preserving entered details.
- Preserve backend request shapes, password policy, signup, destination handling and the unavailable voice method. No database, RLS, service, wallet or payment changes.

Associated frame states: Verify Phone `1093:105` and methods navigation `1097:106`. This is a functional recovery increment, **not a new visual screen migration**. Account Security `1095:153` was inspected only.

## Validation

Node 22.16.0 (default shell Node 24 was not used for repository checks):

- Baseline full suite with dummy public test settings: 51 files passed, one failed, one skipped; 273 tests passed, eight failed, 12 skipped. All eight failures are the existing `walletTransactionDisplay.test.tsx` expectations for `Recent Transactions`, reproduced before edits.
- New `src/test/Signup.verification.test.tsx`: six tests passed with no unhandled errors. Covers HTTP failure/retry, transport failure, lookup exception/retry, duplicate async submissions, changed-number sending and cooldown/voice methods navigation. Auth and network are explicit mocks.
- Application TypeScript check passed; changed-file ESLint has zero errors and three existing warnings (regex escapes and RPC any). `git diff --check` passed.
- Baseline production build passed in 37.13s; final production build passed in 52.72s. Existing Browserslist, Tailwind ambiguity, Sentry and bundle-size notices remain.
- Chromium real Signup component with isolated backend fixtures: seven viewport checks passed (360/375/390/400/430 × 845; XR 414×896; 16 Pro 402×874). Exercised failure text, retry availability, navigation, unavailable voice, preserved number, and no final form horizontal overflow or uncaught browser errors. This is Chromium viewport evidence, not physical-device/Safari or authenticated staging acceptance. Temporary fixture code was kept out of commits.

## Access boundary and next steps

To resume visual migration, restore authenticated download access for the exact asset URLs emitted by Figma MCP, or provide the original exports for `1095:154` / `1097:107` (photo), `1095:156` / `1097:109` (wave), `1095:158` / `1097:111` (curve), `1095:176` / `1097:129` (shield), and `1478:49` / `1478:59` (arrow), preserving intrinsic SVG sizes. Do not substitute screenshots for screens. No password is needed.

Authenticated staging OTP, account creation, driver persistence/uploads and application review require dedicated test accounts/sessions and staging service configuration. Environment status exposes no configured staging credential bindings. Never use production accounts to fill this gap. No staging deployment was attempted: staging deployment access/authorization was not established. No preview URL exists for this increment. No production deployment, main modification, merge, schema change or force-push occurred. Remaining migration phases stay incomplete and final acceptance stays UNVERIFIED.
