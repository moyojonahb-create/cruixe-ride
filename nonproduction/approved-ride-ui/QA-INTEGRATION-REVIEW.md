# Visual QA and integration review — 28 October 2026

Decision: NO-GO for applying the existing UI patch as-is. No patch was applied and no main frontend/backend source was changed during this review.

## Running frontend

- Workspace: C:/Users/MUSAE/Documents/koloi-ride-with-confidence/nonproduction/approved-ride-ui.
- Runtime: Node v22.23.4 from the existing temporary Node environment.
- Vite command: Node 22 + ../../node_modules/vite/bin/vite.js --host localhost --port 8081 --strictPort.
- Vite reported ready; http://localhost:8081/ride returned HTTP 200 and the Vite development entry.
- Port 8080 was neither terminated nor replaced. The 8081 preview is left running.

## Seven existing UI changes reviewed

Relative to the main repository, these are the only UI implementation paths:

1. src/components/ride/RideView.tsx
2. src/components/ride/RideGlassPanel.tsx
3. src/components/ride/RideHomeGreeting.tsx
4. src/components/ride/QuickShortcutsRow.tsx
5. src/components/ride/TownSelectorSheet.tsx
6. src/components/MapboxMap.tsx
7. src/components/ride/approvedRide.css (new)

All six existing main files match the captured SHA-256 baseline, and the CSS destination is absent in main. The UI copies differ as expected. No implementation changes were made in this follow-up; only QA scripts, screenshots, evidence and reports were added.

## Verification

Existing focused tests rerun under Node 22: 5 files / 23 tests passed. requestRide 8; useNearbyDrivers 1; DestinationSearchScreen 5; driverPresence 3; townPricing 6. Earlier typecheck/build/lint results remain historical; they were not rerun because no implementation source changed.

Edge automation completed against the actual Vite frontend. Viewports: 360x800, 390x844, 320x568, 375x480, 430x932, 1440x900. Every measured sheet, search card, Home/Work tile, Schedule button, and primary action stayed within viewport bounds. No document-level horizontal overflow. This bounds check does not prove every text node fits or every physical device is correct.

Tier-picker, schedule and town-search interactions opened successfully. No actual ride or schedule was submitted, no authenticated favorite was written, and no mock service or invented driver/GPS data was introduced. See qa-edge/browser-results.json and the interaction screenshots.

The real Mapbox street map rendered in the tier-picker/schedule captures. Initial idle captures preceded tile readiness; the dedicated reference capture includes a further settling wait. Native GPS prompts, actual user-location freshness, physical keyboard behavior, notched-device safe-area insets and authenticated end-to-end booking are not verified by these desktop captures.

Source review confirms map/GPS/search/favorites/scheduling/authentication/booking handlers remain connected. Twelve relevant route/service/hook/component dependencies match the current main workspace byte-for-byte; see integration-dependency-review.json.

## Findings requiring resolution or explicit acceptance

- Accessibility: axe reported one serious color-contrast finding for the 11px greeting, foreground #777777 on #ffffff: 4.47:1 against the 4.5:1 threshold. No accessibility pass is claimed.
- Live service dependency: the unauthenticated browser received HTTP 401 for Supabase REST pricing_settings, town_pricing, and live_locations reads. No JS page exceptions occurred. These are real console/network errors, not a reason to seed fake data. Correct environment/access must be verified by the backend owner before end-to-end sign-off; UI source alone does not establish the cause.
- Visual fidelity: the sheet is about 229 CSS pixels tall at 390x694, versus roughly 203 pixels in the scaled reference. Town pill height, spacing, vehicle illustration angle/branding, and the primary action proportions differ. The CTA lacks the source's diagonal decorative bands. No pixel-equivalence claim.
- The service-area pill is informational; selecting Gwanda/town changes its configured radius. It is not a separate service-area picker.
- Missing drivers, GPS dot/beam and unread dots cannot be compared with the reference's populated state without genuine authorized data. Heading beam remains intentionally unsupported without heading data.

## Patch conflicts

The check-only integration helper passes for all seven paths. No current semantic overlap or newer edit was detected in those targets.

Plain `git apply --check nonproduction/approved-ride-ui/approved-ride-ui.patch` FAILS for RideGlassPanel.tsx, RideHomeGreeting.tsx, QuickShortcutsRow.tsx. Those main files use LF; the saved patch uses CRLF. `git apply --check --ignore-whitespace` and `--ignore-space-change` pass. This is a reproducible patch-format/line-ending conflict, not evidence of a backend content conflict.

Do not apply the patch automatically. Before a future authorized integration, resolve the patch line endings while preserving each target's convention, rerun the ordinary patch check and baseline guard, confirm the contrast/fidelity findings are fixed or accepted and real service reads are authorized, then coordinate editing of the seven paths. No copying, merging, committing, pushing or deployment occurred.

## Evidence

- qa-edge/reference-viewport.png: actual idle Edge capture at 390x694.
- qa-edge/reference-comparison.png: supplied source scaled from 941x1672 beside the 390x694 capture.
- qa-edge/sheet-comparison.png: lower-panel comparison crop at the same display scale.
- qa-edge/live-map-review.json: actual computed fills and console/network evidence.
- qa-edge/browser-results.json: six viewport measurements, page exceptions and axe finding.
- qa-edge/tier-picker.png, schedule.png, town-selector.png: interaction captures.

For manual confirmation in Edge: open http://localhost:8081/ride, press F12 then Ctrl+Shift+M, set Responsive to 390x694 at 100%, wait for actual map tiles, and use the device toolbar menu's Capture screenshot. Repeat at 320x568 and 375x480. Keep real data empty when unavailable. Compare the resulting PNG with the supplied approved reference; do not mark failed live reads or the contrast finding as passed.
