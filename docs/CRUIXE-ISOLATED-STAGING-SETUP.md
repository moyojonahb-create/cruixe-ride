# Isolated staging setup for the Economy cash milestone

Status: **BLOCKED — no isolated staging verified**. Inspection on 11 November 2026 was read-only. Initial inspection created no resources or accounts; subsequent authorized provisioning progress is recorded below.

## What was verified

- Connected Vercel team `team_cRNzOCgbNp4VukxLDCEzR9yh` lists three projects. Only `cruixe-ride` (`prj_TKm4dDTywggMLB7BiZiJYSEcrJdR`) relates to this repository. The project reports no custom environments (account limit reported as zero).
- Its 79 returned deployment records contain production and ordinary preview targets, with no staging branch/URL match. This does not establish the service isolation of every historical preview.
- The milestone preview is READY at `https://cruixe-ride-2p8vsqcpe-jonah-b-moyos-projects.vercel.app`, deployment `dpl_HaLDmHYDe2WvT9EPFXX2xDB1TqbC`, commit `0b79ce5e62dc7e5dd327224322a3a0120b099c85`. **It is not verified isolated staging:** the build points to the production-labelled Railway backend and the existing Supabase project; backend database mapping is unverified.
- Existing API identity: `https://koloi-ride-with-confidence-production.up.railway.app`; WebSocket identity: `wss://koloi-ride-with-confidence-production.up.railway.app/ws`. These are also the fallback values in `vite.config.ts`.
- Connected Supabase project enumeration returns only `foksbnjtzubsjpeoorvo`, named `Cruize-ride`, region `us-east-1`, project status `ACTIVE_HEALTHY`; database host `db.foksbnjtzubsjpeoorvo.supabase.co`, PostgreSQL `17.6.1.063`. API identity is `https://foksbnjtzubsjpeoorvo.supabase.co`.
- Supabase branch enumeration returns only default `main`, using the same project reference. That branch record reports `MIGRATIONS_FAILED`; this is distinct from the healthy project status and requires investigation before relying on branching. No isolated development branch was returned.
- `supabase/config.toml` contains a different repository project ID, `jidfganntquilvsytslp`. It was not returned by the connected project enumeration and is not evidence of accessible staging.
- No Railway, Expo, or App Store Connect/TestFlight connector was available. A separate backend or TestFlight build therefore could not be independently enumerated here.

## Provisioning prerequisites for an authorized operator

1. **Choose the release surface.** The milestone implementation is the root Vite/React app, with optional Capacitor packaging (`capacitor.config.ts`, app ID `zw.co.pickme`). The separate `apps/mobile` Expo application is a native spike, not the implemented root ride flow. Its bundle ID `zw.co.cruixe.mobile` and EAS project do not establish a suitable TestFlight build. Use a dedicated root-app staging website for Safari testing, or a verified root-app Capacitor iOS staging build for TestFlight testing.

2. **Create an isolated Supabase staging project or a verified separate branch.** Record the new project reference, region, API URL, and database host. It must not be `foksbnjtzubsjpeoorvo` or reuse production Auth, Storage, or application data. Use synthetic fixtures, dedicated test users, and staging buckets. Review the effective schema and migration history, apply the repository's required schema through the approved migration workflow, and verify current grants, RLS, functions, triggers, Storage policies, Realtime subscriptions, and `driver_collected_at`. Do not assume that a successful frontend build proves schema parity. Resolve the existing branch migration failure before choosing branching as the provisioning route.

3. **Deploy an isolated Go backend from the reviewed milestone commit.** Use a separate Railway service/environment or another approved staging host, plus isolated Redis/Asynq resources or namespaces. Record exact HTTPS API and WSS `/ws` origins and deployed commit. Set `APP_ENV=staging`, `READINESS_PROFILE=staging`, `BACKEND_INSTANCE_COUNT=1`, and `DISPATCH_MODE=authoritative`. Configure `DATABASE_URL` with required TLS and the new staging database; configure `SUPABASE_URL` and JWT issuer/validation settings for staging Auth. Configure dependencies required by readiness. Keep payment/notification providers in their approved staging modes so no production messages or payments are sent. Check `/health/live`, `/health/ready`, and dependency readiness without publishing credentials.

