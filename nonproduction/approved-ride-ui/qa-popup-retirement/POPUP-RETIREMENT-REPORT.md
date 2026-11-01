# Payment and automatic luggage presentation retirement

Date: 1 November 2026, Africa/Johannesburg. Results use PASS / FAIL / BLOCKED / NOT RUN. This report supersedes the earlier payment/Note target-size failures only for the current tested isolated source. Historical evidence remains intact.

**Scoped UI acceptance: PASS. Frontend integration: NO-GO pending fresh verification gates. Production release: NO-GO. No commit was created.**

## Source trace and implemented correction

The screenshot payment-iphone-x.png is the old `PaymentMethodSelector` inside `ModalBottomSheet`. In main, the first booking CTA opened it through paymentMethodConfirmed/paymentPopupOpen; its confirm callback called proceedToBook. In the isolated UI, the yellow payment tile opened the same modal through setPaymentPopupOpen(true).

The selected payment-iphone-x-failure.png reference is Trip Configuration with that modal closed. It contains the approved yellow Cash tile; it is not a second pre-existing payment dialog. That tile is retained. Its local choices now expand inline through `TripPaymentSelector`, with accessible selected states, 44px controls, Close/Escape and focus return. Choices persist across closing/reopening. There is exactly one booking payment selector per RideView. Selection/closing never invokes booking or payment services; only the explicit booking action retains the existing request path.

Both RideViews no longer import or render the old modal and no longer contain paymentPopupOpen or paymentMethodConfirmed. The old `PaymentMethodSelector.tsx` files and their existing tests remain untouched; the new selector references only their erased TypeScript payment type. No other runtime caller or obsolete payment route was found in the rider-flow search. Wallet account/top-up screens are outside this retirement scope.

Main's old luggage interruption was an automatic **banner**, “Travelling with luggage?”, rather than an automatically opened LuggageSheet. A useEffect set luggagePromptOpen after dropoffLocation became available, once per non-parcel booking. Yes opened LuggageSheet; No dismissed the banner. That effect, its two state variables and banner JSX were removed. The isolated UI already lacked this automatic prompt.

The existing `LuggageSheet` and all description, weight, photo paths and save/upload/delete handlers remain. It opens only from an optional Luggage control in Trip Configuration. Main now exposes that explicit control; isolated retains its approved tile. Saved details persist across reopen; cancelling unsaved edits retains the previous save semantics. The isolated tile says Details added after a details-only save rather than incorrectly claiming a photo exists.

## Accessibility and visual preservation

- Payment close and option controls meet 44x44 CSS px; the existing yellow tile keeps the approved closed presentation.
- Note close and chips meet 44px, inputs use 16px text, selected chips/reuse expose pressed state, and Radix dialog semantics provide focus containment/Escape. Existing isolated pending-save/denial guards remain intact.
- Optional luggage uses the already-installed Radix dialog primitives for a labelled dialog, Escape and explicit opener-focus restoration. Close/photo-delete targets are enlarged; content and service callbacks remain.
- The shared ribbon target is 44px high, positioned above adjacent content without clipping or overlap. The visible handle coordinate and canonical SVG paths remain unchanged. The old negative-offset CSS override was removed.
- Navigation cradle/BottomNavBar sources and approved vehicle imagery were not changed. No replacement design, animation package or dependency was added.

## Exact application-source scope

- `src/components/ride/RideView.tsx` (modified)
- `src/components/ride/NoteToDriverSheet.tsx` (modified)
- `src/components/ride/RideGlassPanel.tsx` (modified)
- `src/components/luggage/LuggageSheet.tsx` (modified)
- `nonproduction/approved-ride-ui/src/components/ride/RideView.tsx` (modified)
- `nonproduction/approved-ride-ui/src/components/ride/NoteToDriverSheet.tsx` (modified)
- `nonproduction/approved-ride-ui/src/components/ride/RideGlassPanel.tsx` (modified)
- `nonproduction/approved-ride-ui/src/components/luggage/LuggageSheet.tsx` (modified)
- `nonproduction/approved-ride-ui/src/components/ride/approvedRide.css` (modified)
- `src/components/ride/TripPaymentSelector.tsx` (added)
- `nonproduction/approved-ride-ui/src/components/ride/TripPaymentSelector.tsx` (added)

Eleven source files: nine modified, two added. Exact before/after hashes: SOURCE-CHANGES.json. Full source patch against this task's byte-preserving backups: source-review.diff. QA scripts, backups, screenshots and reports are separately inventoried in CHANGED-FILES.json and are not production implementation. No source files were deleted.

## Browser and accessibility evidence

Actual browser: Microsoft Edge 156.0.4314.50; Playwright 1.64.1; Node v22.23.4. Only the existing labelled isolated fixture at http://127.0.0.1:8083 was used. Browser requests were limited to local GET/HEAD, service workers blocked and external WebSockets denied. No production booking, payment, upload or database mutation was executed. Source hashes matched before/after the final run and still match the saved evidence.

| CSS viewport | Final result | Axe/scenario captures |
|---|---|---|
| 320x640 | PASS | 4 |
| 375x812 | PASS | 4 |
| 393x852 | PASS | 4 |

