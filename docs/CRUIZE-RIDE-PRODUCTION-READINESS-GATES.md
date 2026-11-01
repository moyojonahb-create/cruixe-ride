# Cruize Ride production readiness gates

26 October 2026 (Africa/Johannesburg). **Production deployment: NO-GO.** Source changes and contracts do not establish live-environment signoff. No production system was queried or changed.

## Release gates

| Gate | Required evidence | Status |
|---|---|---|
| User work | Exact branch/HEAD/index/dirty inventory; incremental review. | Captured in tracker; no destructive Git operations. |
| P0.1 | Owner rejection, association, distinct withdrawal, state guards, repeat effects, identity and revocation. | Implemented; actual validation in tracker. |
| Fee/product policy | Actor-specific cancellation states, authoritative quote/rates, reason audit, mobile estimate compatibility. | Open; nonzero caller fee explicitly rejected. |
| Deployed schema | Authorized staging columns/FKs/CHECKs/triggers/grants/RLS/RPC definitions and applied provenance. | Not inspected. Local migrations are not deployment proof. |
| Acceptance authority | Explicit negotiated consent vs fixed-fare authority; equivalent Go/RPC eligibility/expiry/exact terms; unsafe direct mutations closed. | Open. Existing fallback/direct accept remain blockers. |
| Assignment | PostgreSQL driver/ride active uniqueness, lock order, rollback, existing-data remediation. | Proposed; Redis TTL locks do not prove exclusivity. |
| Realtime | Canonical IDs/active joins, session expiry, suspension/reassignment, recoverable revocation. | P0.2 source mapping/expiry/revocation/reconnect fixes implemented; deployed schema/session and real-service tests remain open. |
| Negotiation | Immutable revisions, current version, server expiry, exact currency and accepted consent snapshot. | Proposed only. |
| Recovery | Receipts/atomic outbox/stable IDs/aggregate version, retry/DLQ and authorized snapshot/replay. | Unwired contracts; post-commit fanout/settlement crash gaps remain. |
| Payments | Provider verification, idempotent posting, balanced per-currency ledger and reconciliation/disputes. | Modules present, commercial end-to-end evidence absent. |
| Mobile | Node20/22 tests, native/background permissions, uncertainty/staleness UX, version compatibility. | React/Capacitor retained; 13 focused frontend tests pass under isolated Node22; typecheck now passes; native validation remains open. |
| Operations | Readiness, resources, observability, backup/restore, shutdown and rollback rehearsals. | Source/config evidence only; deployment/rehearsals unverified. |

## Disposable validation protocol

Use isolated local PostgreSQL/Redis; never reuse application .env, project links or production DSNs. The opt-in cancellation harness requires explicit CRUIZE_P01_TEST_DSN, loopback host (including fallbacks) and database exactly cruize_p01_test. It creates only a random isolated schema, exercises real guarded SQL/transactions and cleans that schema after test connections close. Absent DSN skips tests and leaves concurrency unproven. Do not use public production tables as fixtures.

Docker daemon is unavailable in this session; no infrastructure was installed/started. Use existing disposable infrastructure later. Node20/22 and compatible Go are required. A temporary Go cache avoids denied default-cache access; it changes no application or production configuration.

## Test categories and acceptance

| Category | Required cases |
|---|---|
| Go/API state machine | All ride/offer states, rider/driver/outsider, both reject URLs/withdrawal, malformed inputs, repeated commands, failure/rollback, canonical identities. |
| Frontend | Equivalent outcomes across screens, semantic errors, no auth downgrade, uncertain response -> receipt/snapshot, optimistic rollback. |
| PostgreSQL races | Two offers/ride, two rides/driver, accept/reject, accept/cancel, complete/cancel, expiry after lock wait; one winner/effect; bounded contention. |
| Redis | Two real gateways, duplicates/reordering, disconnect/restart, missed revoke, presence TTL and database recovery. Fake Pub/Sub remains unit evidence. |
| WebSocket security | Participant/outsider, terminal rejoin, expired token, revoked session, suspension/reassignment, slow consumer and revocation. |
| Receipts/outbox | Same key/body replay, changed body conflict, lost response, commit/publish crash, stable retry identity and DLQ recovery. |
| Money/ledger | Fractional values/ranges/exponents, balanced postings, unique external refs, signature/nonce replay, provider timeout, settlement/reconciliation retry. |
| GPS/geofence | Auth binding, finite coordinates/accuracy, freshness, server epoch/sequence, presence expiry, eligibility, geofence versions and denied background permission. |
| Reconnect | Version/retention gap -> authorized snapshot; remove revoked refs; suppress stale offers/GPS; no blind mutation replay. |
| Load/stress | Matching/accept p50/p95/p99, locks/pool saturation, queues/backpressure, GPS write cost, Redis outage. Agree capacity/SLO thresholds from measurements. |
| Failure injection | Deadlock/rollback, pool exhaustion, Redis partition, process termination, provider timeout, delayed/duplicate/reordered events. |
| Security/admin | Immutable identities, server roles, RLS/grants/definer safety, actor/reason audit, secrets/PII redaction and privileged mutation authorization. |

