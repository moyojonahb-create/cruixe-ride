# Screen 2 implementation and verification

Preview: http://localhost:8081/ride?view=choose. Start at http://localhost:8081/ride to exercise the real Let's CruiXe transition. The existing port 8080 server was not stopped or replaced.

Work is isolated in nonproduction/approved-ride-ui. Main branch at inspection: fix/ecc-sprint-1-accessibility-wallet; HEAD 31c9ae007b8c5e6f4741139a4b2ed98e693e2184. No main source, backend, native Android files, database rules, payments, auth rules, WebSocket contracts, commits, merges, pushes or deployments were changed.

## Source reference and scope

The requested local design file design-references/ride-selection/cruize-choose-ride-approved.png was missing. The user explicitly authorized the screenshot attached to this conversation as the source instead. That exact attachment was inspected before visual implementation. Captured app images use CSS pixels at device scale 1; the reference attachment was assessed visually, without claiming a pixel-diff or pixel-perfect equivalence. The phone frame/system home indicator in the source were not recreated as application content.

Only Screen 2 was visually redesigned. RideHomeGreeting.tsx and DestinationSearchScreen.tsx are byte-identical to the saved pre-task copies in screen2-baseline. The approvedRide.css declarations are unchanged; its final blank line was normalized solely for the strict whitespace check. The home and location-entry layouts remain in the existing component tree; their controller gained the route-backed back/return behavior required for Screen 2.

## Exact frontend source files changed in this sprint

1. src/App.tsx — one navigation/draft provider and persistent navigation instance around existing routes.
2. src/components/BottomNavBar.tsx — route-driven five-tab rider bar, suppression of legacy duplicate instances on rider destinations; existing non-rider legacy behavior retained.
3. src/components/RiderNavigationProvider.tsx — typed in-memory choice/place/town/passenger/schedule draft. No GPS fixes or credentials are stored. Guest drafts survive sign-in; sign-out/account switch clears a signed-in draft.
4. src/components/riderNavigation.css — floating white card, active icon lift/scale, label transitions, focus outlines, safe area and reduced motion.
5. src/lib/riderNavigation.ts — tab destinations and active-route/visibility helpers.
6. src/components/ride/RideView.tsx — query-backed chooser/location stages, existing selection handlers, draft restoration and correct back behavior; selection-only panel class and header. Existing automatic destination entry now excludes the chooser and retained ride-home draft.
7. src/components/ride/RideTierSelector.tsx — opt-in selection presentation; default later-booking presentation and passenger controls retained.
8. src/components/ride/RideSelectionCards.tsx — three full-width stacked, accessible selection buttons with actual capacity and approved assets.
9. src/components/ride/rideSelection.css — Screen 2-only white sheet, readable cards, controlled scrolling and navigation clearance.
10. src/components/ride/approvedRide.css — formatting-only EOF normalization; no CSS declaration changes.
11. src/test/RideSelectionCards.test.tsx — six card/callback/data-claim regressions.
12. src/test/RiderNavigation.test.tsx — nine route/selection/single-instance/back/deep-link regressions.
13. src/test/RideSelectionDraft.test.tsx — three draft remount/sign-in/sign-out regressions.

QA/support artifacts include verify-screen2.mjs, qa-screen2 PNG captures and results/summary JSON, screen2-baseline, screen2-changed-files.json, screen2-integration-review.json, approved-screen2-ui.patch and this report. Earlier approved UI and vehicle changes remain present and are included in the consolidated integration patch.

## Real flow and route mappings

| Screen/tab | Existing route or stage | Behavior |
| --- | --- | --- |
| Home | /ride | Approved ride-home view; navigation card hidden after its brief exit transition |
| Ride / Screen 2 | /ride?view=choose | Chooser with Ride selected; direct entry/reload and browser history supported |
| Screen 3 | /ride?view=locations&tier=economy, share or parcel | Existing DestinationSearchScreen; navigation bar hidden |
| Activity | /history | Existing protected RideHistory page |
| Wallet | /wallet | Existing protected RiderWalletPage |
| Account | /profile | Existing protected RiderProfile page; /edit-profile also resolves Account active |

