# Local startup repair — 2026-10-31

The screenshot showed an empty React root and the red HTML backdrop at localhost:8080.

Reproduction: Vite exited during dependency optimization with `Could not resolve ../domain/performance` from `@datadog/browser-rum-react/esm/entries/main.js`. The installed `esm/domain/performance/index.js` appeared in directory listings, but Node could not open it (`UNKNOWN`, errno -4094). Direct overwrite also failed with Windows `Invalid argument`.

Repair: fetched the exact installed npm package `@datadog/browser-rum-react@6.32.0`, preserved the damaged folder at `node_modules/@datadog/browser-rum-react-startup-backup`, and extracted the official archive into a fresh package directory. Package manifests and lockfile were not changed. No runtime application/backend source edits were required. The isolated `nonproduction/approved-ride-ui/vite.config.ts` now sets a local `.vite-cache` directory to prevent optimizer cache collisions: its node_modules is a junction to the parent workspace, so the default cache had been shared by both concurrent servers.

Verification: Node can read the restored file. esbuild successfully bundles the SDK (98,060 bytes). Node 22 Vite starts successfully on port 8080. Edge at 393x852 mounts React and redirects `/` to `/ride`, with no JavaScript exceptions or failed local module responses. The real map, booking home, and normal location-permission prompt render. Guest service responses still include 401 for pricing_settings, town_pricing and live_locations; no policies or fake data were introduced.

Diagnostic tool: `nonproduction/diagnose-startup.mjs`; screenshot: `nonproduction/startup-check.png`. The isolated frontend server on port 8081 was restarted after its former process stopped and uses its own optimizer cache. No commit, merge, push or deployment occurred.

