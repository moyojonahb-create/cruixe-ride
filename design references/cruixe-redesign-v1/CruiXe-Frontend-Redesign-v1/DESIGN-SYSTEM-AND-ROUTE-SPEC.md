# CruiXe frontend redesign v1 — approved design and route specification

## Visual standard
- Preserve the established CruiXe red, white, dark charcoal and restrained accent palette; no new dark-mode redesign or pink/red haze across white cards.
- Map-based booking bottom sheets use ONE reusable signature curved-red upper ribbon, with smooth symmetric transitions toward the sides, a shallow flowing central contour and one centered white drag handle. Its geometry, height, stroke-free edge, color, padding and safe-area behavior must match across stages. Reference the previously approved Ride Home screen and the two bundled images. Do not simply apply CSS border-radius to unrelated components.
- This ribbon applies only to appropriate map-based booking panels and overlays, NOT every red button, full-screen red toolbar, badge, notification dot or unrelated header.
- Use existing branded CruiXe vehicle artwork and real map implementation. No illustrative example data in production.
- Shared bottom nav when already appropriate: Home, Activity, Ride, Wallet, Account; one elevated red active icon, one active label inside same white card, moving raised white cradle following active tab; selected state follows real route; preserve existing accessible routes.

## Scope and sequence
1. Ride Home: existing approved design; preserve function and visuals except reconcile shared ribbon component where needed.
2. Choose a Ride (after Let's CruiXe): implemented/partially implemented; audit and refine, do not rebuild. Economy, Shared, Parcel; selecting ride opens existing location-entry step. No fabricated route/payment summary at ride selection.
3. Set Destination: existing redesigned screen; verify actual provider-backed search, input focus, suggestions, map picker, saved places, recents, keyboard and error states. No invented recent destinations.
4. Trip Configuration: bundled `mockups/04-trip-configuration-approved.png`; one previously selected type (Economy illustrated), pickup/destination, authorized fare/ETA only, passengers, optional luggage photo, yellow Cash selection tile opening other payment-method options, Schedule and confirm action. Do NOT insert separate obligatory full-page payment screen; reuse existing payment sheet/panel if present. Wallet selectable only with valid balance/eligibility; EcoCash disabled while unintegrated. Do not claim final price, ETA or guarantees based on the screenshot.
5. Finding Drivers: bundled `mockups/05-finding-drivers-approved.png`; preserve true search/offer lifecycle, fare controls only when authorized by business logic, real countdown if one exists, Cancel and Note for driver. Search/progress illustration is decorative; never fake assignment or results.
6. Assigned Driver: inspect existing screen before proposing redesign. Not approved in this package.

## Safety and acceptance
- Backend P0.3 remains inactive/NO-GO; no direct Supabase ride/offer write workaround, no financial calculation bypass, no fake drivers or assignment.
- Use existing state, service contracts and auth; do not alter Go, SQL, Railway, Redis or production infrastructure.
- Preserve dirty main branch; isolated UI worktree; no reset/stash/clean/commit/push/deploy without explicit request.
- Audit all sheet-ribbon occurrences. Report each classified as replace, retain (not a sheet), or already compliant.
- Screenshots are visual reference ONLY, not copyable source of route, fares, ETA, patient/landmark/address facts or business policies.
- Test screen-specific behaviors, responsive widths, iOS/Android safe area and keyboard, reduced motion and screen-reader interaction. Report measured results, not guesses.
