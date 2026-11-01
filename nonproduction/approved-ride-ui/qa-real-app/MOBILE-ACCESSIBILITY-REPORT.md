Date: 1 November 2026 (Africa/Johannesburg). Status vocabulary: PASS, FAIL, BLOCKED, NOT VERIFIED. All browser evidence below uses the existing labelled mocked fixture; it cannot certify real services.

# MOBILE ACCESSIBILITY REPORT

**Automated isolated scans: PASS. Full WCAG/native accessibility acceptance: NOT VERIFIED.**

| Check | Status | Actual evidence |
|---|---|---|
| Axe wcag2a / wcag2aa / wcag21aa | PASS | 36 scans, zero reported violations across nine sizes and four states. |
| Home greeting contrast | PASS | Before: Axe reported 4.47:1 for #777 on white, below 4.5:1. After: existing muted #626b76 gives approximately 5.41:1 on white; all sampled Home scans now report zero violations. |
| Route touch targets | PASS | Pickup/destination route buttons increased from measured 42px to 44px. No measured sampled target remains under 44x44. |
| Semantic controls | PASS | Destination textbox label, Economy selection, passenger increment and wallet tab located by role/name. Important sampled primary buttons have accessible names. |
| Manual screen-reader semantics | NOT VERIFIED | No VoiceOver, TalkBack or full screen-reader traversal. Role/name locators are not a substitute. |
| Axe incomplete/manual rules | NOT VERIFIED | Remaining incomplete rule IDs: aria-prohibited-attr, color-contrast. These are not recorded as passes; inspect the original results before a conformance claim. |
| Focus indicator / keyboard navigation | NOT VERIFIED | Existing focus-visible CSS retained. No complete Tab order, focus-trap, focus restoration or hardware-keyboard acceptance run. |
| Zoom | PASS | maximum-scale=1.0 and user-scalable=no removed from both actual HTML entry points; static byte comparison confirms no unrelated HTML changes. Actual pinch/OS settings remain NOT VERIFIED. |
| Dynamic type / 200% text reflow | NOT VERIFIED | Root font scaling and all layouts at enlarged text sizes not certified. Existing pixel-sized text remains a review item. |
| Reduced motion | PASS | Preference active for all 36 captures; no significant (>1ms duration) running animations observed at sampling. Ribbon/nav CSS unchanged and has reduced-motion rules. All other app routes/native transitions remain NOT VERIFIED. |
| Synthetic keyboard resize | PASS | On iPhone X size, destination input remained within the 375x430 resized viewport. |
| Real software keyboard / safe areas | BLOCKED | No physical iOS/Android device validation. |
| Real map accessibility | NOT VERIFIED | Labelled fixture map only. Actual Mapbox controls, failure states, attribution and screen-reader interaction untested. |
| Current Note for Driver recheck | NOT VERIFIED | No current edits target Note for Driver. Prior approved contrast/interaction results are historical; this audit did not repeat its scans. |

The contrast correction uses an existing project muted color and does not redesign approved surfaces. The landscape correction preserves all content in scrollable containers and keeps the primary action reachable. Fixture coordinates, fare, identity and wallet values are labelled QA data and are never treated as real-service evidence.

Evidence: [raw final results](after/results.json), [pre-edit failures](audit/results.json), [static source checks](static-verification.json), [device matrix](RESPONSIVE-DEVICE-MATRIX.md).