Execute suites appropriate to approved code now. Other categories are explicit future gates, not invented successes. No load/stress, real Redis, payment/provider, outbox, durable-idempotency or native mobile execution is claimed.

## Observability and deployment standards

- Structured Go logs: operation/result/code, request/trace, command/event identity and aggregate version where implemented. Redact credentials/tokens/PII and bound reason input. Do not expose raw SQL errors to clients. Trace command -> SQL -> outbox -> delivery; tracing is not delivery durability.
- Metrics: command/matching/acceptance latency and errors, DB pool/locks/deadlocks/transaction duration, Redis latency/health, socket connections/queues/drops/reconnect/auth denials, outbox lag/retry/DLQ, settlement lag and reconciliation discrepancies. Avoid per-user/ride metric labels.
- Liveness measures process viability; readiness checks required PostgreSQL/schema and critical capabilities with deadlines. Redis failure must not grant stale authorization; explicitly degrade affected functionality. Monitor workers/outbox separately.
- Bound HTTP/SQL deadlines, queues, retries/jitter and shutdown. Drain requests, stop job claims, finish/rollback transactions, close sockets and flush telemetry within Railway termination budget.
- Recovery: encrypted backups/PITR, restore rehearsal, event/settlement reconciliation, credential rotation/privacy retention, agreed RPO/RTO and measured rehearsals.

Railway remains current target. Docker API/worker/scheduler boundaries are source-present; Kubernetes/Terraform/Kafka require measured workload/operational justification. Deferred interfaces and conformance obligations are in the architecture, matrix and event/API contract documents.

## Rollout and rollback

1. Review incremental dirty-tree P0.1 patch and final tests. No automatic commit, push or deployment.
2. Validate disposable races, then authorized staging schema and active mobile/RPC paths. Resolve fee and consent policy before changing public authority.
3. Use reviewed additive migrations for future schemas; verify provenance/data duplicates, index/lock budget and rollback/forward-fix. Do not revoke client writes until every supported client has safe command/cancellation access.
4. Stage compatible adapters before clients. Canary with measured rollback thresholds; never reintroduce writers violating new invariants. Preserve receipt/outbox/ledger data through rollback.
5. Production approval is separate after security/financial/concurrency/recovery gates pass; this document is not approval.

## Next patch

GO for scoped P0.2 canonical room/location identity corrections and continuing-authorization work with tests and independent ownership. P0.3/P0.4/P0.5 share schema ownership and must coordinate before concurrent migrations. NO-GO for expanded acceptance, invented tariffs, technology rewrites or production release while gates remain open.
## P0.2 review and acceptance gates

Source-level identity/state/expiry fixes, connection authorization checks, conservative Redis revocation and browser reconciliation are implemented; the earlier authorizer/location source mismatch is corrected. This is not applied-schema evidence. Relevant frontend tests ran under isolated Node22; native/mobile execution remains unverified. See the tracker for exact results.

**Bounded P0.2 source review: GO. Full P0.2 completion: NO-GO. Production deployment: NO-GO.** Required outstanding evidence:

1. Verify authorized nonproduction rides/drivers schema, eligibility policy, grants/RPC/RLS and canonical identity mappings. The opt-in CRUIZE_P02_TEST_DSN harness permits only loopback hosts and database cruize_p02_test, uses a random transactional fixture schema and rolls back. It was not executed against PostgreSQL. No production DSN may be substituted.
2. Establish the deployed session identity/lifecycle contract and wire the optional session authorizer with revocation and outage tests. Current JWT expiry is enforced, client logout clears scope, and driver suspension is checked; server-side session deletion before JWT expiry is not guaranteed.
3. Run two actual gateways against disposable Redis/PostgreSQL for missed/reordered revocations, partition/restart, reassignment, suspension, queued delivery and token expiry. Fake PubSub propagation tests do not satisfy this gate. Docker daemon was unavailable; no production services were used.
4. Measure database checks at enqueue/dequeue and ten-second watcher under expected GPS/socket load. Validate deadlines, pool exhaustion, slow consumers and authorization failure behavior. Account for already-in-flight bytes and check-to-write races rather than claiming atomic global revocation.
5. Verify bid/request visibility and expiry against deployed offer policies. Preserve P0.1 rejection/cancellation guarantees. P0.3 acceptance/reservations, P0.4 immutable proposal/expiry/consent and P0.5 receipts/outbox/aggregate versions/replay remain open.
6. The useNearbyDrivers.ts typecheck blocker is resolved in the completion follow-up; review participant-only tracking/share-link compatibility and run physical-device/background/reconnect tests. Other raw Supabase consumers and RLS were not secured by replacing these precise-tracking paths.