4. **Build an isolated root frontend.** A separate Vercel staging project is a clear option when custom environments are unavailable; an explicitly scoped preview configuration is also possible if every service mapping is verified. Set `VITE_GO_BACKEND_URL`, `VITE_WS_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` to staging values before building. Do not rely on defaults: `vite.config.ts` falls back to production services. Configure approved map public credentials and restrict their referrers to the exact staging origin; configure any required native bundle restrictions separately. Set backend `CORS_ALLOW_ORIGINS` to the exact frontend origin. Configure staging Auth Site URL and redirect allowlist for the selected website/native callback flow. Rebuild after changing build-time public variables.

5. **Verify the built artifact's identities.** Inspect the actual browser bundle and runtime network requests to confirm API, WSS, Auth, database project, Storage, and Realtime all resolve to staging. Check browser sign-in and authenticated WebSocket handshake. Confirm the API deployment contains `POST /api/rides/:rideId/confirm-cash`. Preserve the command's existing `COALESCE(driver_collected_at, NOW())` behavior so retries keep the first collection timestamp. Retain the frontend/backend commit IDs and environment mapping together as evidence.

6. **Provision dedicated test accounts through normal staging workflows.** Create a Rider and a separate Driver using controlled test mailbox/phone identities, and complete Auth verification. Register the Driver at `/driver/register` with `vehicle_type=economy` and pending documents. An authorized staging administrator reviews and approves the Driver and its documents through `/admin/drivers/:driverId`. Confirm `drivers.user_id` matches the Driver Auth UUID, keep the distinct `drivers.id`, and approve a `personal_photo` or `selfie_with_id` document belonging to that driver. Verify `can_driver_operate(DriverAuthUUID)` returns true: the checked-in function requires approval plus an unexpired trial or, after trial, driver wallet balance of at least USD 0.50. Use the normal authorized staging trial/wallet setup. Sign in and go online through the app rather than manually setting presence. No account or fixture has been provisioned by this document.

7. **Publish the exact test entrypoint only after verification.** Record the verified staging HTTPS URL. For TestFlight, the operator must identify the root Capacitor app, configure its separate staging service values, build/sign/upload it using the authorized Apple account, and record the actual invitation URL, bundle ID, version/build number, commit, and backend/database mapping. Do not invent an invitation or treat an Expo development build as the completed root app.

## Provisioning progress

After the user selected Tautona Tek, the authorized provisioning flow quoted $0 monthly and created `cruixe-staging` (`sgqqhrrdfyrebqreodfl`), region `us-east-1`, status `ACTIVE_HEALTHY`. API: `https://sgqqhrrdfyrebqreodfl.supabase.co`; database: `db.sgqqhrrdfyrebqreodfl.supabase.co`, PostgreSQL `17.11.0.018`. Backend inspection returned no public tables. No migrations or accounts have been created, and no secrets were retrieved or printed. This establishes a separate resource, not a usable staging ride environment.

Root also created a separate protected Vercel staging project (`prj_F6em9zDGv7TUF0LmbWObgYoyZfkW`), with Node 22, `npm run build:staging`, and SSO protection for all deployments. Preview-only configuration contains the staging marker and new Supabase identity/publishable configuration; API and WSS values are intentionally unset until an isolated backend exists. Production-target environment changes were rejected by automatic approval review; preview-only configuration succeeded. No production environment configuration was changed, and no staging entrypoint is claimed ready.

## Owner-action matrix

No accounts are created until the frontend, backend, Auth and database isolation evidence is verified together. Owner roles below are handover responsibilities, not claims that access has been granted.

| Owner | Required input/access | Action and completion evidence | Current state |
| --- | --- | --- | --- |
| Supabase owner | Chosen organization, provisioning access and any required cost approval | Separate project/branch; record project ref, API and database identities; reconcile clean schema/migrations and verify effective RLS/grants | PARTIAL: isolated `cruixe-staging` project created; schema/policy verification pending |
| Backend hosting owner | Separate hosting service/environment and secret settings | Deploy reviewed Go commit with staging DB/Auth/Redis mapping; retain HTTPS/WSS identity and dependency configuration | BLOCKED: no Railway/other backend hosting access identified |
| Frontend hosting owner | Vercel project scope and staging configuration | Build exact reviewed commit with strict staging guard; provide protected HTTPS entrypoint and environment mapping | PARTIAL: protected project created; API/WSS intentionally unset, so staging build remains blocked |
| Auth operator | Staging Auth settings | Configure exact website/native callbacks; verify sign-in and authenticated WebSocket against staging issuer | NOT RUN |
| QA/release owner | Built artifact and read-only service identities | Inspect bundles and runtime API/WSS/Auth/Storage/Realtime destinations; retain proof that none resolve to production | NOT RUN; prerequisite to accounts |
| Staging administrator | Verified isolated services and secure test credential channel | Create distinct synthetic Rider/Driver; approve Economy vehicle/documents; verify Driver operability and online flow | NOT RUN; no accounts created |
| iOS signing owner | Root Capacitor app, authorized Apple signing/upload access | If TestFlight is chosen, record bundle ID, version/build, exact commit, staging mapping and invitation | NOT RUN; Safari staging remains a separate release surface |
| Physical-device tester | Verified entrypoint, secure account access, XR and second device | Execute full ride evidence matrix in `CRUIXE-ECONOMY-CASH-MILESTONE.md` | NOT RUN |

