Date: 1 November 2026 (Africa/Johannesburg). Status vocabulary: PASS, FAIL, BLOCKED, NOT VERIFIED. Browser fixture evidence is explicitly isolated and mocked; it does not verify live application services. No backend, production data, RLS, ledger, assignment authority or approved CI payload was changed.

# MAP INTEGRATION STATUS

**Real-map integration: NOT VERIFIED. Placeholder removal: BLOCKED until genuine integration is verified.**

The actual map path is LazyMapboxMap -> src/components/MapboxMap.tsx -> mapboxLoader.ts. It loads Mapbox GL JS/CSS, requires a public provider token and creates genuine maps. The fixture deliberately replaces the lazy wrapper with fixture-map.tsx. The fixture's MOCKED MAP / UI ONLY label is retained. No invented vehicle markers were added and no fixture map was presented as genuine.

| Requirement | Status | Source evidence / next proof |
|---|---|---|
| Genuine map tiles | NOT VERIFIED | Mapbox integration exists; no live tiles loaded in this audit. Verify approved provider token, allowed origins, style entitlement and WebGL. |
| Location only with permission | NOT VERIFIED | RideView permission prompt and nativeBridge requestNativeLocationPermission exist. Browser/native permission paths require real-device tests. |
| Permission denial | NOT VERIFIED | Source sets denied/error state and retains manual selection. Fixture denial state renders, which does not verify OS behavior. |
| Accurate current position | BLOCKED | No actual location permission or GPS data requested. A town/default map center is not a current-position claim. |
| Location loading/error UI | PASS | Source contains loading, denied and unavailable states; fixture rendered denial/manual selection. Real timing/recovery not verified. |
| Pickup/destination search | PASS | Address controls and isolated fixture selection work in browser evidence. Genuine search-service results remain NOT VERIFIED. |
| Actual geocoding results | NOT VERIFIED | geo_osm.ts routes to dev Nominatim proxy / deployed Edge function; cache and other search paths exist. No production/geocoding service called. |
| Route geometry only when available | NOT VERIFIED | RouteData allows null geometry; Mapbox consumes route props. Actual route/marker fidelity needs provider-backed testing. |
| Distance/ETA only from verified routing | FAIL | osrm.ts fallback multiplies Haversine distance and time; getDriverETA returns ETA without the estimate marker. RideView also calculates fallback estimates. Needs honest unavailable/estimated handling before booking is enabled. |
| Last known authorized position | NOT VERIFIED | Source uses state/cache paths, but expiry, revocation and loss-of-permission behavior were not exhaustively tested. Never reuse stale positions as current without provenance. |
| API outage/offline recovery | NOT VERIFIED | Mapbox missing-token/load/WebGL failure UI and retry exist. Tile/style failures and offline/reconnect need explicit tests. |
| No fabricated driver positions | PASS | No synthetic markers added. Fixture driver hook returns no drivers; real hook reads service data. Deployed feed authorization remains NOT VERIFIED. |
| Truthful unavailable-map state | PASS | Real component has missing-token/load-error recovery UI. Fixture remains visibly labelled mocked. Runtime recovery and screen-reader behavior still require testing. |

Required next evidence: approved nonproduction/provider configuration, genuine tiles and attribution on supported hardware, permission granted/denied/revoked tests, search/routing provenance and outage recovery. Do not remove the fixture alias or label merely to make screenshots look real. Reuse the existing component once its boundary is verified; do not supply dummy coordinates, routes or driver markers.
