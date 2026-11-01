Date: 1 November 2026 (Africa/Johannesburg). Status vocabulary: PASS, FAIL, BLOCKED, NOT VERIFIED. Browser fixture evidence is explicitly isolated and mocked; it does not verify live application services. No backend, production data, RLS, ledger, assignment authority or approved CI payload was changed.

# REAL APP READINESS AUDIT

**Frontend integration: NO-GO. Production release: NO-GO.** The actual app and the approved isolated redesign are separate implementations. The VS Code panel serves the labelled fixture at 127.0.0.1:8083, not the authenticated real application. The main application at localhost:8080 was not running during the earlier loading investigation; the fixture's subsequent success did not resolve or certify the real application's startup/integrations.

## Implementation boundaries inspected before edits

| Area | Status | Implemented / missing evidence |
|---|---|---|
| Main React architecture | PASS | src/main.tsx mounts providers and App.tsx routes. Web uses BrowserRouter; Capacitor uses HashRouter. Source inspection only. |
| Approved redesign boundary | PASS | Isolated src/components/ride plus approvedRide.css; fixture config aliases auth, wallet, pricing, requests, bootstrap and map to QA services. These aliases are not evidence of real integration. |
| React/TypeScript compiler readiness | NOT VERIFIED | Current edits are HTML/CSS, but the full current application has not passed fresh TypeScript/CI. Historical passes remain historical. |
| Authentication | NOT VERIFIED | useAuth restores/refreshes sessions; requestRide calls auth.getUser. Real identities, token expiry and revoked-session behavior require staging. |
| Supabase RLS | NOT VERIFIED | Migration files exist; deployed grants, policies, roles, publications and revocation were not inspected live. No database connection was made. |
| Go APIs | NOT VERIFIED | Bearer-token client, API calls and backend handlers exist. Reachability, deployed version and contract compatibility are not verified. |
| Map integration | NOT VERIFIED | Genuine Mapbox component/token loader and failure UI exist. CDN/tiles/WebGL/provider entitlement not exercised with an approved environment. |
| Driver location | NOT VERIFIED | useDriverTracking requires rideId and active status. rideLocationSubscription checks scoped socket snapshots, driver identity and timestamp freshness; no raw tracking fallback there. Deployed authorization/reconnect remains unverified. |
| Booking authority | FAIL | requestRide permits direct Supabase insertion when Go is unconfigured/unavailable. isBackendUnavailable includes UNAUTHENTICATED. This violates the requested single backend authority boundary; it is not proof that deployed RLS is bypassable. |
| Honest offline booking | FAIL | requestRide returns ok:true with a local queued ID/_offline flag. RideView's inspected success path consumes ride.id without an _offline distinction before subsequent work. Needs explicit queued/not-booked behavior and idempotency proof. |
| Fare authority | FAIL | useTownPricing starts from built-in rates; RideView calculates proposals/tier multipliers. No inspected frontend authoritative quote/revision/expiry handshake proves the displayed amount is server-verified. |
| Route/ETA fidelity | FAIL | osrm.ts uses straight-line multipliers if OSRM fails; getDriverETA discards the isEstimate marker. Estimates cannot meet the requested verified-routing-only rule. |
| Payments/wallet | NOT VERIFIED | Wallet API routes and cash/wallet request validation exist. useWallet exposes 0 when wallet is null, so unavailable is not distinguishable from verified zero through balance alone. No financial request executed. |
| Error/reconnect states | NOT VERIFIED | Error boundaries, map retry UI, socket resets and auth circuit breaker exist. Real outage, recovery, cancellation and duplicate-request behavior remain staging gates. |
| Capacitor source/config | PASS | app config, Android project, permission declarations, native keyboard bridge and HashRouter integration are present. Runtime/native acceptance is a separate blocked gate. |
| Native iOS/Android execution | BLOCKED | No real-device/emulator run. No ios project directory was found; Windows cannot supply Xcode validation. Android build/runtime was not run. |

## Safe changes implemented

1. Main index.html and isolated index.html: remove maximum-scale=1.0 and user-scalable=no; retain viewport-fit=cover. Only those bytes change in each HTML entry point.
2. Isolated approvedRide.css: increase home greeting contrast (#777 to existing muted #626b76) and route editing targets from 42px to 44px.
3. Isolated destinationScreen.css: on short screens constrain measured inline height with max-height, leaving space above floating navigation and retaining scrolling. A height-only attempt could not override visualViewport's inline height; that attempt was superseded.
4. Isolated approvedRide.css: short configuration content becomes one scroll surface with a sticky final primary-action row. The earlier landscape configuration clipped the primary action below the viewport.

Main has no destinationScreen.css at the isolated path. No unused stylesheet, service replacement or wholesale redesign integration was added to main. The canonical ribbon component, BottomNavBar and riderNavigation.css remain byte-identical to the reviewed snapshot. See static-verification.json and source-changes.json.

## Preservation and security

Original Git index is byte-identical; original branch and HEAD are preserved. All other user work is retained. No commit, push, merge, deployment, reset, stash or clean occurred in this task. The earlier approved verification commit bb887feaa86589c47f2d728d3d57a087ef89ffe8 and its three-file payload were not changed. That frozen payload predates these new edits and cannot certify them.

RLS protection depends on deployed grants and policies, so source migrations alone cannot establish tenant isolation. This audit follows the boundary distinction documented by [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security); it performs no database tests. The skill's markdown changelog endpoint was unavailable to the browser tool; no Supabase implementation or schema change was made.

Skills used selectively: mobile-native for viewport/scroll/touch/zoom constraints, code-quality for narrow ownership and preservation, playwright-cli workflow guidance for Edge browser evidence, security-review for service/credential boundary reasoning, and Supabase guidance for read-only auth/RLS review. No skill was used to authorize production access.

Current measured free physical memory was 776,512 KiB (about 758 MiB), below the existing 3,072 MiB build-start threshold. Node 22.23.4 is available for final checks; no dependency installation was needed.

See the other five reports for the requirement-by-requirement matrix and remaining gates.