No migration, deployment, production Redis/database change, financial-policy change, global Node replacement, commit or push was performed. Kafka, Python analytics, native rewrites and Kubernetes adoption remain behind the existing architecture gates.

## Completion verification follow-up

The frontend typecheck gate is now CLOSED: isolated Node22.23.4 typecheck PASS and 26 focused frontend tests PASS. Six focused Go packages PASS, preserving P0.1/P0.2 regressions. New test coverage preserves nearby-driver UPDATE/coordinate/offline behavior. No production backend runtime logic changed in this increment.

Real PostgreSQL and Redis gates remain OPEN. Read-only checks confirm Docker Desktop/CLI and its WSL registration exist but the engine pipe is absent. No verified native database service/listener was found. No engine/service was started and no image installed. Four PostgreSQL tests skipped without DSNs; fake Redis tests remain unit evidence. Resource-capped future setup and exact test commands are in the [verification runbook](CRUIZE-RIDE-P02-VERIFICATION-RUNBOOK.md), together with a real two-gateway acceptance matrix and the unverified idle subscriber cancellation path.

Applied schema/grants/RLS/RPC/session gates remain OPEN. Canonical source identity/status fields agree with generated types, but a conflicting hot-path index dialect, historical offer driver mapping and CHECK/trigger state drift preclude certifying the migration chain. No staging schema or provider session table was queried. Immediate logout/account-ban enforcement remains unimplemented; driver suspension checks and JWT expiry alone do not close that gate.

**P0.2 completion: NO-GO. P0.3 design and isolated test preparation: GO. P0.3 runtime acceptance/reservation changes or migrations: NO-GO until schema/authority and integration prerequisites are verified. Production deployment: NO-GO.** P0.4 proposal/expiry and P0.5 durable recovery remain coordinated dependencies. No commit, push, deployment, production write or global runtime replacement occurred.

## Real-infrastructure attempt: resource/engine gate

The infrastructure phase stopped before any start/create/pull/DDL: only1457 MiB of7888 MiB usable physical RAM was free (1283 MiB during serial frontend tests), and Docker Desktop's actual local Linux-engine pipe plus default pipe were absent. WSL docker-desktop is stopped/version2. Resource caps could not be established; no allocation was changed. Read-only container/volume listing failed, so existing inventory remains unknown and untouched. No task infrastructure exists to clean up. The runbook now validates the actual local named pipe and includes a conservative3 GiB free-RAM task guard; this is an engineering guard, not a vendor minimum.

Six focused Go packages passed with test cache disabled;26 frontend tests passed with one worker/512MiB JS heap, sequentially after Go. Four prepared PostgreSQL tests skipped without disposable DSNs; all real Redis gates remain unexecuted. Those four PostgreSQL cases do not cover actual rider-offer rejection; an additional real handler-transaction rejection/rollback test must be added and run. Fake PubSub and mock SQL remain insufficient.

No effective test schema/RPC or authorized staging provider metadata was available. Existing source migration dialect/driver identity/CHECK conflicts, RLS/grant uncertainty, session/account revocation and idle subscriber cancellation remain blockers. No production query, migration or runtime assignment change was made.

The [P0.3 assignment preparation](CRUIZE-RIDE-P03-ASSIGNMENT-PREPARATION.md) supplies proposed invariants/lock protocol and a concrete acceptance test matrix; it is not an executable authority or passing concurrency suite. Approve mode/consent, exact terms, writer/RPC parity, reservation/receipt ownership and migration remediation only after effective nonproduction metadata and real integration evidence are obtained. P0.2 completion, P0.3 runtime implementation/migrations and production deployment remain NO-GO. P0.3 design/isolated fixture preparation remains GO within existing scope.

