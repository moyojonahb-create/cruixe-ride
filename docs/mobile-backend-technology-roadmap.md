# Cruize Ride — Technology Adoption Roadmap (mobile + backend)
**Owner:** Cruize Ride engineering. **Updated:** 2026-10-22. **Tracking branch:** `release/cruize-v1-20261022`. **Database:** `foksbnjtzubsjpeoorvo`.

This is the persistent checklist. Revisit before each mobile/backend milestone. **Existing code/config does not equal live or tested operation.** Never enable paid APIs or production writes on the basis of this file alone.

## Already found in the codebase — VERIFY, not reinstall
| Capability | Existing evidence | Next acceptance test |
| --- | --- | --- |
| Redis GEOSEARCH | `backend/internal/redis/client.go` supports GEOADD/GEOSEARCH; `backend/internal/geo/service.go` has location/presence expiry and stale-location filtering; fake-store tests exist. | Real Redis integration, expired/disabled/unapproved-driver filtering, GPS spoofing, geo reindexing; verify city/vehicle geo membership removal. |
| PostGIS | Enabled extension on connected Supabase. | Confirm correct spatial indexes and scoped pickup radius searches on real Postgres; test Zimbabwe locations. |
| Asynq / Redis queues | Asynq systemd services, docs and worker code exist. | Start worker+scheduler with isolated Redis and test replay/retry/dead-letter behavior, queue lag, failure alerts. |
| Sentry | React initializes `@sentry/react`, masked Replay, DSN present. | Verify staging event delivery, redaction of driver docs/location, wallet PIN and phone numbers; check SDK performance and consent. |
| Prometheus / Grafana | Compose config, alerts, dashboards and deployment guide exist. | Scrape real Go metrics with private auth, check alarms and Grafana permissions; verify no public metrics exposure. |
| Google Routes | `supabase/functions/google-routes/index.ts` calls Google Routes API. | Confirm maintained API path after Lovable exit, backend-only key, billing quotas, traffic-aware ETA in Zimbabwe, fallback/error handling. Legacy code chooses LONGEST route for fares; audit pricing policy before use. |
| Web Push | `src/lib/push.ts` implements VAPID browser push via Edge Functions. | Not equivalent to native FCM/APNs; verify browser path then implement/test native push for Android/iOS. |

## P0 — must finish before public rides or money
- [ ] Freeze and back up destination; rehearse restore to isolated staging. Owner accepted abandonment of inaccessible Lovable-only records; this does **not** authorize deleting recoverable backups.
- [ ] Reconcile Go V2 `wallet_accounts` and `wallet_ledger_entries` (missing on destination) with legacy `wallets` and `wallet_transactions`; plan financial ledger migration without duplicate balances.
- [ ] Fix direct `authenticated` INSERT/UPDATE on `public.wallets`, including balance; test Go trusted writes and client denied actions in staging.
- [ ] Verify direct ride status/fare/offer/accept mutations are denied or routed via Go backend; real PostgreSQL concurrent acceptance test.
- [ ] Restore/validate migration history: Supabase branch reports `MIGRATIONS_FAILED`; reconcile applied SQL and code before schema changes.
- [ ] Verify backup retention, encrypted access, incident/runbook, logs and operational alerts.
- [ ] Provider sandbox + idempotent payment webhook security before EcoCash/OneMoney/card launch.

## P1 — initial mobile pilot, use the existing foundations
- [ ] Real Redis with TTL/freshness checks, driver online/offline states, push fallback and distributed locks that do not replace SQL correctness.
- [ ] Route/ETA service behind Go endpoint with cache, quotas, predictable fallback and no exposed secret key. Route estimate must not silently authorize user-controlled final fare.
- [ ] Native push through FCM for Android and APNs for iOS (direct or FCM bridge); signed-in token registration, logout cleanup, notification delivery on killed/backgrounded device, duplicate suppression.
- [ ] Sentry crash telemetry + protected Prometheus/Grafana alerts for booking failures, offer queues, Redis downtime, payment rejection and driver location freshness.
- [ ] Realtime connection recovery on mobile with resync after app resumes; battery-efficient driver location with consent and native background permissions.
- [ ] Field tests with low-bandwidth Econet/NetOne, intermittent GPS and real Zimbabwe address formats.

## P2 — add only when pilot evidence supports cost
- [ ] Meilisearch or Typesense for more responsive place search **only if** existing PostgreSQL/OSM search misses latency and relevance targets.
- [ ] ClickHouse or a data warehouse once Postgres reports/aggregates strain transactional performance.
- [ ] ML/AI demand forecasting once high-quality location/demand history exists and privacy retention rules are documented.
- [ ] Multi-replica Go gateway only after WebSocket presence and event routing are safely distributed; current architecture is limited to one backend instance.

## Release gates
Each technology moves through **code present → local tests → staging integration → Zimbabwe field test → production activation → telemetry validation**. No checkmark just for config files or marketing promises.
Maintain an implementation evidence link (test logs/commit/CI), monthly price/quotas and fallback plan for each paid provider.
Do not modify `main`, production DB, active deployment or recurring paid services without explicit approval.
