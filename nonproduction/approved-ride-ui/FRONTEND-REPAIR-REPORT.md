# CruiXe frontend repair evidence

Scope: nonproduction/approved-ride-ui only. Main application source, backend, infrastructure, auth, financial calculations, and assignment authority were not edited. No commits, pushes, merges, resets, stashes, cleans or deployments.

## Runtime diagnosis

Port 8081 was unreachable when inspected. Started this existing isolated frontend preview using Vite on 127.0.0.1:8081. Vite reported version 5.4.19 and ready in 12553 ms. The previous process/terminal and four reported current screenshots were not available in this chat, so their historical failures cannot be attributed to stale cache or a missing module without more evidence.

All three vehicle URLs returned HTTP 200 with image/webp and decoded to naturalWidth 664 in Edge at both requested viewport sizes. Files have RIFF/WEBP headers. Existing URLs are origin-root public assets; Vite has no custom base. Both RideSelectionCards and RideTierSelector already reference these assets. No vehicles or asset paths were replaced.

Finding Drivers module: http://localhost:8081/src/pages/RideMatching.tsx returned HTTP 200, Content-Type text/javascript. Browser import succeeded before and after the edits. No module/import exception or Vite import error was captured. The historical dynamic-import root cause remains unverified. No cache was deleted and authentication was not bypassed.

Observed runtime failures: unauthenticated pricing_settings, town_pricing and live_locations reads return 401/42501 permission denied. Destination search services time out/become unavailable. The map was blank in captures. These block a real configuration/matching journey in this session. No production ride was created, mocked or assigned.

## Source changes

1. src/components/ride/RideView.tsx
   - Removed the repeated luggage yes/no prompt; its Yes action opened the same LuggageSheet as the retained optional photo tile. No only dismissed the prompt.
   - Replaced the luggage placeholder glyph with the existing Lucide Luggage icon.
   - Payment-panel confirmation now closes the panel instead of submitting a ride. Cash remains the existing initial selection. The main confirmation uses the existing proceedToBook path without forcing a payment detour.
   - Confirmation label matches approved wording: Confirm location & continue.
   - Kept Who is riding because it opens the separate required third-party booking functionality.
2. src/components/ride/RideTierSelector.tsx
   - Increased passenger buttons from 24 to 44 CSS pixels, preserving count limits and handlers.

Exact pre-edit bytes and hashes: qa-repair/baseline/. Diffs: qa-repair/RideView.diff and RideTierSelector.diff. Diagnostic runners: repair-inspect.mjs and repair-browser.mjs. Raw module response: matching-response.txt. Build artifacts are directed to dist-repair/ rather than replacing dist/.

## Preserved design and behavior

The approved SVG ribbon, existing Choose a Ride cards, Set Destination implementation, route-driven navigation, actual map provider, selected tier, route controls, luggage photo implementation, Schedule, payment eligibility, and booking/auth logic remain. Assigned Driver was not redesigned.

The navigation cradle has a 0.33s transition and 0s with reduced motion. Account/Activity/Wallet clicks reach the real /auth guard and browser back returns to selection. Authenticated tab-to-tab movement is not verified without a valid session; existing route synchronization tests could not execute because of the dependency problem.

## Executed verification

- PASS: assets decode at 393x852 and 360x800; Choose a Ride has no horizontal overflow; Economy selection leads to /ride?view=locations&tier=economy.
- PASS: direct Finding Drivers dynamic import (before and after); no page exceptions in recorded browser checks.
- PASS: Account, Activity and Wallet authentication redirects; no ride creation attempts recorded.
- PASS: changed-file ESLint, 0 errors / 41 warnings.
- PASS: git diff --check with normal repository settings, exit 0. An earlier core.autocrlf=false diagnostic produced misleading CRLF warnings and is superseded by git-diff-check-default.log.
- BLOCKED: focused Vitest, environment fails on missing shared node_modules/jsdom/lib/jsdom/living/nodes/DocumentFragment-impl.js. Existing shared dependencies were not modified.
- BLOCKED: end-to-end configuration/payment/luggage/schedule/matching checks need usable provider results and an authorized session. No fake fares or rides were substituted.
- BLOCKED: production build was attempted twice with Node 22, but remained in transformation without completion on this machine and was stopped. No successful artifact is claimed. Logs: build.log and build-sequential.log.
- BLOCKED: TypeScript final Node 22 attempt exceeded its 180-second limit (185 seconds recorded), with no compiler diagnostic before termination. See typecheck-status.json and typecheck-final.log. Earlier competing attempts were also stopped.
- BLOCKED: full-tree ESLint attempts were stopped without a completed result. The changed-file ESLint result above is the only completed lint verdict.

## Remaining differences / integration

The configuration label, duplicate prompt and touch targets are reconciled in code, but the complete configuration screen has not been visually verified at either viewport because the live search path is unavailable. The selected-card tint/selection ring, auxiliary town/area and rider controls remain as implemented; no additional visual polishing was attempted. Earlier Home/Choose/Destination reference images are absent from the approved bundle.

Changes remain isolated and are not ready to integrate while required checks and authenticated runtime verification remain unresolved. The previous integration patches/manifests have not been regenerated or applied.