Home is the actual ride-home state, not the separate marketing /home page, which redirects authenticated riders back to /ride. No new placeholder page routes were introduced. Existing BrowserRouter/Capacitor HashRouter selection remains unchanged.

Let's CruiXe opens the chooser by navigation state in the URL. Selecting a card calls existing handleSelectTier, ensurePickup and place-entry setters, then enters the location stage. It does not call requestRide. Economy/share/parcel retain their existing service IDs and courier mapping for Parcel. Current capacities remain 4 for Economy/Shared; the source screenshot's Shared capacity 2 was not substituted for the service definition.

The chooser omits the source's unentered route summary and unsupported Fast pickup, Best value, Lower cost, Eco friendly, Secure and Reliable claims. No fare, ETA, payment/promo selector or final booking action is introduced. Approved /brand/cruize-economy-car.webp, cruize-shared-car.webp and cruize-parcel-van.webp remain transparent, contained and free of artificial image glow.

## Navigation and animation

One App-owned BottomNavBar stays mounted across rider destinations. Legacy per-page calls become no-ops on those routes. Selection comes from actual path/query state; exactly one button has aria-current=page/data-selected=true. Only its label is visible, inside the same white card. Inactive labels remain accessible through button names. Existing AuthGuard protects account/history/wallet; no guest-auth bypass was added.

The active icon rises 17px and scales to 1.08 while inactive icons return to .9 scale and grey. Transform duration is 240ms with cubic-bezier(.22,1,.36,1), colors/background 200ms and label opacity/transform 180ms. No layout properties are animated. Reduced motion disables transitions; keyboard navigation has a visible 3px outline. Home's bar exits after 260ms while the approved home renders immediately. The bar is absent from place entry and accommodates safe-area insets; small card regions scroll above the active circle, with about 4px minimum clearance measured in browser checks.

## Validation statuses

| Category | Status | Executed evidence and limits |
| --- | --- | --- |
| Source/route inspection | PASS | Current main/isolated differences, branch/HEAD, handlers and route destinations inspected |
| Screen 1 preservation | PASS | Home component unchanged; stylesheet declarations unchanged; screen1-preserved.png; bar absent on initial and returned home |
| Screen 3 preservation | PASS | DestinationSearchScreen source unchanged; all three real entry journeys captured; bar hidden |
| Selection and browser back | PASS | Economy, Shared and Parcel enter existing destination form and restore selected tier on browser back; top back returns home |
| No early booking | PASS | Zero ride-creation POSTs observed throughout the live journeys; original validation retained |
| Navigation routing | PASS | Nine component tests verify current routes, one mounted bar, active transfer and browser-back/deep-link state |
| Authenticated destination screens / cross-tab visual transfer | BLOCKED | Fresh Edge session is signed out; Account, Activity and Wallet correctly reach /auth. Component-level transfer passes; real signed-in destination/animation capture was not possible |
| Responsive layout | PASS | 320x640, 360x800, 375x812, 390x844, 393x852, 430x932, 375x480, 800x400; no horizontal overflow; full category names; contained vehicles; visible navigation and unclipped active circle |
| Scrolling and reachability | PASS | Small/short layouts scroll; Parcel was selected successfully at 320x640 |
| Large text | PASS | 125% root text at 390x844 retained names, card/image containment and navigation clearance |
| Accessibility | PASS | Zero axe WCAG 2/2.1 A/AA violations in the new chooser/navigation; keyboard focus and Economy selection tested |
| Reduced motion | PASS | Computed transition duration 0s when reduced; normal icon transitions 0.24s/0.2s verified |
| TypeScript | PASS | Node 22 tsc --noEmit -p tsconfig.app.json, final draft revision included |
| Component/regression tests | PASS | Full 39-test run in eight files; final draft rerun 3/3 after two additional cases. 41 unique tests passed across focused runs |
| ESLint | PASS | Exit 0, zero errors. 44 warnings in inspected files: legacy RideView unused/type/disable warnings plus a context/provider fast-refresh warning |
| Production build | PASS | Final source built under Node 22, 4520 modules, exit 0; source maps and gzip reporting disabled for resource control; no release/upload/deployment |
| Git whitespace / patch check | PASS | Targeted git diff --check passed; baseline guard passed; git apply --check --whitespace=error-all passed for the consolidated 18-path patch |
| Native hardware back, OS keyboard/notched safe areas | BLOCKED | No physical Android/iOS run. No @capacitor/app/backButton bridge found in the inspected snapshot; browser/HashRouter history is wired, but native-host back handling needs platform validation/integration. Native work was not overwritten |
| Actual fare negotiation/payment submission | SKIPPED | Outside this presentation sprint; no real ride or payment was submitted |
| Pixel-perfect equivalence | SKIPPED | Visual comparison against attached source performed; no source raster pixel-diff available and data/policy-driven differences are intentional |

