# Screen 2 design QA

final result: blocked

Source: exact approved screenshot attached to the user request; the named local PNG was absent, and the user authorized use of that attachment. No substitute design was used. Source pixel dimensions are not asserted because no local source raster was available. Implementation: actual Vite /ride?view=choose in Microsoft Edge, final capture qa-screen2/final-screen2.png at 390x844 CSS pixels, scale 1. Comparison used the app-owned screen, excluding source phone chrome. This is visual comparison, not a pixel-diff.

## Evaluated surfaces

- Typography: strong black chooser heading; full Economy/Shared/Parcel names; smaller muted descriptions; system sans typography consistent with the existing approved home. All names fit at 320px width and 125% root text. No ellipsis remains in this selection presentation.
- Spacing/proportions: full-width vertical cards, 64dvh bounded white sheet, curved red top/white handle, anchored floating navigation. A scrollable card region replaces the prior dead gap. Portrait, short-height and landscape checks passed. Active-circle clearance was about 4px beyond the card scroll clip, without circle clipping or navigation overlap.
- Palette/elevation: rendered sheet is rgb(255,255,255), selected card uses restrained pale red with a red outline/radio, unselected cards retain light-grey borders and soft shadows; no panel haze. Navigation is one white pill with grey inactive icons and one red elevated selected circle.
- Images: supplied branded WebP vehicles remain transparent, proportional and contained, with no image filter/glow. No map image or synthetic driver markers were added. Actual Mapbox streets are visible in the final capture.
- Copy/content: actual Shared capacity remains 4, differing intentionally from the source's decorative 2. Unverified badge claims, unknown pickup/drop-off summary, fares and ETAs are omitted as required. One top map back button replaces duplicate controls. No new service categories or checkout sections.
- Navigation: all five names are accessible; only Ride's label is visible in the captured initial state, inside the same white card. Unit tests cover active transfer to other real routes and one persistent DOM instance. The active icon/label comes from path/query state, with 240ms icon, 200ms color and 180ms label transitions; reduced motion computed 0s.

## Evidence and iteration

1. Initial screenshots and geometry passed eight viewport checks plus large text, with zero scoped axe violations. The browser journey found the existing auto-destination effect reopening location entry on browser back; failure.png records that early state.
2. Added route-stage guards, retained pickup/selection in memory, and corrected short-height navigation-circle spacing. Re-ran the full actual browser workflow. results.json and summary.json now report all responsive, card selection, back/home, reachability, keyboard focus and reduced-motion checks passing; no page exceptions and no ride-creation POSTs occurred.
3. Visually opened final-screen2.png, iphone.png, small.png, screen1-preserved.png and screen3-share.png against the authorized attached reference and preserved screens. Meaningful truncation/overflow/duplicate-navigation problems are resolved. Intentional service-data and policy omissions remain explicit.

## Remaining block

Authenticated Account/Activity/Wallet pages and their live cross-tab animation states could not be visually inspected in the fresh guest browser: the existing guard correctly redirects to /auth. This is not bypassed. Native Android hardware back, real keyboard and notched-device safe areas remain unverified; the snapshot lacks an inspected App/backButton plugin bridge and native files were not changed. These checks require a signed-in test session and native-host validation. The new chooser's scoped axe run reports zero violations, but these gaps prevent complete visual/release sign-off.

No additional design drift requiring an unapproved redesign was identified in the captured Screen 2 state. The broader previous home contrast/service-access findings are outside this sprint. No pixel-perfect claim is made. See SCREEN2-IMPLEMENTATION.md for exact files, routes, test/build results and guarded integration instructions.
