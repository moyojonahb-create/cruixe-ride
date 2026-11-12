# Driver onboarding migration increment — 12 November 2026

## Scope delivered

Eight real Figma states now use exact exported vector assets and locally hosted, licensed Poppins fonts in existing application components:

- Application received `1101:619`, changes requested `1101:689`, approved `1101:759`: `ApplicationStatus`, reached at `/driver/application`.
- Profile photo `1102:105`, identity `1102:155`, licence `1102:206`, vehicle documents `1102:259`, vehicle photos `1102:312`: `DriverCaptureGuide`, reached through `/driver/register` capture guidance.

The original frames remain intact and editable in [Figma](https://www.figma.com/design/YLDdDmUNi4qbEb3mFfwpkB). Only reads and original SVG exports were performed. This is eight migrated states, not twenty completed migrations and not full authenticated acceptance.

## Live behavior repaired

Application outcomes now prioritize suspension and rejected current documents over an approved profile display. Submitted counts use the latest document of each type rather than a fabricated fixed total. Query failures display a safe failure state, not an empty application or stale approval. Back, review-documents and continuation buttons navigate to real destinations; prototype outcome switches are excluded.

Registration uses the existing protected Go upsert contract, saving the entered full name and gender with vehicle details and preserving application identity on retries. Failed uploads lead to `/driver/application`, whose recovery uploader now supports all seven wizard document types plus its legacy types. PDF selection, same-file retries and object URL cleanup work without fabricating image previews. Customer-facing messages do not expose operator scripts or schema instructions.

The existing backend deliberately owns approval, presence and document pending state. No authorization, database, Go service, payment or wallet behavior was changed by this increment.

## Evidence

- Node 22.16.0 application TypeScript check: passed.
- ESLint: zero errors; existing warnings remain (full workspace scan: 278 warnings including one scratch fixture warning).
- Production Vite build: passed, 45.81 seconds.
- Production artifact inspection: no emitted gallery/preview/batch-inventory chunks. Gallery routes remain staging-mode-only; raw source scanners explicitly exclude their implementation files. Literal excluded path names in scanner/App source are not runtime gallery code.
- Configured frontend suite: 43 files passed, one failed, one skipped; **236 tests passed, 8 failed, 12 skipped**.
- All eight failures are `walletTransactionDisplay.test.tsx` expectations for `Recent Transactions`. A clean detached worktree at baseline `5cad8d6fdf82463e2e6813bf026a3b657a72b25c` reproduced all eight under the same Node/configuration. Wallet code remains deferred and unchanged.
- First unconfigured full-suite run also failed two suites due to missing public Supabase fixture settings. Supplying dummy public test configuration resolved those setup failures; no real credentials were used for unit tests.
- Chromium real-component fixture checks: **50 passed**. Five capture states, three application outcomes and two status safety cases were exercised at 360/375/390/400/430 px, with actual local Poppins weights 400/500/600/700 loaded. No horizontal overflow, broken images, browser errors or callback failures. Source SVG dimensions remained intact.
- Browser screenshots were visually inspected against the exact Figma contexts. Fixture props are test data, not evidence of an authenticated review/upload backend round-trip.

## Remaining gates

The 341-frame inventory remains the current scope; this increment updates eight acceptance-ledger entries to TESTED, not ACCEPTED. A reliable count of genuinely missing unique product screens still requires semantic reconciliation of the remaining states.

Authenticated staging application submission, private document storage, review updates and operability require dedicated test sessions and remain unverified. Date of birth, licence number and licence expiry are collected by the existing form but have no verified writable persistence contract in the current application endpoints. Do not mark full registration accepted until that gap is resolved and tested.

Next priority: finish the remaining onboarding/account states and their verified persistence contracts, then continue non-wallet journeys. Wallet migration stays last. Keep PR #6 draft; no merge or production release is authorized.
