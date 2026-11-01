# Curved navigation and Set Destination implementation

Review URL: http://localhost:8081/ride?view=choose
Select Economy, Shared or Parcel to open Set destination. This is the isolated frontend in `nonproduction/approved-ride-ui`; port 8080 and main application source were not modified.

## References and implementation
Used both screenshots attached to the current request: the actual Choose a ride capture and approved red-and-white Set destination design. No pixel-difference claim: the references were provided in the conversation.

The persistent `BottomNavBar` now uses one continuous white SVG path for the entire bar and raised cradle. ResizeObserver measures the five-column card; route-derived index positions its center. The path interpolates for 330ms, with existing 240ms circle movement and 180ms label transitions. Reduced motion disables transitions. Labels remain inside the bar, only the active circle is raised, and inactive buttons retain accessible names. Home remains the approved initial screen with the established short nav exit.

DestinationSearchScreen retains its existing callbacks and adds the red header, white address card, yellow/red markers and connector, current-location action, real search input/clear button, pink map card, Home/Work shortcuts, recent destinations and empty history state. VisualViewport resize/scroll adjusts screen height/top; the shared nav hides when a software keyboard significantly reduces viewport height. Actual OS keyboard/notch testing remains blocked.

## Source files changed in this sprint
- `src/components/BottomNavBar.tsx`
- `src/components/riderNavigation.css`
- `src/lib/riderNavigation.ts`
- `src/components/ride/DestinationSearchScreen.tsx`
- `src/components/ride/destinationScreen.css` (new)
- `src/components/ride/RideView.tsx`
- `src/hooks/useAppBootstrap.tsx`
- `src/test/RiderNavigation.test.tsx`
- `src/test/DestinationSearchScreen.test.tsx`

All are under the isolated directory. The destination-baseline folder preserves pre-sprint source copies. Additional QA scripts, screenshots, reports, integration manifests and patch are nonproduction artifacts.

## Real data and booking behavior
Search retains the existing town landmarks, streets and place cache, followed by the existing `google-places-search` Supabase Edge Function (Google Places with server-side Nominatim fallback). No provider or paid service was added. Existing debounce and coordinate/details selection handlers remain. Remote requests now have generation checks, abort previous requests, clear stale remote rows on typing and expose a network-error message instead of presenting failures as empty results. Local result ordering is unchanged.

Pickup displays application state and GPS error/loading state. In the guest capture GPS was denied; the existing application's town fallback is visible alongside that error. No new fake GPS coordinates or addresses were introduced. Selecting a place uses its actual coordinates and existing fare/route/booking pipeline; the selected service remains economy/share/parcel. Browser QA observes transition into the existing booking controls; exact downstream coordinate payloads were source-reviewed and covered by callback tests, not captured from an actual submitted ride.

Home and Work use existing saved favorites or existing setup callbacks. Recent trips come from the current user's bootstrap data. A cache ownership check now hides favorites/history after account changes and ignores stale responses belonging to a previous user. No new storage or backend changes. See all uses client-side navigation to `/history`, preserving the existing in-memory draft. Empty history shows an empty state, not the reference's example places.

Real routes remain Home `/ride`, Activity `/history`, Ride `/ride?view=choose`, Wallet `/wallet`, Account `/profile`. Destination entry uses `/ride?view=locations&tier=economy|share|parcel`. Existing authentication guards stay in place.

