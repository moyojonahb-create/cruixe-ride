# Economy cash ride milestone — 11 November 2026

Status: implementation prepared for review; authenticated staging ride **not completed**. No staging deployment or physical iPhone run was performed.

## Scope and source inspection

The existing app is React/Vite with Capacitor; the repository also contains a paused React Native app. Existing Rider and Driver screens, fare negotiation, ride state transitions, Supabase authentication, and a Go backend were inspected. Existing smoke tests validate helpers and UI behavior; they are not an authenticated ride E2E test.

The patch connects Driver cash acknowledgement to a dedicated authenticated Go endpoint, exposes the saved collection timestamp through ride snapshots, keeps the collection sheet open on failure, and distinguishes trip completion from confirmed cash payment. Receipt rendering refreshes saved ride/payment information and escapes inserted text. Completed rides expose receipts from both history views.

Patch source inventory:

- Backend: `backend/internal/rides/handler.go`, `cash_confirmation.go`, `cash_confirmation_test.go`, `snapshot_security_test.go`.
- Frontend: `src/lib/confirmCashCollection.ts`, `src/lib/rideMatching.ts`, `src/components/driver/TripCollectSheet.tsx`, `src/components/ride/PaymentStatusBadge.tsx`, `src/components/ride/TripReceiptButton.tsx`, `src/pages/RideMatching.tsx`, `src/pages/RideHistory.tsx`, `src/components/RideHistorySheet.tsx`.
- Database client types: `src/integrations/supabase/types.ts` adds the existing migration-backed nullable `driver_collected_at` field to ride Row/Insert/Update types.
- Regression tests: `src/test/confirmCashCollection.test.ts`, `PaymentStatusBadge.test.tsx`, `TripReceiptButton.test.ts`.

## Verification

Node 22 was installed in a user-owned workspace directory because the initial runtime was Node 24, which the repository explicitly rejects. Dependencies were installed with `npm ci --ignore-scripts --no-audit --no-fund`. All frontend commands used Node 22 on `PATH`.

| Check | Result | Limits |
| --- | --- | --- |
| Full Vitest suite | PASS: 28 files, 165 tests; 1 file / 12 tests skipped | Used dummy localhost Supabase URL/key. The skipped live wallet RLS tests require external credentials. |
| ESLint | PASS: 0 errors, 278 warnings | Repository-wide `npm run lint`; warnings remain. |
| Final frontend TypeScript | PASS | `tsc --noEmit -p tsconfig.app.json`, after the generated ride field type was corrected. |
| Production build | PASS | `npm run build` with dummy localhost service configuration. |
| Go backend suite | PASS, reported by Backend | Go 1.26.3, `go test -p 2 ./...`; PostgreSQL integration suites skipped without `CRUIZE_P01_TEST_DSN`, `CRUIZE_P02_TEST_DSN`, `CRUIZE_P03_TEST_DSN`. |
| New focused regressions | PASS: 3 files, 9 tests | Cash confirmation (4), payment status (2), refreshed receipt/history (3); rerun after final history edits. Counts overlap the suite and are not additive. |
| Local Chromium smoke | PASS | 414 × 896 mobile viewport, external traffic blocked, localhost dummy services. |
| Authenticated staging E2E | BLOCKED | No confirmed staging build/URL or synthetic Rider/Driver accounts. |
| Physical iPhone XR | NOT RUN | Requires the actual staging installation and device. |

The local browser mounted `/` → `/ride` without uncaught JavaScript errors. `/auth` showed the sign-in form without horizontal overflow, and an unauthenticated `/driver/dashboard` visit redirected to `/auth`. Maps showed the expected unavailable state because external traffic was blocked. These checks do not establish working sign-in, real maps, native permissions, or a completed ride.

Exact frontend commands (prefix with the installed Node 22 directory on `PATH`):

```sh
VITE_SUPABASE_URL=http://127.0.0.1:59999 VITE_SUPABASE_PUBLISHABLE_KEY=qa-dummy-publishable npm test
npm run lint
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
./node_modules/.bin/vitest run src/test/confirmCashCollection.test.ts src/test/PaymentStatusBadge.test.tsx src/test/TripReceiptButton.test.ts
VITE_SUPABASE_URL=http://127.0.0.1:59999 VITE_SUPABASE_PUBLISHABLE_KEY=qa-dummy-publishable VITE_GO_BACKEND_URL=http://127.0.0.1:59998 VITE_WS_URL=ws://127.0.0.1:59998/ws VITE_MAPBOX_ACCESS_TOKEN=qa-dummy npm run build
```

## Staging blockers

- The user confirms no staging URL, TestFlight build, or account runbook is available. The proposed test setup is a dedicated Rider and an approved Driver with an Economy vehicle. No accounts were created; provisioning requires an identified staging environment. Production service defaults in Vite configuration are not proof of staging access.
- `docs/staging/DATABASE-SECURITY-GPS-READINESS.md` records proposal-only / staging NO-GO and requires effective database grants, policies, location privacy controls, and two-account verification. This session did not inspect or change a live database; that document's controls remain unverified.
- The approved frontend verification workflow runs an isolated snapshot and explicitly labels authenticated E2E blocked when no approved staging is available. Passing local gates cannot replace that acceptance run.
- Mobile Engineering inspected approved Figma file `YLDdDmUNi4qbEb3mFfwpkB`: Rider splash `4:14`, Driver welcome `1063:103`, Rider completion `631:104`, Driver cash confirmation `1185:198`, and Driver receipt `1185:281`. Rider completion contains route, fare, driver and rating; Driver receipt contains cash collected, total and route. The approved cash screen instructs the Driver to mark paid only after actual collection, with “Not received” and “Cash received” actions. The patch follows that payment-state rule. The existing app combines commission, rating and collection in one sheet, whereas the approved cash screen is standalone; visual fidelity remains unverified and that layout difference remains.
- Root's read-only connected-service discovery found one healthy Supabase project, `Cruize-ride` (`foksbnjtzubsjpeoorvo`), and only default branch `main`. Its branch record reports `MIGRATIONS_FAILED` with a July 10 update; this is historical metadata, not a fresh migration test. The README references another project (`jidfganntquilvsytslp`), so environment mapping is unverified. Vercel repository-filtered project discovery returned HTTP 403 for team scope. No separate staging deployment was identified, no secrets were fetched, and no remote writes were made.

## iPhone XR acceptance run — all steps untested

Use a synthetic Rider on the iPhone XR and a separate approved Driver account on another device. Record the build identifier and resulting ride ID.

1. Sign in on both devices; verify each keeps the correct account after background/resume.
2. Grant location permission and set pickup/drop-off. Verify pickup accuracy, keyboard visibility, and controls clear of the notch and home indicator.
3. Request **Economy / Cash**. Verify the Driver sees the same request and route.
4. Submit a counter-offer, accept it, and verify both devices show the same agreed fare.
5. Driver arrives, picks up, starts, and completes the ride. Verify each transition reaches the Rider without refresh.
6. Before cash confirmation, verify the completed ride still shows cash payment pending. Confirm cash once; verify both views update. Retry/reopen and ensure the first confirmation persists without duplication.
7. Open and reopen the receipt from trip completion and history. Verify ride ID, route, agreed amount, Cash, and confirmed status agree with the saved ride.
8. Briefly lose connectivity and background/resume both apps. Verify recovery retains the same ride, fare and collection state, with no duplicate request or confirmation.

Retain screenshots and any failure steps with the ride ID; do not put passwords or tokens into the report.
