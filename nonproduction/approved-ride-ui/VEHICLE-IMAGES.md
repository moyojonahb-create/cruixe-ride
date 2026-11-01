# Approved vehicle-image installation

Workspace: nonproduction/approved-ride-ui. Actual frontend preview: http://localhost:8081/ride. The parent application's source and backend P0.3 work have not been edited or integrated by this task.

## Exact implementation changes

- src/components/ride/RideHomeGreeting.tsx: use /brand/cruize-search-car.webp in the existing Where to? card.
- src/components/ride/RideTierSelector.tsx: map the existing economy, share and parcel IDs to /brand/cruize-economy-car.webp, /brand/cruize-shared-car.webp and /brand/cruize-parcel-van.webp.
- public/brand/cruize-search-car.webp, cruize-economy-car.webp, cruize-shared-car.webp, cruize-parcel-van.webp: copied byte-for-byte from the user's parent public/brand directory into this isolated public directory. No image editing or regeneration.

All four expected filenames and extensions exist. PIL identified genuine WebP RGBA images with alpha range 0–255. Dimensions: search 664x293, economy 664x330, shared 664x364, parcel 664x377. All four were opened and visually inspected before wiring. No assets are missing.

The existing image slots, object-contain styling, labels, touch-target dimensions, spacing, selection callbacks, tier IDs and pricing calculations remain unchanged. No image filter or red glow was added. No category, map, GPS, driver-presence, destination-search, scheduling, authentication, API or WebSocket logic was edited.

The isolated Vite server serves all four /brand paths with HTTP 200, image/webp content type and byte-for-byte identity to the supplied parent assets.

## Integration artifacts

approved-ride-ui-with-vehicles.patch is a separate consolidated review patch for the eight accumulated UI source files, including the previously approved UI work. It preserves the main files' context line endings and passes plain git apply --check. It does not replace the original historical approved-ride-ui.patch, which still has the previously recorded line-ending issue.

integration-manifest.json now includes RideTierSelector.tsx, for eight source paths total. vehicle-asset-manifest.json records the four supplied asset hashes. The Python integration helper checks both the current parent source baselines and asset availability/identity before any future authorized copy. Check-only execution passed; --apply was not used. The new public assets already exist in the parent project and remain the user's uncommitted changes.

Do not use the old seven-file package script to regenerate the new manifest. Do not apply either patch, copy source back, commit, merge, push or deploy without a later instruction. Existing broader visual-QA findings and live-service HTTP 401 dependencies remain recorded in QA-INTEGRATION-REVIEW.md; this image-only task does not resolve them.

## Verification

- Supported Node v22.23.4 used.
- TypeScript tsc --noEmit -p tsconfig.app.json: passed, exit 0.
- Existing focused regression suite: 5 files, 23 tests passed. DestinationSearchScreen (5), requestRide (8), useNearbyDrivers (1), driverPresence (3), townPricing (6).
- Browser image inspection and production-build outcome are recorded below after their completion.
## Browser result

The first Edge startup attempt timed out at 60 seconds. The retry after the test workers finished completed successfully. qa-vehicles/results.json reports pass: true for image loading and geometry at 360x800, 390x844, 320x568, 375x480 and 430x932. All four images loaded with their expected natural dimensions, stayed inside their existing cards and viewports, used object-fit: contain, and had filter: none. No page-level horizontal overflow or JavaScript page exceptions were recorded in this image check. All image requests returned HTTP 200 or a valid 304 cache response.

Opened and visually inspected iphone-search.png, iphone-tiers.png and narrow-tiers.png. The Cruize sedan, economy car, shared vehicle and parcel van appear in their intended slots without vehicle clipping. The 320px tier panel retains the pre-existing truncated Share/Parcel labels; the image-only update does not change their layout. This remains a broader responsive-label issue and is not counted as a label-readability pass. Existing card touch-target dimensions were retained.

This image verification does not clear the previously recorded greeting contrast issue, live-service HTTP 401s, native GPS/safe-area/keyboard gaps or full UI fidelity findings. No authenticated ride was submitted and no service was mocked.

Screenshot evidence:
- qa-vehicles/iphone-search.png
- qa-vehicles/iphone-tiers.png
- qa-vehicles/narrow-search.png
- qa-vehicles/narrow-tiers.png
- qa-vehicles/android-search.png and android-tiers.png
- qa-vehicles/small-height-search.png and small-height-tiers.png
- qa-vehicles/large-phone-search.png and large-phone-tiers.png

## Production build result

Production build passed after transforming 4512 modules. The build used the existing production configuration with sourcemap: false and reportCompressedSize: false for resource control; no runtime/config source was changed. Warnings were the existing stale Browserslist data, ambiguous Tailwind ease utility, static/dynamic Ride import, and missing Sentry auth token. Sentry reported no release or source-map upload. The build was local only, with no deployment.