The first browser run exposed the old auto-destination effect reopening Screen 3 after back. That was fixed with chooser/home stage guards; the full browser rerun passed. The initial test-only invalid RTL exact option was corrected and typecheck rerun. The initial stricter patch check found an EOF blank line; formatting was normalized and the check rerun. Historical failure.png is retained as first-iteration evidence, not the final state.

## Screenshots and comparison

qa-screen2/final-screen2.png is the final 390x844 normal-motion idle chooser with actual Mapbox streets loaded. iphone.png, small.png, short.png, landscape.png and large-text.png show responsive states; screen3-economy/share/parcel.png show the unchanged entry view. results.json and summary.json contain measured geometry and actual journey outcomes.

Compared with the attached source: the live light map, curved red edge/white handle, white sheet, large heading, stacked rounded vehicle cards, selected red border/radio, grey inactive states, single floating white navigation card, raised red Ride icon and in-card active label are present. Intentional differences are the single map back button (avoiding a duplicate), omission of an unknown route and unverified badges, genuine Shared capacity 4, actual authorized driver/GPS state, and platform-owned phone chrome. Card text remains readable at narrow width rather than ellipsized. The broad earlier Screen 1 contrast finding and historical service-access issues were not changed by this sprint.

## Safe integration

The consolidated approved-screen2-ui.patch covers 18 accumulated UI source paths (previous approved UI/vehicle work plus this sprint). screen2-changed-files.json lists this sprint's 13 paths. The original seven/eight-file patches remain historical; do not substitute them for this patch or run older package scripts that would truncate the manifest.

The current Python guard checks main-file SHA-256 baselines, absence of new destination files, and the four user-supplied parent assets. No source conflicts were found when preparing the patch. Relevant API/socket/presence/search/schedule/auth dependencies still match the current main workspace; App differs intentionally for this implementation. No backend or native paths appear in the patch.

Do not apply automatically. Pause concurrent edits to the listed targets, run `python nonproduction/approved-ride-ui/integrate-ui.py` (check-only), and `git apply --check --whitespace=error-all nonproduction/approved-ride-ui/approved-screen2-ui.patch`. Reconcile any newly reported target conflict manually. Only after explicit integration authorization, copy/apply the reviewed source paths; do not replace all src or copy the entire snapshot. Rerun Node 22 checks against the latest backend frontend dependencies after integration. No --apply, merge, commit, push or deployment was performed.

Readiness: GO for isolated visual review. Source integration is conditional on final guard/patch checks and explicit authorization. NO-GO for production release until authenticated destination/animation checks and native back/keyboard/safe-area validation are completed and broader existing service-access issues are resolved.

Final build: PASS, exit 0, Vite reported success in 8m 27s. Warnings: CJS Vite API deprecation, stale Browserslist data, existing ambiguous Tailwind utility, mixed static/dynamic Ride import, large chunks and missing Sentry token. No Sentry release/source-map upload or deployment occurred. The final typecheck passed and final identity-boundary tests passed 3/3.
