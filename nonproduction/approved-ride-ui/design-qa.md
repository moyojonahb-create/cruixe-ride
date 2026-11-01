# Design QA — approved /ride screen

final result: blocked

Source visual truth: C:/Users/MUSAE/Pictures/cruize-ride-approved-ui.png (940 x 1672 supplied image, including a narrow black frame).
Implementation: nonproduction/approved-ride-ui; /ride on ports 8081 (Vite) and 8082 (production build).
Implementation screenshot: unavailable. No rendered pixel dimensions or density normalization can be reported.
Intended viewports: 360x800, 390x844, 320x568, 375x480, 430x932, 1440x900; reduced motion enabled; unauthenticated idle state without invented GPS or drivers.

## Blocking evidence

- First Chromium navigation to the Vite preview exceeded 180 seconds before DOM content loaded.
- The production-build attempt exceeded Chromium's 180-second startup timeout after launching the installed browser executable.
- A final installed headless-shell attempt is recorded by verify-browser.mjs. See VERIFICATION.md for its outcome.
- No browser-rendered screenshot is available. Full-view and focused-region comparison, typography, actual spacing/wrapping, colors as rendered, image quality, responsive geometry, console errors, and axe results remain unverified. Code inspection and a successful build do not substitute for these checks.

## Implementation review awaiting visual confirmation

- Existing Mapbox streets-v12 remains the full-screen map.
- The booking sheet uses an opt-in responsive SVG curve, solid white interior, and screen-scoped spacing.
- White floating controls, town and service-area pills, white destination/schedule cards, pink Home, pale yellow Work, and bright red primary action are implemented.
- Existing vehicle imagery is reused. Its angle and branding differ from the reference and should be considered during visual review.
- Actual GPS coordinates alone produce the location dot; no directional beam is drawn without heading data. No invented driver markers or unread notification badges.
- Desktop uses a centered 520px sheet; mobile keeps an edge-to-edge sheet. Safe-area padding, bounded scroll areas, touch targets, focus outlines, and reduced-motion rules need browser/device confirmation.

## Comparison history

No visual comparison iteration is claimed. No P0/P1/P2 finding can be resolved or accepted from unrendered code alone.

## Remaining checklist

1. Start a working local Chromium session and run verify-browser.mjs against the built /ride page.
2. Open the source and actual screenshot together at matching scale; compare the full view and booking-sheet crop.
3. Correct meaningful differences, recapture, and repeat.
4. Check search, Home/Work, schedule, town selection, keyboard behavior, short-height scroll, focus, and axe results.
5. Set final result to passed only after those checks succeed.
Final retry outcome: Chromium headless-shell startup exceeded its 60-second timeout after launching process 2744. No capture was produced. final result remains blocked.

Follow-up evidence: Edge automation subsequently succeeded; QA-INTEGRATION-REVIEW.md records the six-viewport comparison and the unresolved contrast, fidelity and service-access findings. The later image-only verification is in VEHICLE-IMAGES.md. final result remains blocked for those broader findings, rather than unavailable browser tooling. No redesign was undertaken in the vehicle-image task.

Screen 2 continuation: see SCREEN2-IMPLEMENTATION.md and design-qa-screen2.md for the latest scoped implementation and real Edge captures. The chooser/mobile/axe checks pass; authenticated destination animation and native-device validation remain blocked. Earlier home-only QA statements are historical.
