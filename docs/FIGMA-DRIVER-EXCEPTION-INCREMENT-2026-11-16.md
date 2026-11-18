# Driver exception screens — 16 November 2026

## Source reconciliation

Resumed from local `ed4d97d6`; the pasted handoff's four-screen edits were not in the checkout. Inspection of staging and GitHub found five newer commits ending at `8fbeb3c9f63f6f512f861f5eb0a6d62e7b6d48de`. Fast-forwarded to that exact remote HEAD and reapplied this batch, resolving Profile/history conflicts by preserving the newer detail links, React Query history, receipts, document review and account migrations. No reset or force-push.

## Four mapped frames

- `1373:374` Rider Cancelled Ride: cancelled history entries open the new view through the existing DriverHistoryScreens callback. The latest saved `trip_events` cancellation actor must match the ride's Rider UUID, without conflicting driver attribution. Missing, inaccessible, stale or mismatched evidence uses neutral **Trip Cancelled** text. No reason-string guessing or fabricated cancellation fee.
- `1373:413` Pickup No-Show Resolution: reached only from an arrived active trip. Contact uses the existing call callback; Keep waiting returns to navigation. Report calls the existing dispute service with Driver role and `other` category; success requires `{success:true}`. Failed reports remain retryable. Reporting never changes the ride status or awards a fee.
- `1373:452` Account Suspended: Profile's Account status entry uses the saved Driver status, explains the restriction and opens the existing support email flow for review.
- `1373:491` Account Reactivated: only an observed same-Driver suspended→approved transition reaches this state. Fresh approval or missing transition evidence stays neutral. Return Home uses the existing dashboard and does not bypass availability/eligibility checks.

The shared DriverExceptionLayout uses the actual Figma context/render, local Poppins400–700 and the exact existing back-arrow asset. It preserves red status cards, black offset backing, white detail/notice cards, warm background and paired footer. Forms/messages flow and scroll at supported widths. Native/browser UI owns clock/signal indicators; no fake9:41 status bar is rendered. Support reasons and waiting allowances are not invented.

## Behavior and evidence

Independent agents inspected the Figma frames, implemented/reviewed account behavior, audited trip contracts, reviewed the integration, checked browser rendering and inspected staging. The parent active-trip view retains no-show request state while it remains mounted; pending reports disable navigation, and Back/reopen retains a successful report. This is not server-side idempotency across reloads or separate sessions. That requires a separately verified persisted lookup/contract; no schema changes are included.

Changed source: DriverExceptionLayout, DriverTripExceptionScreens, driverTripExceptionState, DriverAccountStatusScreen, useObservedDriverReactivation, DriverProfile, DriverTrips, DriverHistoryScreens and FullScreenNavigation. Added tests cover saved attribution, neutral lookup failures, dispute failure/retry/pending/reopen, account transition evidence and the latest history callback. Existing account, records, details and trip-recovery tests are included in verification.

Validation uses Node22.16.0. All 47 tests in the seven affected/new Driver suites pass. Independent browser QA passes 28 screen/viewport scenarios plus seven neutral-attribution checks at 360/375/390/400/430px, XR414×896 and16Pro402×874. The final build passed in30.22s. The final deployment result is recorded in draft PR#7 and the turn's deployment report. Application TypeScript and production build checks pass; changed-file lint has no errors and eight pre-existing warnings in older navigation/Profile/history files. Browser fixture tests exercise actual components with explicit test network/account data; they do not establish authenticated staging integration or live platform review.

## Deployment and remaining gates

Deploy only the tested pushed commit as a preview under the existing `cruixe-staging` project (`prj_F6em9zDGv7TUF0LmbWObgYoyZfkW`, team `team_cRNzOCgbNp4VukxLDCEzR9yh`). Keep SSO protection and the staging build guard. The user's standing authorization covers staging deployment of tested batches. Final runtime/asset checks and the exact URL/SHA belong in the deployment report.

No production/main merge, backend/schema/RLS/payment changes, account approval or automatic cancellation occurred. All four final acceptance statuses remain UNVERIFIED pending dedicated authenticated staging sessions and review of live records/service results. The 341-frame inventory is preserved, not recounted as missing screens.
