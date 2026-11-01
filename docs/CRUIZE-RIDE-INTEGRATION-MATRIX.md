# Cruize Ride integration and dependency matrix

Prepared 26 October 2026. All status below describes inspected source or planned contracts; deployed state is unknown. See [architecture](CRUIZE-RIDE-FULL-STACK-ARCHITECTURE.md), [command/event contracts](CRUIZE-RIDE-EVENT-AND-API-CONTRACTS.md), [tracker and validation results](CRUIZE-RIDE-P0-IMPLEMENTATION-TRACKER.md), and [production gates](CRUIZE-RIDE-PRODUCTION-READINESS-GATES.md).

## Integrated ownership and verification

| Producer / consumer | Current integration evidence | Authority and target contract | Dependencies / rollout gate | Meaningful verification |
|---|---|---|---|---|
| Rider create → ride API | `src/lib/rideMatching.ts`, `src/pages/RideMatching.tsx`; `backend/internal/rides/handler.go` | Rider auth owns request; PostgreSQL validates coordinates/service/fare/state; exact amount and currency | Existing API compatibility; request revision and receipt design later | Authorized/outsider, invalid finite/range coordinates, bounded fare, duplicate intent; no weaker mutation fallback after uncertain result |
| Driver bid → negotiated offers | `src/lib/offerHelpers.ts`; rides handler | Eligible authenticated driver; `offers` bind ride and driver auth identity | Immutable proposal/expiry schema gate; vehicle and service eligibility | Wrong ride/driver, expired ride, duplicate bid, stale request revision and acceptance race |
| Rider rejection / driver withdrawal → offer state | rides handler rejection adapters and tests | Distinct commands; ride owner rejects, offer driver withdraws; guard pending ride/offer; never release an unrelated driver | P0.1 source-only repair; preserve existing URL/body shapes and define withdrawal compatibility | Both URL variants, association mismatch, outsider, own driver, terminal ride, nonpending offer, no availability effect |
| Counter → immutable proposal | Current ride counter/fare fields; `offerHelpers.ts` | New immutable proposal, parent/current revision and opposite-party acceptance | P0.4 negotiation reviewed additive schema, coordinated with P0.3 assignment concurrency; no silent reinterpretation of existing fare column | Concurrent counters, stale acceptance, exact money round-trip, expiry after lock wait |
| Accept → assignment | Direct Go and SQL RPC paths; `20260823120000_lock_down_rides_writes.sql` | One atomic accepted agreement/reservation; deterministic locking; no direct negotiated bypass | Product acceptance-mode decision, applied schema/grant inventory, driver reservation constraint | Real PostgreSQL competing offers, same driver/two rides, accept/cancel and accept/expiry; identical HTTP/RPC errors and stored price |
| Cancel → business/ride handlers | `backend/internal/business/handler.go`, `rides/handler.go`; `src/lib/businessApi.ts`, `rideMatching.ts` | Conditional nonterminal transition; server fee; actual assigned-driver identity; postcommit notifications/revocation | P0.1 preserves route-specific nonterminal policy; later unify policy and close direct-write fallback | Terminal state matrix, zero affected row conflict, no duplicate fees/events, distinct caller/driver identity, rollback failure |
| Start/complete → settlement | rides handler; `wallet/settlement.go`, `active_settlement.go:34` | Assigned driver only; completion durable independently of settlement; reservation release in transaction later | Assignment authority, exact accepted fare/currency, active/shadow configuration; current goroutine dispatch is not a durable enqueue | Start from allowed states; cancel/complete race; one settlement after duplicate completion; crash after ride commit and worker recovery |
| GPS → API → PostgreSQL/cache → fanout | `drivers/handler.go`; `geo/service.go:126`; `useDriverTracking.ts`; `driverLocationState.ts` | Authenticated driver/session, ordered samples, freshness/accuracy; authorize before persistence/fanout | Preserve pending GPS changes; location-v2 staging contract is not applied-schema evidence | Stale/out-of-order/session samples, invalid accuracy/coords, fake trip ID, offline/expiry, failed DB write produces no fresh fanout |
| Redis GEO → dispatch candidates | `geo/service.go:188`; `dispatch/geo_provider.go`; `dispatch/service.go` | Redis candidates are hints; PostgreSQL eligibility/assignment rechecked | TTL/disconnect cleanup, service policy, geofence contract | Stale/offline/ineligible/occupied drivers excluded; Redis failure cannot permit duplicate assignment |
| Presence/availability → assignment | `driverPresence.ts`; `driverAvailability.ts`; `drivers/handler.go`; dispatch repository | Availability is derived from fresh eligible presence AND active reservation | Durable reservation and synchronized release later | Presence cannot override busy assignment; cancellation cannot mark unrelated driver free; cross-ride concurrency |
| Committed state → WebSockets | `websocket/manager.go`; `authorizer.go`; `auth.go` | Participant identity and active-state room auth; revocation at terminal/logout/expiry | P0.2 FK/status/lifetime source fixes implemented; applied schema/session and real-service verification open; outbox/replay later | Outsider join, auth ID versus driver row ID, terminal join, token expiration, cross-node revocation, slow queue overflow |
| Reconnect → canonical mobile snapshot | `src/lib/backendSocketClient.ts`; `LiveTrackingPage.tsx` | Snapshot/version/cursor handshake; dedup event IDs; no stale offer/trip reconstruction from hints | Server aggregate version/outbox/replay; client revocation messages and auth refresh | Disconnect across cancellation/assignment, version gap, snapshot/subscription race, replay beyond retention, revoked room not rejoined |
| Payment initiation → provider | `payments/service.go:75`–`:91`; `provider.go:48`; wallet modals | Actor-scoped operation receipt, exact amount/currency, enabled certified provider | Provider configuration/certification, sandbox evidence; no real-money activity here | Altered-key replay, unsupported provider/currency, uncertain provider response, no secret leakage |
| Provider callback → intent/ledger | `payments/service.go:311`; `provider.go:275`; wallet repository | Verified signature/freshness/event identity/reference/status; one credit | Applied ledger/intent schema, independently confirmed provider state | Duplicate/conflicting/replayed callbacks, reference mismatch, amount mismatch, concurrent delivery, crash before/after posting |
| Cash/wallet settlement → ledger | `wallet/settlement.go:66`; `active_settlement.go`; `repository.go:220`; `money.go` | Balanced per-currency immutable entries, idempotent ride reference, server commission policy | Exact ride fare conversion, shadow/active gate, account locks/constraints | Real DB concurrent balance/settlement, rounding edge, duplicate completion, reversal conservation, insufficient funds |
| Provider statement → reconciliation | `wallet/reconciliation.go`; `repository.go:592`, `:647`; reporting/admin modules | Durable statement identity and discrepancy resolution; ledger ≠ provider confirmation | Finance policy, certified adapter, audit and approval rights | Duplicate import, missing settlement, amount/currency mismatch, late statement, reviewed correction |
| Dispute/refund → admin/finance | `business/handler.go:31`, `:67`; `wallet/repository.go:430`, `:503`; `AdminDisputes.tsx` | Participant authorization; scoped admin roles; append-only decision evidence; refund separate financial command | Role/grant audit and maker/checker policy | Foreign ride dispute, forged reporter role, unauthorized refund, duplicate refund and audit attribution |
| Identity/risk → eligibility | `risk/service.go`; `risk/repository.go`; `DriverSelfieCheck.tsx`; `fraudDetection.ts` | Client evidence untrusted; server eligibility/risk decision audited; override explicit | Privacy/retention, identity provider/manual process, administrative permission policy | Forged client risk event, rate abuse, blocked-user override, admin action actor/reason, PII access |
| Geofence admin → booking/dispatch | Geo city/category keys and service/admin configuration; no dedicated active containment contract established | Versioned serviceability decision from coordinates; server authoritative | Polygon model, jurisdiction/service policy and audited admin API | Boundary/hole/invalid polygon, policy switch during bid, unauthorized admin edit, stale cache |
| API/worker → observability | `observability/observability.go`; risk/job metrics; `main.go:47`, `:289`, `:306` | Trace/command/event correlation; redacted structured logs; bounded metric cardinality | Configuration and telemetry destination verified separately | Trace continuity across command/outbox/worker, no secrets/PII, recorded conflict/failure latency, usable alert routing |
| Runtime → readiness/shutdown | `main.go:298`–`:302`, `:334`; readiness package; `backend/Dockerfile` | Liveness independent from readiness; bounded drain/retry ownership | Railway config unknown; dependency/schema checks; resource budgets | Redis/DB down, pool exhaustion, SIGTERM with active mutation/WS/job, restart and backlog recovery |
| Transaction → future analytics | No authoritative ride export pipeline established | Versioned redacted event/export schema, cursor, corrections/deletion policy; read-only consumers | Outbox/version milestone, privacy/data-quality gate | Duplicate export, restart cursor, schema evolution, correction/tombstone, PII exclusion |
| Infrastructure → future orchestration | Dockerfile/compose present; no active app Terraform/Kubernetes/gRPC schema established in inspected inventory | Portable processes and typed ports; no new transactional authority | Measured demand and ownership before adoption | Container build/probes/resource/shutdown; protocol equivalence fixtures when adopting; no production apply here |

