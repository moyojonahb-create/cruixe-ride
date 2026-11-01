# Approved /ride UI — isolated implementation

The source implementation is in this folder. The parent working tree remains untouched by this UI task, apart from these nonproduction artifacts. The snapshot includes the uncommitted frontend integration work present at capture time; dependencies are reused through a node_modules junction. Do not replace the parent src directory with this snapshot.

## Changed frontend files

- src/components/ride/RideView.tsx — scoped screen styles, responsive panel sizing, existing controls and callbacks.
- src/components/ride/RideGlassPanel.tsx — opt-in responsive SVG curve and opaque white panel; other consumers retain their existing skin.
- src/components/ride/RideHomeGreeting.tsx — existing vehicle asset, accessible search button, reduced-motion support.
- src/components/ride/QuickShortcutsRow.tsx — existing favorites behavior, accessible labels, reduced-motion support.
- src/components/ride/TownSelectorSheet.tsx — scoped white pill, labels, narrow-screen bounds.
- src/components/MapboxMap.tsx — restrained white-car outline and actual GPS-only location dot.
- src/components/ride/approvedRide.css — screen-scoped layout, colors, touch targets, safe-area and responsive rules.

## Preserved integration

The route still renders RideView and the existing lazy Mapbox renderer with streets-v12. Driver data still comes from useNearbyDrivers, including its current presence filtering and socket authorization. GPS permission, search results, pickup selection, saved Home/Work coordinates, tier choice, schedule validation, payment selection, requestRide, rider authentication, pricing, and API payloads retain their existing handlers. No backend, schema, payment, authentication-rule, or production-infrastructure source was edited.

No active drivers or coordinates were seeded. The directional heading beam is omitted because this screen supplies no actual heading. Notification badges remain driven by actual unread data. The service-area pill displays the town configuration; town selection remains the way to change service area. The existing white/red vehicle illustration is reused; its branding and angle differ from the reference.

## Safe integration with the active backend workspace

1. Coordinate a pause for edits to the seven listed frontend paths. Other backend work can continue.
2. Run `python nonproduction/approved-ride-ui/integrate-ui.py` from the parent repository. This is check-only and compares SHA-256 values with the captured baseline. It refuses any file changed since the snapshot, including a newly created destination CSS file.
3. Review `approved-ride-ui.patch`. If baseline checks pass, run the same script with `--apply`. It copies only the seven paths; it never commits, resets, stashes, merges, pushes, or deploys.
4. If checks fail, manually reconcile just the presentation hunks with the backend agent's latest source. Do not bypass the guard by copying the whole snapshot.
5. Repeat Node 22 typecheck, focused regressions, and build on the integrated tree. Stop the isolated preview when it is no longer needed.

The patch is for review, not an automatic merge instruction. Current backend contracts and uncommitted hooks are dependencies preserved in the snapshot, not changes shipped by this UI task.

The PowerShell helper is also included, but local execution policy blocks it. Use the Python helper above; no execution-policy change is needed. The check-only Python run passed for all seven paths.

## Approved vehicle-image follow-up

The image-only update adds RideTierSelector.tsx to the reviewed source paths (eight accumulated UI source paths total). The four verified public/brand/cruize-*.webp files are present in both parent and isolated public directories. Use VEHICLE-IMAGES.md, vehicle-asset-manifest.json and the check-only Python guard for current details. The separate approved-ride-ui-with-vehicles.patch includes the current source and passes ordinary git apply --check; the original patch is retained as historical evidence. Neither patch has been applied.

## Screen 2 continuation

Latest integration artifact: approved-screen2-ui.patch, with 18 accumulated UI source paths. SCREEN2-IMPLEMENTATION.md lists the 13 paths changed for this sprint, actual route/stage mappings and all validation statuses. The ordinary strict whitespace patch check and Python baseline/asset guard pass. Older packaging scripts/patches describe earlier snapshots and must not replace the current manifest. No integration has been applied.

Latest sprint: see DESTINATION-IMPLEMENTATION.md and approved-destination-ui.patch for curved navigation and Set destination. Older Screen2 artifacts are historical.
