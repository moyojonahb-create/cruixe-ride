# Driver badge increment — 18 November 2026

Migrates approved frames 1356:232 (Badge Progress), 1360:142 (Achievements), and 1360:204 (Badge Requirements). Entry: Driver Profile → Driver badge & achievements. Authenticated routes: `/driver/badges/progress`, `/driver/badges/achievements`, `/driver/badges/requirements`. Staging-only visual selector: `/staging/driver-badges` (explicit sample data, no writes).

Original Figma contexts/screenshots and six SVG exports recovered through the authenticated Figma connection. SVG dimensions and colors preserved. Responsive Poppins layout, bronze/copper summary, white summary text, black offset cards, red actions. Native/browser status UI remains native.

## Integration and deliberate differences

- Existing authenticated `getDriverProfile` identifies the current driver. Exact head-only counts read completed `rides`, scoped to driver ID; `vehicle_type=parcel` is separated from other rides. Counts are not capped by the API row limit.
- Missing profile, failed reads and unavailable counts show failure/retry, never fabricated zeros. Query cache is scoped by authenticated user ID.
- Figma Bronze award and example totals are not treated as real awards. The connected screens say badge status pending because no approved award contract was found. Existing frontend rating-based verification badge logic is not changed.
- Driver approval is shown as account status, not an assertion that every document is approved. Requirements remain explanatory and progression rules pending, as in Figma.
- No invented achievement timestamps/history or tier thresholds. Saved award history requires an authoritative award contract before it can be displayed.

## Verification

51 focused Vitest tests passed (7 new badge regressions, records regressions and staging guards). TypeScript app check passed. Chromium checks passed for all three screens at 360×800, 400×845 and 414×896: no horizontal overflow or browser exceptions, icons loaded, white summary headings, progress/achievement/back navigation. Reviewed rendered 400px screenshot against Figma.

Physical iPhone XR Safari and authenticated staging account acceptance remain pending. No two-device ride or staging sign-off is claimed. Notifications and remaining Driver designs are separate pending work. PR #5 and #7 remain draft.