## Technology readiness matrix

No "already deployed" classification is asserted without live evidence. This matrix classifies the next engineering need, not a production inventory.

| Technology | Classification | Contract boundary | Gate before introducing runtime |
|---|---|---|---|
| Existing Go/React/Capacitor/PostgreSQL/Redis/WebSockets | Needed in P0; source present | Existing authenticated APIs and canonical database state | Focused regressions, staging schema and security validation |
| Docker | Needed in P0 validation; packaging present | API, worker, scheduler process/env/health/signal contract | Reproducible image build and dependency-loss/drain tests |
| Python forecasting | Architecture/interface readiness only | Redacted exports → versioned, expiring forecasts | Data quality, privacy and benchmarked benefit |
| Kafka-compatible stream | Architecture/interface readiness only | Outbox publisher interface, stable event ID, aggregate key, consumer dedup | Measured throughput/retention/fanout requirement and recovery operations |
| gRPC | Architecture/interface readiness only | Typed ports, actor/deadline/idempotency/error semantics | Independently operated service need; HTTP/protobuf equivalence tests |
| Kubernetes | Not justified currently | Resource/probe/drain/process boundaries | Measured scale/availability benefit and operational capability |
| Terraform | Architecture/interface readiness only | Resource inventory/ownership/secrets-reference contract | Explicit infrastructure authorization and safe state/import/rollback plan |
| Kotlin | Architecture/interface readiness only | Typed Capacitor location/permission plugin | Demonstrated native gap; physical-device background/process-death tests |
| Flutter | Not justified currently | Shared HTTP/event specifications only | Specific evidence current platform cannot meet requirement |
| Analytical storage/pipelines | Later milestone | Cursor-based redacted export, corrections and retention | Workload/volume/SLA measurement and privacy controls |