## Verification
- Node 22.23.4 typecheck: PASS on final revision (exit 0).
- Focused regression tests: 42 unique tests PASS across runs. Initial run: 37 passed, 5 exceeded the default 5-second timeout. Retried the two affected component files with one worker and 30-second timeout: 15/15 passed. Covers navigation/cradle route changes, search accessibility and callbacks, favorites/recents payloads, draft, selection, requestRide, pricing and driver presence/discovery.
- ESLint targeted source/tests: PASS, zero errors and 44 warnings (mostly existing unused declarations/disable directives).
- Production build: PASS on pre-viewport revision, 4521 modules in 10m24s. Final revision: Vite completed bundling 4521 modules in 12m6s and generated dist/index.html. The PowerShell redirected wrapper returned exit 1 because the captured CJS deprecation warning became NativeCommandError. Bundling PASS; shell-wrapper check FAIL/WARNING, not a clean exit-0 claim. Full output: destination-build.log. Uses existing resource-conscious build script with sourcemaps and compressed-size reporting disabled, otherwise production mode. Existing chunk-size, Sentry-token, CJS API, Browserslist and Tailwind warnings remain.
- `git diff --check`: PASS (line-ending advisories only).
- `git apply --check --whitespace=error-all` on proposed patch: PASS on final revision (exit 0).
- Edge: all requested 320x640, 360x800, 375x812, 390x844, 393x852, 430x932 captures completed without horizontal overflow. The 390px capture was visually inspected against the reference.
- Scoped axe WCAG 2/2.1 A/AA: PASS, zero violations on destination screen and nav.
- Real query Gwanda: 45 actual provider/database results observed; map-picker action opened existing picker.
- All three categories: actual Gwanda Public Swimming Pool search result selected; destination editor closed into existing booking controls, tier preserved in URL, browser back returned chooser. Zero ride-creation POSTs and zero page exceptions on successful final runs. The resulting booking controls do not expose destination text in the captured viewport, so direct visible address verification there is not claimed.
- Cradle animation computed 0.33s; reduced motion 0s. Route-transfer/cradle-path and browser-back component tests pass.
- Account/Activity/Wallet guest navigation: existing `/auth` redirect verified. Authenticated cross-tab visual transitions and account-active screenshot BLOCKED: no authenticated browser session supplied. The active tab must follow the actual route, so Account cannot remain active on Choose a ride merely for a screenshot.
- Android hardware back, physical iOS/Android keyboard and native safe areas: BLOCKED, no physical-device session.
- Actual ride/payment submission: NOT RUN; no ride was created.

Earlier failed browser attempts (load timeout, GPS prompt interception, and an axe harness context error) were corrected and rerun. Latest `qa-destination/results.json` and `qa-destination-flow/results.json` contain successful runs. No fake auth, service responses or map data were used in the app/browser checks.

## Evidence
- `qa-destination/choose.png`: chooser and white cradle
- `qa-destination/390.png`: Set destination with Ride active
- `qa-destination/320.png`: smallest requested viewport
- `qa-destination/search.png`: real search and results
- `qa-destination/map-picker.png`: actual map picker
- `qa-destination/results.json`: responsive/search/accessibility results
- `qa-destination-flow/economy-next.png`, `share-next.png`, `parcel-next.png`: subsequent existing booking controls
- `qa-destination-flow/results.json`: tier/route/motion/auth guard checks

## Integration readiness
Prepared `approved-destination-ui.patch`, `destination-integration-manifest.json`, and `destination-integration-review.json`. Current baseline guard reports no conflicts. This accumulates earlier approved UI changes plus this sprint; do not use the older screen2 patch or its older integration manifest to install this revision. The main destination screen contains pre-existing concurrent modifications; the recorded baseline check passed, but it must be rerun immediately before integration. No patch was applied and no main files were overwritten.

GO for isolated frontend review. NO-GO for unconditional main-workspace/production integration until authenticated and native acceptance checks are completed and the user authorizes integration. Pause concurrent edits to overlapping frontend files, rerun baseline comparisons and strict patch check, review the nine current changes plus prior UI package, and rerun checks against the integrated frontend dependencies. No merge, commit, push or deployment was performed.

Final rerun: destination tests 6/6 PASS; final typecheck exit 0; targeted final lint exit 0 with one existing unused-disable warning; six-size Edge capture/search/map/axe rerun PASS after viewport changes. RideHomeGreeting SHA256 matches preserved baseline. Final integration guard and strict patch check PASS; no conflicts.
