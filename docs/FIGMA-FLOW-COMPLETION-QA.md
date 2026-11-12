# Rider and Driver flow coverage — 12 November 2026

**Completion gate remains open.** This is a source and focused-test audit of baseline `f3591925e620b68aa4e76ef65e0fc4ebb069a30c`, with concurrent implementation work excluded from acceptance claims. It does not certify every Figma screen connected. The user has deferred the physical ride test until screen connections are complete. No app changes, deployment, remote account action or physical-device acceptance were performed by this audit.

Source lineage is compatible with the earlier cash milestone: `git merge-base --is-ancestor 4056fe5df06454f4d73181ee016b33a089346e71 HEAD` returned 0 (as did checks for the cash UI and staging guard commits). The frontend confirmation helper, authenticated Go `ConfirmCash` handler and registered `/api/rides/:rideId/confirm-cash` route exist here. Different frontend/backend commit identifiers alone do not prove incompatibility; deployed API/schema parity must still be verified independently.

## What the ledger establishes

`FIGMA-SCREEN-ACCEPTANCE-MATRIX.json` contains 341 frames: 168 Main/Rider, 149 Main/Driver and 24 Wallet. It records 333 UNVERIFIED and eight TESTED entries, **zero ACCEPTED**. Those eight are three application outcomes and five capture guides tested with local fixtures; authenticated submission/storage/review remains unverified. Forty-two rows identify component candidates and 60 identify gallery evidence, with overlap. These counts are not independent completed-screen totals. Frames, routes, component variants and business journeys cannot be subtracted from one another to calculate missing screens.

The earlier reconciliation's 29 live references came from selected files; the later progress document's 42 came from a wider scan. The matrix is incomplete, so there is no defensible remaining unique-screen count yet. A complete screen-to-route/state/action mapping is still required for all 341 rows, including explicit duplicate/superseded/deferred decisions.

## Actual routes versus remaining connections

Source evidence is `src/App.tsx` and the named components below. “Exists” means source wiring was found, not that the authenticated workflow passed.

| Journey family | Existing application entry/state | Remaining acceptance or connection gap |
| --- | --- | --- |
| Rider/Driver welcome, sign-in, signup, reset and verification | `/auth`, `/signup`, `/reset-password`, `/driver` | Shared auth routes exist; reconcile every role-specific Figma variant, destination/session recovery and phone/security method. Do not substitute preview outcome switches for actual Auth. |
| Driver registration, capture, application and corrections | `/driver/register`, `/driver/application`; `DriverRegistrationWizard`, `DriverCaptureGuide`, `ApplicationStatus` | Eight locally tested states are not full registration acceptance. Baseline document records DOB/licence number/expiry persistence unverified and single-image versus multi-view vehicle capture gaps. Verify protected application upsert, private storage, correction upload, administrator outcome and operability together. |
| Rider discovery, location, tiers and preferences | `/ride`; `RideView`, destination editor, town/tier/preference sheets | Source contains actual location/booking callbacks. Each Figma empty/loading/permission/error/tier state still needs precise mapping and visual/action evidence. |
| Economy negotiation, pickup, navigation, completion and receipts | `/ride/:rideId/matching`, `/driver/dashboard`, `/driver/requests`, `/driver/ride/:rideId`; `FullScreenNavigation`, collection and receipt components | Live Go/Supabase handlers exist; prove reconnect, rejection/cancellation, pickup, start/completion and cash timestamps remain synchronized. Prior local cash regression results do not accept every new Figma state. |
| Scheduled, guest and intercity bookings | `RideView`, `ScheduleRide`, `BookingForSomeoneElse`, `IntercitySelector`; `/track/:tripId` | Existing creation/review paths are separate from preview variants. Verify actual booking status, secure guest invitation/tracking, recipient identity and schedule execution/cancellation. Parcel scheduling is explicitly unsupported in baseline UI. |
| Shared ride | `ShareRideSheet`, shared-tier matching/recovery | Source explicitly says live multi-passenger pooling/dispatch is not established. A two-seat policy label or normal driver search is not pooled matching, second-rider boarding or updated-route integration. |
| Parcel sender/Driver/recipient lifecycle | Existing `ParcelBookingSheet` submits through live booking path; generic Driver ride infrastructure exists | `ParcelBatchScreen` is used only by the gallery. Twenty preview variants do not establish collection/proof, private recipient code/link authorization, delivery transition, cash or issue handling. Reconcile backend contracts before connecting these actions. |
| Calls, messages, notifications | Existing `RideCommunication`, `ActiveCallOverlay`, `DriverMessageSheet`, `NotificationCenter` | Real transport hooks exist, but sender/recipient/student-specific gallery variants are not independent live call flows. Verify caller identity, channel authorization, permission/error states and actual duration/status. |
| Rider account, saved places, preferences and security | `/profile`, `/edit-profile`; preferences panel and existing favorites infrastructure | Profile actions exist. No dedicated baseline routes matching the full approved logged-in-devices/account-security/support-case families were found. A shared panel may satisfy a frame only after semantic/action verification. |
| Driver account, vehicle, earnings and settings | `/driver/profile`, `/driver/trips`, `/driver/leaderboard`; feedback, notifications and emergency-contact sheets | Existing data-backed profile and panels must be preserved. Map every approved state to its panel/tab/action and verify persistence. Baseline document query uses Auth UUID as `driver_documents.driver_id`; confirm the identifier contract before declaring document status correct. |
| Safety, support, lost item, policies and deletion | `/safety`, `/terms`, `/privacy`, `/delete-account`; `SafetySheet`, dispute components | Safety and deletion handlers exist. Driver profile Help opens email, which is not the approved support-case lifecycle. No baseline dedicated support-case/lost-item routes found. Verify SOS/privacy, case ownership/status, deletion identity and failure paths, not only navigation. |
| Rider/Driver wallets and payments | `/wallet`, `/driver/wallet`, `/driver/deposit`; existing ledger/PIN controls | Wallet visual migration is explicitly deferred, including 24 Wallet-page frames and wallet-related Main variants. “All screens complete” cannot include wallet until scope is explicitly reconciled and secure existing money behavior retained. |