Contract test obligations here are specified for implementation; no new Python, Kafka, gRPC, cluster, Terraform or mobile rewrite tests are claimed to have executed.

## Safe concurrent implementation groups

| Group and ownership | Can proceed together | Shared contracts and stop boundary |
|---|---|---|
| P0.1 ride handler owner | Rider rejection, driver withdrawal separation, assigned-driver cancellation effects and same-file regressions | Single owner for `rides/handler.go` and its test file. Business cancellation owner must not modify this file concurrently. |
| P0.1 business handler owner | Terminal guards, server-authoritative fee policy enforcement, transactional cancellation tests | Own `business/handler.go` and business tests. Agree notification interface before shared wiring; no schema change. |
| Realtime security owner | Authorization analysis, identity/terminal predicate tests and reconnect contract work | Separate `websocket/*` and socket client ownership. Runtime changes need a reviewed patch; do not alter lifecycle payloads unilaterally. |
| GPS/discovery owner | Freshness/session contract tests, cache expiry and eligible-candidate test planning | Preserve pre-existing driver/GPS edits. Agree driver identity map; avoid overlapping driver handlers with another patch. |
| Financial integrity owner | Exact-money and ledger/reconciliation test coverage; provider fixture review | Separate wallet/payment files; no live credentials/transactions. Agree fare conversion before integrating completion. |
| Mobile contract owner | UI state/command-intent tests, committed-result handling and snapshot reconciliation design | No broad rewrite. Agree authoritative mutation/fallback rules before removing legacy behavior. |
| Operations owner | Redaction/trace metric tests, container build and nonproduction failure/restore plan | Separate observability/readiness files. No infrastructure deployment/apply. |
| Documentation/schema design owner | Command/event fixtures, schema/grant inventory plan, dependency decisions | Review proposal/receipt/reservation/outbox as one migration ownership group; do not independently add overlapping schemas. |

