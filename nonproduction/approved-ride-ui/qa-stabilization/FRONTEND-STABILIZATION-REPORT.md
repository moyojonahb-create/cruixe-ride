# CruiXe frontend stabilization and verification

Date: 2026-11-01. Workspace: `nonproduction/approved-ride-ui`. All browser and focused-test behavior below is **MOCKED/ISOLATED**, not authenticated backend integration.

## Executed gates

| Check | Result | Evidence |
| --- | --- | --- |
| Focused Vitest, Node 22.23.4 | PASS, exit 0; 8 files / 58 tests; 85.89 s | [Log](focused-final.log), [status](focused-final-status.json) |
| TypeScript app project, no emit, extended diagnostics | PASS, exit 0; 92.14 s elapsed | [Diagnostics](typecheck-final.log), [resources and exit](typecheck-final-status.json), [samples](typecheck-final-resources.jsonl) |
| Scoped ESLint, 13 changed source/test/harness files | PASS, exit 0; 0 errors, 52 warnings | [Results](eslint-final.json), [status](eslint-final-status.json) |
| Production bundle with application environment excluded and upload plugins removed | BLOCKED by host RAM guard; no completed production build | [Final attempt](production-build-768-status.json), [log](production-build-768.log) |
| Playwright/Edge, 393x852 and 360x800 | PASS, exit 0, MOCKED/ISOLATED | [Assertions](browser-verified/assertions.json), [results](browser-verified/results.json), [status](browser-verified-status.json) |
| Axe WCAG 2 A/AA and 2.1 AA, configuration/payment/luggage/Schedule/pending states at both sizes | PASS, 10 tested states, 0 violations; automated scope only | [Results](browser-verified/results.json) |
| `git diff --check` | PASS, exit 0; existing CRLF conversion notices only | [Whitespace evidence](whitespace-checks.json) |
| Authenticated booking, authorized Finding Drivers lifecycle, real uploads/payment/matching | BLOCKED: no approved staging environment or accounts | [Staging requirements](STAGING-REQUIREMENTS.md) |

This is scoped ESLint, not `npm run lint` over the whole dirty repository and preserved dependency directories. Per-sprint `git diff --no-index --check` comparisons returned 1 because files differ, with no whitespace-error diagnostics. The repository `git diff --check` returned 0.

## Dependency diagnosis and minimal correction

The existing Vitest configuration already selected jsdom; package declarations, the lockfile and installed package agreed on jsdom 20.0.3. Reading the shared installed `jsdom/lib/jsdom/living/nodes/DocumentFragment-impl.js` produced Windows error 1392 (corrupted/unreadable). The exact locked tarball passed SHA512 integrity validation and contained the expected 1,396-byte file. This was an unhealthy installation, not a missing dependency declaration.

Restored only the preview toolchain using copies of the unchanged package manifest and lockfile in `qa-stabilization/toolchain`, Node 22, and `npm ci --ignore-scripts --no-audit --no-fund`. Initial registry attempt failed ECONNRESET (exit -4077). The bounded lower-concurrency cached retry installed 696 packages, exit 0. jsdom constructed a document successfully afterward. No dependency version or application manifest/lockfile changes were needed.

The preview's old shared `node_modules` junction was preserved as `node_modules.shared-before-stabilization`; the new preview `node_modules` junction points at the private toolchain. The main repository's dependency directory was not repaired or altered. Its original corrupted installation remains outside this sprint's scope. See [diagnosis](jsdom-diagnosis.json), [repair record](dependency-repair.json), and [manifest hashes](toolchain-inputs.json).

## Why TypeScript crossed 180 seconds

The original shared-tree trace showed active reads and checking, not a deadlock: 451 root files; the 180-second diagnostic guard ended it at 183.14 s (forced child exit 1). The trace was retained in `typecheck-shared-trace/` and summarized in [trace summary](typecheck-shared-trace-summary.json).

A monitored fresh-tree run completed naturally in 188.77 s (exit 2), exposing just two unsupported Testing Library `exact` options in the newly added isolated test. Those options were removed. That run measured 1,885 files, 223,206 definition lines, roughly 1.52 million type instantiations, 185.13 s compiler time and 861.6 MiB peak working set. The source workload, cold reads and constrained host account for the overrun; no type-check scope was reduced or strictness relaxed.

The final run passed in 92.14 s elapsed, 85.27 s compiler time, 843.1 MiB peak working set, 846.1 MiB peak private memory, 64.703 CPU seconds and 418 MiB minimum available physical RAM. Compiler-reported memory was 823,011 KiB. The profiler records CPU, file reads, output progress and memory every two seconds, and retains a 40-second no-progress guard and 384 MiB free-RAM guard. The diagnostic completion window was based on demonstrated progress, not a blind timeout extension.

Exact final compiler invocation: Node 22.23.4 `--max-old-space-size=1536 node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json --extendedDiagnostics --pretty false`.