Across all three viewports: pickup selection, destination selection, entry to configuration without an automatic luggage/payment interruption, passenger control reachability, user-initiated luggage opening, saved luggage persistence, local cash/wallet selection and persistence, one inline payment interface, Close/Escape and payment/luggage focus restoration: PASS.

Note checks cover chip draft preservation, focus containment, 44px targets, denied-save draft retention and pending-save protection against Escape/ribbon dismissal. Actual Matching-page Note opener focus restoration is additionally verified at 375x812. No matching/booking request was submitted.

Final run: 12 Axe scans, zero automated violations; zero horizontal overflow; zero effective-target intersections; measured product controls at least 44x44; zero JavaScript exceptions, console errors, HTTP errors, failed requests or blocked attempts. Clipped content in scroll containers is not treated as a concurrently visible target; key controls were explicitly reached and clicked. The automated incomplete rules were aria-hidden-focus, aria-prohibited-attr, color-contrast; this is not a full screen-reader/native accessibility certification.

Screenshots (configuration, luggage, inline payment and Note) use 320-, 375- and 393- filename prefixes. Representative results: 375-configuration.png, 375-payment.png and 375-note.png. Both selected historical reference screenshots remain byte-identical. Earlier unsuccessful attempts and their screenshots are retained under initial-/second- names: focus-return, a 320px one-pixel target intersection and a Portal animation-wrapper ref warning were corrected; they are not represented as passes.

## Current verification gates

| Gate | Result | Evidence or blocker |
|---|---|---|
| Final three-viewport isolated browser acceptance | PASS | browser-results.json; all cases PASS; source stable |
| Automated accessibility / 44px / overflow / effective overlap | PASS | 12 captures in final browser results |
| Console, JavaScript and local-network diagnostics | PASS | No errors or failed/blocked requests |
| TSX syntax/transpile | PASS | Ten TSX files, Node22; static-results.json |
| Relative isolated imports/runtime mounting | PASS | Actual Vite/Edge flows mounted without import or runtime errors |
| Ride/luggage service-handler preservation | PASS | Main/isolated handler bodies compared to backups; canonical path strings unchanged |
| Current full TypeScript checking | BLOCKED | 368.04 MiB available vs configured 3072 MiB threshold; not attempted |
| Current focused Vitest | BLOCKED | Memory threshold; not attempted |
| Current scoped ESLint | BLOCKED | No heavy local retry under the memory threshold |
| Current production build | BLOCKED | Memory threshold; not attempted |
| Current remote Actions verification | BLOCKED | No publication authorized; frozen snapshot predates these edits |
| Historical compiler/test/lint baseline | PASS | Prior TypeScript 92.14s, 58 tests, lint 0 errors/52 warnings; NOT verification of current edits |
| Main authenticated runtime / services | BLOCKED | No approved staging configuration or test identities |
| Deployed booking/payment authority | BLOCKED | Existing service behavior unmodified, but not independently verified; prior authority/offline/fare/ETA audit gaps remain |
| Real native keyboard/GPS/safe-area/screen-reader/device acceptance | NOT RUN | Edge viewport/focus evidence is not physical iOS/Android validation |
| Preservation / approved snapshot integrity | PASS | preservation-after.json and approved-ci-preservation.json |
| Commit / push / merge / deploy | NOT RUN | Current source scope awaits review; none performed |

The lightweight transpile check does not resolve all main-app imports, perform type checking or produce a production build. No heavy local TypeScript, Vitest, lint or build was repeated. No dependency was installed. Main source was inspected/parsed; main was not launched against real services.

## Skills and safety

Applied installed skills previously read in this session: frontend-design (retain approved visual treatment), mobile-native (touch/viewport/native limits), apple-design (targets, focus and mobile accessibility), code-quality (trace reachable owners, smallest presentation change, preserve work), security-review (state-only selection, unchanged service handlers and isolated boundaries), playwright-cli (Edge workflow and browser evidence using the existing Playwright Node API). No claim of real-service verification is inferred from fixtures.

Original branch fix/ecc-sprint-1-accessibility-wallet, HEAD 31c9ae007b8c5e6f4741139a4b2ed98e693e2184, original index and worktrees remain unchanged. Every unrelated pre-existing dirty tracked file remains byte-identical. Approved CI commit bb887feaa86589c47f2d728d3d57a087ef89ffe8, prior viewport commit a7650a61854f7cc907baaa9631cc55469e222640 and their dedicated branches remain intact. All three approved CI working payload and committed-blob hashes are unchanged. Temporary repositories were checked in their respective filesystem access contexts without modifying Git configuration. No resets, stashes, cleans, source deletions or production/backend/credential changes occurred.

## Readiness

This UI scope is ready for changed-file review. Full frontend integration remains **NO-GO** until current-source TypeScript, focused Vitest, lint and build gates pass on an authorized runner. Do not treat the unchanged older CI snapshot as verification of these changes. Production readiness is separately **NO-GO**: staging identities, live authority/contract checks, earlier real-service audit gaps and native-device acceptance remain unresolved.

Next safe step: review the eleven-file patch and source inventory. A commit/publication requires the user's subsequent authorization; prepare a newly reviewed isolated verification payload for current source rather than overwriting the approved snapshot. No authenticated booking or payment test may run until dedicated staging is approved.