These are boundaries for future authorized groups, not authorization to expand this P0.1 patch. Two owners must not simultaneously modify the same handler, schema or frontend adapter. Changes to shared event/API fixtures require joint review before implementation resumes.

## Milestone dependencies and decisions

1. **P0.1:** bounded source fixes and regression tests. Existing tree preserved; no migrations. Full acceptance authority, durable delivery and financial certification are not outcomes of this patch.
2. **P0.2 realtime security:** canonical participant identity and active-state authorization for ride/location rooms, continued session/eligibility checks, token/logout/terminal revocation and safe reconnect membership. Preserve current GPS work; coordinate freshness/session and background-location tests with the tracking owner. Requires actual schema evidence and two-gateway authorization tests, not a new negotiation schema.
3. **P0.3 assignment concurrency:** one shared acceptance authority, deterministic locks, PostgreSQL driver reservations, exact accepted terms and direct/RPC compatibility. Resolve fixed-fare versus negotiated consent and inventory actual nonproduction schema/grants/triggers before additive DDL. No migration execution without a separate reviewed scope.
4. **P0.4 negotiation:** immutable proposal revisions, counteroffers, `WithdrawDriverOffer`, server expiry, rider/driver UI contracts and exact money/currency. Depends on P0.3 ownership and consent policy; proposal/schema changes must be coordinated with reservations and receipts. Client fixtures can proceed independently while unapproved writes remain disabled.
5. **P0.5 reliable recovery:** actor-scoped receipts, transactional outbox, stable aggregate versions, replay/snapshot reconciliation, duplicate-safe workers and completion-to-settlement recovery. Coordinate schema ownership with P0.3/P0.4. Settlement/provider reconciliation, audited admin/fraud controls and load/failure/restore evidence remain cross-cutting production gates; they are not redefinitions of this milestone.

Milestone names above are planning groups. Read the tracker for actual completed versus pending work and measured test results. **GO** for independently bounded source/test work after owner coordination; **NO-GO** for unapproved migrations, live infrastructure or production deployment. Fake database tests cannot certify transaction races; source presence cannot certify provider settlement or applied RLS.

## P0.2 implementation delta

This table supersedes the earlier P0.2 source-gap statuses; deployment evidence remains unknown.

| Boundary | Implemented | Remaining gate |
|---|---|---|
| Ride room | Canonical owner and driver FK/auth mapping; active-state/expiry policy; opaque denial; reauthorization at join and delivery | Applied schema/grants and actual PostgreSQL verification |
| Location | Current active assignment before ingest/fanout; sender auth match; recipient scope at enqueue/dequeue; shared frontend helper | Other Supabase location readers/RLS, physical-device and load evidence |
| Established connection | Verified JWT expiry timer, current driver eligibility, periodic room checks; optional session port | Deployed session lifecycle/revocation adapter not wired |
| Redis revoke | Existing local/remote revoke retained; sticky per-connection denial, join epoch fence, conservative reordered revokes | Two real gateways with Redis partition/restart tests; fake PubSub is unit evidence |
| Browser reconnect | Fresh token, authenticated snapshot before join, scoped ack, revoked refs removed, old generation ignored; transient API failures retry | Versioned atomic snapshot/replay handshake reserved for P0.5 |
| Bidding | Existing multiple-offer reads preserved; driver dispatch role check; post-commit rider/assigned-driver acceptance notifications | Offer RLS verification, P0.3 acceptance/reservations and P0.4 proposal expiry/negotiation notifications |
| Validation | Focused Go and isolated Node22 suites; opt-in guarded PostgreSQL harness | No real PostgreSQL/Redis execution, native/mobile or production validation |

P0.2 bounded source implementation is ready for review. Full P0.2 acceptance and production deployment remain NO-GO until the session model, applied schema and real-service tests are verified. See the tracker for exact commands/results and gates for acceptance criteria.

## P0.2 verification follow-up status