## Preview-only evidence

`/staging/figma-20`, `/staging/parcel-20` and `/staging/communication-20` are guarded by `import.meta.env.MODE === 'staging'`. Their `Batch20JourneyScreen`, `ParcelBatchScreen` and `CommunicationBatchScreen` renderers are imported only by those gallery pages in the audited baseline. They receive generic fixtures and inert callbacks. Gallery buttons explicitly report that no real trip, booking or payment was changed.

The corresponding inventory tests assert definitions, distinct IDs and grouping. They do **not** prove navigation to real actions, recipient authorization, call transport, payment or delivery. Some corresponding product behavior exists in other components, so “gallery-only renderer” must not be misreported as “no implementation anywhere.”

## Checks in this audit

Node 22 was selected from `/workspace/work/qa-runtime/node_modules/.bin`; dependencies installed with `npm ci --ignore-scripts --no-audit --no-fund`. Tests use dummy localhost Supabase public configuration, no real sessions or credentials.

- Focused baseline: **PASS, 14 files / 56 tests**, Node 22.23.4. Selected onboarding/application/recovery tests, all three gallery-definition suites, cash collection/receipt helpers and SafetySheet.
- Application TypeScript: **PASS**, exit 0 (`tsc --noEmit -p tsconfig.app.json`). This run preceded completion of concurrent follow-up edits and must not be carried forward as their final validation.
- No full suite, fresh screenshots, visual parity, staging round-trip, native permissions or physical ride result is claimed here. Prior onboarding report records eight wallet transaction display failures reproduced on its baseline; those are historical evidence and outside this focused run.

## Gate before the deferred ride test

1. Resolve each Figma row to a live route plus state/entry action, or an explicit approved duplicate/deferred decision. Preserve existing authorization and business logic.
2. Replace inert preview actions with verified product handlers where required; prove meaningful back/retry/failure paths and no stale or fabricated successful outcomes.
3. Attach exact-frame screenshots, responsive/accessibility observations and focused action/contract tests to each journey family. Mark local fixtures separately from authenticated evidence.
4. Check the final commit's TypeScript/lint/build/tests and isolated service mapping. Keep screen completion distinct from release readiness.
5. After the user resumes ride testing, execute the two-device Economy cash ride and physical iPhone checks. Until then every physical-device and full-ride acceptance item remains **NOT RUN**.
