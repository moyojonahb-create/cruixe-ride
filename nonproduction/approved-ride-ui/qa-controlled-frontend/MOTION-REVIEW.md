# Motion review

Scope: existing approved isolated navigation and finding-drivers motion, plus the one-line viewport commit. No animation code was changed. User-approved visuals were preserved.

| Before | After (recommendation, not implemented) | Why |
|---|---|---|
| riderNavigation.css:52 uses an SVG path d transition of 330ms | Profile on a real midrange Android device before selecting an equivalent treatment or timing adjustment | Path morphing requires paint; exceeds the review skill's sub-300ms interaction budget. It is the approved cradle geometry; no measured regression justifies redesign here |
| riderNavigation.css:29 transitions color/background/shadow as well as transform | Measure paint cost before narrowing the list | Explicit properties avoid transition:all, but color/shadow are not a blanket compositor-only guarantee |
| PaymentMethodSelector.tsx:29 uses a static 28px backdrop blur | Profile the actual composed layer on older GPU hardware; reduce only if measured necessary | Static backdrop blur is a potential cost, not proof of a dropped frame and not equivalent to animating blur |
| Main index.html:86-105 defines an infinite spinner and 400ms splash fades without a local reduced-motion rule | Review main startup's complete reduced-motion treatment in an isolated safe configuration | Existing HTML motion is unchanged by the viewport commit; fixture reduced-motion evidence cannot certify main splash behavior |

Performance: finding visual progress uses CSS transform animations (scaleX/translateX), not width/left layout animation. The navigation cradle morph and shadows still need real-device recordings. No new will-change, rAF loop, animation dependency or per-frame React state was introduced. A 60fps/120Hz or older-Android performance PASS is not supported.

Interruptibility and timing: navigation uses transitions that can retarget; current fixture tab interaction is usable. Rapid repeated input, frame delivery and pending-state timing under real service latency: NOT RUN. The finding animation alone never establishes real driver availability or assignment.

Accessibility: approvedRide.css:63-64 and :135-136, plus riderNavigation.css:47-48, disable/reduce motion. Current matched-source core captures and supplemental finding capture show zero significant running animations with reduced motion enabled: PASS. Physical reduced-motion/VoiceOver/Safari testing: BLOCKED. Fully disabling movement is accepted here under the user's requirement even where generic motion guidance suggests retaining a gentle fade.

Decision: **Approve the narrow viewport commit**; it changes no animation. **Block full motion-performance acceptance** until the non-compositor morph/blur and main splash accessibility are verified on representative hardware. No approved visual element was redesigned based on a hypothetical performance risk.