| Boundary | Verified now | Remaining dependency |
|---|---|---|
| Frontend typecheck | PASS under isolated Node22.23.4; UPDATE-only channel's unreachable DELETE branch removed | Full mobile/background and discovery RLS/privacy evidence |
| Frontend regressions | 26/26 tests in seven files pass, including new nearby-driver offline/coordinate regression | Real provider/transport and physical-device tests |
| Go composition/regressions | Six focused packages pass; earlier P0.1/P0.2 source preserved | Four opt-in PostgreSQL cases skipped; no real Redis suite executed |
| Local database environment | Docker CLI/Desktop and docker-desktop WSL distro present; engine pipe absent; no verified disposable DB listeners/services | Start a resource-capped local engine separately, then run documented disposable fixtures |
| Source schema | Canonical rides.user_id/status, driver FK and auth mapping agree with committed types | Conflicting hot-path index dialect, historical RPC driver mapping and offer CHECK/trigger state drift; verify effective schema/grants |
| Session/account authority | Existing verified JWT expiry and driver-status checks preserved | Applied auth/session/ban metadata and least-privilege adapter unverified; no immediate logout/account-ban guarantee |
| Redis interruption | Fake propagation/reorder tests pass; source recovery limits identified | Production adapter plus two real gateways/sockets; idle-read cancellation, missed revoke, reassignment/queued data, interruption/reconnect |

Exact prerequisites, commands and acceptance cases are in the [verification runbook](CRUIZE-RIDE-P02-VERIFICATION-RUNBOOK.md). P0.3 planning/isolated fixtures can proceed; runtime acceptance/reservation changes and migrations must wait for schema/authority and integration prerequisites. Production remains NO-GO. Kafka/Python/native/Kubernetes boundaries are unchanged.

## Unified engineering dependencies:27 October2026

| Workstream | Safe independent progress / prepared artifact | Dependency before activation / real-service signoff |
|---|---|---|
| Integration infrastructure | Reusable Linux host specification, resource budget, costs and isolation/credential/marker procedure; no provisioning | Approved host/budget and source export; blocked production routes, pinned versions, verified fixture schema and resource measurements |
| P0.2 realtime | Existing scoped auth/expiry/revocation/reconnect preserved; fake tests retained | Real Redis transport/interruption/writer queues, idle subscriber cancellation, four PG cases plus missing rider-rejection transaction case, schema/session/grant evidence |
| P0.3 assignment | Typed ports, guarded storage draft and ten conformance scenario groups in test-only package | Candidate adapter to ONE reviewed authority, actual PG contention, uniqueness/state consistency, consent/exact terms, RPC/client writer parity, data remediation |
| P0.4 negotiation | Immutable term/version/expiry contract and client fixtures can proceed | Approved consent policy, term storage and atomic linkage with P0.3; real expiry-after-lock tests |
| P0.5 receipts/outbox | Shared actor/operation/key/hash and event intent contract prepared | One coordinated schema owner with P0.3/P0.4; atomic durable receipts/outbox, versions/replay, unknown-commit and crash recovery |
| Required migration set | Guarded draft agreements/reservations/receipts under docs, not migrations | M0 applied metadata/duplicates/privacy review -> M1 approved storage -> M2 shared writer/enforcement/cutover -> M3 coordinated terms/outbox/version storage |
| Sessions/account security | Existing JWT expiry/driver status plus optional port retained | Independently authorized provider metadata, correct session/account source and least-privilege adapter; logout/ban/deletion/outage tests; no production auth.sessions access |
| Frontend verification | No app code changed; prior Node22 PASS/26 tests remain historical | Current1041 MiB free RAM precludes safe heap increase/typecheck; use approved adequately sized runner |

Current executable assignment tests intentionally skip without explicit verified DB and fail on a verified DB lacking the reviewed candidate adapter. Destination-guard unit success does not prove assignment integration. Test definitions, source paths, precise semantics and artifact dependencies: [P0.3 preparation](CRUIZE-RIDE-P03-ASSIGNMENT-PREPARATION.md). Infrastructure choice: [environment report](CRUIZE-RIDE-INTEGRATION-INFRASTRUCTURE.md). Preparation can proceed; activation and production remain NO-GO.
