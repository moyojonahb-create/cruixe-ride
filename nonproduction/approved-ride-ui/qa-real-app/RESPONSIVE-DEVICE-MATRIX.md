Date: 1 November 2026 (Africa/Johannesburg). Status vocabulary: PASS, FAIL, BLOCKED, NOT VERIFIED. All browser evidence below uses the existing labelled mocked fixture; it cannot certify real services.

# RESPONSIVE DEVICE MATRIX

**Isolated layout: PASS for the sampled screens. Real/native universal compatibility: NOT VERIFIED.**

Final run: Microsoft Edge using existing Node 22.23.4; one context at a time; reduced-motion preference enabled; external HTTP/write requests blocked; no external request was attempted. Four states per size: Ride Home, Choose a Ride, Set Destination and Economy Trip Configuration. Evidence: [after/results.json](after/results.json). No ride-confirmation action was invoked.

| Viewport | No horizontal overflow | Primary actions visible/hit-testable | 44px sampled targets | Five visible tabs on choose/search | Axe | Keyboard shrink model | Screenshot |
|---|---|---|---|---|---|---|---|
| 320x640 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/320x640-home.png) |
| 360x800 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/360x800-home.png) |
| 375x667 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/375x667-home.png) |
| 375x812 | PASS | PASS | PASS | PASS | PASS | PASS | [screens](after/375x812-home.png) |
| 390x844 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/390x844-home.png) |
| 393x852 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/393x852-home.png) |
| 412x915 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/412x915-home.png) |
| 768x1024 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/768x1024-home.png) |
| 812x375 | PASS | PASS | PASS | PASS | PASS | NOT VERIFIED | [screens](after/812x375-home.png) |

375x812 is the required iPhone X visual acceptance target. 768x1024 covers tablet; 812x375 covers landscape. The keyboard PASS is only a synthetic viewport resize to 375x430 with the destination input focused. It is not an OS keyboard test. All real iOS/Android keyboard, home-indicator, notch and system-navigation tests remain BLOCKED pending devices.

The navigation intentionally hides on Home and after destination selection according to the existing approved rules. Raw DOM navCount in the capture can count CSS-hidden elements: visibility is determined from navRect and interaction results, not element count alone. No cradle/ribbon component or navigation stylesheet was changed.

## Responsive requirements

| Requirement | Status | Evidence / limit |
|---|---|---|
| Widths from 320px | PASS | Smallest sampled width 320; all 36 screens had no document horizontal overflow. Arbitrarily long translated/user text remains NOT VERIFIED. |
| Safe-area insets | NOT VERIFIED | viewport-fit=cover and env safe-area rules remain present. Desktop emulation does not reproduce physical insets. |
| Primary actions visible/reachable | PASS | Geometry plus center hit tests on sampled actions; local navigation/selection exercised. Server-backed booking buttons were never invoked. |
| No horizontal overflow | PASS | Nine sizes/four states; primary bounds checked in addition to document width. |
| No hardcoded screen height | PASS | Existing 100dvh/visualViewport tracking retained; no fixed screen-height value introduced. Component/button dimensions remain intentional. |
| Dynamic viewport units | PASS | Existing dvh sizing retained; short search screen uses max-height so the inline viewport height can still shrink. |
| Navigation/action collisions | PASS | The reproduced landscape destination interception and clipped configuration primary action are corrected. Parent scroll remains available; no essential rows were removed. |
| Responsive destination inputs | PASS | Sampled widths plus iPhone X shrink model; minimum input font is 16px in the isolated search screen. |
| Home/Work/Schedule | PASS | Each sampled Home action is within the viewport, >=44px and hit-testable; service-backed favorites are NOT VERIFIED. |
| Android/iOS navigation areas | NOT VERIFIED | Source safe-area rules retained; needs physical OS navigation modes. |
| Keyboard open/close/resizing | NOT VERIFIED | One synthetic shrink check passes. Actual keyboard opening/closing, visual viewport offsets and native plugin interaction remain device gates. |
| Portrait / sensible landscape | PASS | All seven phone portrait sizes, tablet and landscape; short configuration scrolls with sticky primary row. |
| Dynamic text scaling | NOT VERIFIED | Zoom restrictions removed from main/isolated HTML. Native font scaling, 200% text reflow and all fixed-pixel typography remain unverified. |
| Minimum 44x44 touch targets | PASS | Every DOM-visible control measured in the 36 sampled states met 44x44, including disabled controls. Offscreen overlays and other app routes were not exhaustively sampled. |
| Canonical ribbon / moving cradle | PASS | Ribbon path values match pre-edit at all nine sizes. Component, nav code and nav CSS hashes match the reviewed snapshot; sampled choose/search show five tabs. Full native animation acceptance remains NOT VERIFIED. |

The failed audit and intermediate landscape attempts remain preserved under audit/, landscape-fixed/ and landscape-constrained/. The first height-only short-screen rule was ineffective because visualViewport writes inline height; the max-height rule supersedes it. The final run is the current result; intermediate PASS logs must not be used to claim geometry that their screenshots did not support.

[Before iPhone X home](before/375x812-home.png) / [after](after/375x812-home.png). [Before landscape search](audit/812x375-destination.png) / [after](after/812x375-destination.png). [Clipped landscape confirmation](landscape-constrained/812x375-configuration.png) / [corrected sticky confirmation](after/812x375-configuration.png). [Final iPhone X configuration](after/375x812-configuration.png).