Final resource-limited validation note: an additional app typecheck rerun using isolated Node22 with --max-old-space-size=512 exited1 after V8 exhausted that heap cap (approximately508 MiB live heap at final GC). No TypeScript diagnostic was emitted; this rerun did not complete and is not a PASS. The preceding stage's normal Node22 typecheck passed and application source is unchanged, but no new typecheck success is claimed. The heap cap was not raised on this low-headroom PC. Go six-package and frontend26-test PASS results above are independent completed checks.

## 27 October: preparation continues while activation stays gated

No Docker Desktop launch, paid resource, server installation, remote connection or production mutation occurred. Local free physical RAM measured1041 MiB of7888 MiB; native tool/service/listener discovery found no usable test server in inspected locations. Do not raise the TypeScript heap on this evidence. Current frontend validation is deferred, not a new PASS; prior normal Node22/26-test results retain their historical status.

Prepared artifacts now include an isolated PostgreSQL conformance-test package, typed command/repository contract draft and execution-guarded SQL outside migrations. The test candidate factory is deliberately unset; there is no new assignment implementation. Eleven integration leaf cases across ten scenario groups must SKIP without explicit verified DB and must FAIL if a verified DB lacks the actual-authority fixture adapter. No real PG/Redis success is claimed from local guard unit tests or a parent test whose children skip.

P0.3 activation requires one authority across Go/retained RPC, approved effective schema/grants/triggers/RLS and duplicate/deletion-policy remediation, exact accepted terms/consent, atomic reservation/state consistency, committed receipts and coordinated P0.4/P0.5 storage. The guarded draft has no runtime grants, shared mutation primitive or migration approval. The four earlier PG cases and real Redis/security tests remain unexecuted; real rider-offer-rejection coverage and session/account authority are still open.

Preferred recovery is a separately approved dedicated Linux test host with isolated PostgreSQL/Redis/runner networking and no production credentials, detailed in the [infrastructure report](CRUIZE-RIDE-INTEGRATION-INFRASTRUCTURE.md). A full Supabase-compatible parity profile remains a separate resource/schema step. Safe work can continue in contracts/drafts/test adapters, but P0.2 completion, P0.3 activation and production deployment remain NO-GO. See the matrix for one unified dependency tracker and [P0.3 preparation](CRUIZE-RIDE-P03-ASSIGNMENT-PREPARATION.md) for exact patch boundaries.

Validation provenance for this preparation: the new conformance package compiles, its destination-guard unit passes, and11 integration leaf cases SKIP without a DB/adapter. WebSocket regressions passed13.202s with the real room-policy case skipped. The broader Go rerun was stopped after644 seconds without remaining package outcomes (exit-1); no complete seven-package PASS is asserted. Existing six-package/26-frontend-test PASS remains historical. Typecheck was deferred at1041MiB free RAM. No application behavior was changed to work around resources; full real-service acceptance remains gated.

## 2026-10-28 P0.3 test-readiness gate update

| Gate | Current evidence | Decision |
|---|---|---|
| Reviewable nonproduction configuration | CPU/RAM caps, source-only build, pinned-image requirements, SSH-only control, no published DB ports, ephemeral guards/credentials and bounded cleanup prepared under nonproduction/p03 | GO for review only |
| Actual isolated infrastructure | No host provisioned/contacted; no Docker/PG/Redis started; static checks only | BLOCKED; conditional storage-smoke execution after explicit approval and host/runtime verification |
| Physical PostgreSQL fixture smoke | Real SQL setup/snapshot/unique violation/rollback/cleanup implemented; no DSN | SKIPPED, no integration PASS |
| Assignment authority conformance11 leaves | Physical-state oracle implemented; candidate command adapter deliberately unset; real Redis fixture absent | BLOCKED for full execution; locally SKIPPED without DSN |
| Effective Supabase schema/RPC/grants and writer bypass | Source identity/status conflicts retained; applied metadata not inspected | NO-GO |
| P0.3 activation | Shared authority, direct/RPC cutover, immutable terms/consent/currency, all transition lock orders, receipts/event ownership and migration review incomplete | NO-GO |
| Production | P0.2 real-service/session/rejection gaps plus P0.3/P0.4/P0.5 dependencies remain | NO-GO |

Neither offline checks nor a future minimal fixture PASS certifies Supabase auth/RLS/session semantics, all command-state transitions, realtime revocation or production readiness. Preserve previous P0.1/P0.2 results with their original execution provenance. No current handler, migration, deployment wiring or live-service change was made for this readiness increment.
