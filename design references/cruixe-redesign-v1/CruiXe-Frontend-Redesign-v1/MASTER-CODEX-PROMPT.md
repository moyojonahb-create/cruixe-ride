# CRUIXE — MASTER FRONTEND AUDIT, CURVED RIBBON STANDARDIZATION & APPROVED SCREEN UPGRADES

## Roles
You are Principal Mobile Product Designer, Senior UI/UX & Motion Designer, Staff React/TypeScript Frontend Engineer, Capacitor iOS/Android Engineer, Accessibility Engineer, and Frontend QA Lead.

## Workspace and image references
Main repository: `C:\Users\MUSAE\Documents\koloi-ride-with-confidence`.
Use the existing isolated UI workspace/preview first if available; locate its actual path rather than guessing.
The user will add this folder (or its contents) in `design-references/cruixe-redesign-v1/`:
- `mockups/04-trip-configuration-approved.png`: approved selected-Economy booking/configuration view.
- `mockups/05-finding-drivers-approved.png`: approved Finding Drivers screen.
- `DESIGN-SYSTEM-AND-ROUTE-SPEC.md`: governing requirements.
Also inspect the already approved Ride Home, Choose a Ride and Set Destination references when available. If older reference assets are absent, identify them; do not fabricate replacements or block independent work.

## Non-negotiable FIRST PHASE: scan before edits
1. Inspect Git status/HEAD and ongoing staged, unstaged and untracked files; preserve all existing work and concurrency boundaries.
2. Trace actual rider journey in code: Ride Home -> Let's CruiXe -> Choose a Ride -> Set Destination -> Trip Configuration -> Find Drivers -> Assigned Driver. Confirm how the current app does this. Preserve existing logic; do not invent screens or transitions.
3. Produce a compact matrix for each screen: ALREADY IMPLEMENTED / PARTIALLY IMPLEMENTED / NOT IMPLEMENTED, and list real components/routes, current behavior, change needed, and reference.
4. Search all React components/styles for red curved header, top ribbon, drag handle, bottom sheet/overlay and duplicate variants. Classify EACH finding into (A) applicable booking-sheet ribbon to migrate, (B) already compliant, or (C) unrelated red interface to leave unchanged.
5. Identify existing vehicle assets, animation packages, map/GPS, search, pricing, payment, luggage capture, scheduling, ride-state and driver-offer services. Do not create duplicate systems.
6. Before implementation, report the inventory and a narrow execution plan; then continue only where safe and evidence supports the change.

## Highest-priority visual change: ONE SHARED SIGNATURE CURVED RED RIBBON
Use the existing approved Ride Home flowing curved ribbon as canonical reference and compare the two bundled screens. Extract/reuse a single typed component or style primitive shared by EVERY applicable map-based ride booking sheet (Ride Home, Choose Ride, Trip Configuration, Finding Drivers and other appropriate sheet instances discovered). Match smooth symmetric raised-and-dipped contour, vivid CruiXe red, centered white drag handle, precise consistent ribbon height and clean intersection with white card. Prefer SVG/mask or the simplest robust implementation that can represent the approved geometry; use CSS custom properties/design tokens, no duplicated hard-coded shapes. Keep white content background pure white; do NOT add faint red haze. Honor sheet drag behavior if present, responsive geometry, pixel density and safe areas. Do NOT change fullscreen red Set Destination header, red buttons, badges or unrelated elements.

## Approved screen work: DIFF ONLY, NEVER REBUILD
A. Preserve existing Ride Home UI and features. Reconcile only shared sheet component if necessary.
B. Choose a Ride: continue from existing implemented UI; fix missing visual fidelity only, including three service cards and shared five-tab nav where needed. Nav: Home/Activity/Ride/Wallet/Account, moving curved white cradle, only active red icon lifted and label within same white nav, actual route-driven selection, reduced motion. Keep backend-safe tier selection -> pickup/dropoff sequence.
C. Set Destination: fix existing search double border, field width/clear button, provider-backed autocomplete, loading/empty/errors, result selection, keyboard overlay and saved addresses/real recents. No hardcoded mockup addresses.
D. Trip Configuration: match `04-trip-configuration-approved.png` using existing real selected tier (Economy is just example), map, pickup/destination, passenger control, luggage photo optional flow, Schedule and primary confirmation. The Cash tile is compact iOS-like yellow, placed beside luggage; tapping opens EXISTING payment-method panel or compact selection sheet (not a forced separate full-page step). Keep Wallet balance validation, EcoCash unavailable until genuine integration. Retain actual authorized fare, not static $6; suppress unsupported ETA and claims. Respect booking state and confirmation safety.
E. Finding Drivers: match `05-finding-drivers-approved.png` and use EXACT SAME curved ribbon as canonical Ride Home; maintain real lifecycle, status, countdown when actually sourced, meaningful progress, fare increase/decrease only if authorized existing rules permit, Cancel and Note. Never animate an invented driver-search result. Preserve cancellation/assignment race controls.
F. Assigned Driver: inventory only; no unapproved redesign.

## Implementation rules
- Keep map provider and real authorized live data; never replace map with mockup screenshot.
- Preserve authentication, RLS expectations, backend errors, assigned driver identity, GPS validity, money precision and any production NO-GO boundaries.
- Do not modify Go, Redis, Railway, Supabase, ledger, migrations, assignment authority, backend routes or deployment configuration.
- Build reusable typed components; no side-effectful click decorations or fake interactions.
- Small screens: flex/scroll, keyboard avoidance, WCAG labels/contrast, focus, 44px-ish targets, accessible active navigation, prefers-reduced-motion, iOS/Android safe area. Avoid cards/nav overlapping.
- Prefer editing existing isolated UI workspace; preserve all main repository work. Do not reset/stash/clean, commit/push/merge/deploy or trigger production mutations.

## Evidence-based QA and output
1. Visually compare actual screenshot per applicable sheet with same canonical red ribbon (including animation/edge on mobile widths).
2. Test Home -> Let's CruiXe -> Choose tier -> Set Destination autocomplete/map choice -> configure passengers/luggage/payment -> confirmation -> Finding Drivers -> cancel/note. Do not create a real production ride as a test.
3. Test default active Ride nav and move-to-Account with cradle traveling; route/back/deep link synchronization.
4. Test payment selection (Cash default only when applicable), Wallet insufficient balance, EcoCash disabled, luggage upload preview/removal, schedule, true fare/ETA handling, offline/stale/errors.
5. Run Node 22 typecheck, lint, focused regression tests, full available frontend tests, build and browser responsive tests at 320, 360, 375, 390 and 430 px widths. Record pass/fail/skipped/blocked with evidence.
6. Final report: scan matrix, all ribbon occurrences and classification, exact changed files, what was already implemented, precise visual differences corrected, actual service integrations preserved, screenshots, tests, blockers and merge/integration plan. Do not claim unexecuted checks as passed.

## Final decision gate
Implement only the changes required by the approved mockups and verified existing code. P0.3 backend remains NO-GO; frontend work does not authorize production release.