## Production build evidence and blocker

Production bundling uses the original application's source, SWC, target, chunk settings, sourcemaps and code splitting through `vite.stabilization-build.config.ts`. It runs from an empty environment directory, injects only invented loopback build values and excludes Sentry upload plugins. It is a build verification artifact, not a deployable application or a normal-environment release certification.

The first harness attempt exited 1 because Tailwind resolved its configuration from the intentionally empty working directory (`border-border` missing). Corrected only the harness to pass the existing Tailwind configuration and absolute content paths explicitly; application Vite/PostCSS/Tailwind configuration is unchanged.

With that corrected, the 1536 MiB heap attempt was stopped at 50.48 s when free physical RAM fell to 345 MiB; peak working set 822.3 MiB, private memory 941.7 MiB. A justified smaller 768 MiB heap retry was stopped at 44.55 s with 353 MiB free; peak working set 770.8 MiB, private memory 902.1 MiB. Both profiler wrappers exited 3; forcibly terminated Vite children exited 1. These are resource-guard terminations during transform, not completed compiler failures or passes. Logs retain Browserslist-age and ambiguous Tailwind-easing warnings. More free host memory is required to complete this gate; no other applications were terminated and no production build settings were weakened.

## Demonstrated UI discrepancies corrected

Compared the existing screens to the approved Trip Configuration and Finding Drivers PNGs and route specification under `design references/cruixe-redesign-v1/CruiXe-Frontend-Redesign-v1`.

| Before | After | Reason |
| --- | --- | --- |
| Confirmation text/arrow cramped beside fixed-width Schedule at 360 px | Responsive Schedule width and bounded confirmation copy; arrow remains inside button | Keep both approved actions usable on the smaller phone |
| Selected Economy card had redundant red selection treatment and smaller artwork | Pink selected card, larger existing artwork, configuration-only redundant mark hidden | Match the approved configured-trip presentation |
| Pending search had small title, bare timer/fare, blue summary and unequal Cancel/Note actions | Larger status treatment, timer pill, fare surface, pink summary and equal Cancel/Note for driver actions | Match approved hierarchy without changing matching behavior |
| Faint helper labels; luggage preview remove button had no accessible name and note label lacked association | Stronger contrast, named removal buttons, associated note label and descriptive preview alt | Resolve measured Axe violations |

Actual passenger count and recorded trip duration are displayed only when valid in the existing pending ride object; duration is labelled Trip, never a driver ETA. Pending artwork reuses existing public vehicle WebPs. The assigned-driver view retains its original PNG mapping. Fare bounds/handlers, timers, authorization, offers, cancellation and matching authority are unchanged. No successful backend matching or progress was simulated.

## Exact changed application files

1. `src/components/ride/RideView.tsx`: responsive footer classes/width, optional-photo helper text, separator encoding correction.
2. `src/components/ride/RideTierSelector.tsx`: scoped styling hooks only; passenger handlers and existing 44 px touch targets retained.
3. `src/components/ride/approvedRide.css`: configuration and pending-view styles and contrast corrections; original UTF-8 BOM preserved.
4. `src/components/luggage/LuggageSheet.tsx`: label association, preview alt, removal button name and helper contrast; upload/save/removal handlers unchanged.
5. `src/pages/RideMatching.tsx`: pending-view presentation, existing pending artwork, valid ride metadata and 44 px fare buttons; assigned/completed views and control logic preserved.

[Exact sprint diffs, SHA256 before/after and preservation assertions](source-change-manifest.json) distinguish these changes from the user's existing work.

New verification files: `src/test/BookingConfiguration.isolated.test.tsx`, `vitest.stabilization.config.ts`, `vite.stabilization.config.ts`, `vite.stabilization-build.config.ts`; `qa-stabilization/network-guard.ts`, `fixture.tsx`, `fixture-services.ts`, `fixture-pricing.ts`, `fixture-map.tsx`, `fixture-site/index.html`, `profile-command.py`, `browser-isolated.mjs`, `browser-finding.mjs`, `STAGING-REQUIREMENTS.md` and this report. The QA directory also contains retained baselines, diffs, JSON status/resource reports, logs, screenshots, verified dependency archive, private npm cache/toolchain and isolated build/Vite/Vitest caches. Existing files were not deleted to create them.

## Browser behavior and visual evidence

The final run loaded the actual frontend components and real Framer Motion in a clearly labelled isolated fixture shell. All external requests and network writes were denied. Search, identity, map, network and ride state were explicit fixtures; photos used in-memory object URLs. No production sessions, credentials or accounts were used.

Verified Choose a Ride -> Set Destination -> Economy Configuration; passenger bounds 1-4 and 44x44 targets; Cash panel opening/return/focus; insufficient Wallet/unavailable EcoCash states; optional photo selection, decoding, save and removal; Schedule selection; and passing the selected date into an explicitly denied local booking adapter, with no ride creation. The new component suite plus seven existing focused suites total 58 passing tests, including existing requestRide authorization-contract tests. Those mocks do not certify live 401 behavior.

