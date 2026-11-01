# Destination search fix

The issue was reproduced in Edge at `http://localhost:8081/ride?view=choose` before editing. A focused destination input had a permanent red CSS border plus a Tailwind `focus-visible:ring-2` and ring offset, producing the double border. The clear button was a sibling outside the input container. Queries shorter than three characters rendered only shortcuts, with no explanation. A valid `Gwanda` query showed real provider/database results, but the cache endpoint returned 401 and that failure had previously been hidden.

The isolated implementation now uses one `.destination-search-control` with `:focus-within` as the single red focus treatment. The input has no native border, ring or shadow; the clear action is an internal 44px button. At zero, one or two characters the field explains the three-character threshold. At three or more characters it exposes a named, scrollable Search results region, keeps loading visible while results exist, distinguishes empty results from errors, and provides Retry search plus Choose on map for failures. Enter moves focus to the first native result button; Escape blurs; clear restores focus to the input.

The existing landmark, street, cached-place and `google-places-search` provider paths remain in use. Local and cache requests now debounce, abort previous requests, time out, and ignore stale generations. Provider errors are surfaced; authoritative place-details resolution has timeout and finite-coordinate guards. No backend or provider was added, and no ride is created during selection.

Files changed in the isolated workspace:

- `src/components/ride/DestinationSearchScreen.tsx`
- `src/components/ride/destinationScreen.css`
- `src/components/ride/RideView.tsx`
- `src/hooks/useLandmarks.ts`
- `src/hooks/useStreets.ts`
- `src/lib/placeCache.ts`
- `src/test/DestinationSearchScreen.test.tsx`
- `src/test/DestinationSearchPipeline.test.tsx`

Verification:

- Node 22 typecheck: PASS.
- Focused suite: 39 tests PASS across destination UI, provider cancellation, navigation, tier selection and draft preservation.
- Targeted ESLint: zero errors; warnings are existing RideView warnings plus hook cancellation dependency warnings.
- Edge at 320px: one-character threshold message visible; valid `Gwanda` query produced actual Gwanda landmark/street results; clear button was inside the control; no page exceptions; no ride-creation POSTs.
- Search provider responses included successful `koloi_landmarks` and `streets` results. `places_cache` returned 401 for this guest session, now shown as “Saved place search is unavailable. Retry search.”
- `git diff --check`: PASS. Strict patch check: PASS for the generated review patch.
- Production Vite bundling: PASS, 4,521 modules and `dist/index.html` generated in 8m41s. The PowerShell wrapper returned exit 1 because captured Vite/Sentry deprecation warnings were promoted to `NativeCommandError`; no bundling error occurred.

Integration remains blocked by the expected dirty-tree conflicts in the main workspace: `src/components/ride/DestinationSearchScreen.tsx` and `src/components/ride/destinationScreen.css` changed after their recorded baseline. The patch was not applied, and no commit, merge, push or deployment was performed.