Backend inspection found 135 repository migrations plus five backend schema files requiring an isolated clean replay/reconciliation. A successful staging readiness response alone is insufficient: `READINESS_PROFILE=staging` can permit disabled Redis/jobs and no-op notifications. Record actual dependency configuration and test the required ride/realtime flow. Staging Auth can use ES256/JWKS validation; do not copy a production JWT secret.

## Credentials and access handover

Enter infrastructure secrets only in the hosting provider's secret settings or the organization's approved secrets manager. Supply Rider/Driver passwords through an approved password-manager item or secure credential channel; OTPs go only to the controlled test mailbox/phone and sign-in flow. Never put passwords, tokens, database connection strings, service-role keys, Apple credentials, or authentication state in this document, chat, commits, screenshots, or public artifacts. Public frontend bundles contain only their intended publishable configuration.

The non-secret handover must include: staging frontend URL or verified TestFlight invitation, app/build identity, frontend and backend commit IDs, API origin, WSS endpoint, Supabase project reference/API URL, database host, test-account labels and Auth UUIDs, Driver row ID, approval/operability evidence, secure credential-item location, and responsible operator.

## Source evidence

- `vite.config.ts`: production fallback API, WSS, and Supabase configuration.
- `docs/deployment/environment.md`, `backend/.env.example`: backend TLS, CORS, readiness, single-instance, dependency, and dispatch configuration.
- `backend/cmd/server/main.go`: health endpoints and authenticated ride route registration.
- `backend/internal/rides/cash_confirmation.go`: completed cash ride, assigned-driver authorization, and first-timestamp preservation.
- `src/components/driver/DriverRegistrationWizard.tsx`: pending application/document submission.
- `src/pages/admin/AdminDriverDetail.tsx`: trusted driver/document review actions.
- `backend/internal/drivers/handler.go`: online authorization, operability, and approved selfie/photo checks.
- `supabase/migrations/20260309075136_39a3e984-89cb-435a-afeb-08c9d0e1bbaa.sql`: checked-in `can_driver_operate` rules; effective staging definition remains to be verified.
- `.github/workflows/cd.yml`: a staging job exists, but SSH deployment is conditional on `STAGING_SSH_HOST`; workflow presence alone does not establish a deployed isolated environment.
- `capacitor.config.ts`, `apps/mobile/app.json`, `apps/mobile/eas.json`, `apps/mobile/README.md`: distinct app identities and Expo spike limitations.

This document is a provisioning handover, not a staging pass or permission to modify production.

## Staging build guard verification

The follow-up adds fail-closed staging configuration in `scripts/stagingEnvironment.ts`, invoked by Vite for `--mode staging` or `VITE_APP_ENV=staging`. Explicit API/WSS/Supabase URL and publishable configuration must match separately configured staging host/project allowlists; known production values, invalid protocols, paths, credentials, query/fragment, custom ports, and invalid public-key claims are rejected. This validates declared identities; it cannot establish the actual backend database mapping or authenticate opaque publishable-key project ownership. Those require runtime verification before account creation.

Local verification: 25 validator tests and four real Vite configuration invocation tests passed. The latter verify both staging mode and staging-tagged production mode reject missing or production mapping before module transformation. CI now includes a separate `Staging isolation guard regressions` step. TypeScript passed; lint passed with 0 errors / 280 warnings. A local staging build using fictional API/Auth identities and a dummy publishable key passed; its generated JavaScript contained those fixture identities and neither known production API nor known production Supabase URL. This fixture build proves configuration substitution only, not live staging isolation or working services. Updated exact-commit CI remains pending publication/observation.