Pending Finding Drivers is tested solely as a fixture rendering state. The browser did not submit a real ride, change fare, cancel a real ride, assign a driver or exercise a backend matching success. Both pending viewports have no horizontal overflow; the same two canonical ribbon SVG paths were verified against configuration.

Navigation uses the real router and existing cradle: Account `/profile`, Activity `/history`, Wallet `/wallet`, with `aria-current=page` after click, reload and Back. Measured 11, 11 and 12 distinct interpolated SVG curve states respectively; reduced-motion transition duration 0 s. Fixture account/history/wallet destination content is not backend integration coverage.

Final run exit 0 with all eleven [assertions](browser-verified/assertions.json) true, no page/console/HTTP errors, no blocked external attempts and no forbidden writes. An earlier complete-flow attempt encountered browser `ERR_NETWORK_IO_SUSPENDED` on the pending-view navigation, exited 1 and was retained; a targeted pending retry and the final complete rerun both passed. Earlier screenshots/logs remain for diagnosis; use the final evidence below.

- [Choose 393](browser-verified/choose-393.png) / [360](browser-verified/choose-360.png)
- [Destination 393](browser-verified/destination-393.png) / [360](browser-verified/destination-360.png)
- [Configuration 393](browser-verified/configuration-393.png) / [360](browser-verified/configuration-360.png)
- [Payment 393](browser-verified/payment-393.png) / [360](browser-verified/payment-360.png)
- [Luggage 393](browser-verified/luggage-393.png) / [360](browser-verified/luggage-360.png)
- [Schedule 393](browser-verified/schedule-393.png) / [360](browser-verified/schedule-360.png)
- [Finding Drivers 393](browser-verified/finding-drivers-393.png) / [360](browser-verified/finding-drivers-360.png)

## Preserved screens and remaining differences

The shared `RideGlassPanel.tsx`, `BottomNavBar.tsx`, `riderNavigation.css` and `ScheduleRide.tsx` are byte-identical to their sprint baselines. Existing Choose a Ride/search behavior, real route/map implementation, pickup/destination controls, optional luggage behavior, inline payment panel and confirmation handlers remain. No separate mandatory payment screen was inserted. No duplicate-control or historical asset/import repair was repeated. Pending dynamic loading succeeded in the isolated browser; this does not establish authenticated runtime health.

Town/service-area and Who is riding controls remain as functional additions to the minimal approved configuration mockup. Existing provider-backed map/route content remains in application code, but the isolated screenshots intentionally show a blank labelled map, synthetic locations and synthetic fare/ride values; visual parity of real map geometry, driver markers, server timing and authorized driver assignment is unverified. Physical keyboard/safe-area, native camera/storage and screen-reader behavior are not certified by desktop automated browser checks. No approved earlier-screen PNG was available in this reference folder for a pixel comparison of Choose a Ride or Set Destination.

## Skills accessibility

All seven prioritized skills are installed/readable and their instructions were read: apple-design, animate, animation-performance, emil-design-eng, improve-animations, mobile-native and ui-ux-pro-max. Codex can use their local instructions; no additional agent/model is required. Used them selectively for phone layout, contrast/labels, existing motion/reduced-motion inspection and scoped approved-reference reconciliation. Working navigation and ribbon were not rebuilt. [Accessibility and installed inventory](skill-access.json).

Installed local SKILL.md inventory (35): `animate`, `animate-expo`, `animation-performance`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `banner-design`, `brand`, `break-ui`, `code-quality`, `design`, `design-system`, `design-taste-frontend`, `emil-design-eng`, `find-animation-opportunities`, `frontend-design`, `gsap`, `improve-animations`, `mobile-native`, `pick-ui-library`, `playwright-cli`, `prototype`, `remotion-best-practices`, `remove-animations`, `review-animations`, `security-review`, `slides`, `ui-styling`, `ui-ux-pro-max`, `vercel-composition-patterns`, `vercel-react-best-practices`, `web-css-animations`, `web-design-guidelines`, `web-waapi`, `write-swift`.

## Safety and next verification gate

No commits, pushes, merges, deployment, reset, stash or clean. No main-workspace source edits, Go/backend changes, database/policy changes, production service writes, financial logic changes or ride-assignment changes were made. All preceding staged, unstaged and untracked work was retained. The private fixture server was stopped after verification.

Authenticated integration remains BLOCKED until an explicitly approved separate Supabase project/backend, disposable rider/driver identities, isolated storage/data, safe credentials handling and cleanup plan exist. The requested [staging requirements](STAGING-REQUIREMENTS.md) cover these prerequisites. Production-build completion also remains BLOCKED by measured host RAM. Main-workspace integration is not proposed while those gates remain unresolved.
