# Cruize Ride P0 implementation tracker

26 October 2026 (Africa/Johannesburg). Bounded P0.1 source changes and integration preparation; no deployment, migration, live database, Redis or payment operation.

## Baseline and preservation

Branch `fix/ecc-sprint-1-accessibility-wallet`; HEAD `31c9ae007b8c5e6f4741139a4b2ed98e693e2184`. Before editing, status matched prior preparation: 39 unstaged files, one staged addition (`AM scripts/verify.mjs`), 19 untracked entries with normal directory grouping, no unmerged paths. Unstaged diff: 1465 additions / 506 deletions. Index: 142 additions in scripts/verify.mjs, blob `2096bd1626940f7402bd7211e5cba47d47251512`.

Pre-existing edits include business driver-field protections/canonical columns, GPS validation/persistence, terminal room revocation, cross-node revocation, frontend availability/freshness, wallet/accessibility and Android changes. They are the starting point, not this patch's accomplishments. No reset, clean, stash, checkout, commit or push was performed. Historical migrations, Redis configuration, GPS modules and frontend source remain outside this patch.

## Dependency boundaries established before implementation

The [integration matrix](CRUIZE-RIDE-INTEGRATION-MATRIX.md) covers booking, bidding, assignment, identity, location, realtime, recovery, payments, risk, administration, mobile and operations. Safe first group: owner rejection, separate withdrawal, terminal cancellation, canonical driver effects and focused tests. It needs no new schema/status, tariff or infrastructure. Acceptance parity, proposal revisions, reservations and outbox share future database ownership and remain gated.

## Implemented behavior

| Area | Change | Compatibility / limit |
|---|---|---|
| Rider rejection | Owner can close pending offer on pending ride; association checked under ride-first then offer locks; guarded update commits before success. | Both reject URLs and message/offer_id/status remain. Repeated/terminal closure returns 409. |
| Driver withdrawal | Explicit POST /api/rides/:rideId/offers/:offerId/withdraw; legacy driver calls to reject adapt to withdrawal. | Stored status remains rejected; additive operation identifies reject/withdraw. No unsupported withdrawn status introduced. |
| Availability | Bid closure never releases global availability. | Pending bid does not own an assignment. |
| Business cancellation | Conditional rider/admin update permits known nonterminal pending/scheduled/accepted/arrived/in_progress; terminal/unknown/repeated update is 409 INVALID_STATE. | Ride-status route retains pending/accepted/arrived/in_progress. Product policy is not silently unified. |
| Fee authority | Existing stored fee preserved; no unverified fee rows inserted. Nonzero client fee returns 400 CANCELLATION_FEE_SERVER_OWNED. | Field accepted at zero/omitted. Existing client nonzero estimate now fails explicitly; server fee quote/policy is unresolved. Reason remains accepted but not durably audited here. |
| Driver identity | Cancellation resolves rides.driver_id -> drivers.id -> drivers.user_id separately from actor. | Correct assigned auth identity reaches notifications/reputation/availability; unassigned ride has no driver effects. |
| Lifecycle | Business cancellation invokes existing lifecycle/revocation callback after commit; denied/repeated transitions emit no effects. | Post-commit crash gap remains; no outbox/receipt guarantee. |
| Other active ride | Availability projection checks for other active assignment and fails conservatively on lookup error. | Projection check is not atomic assignment authority; P0.3 reservation remains required. |
| Future boundaries | Dependency-free event/broker, exact-money settlement and GPS epoch/freshness contracts with semantic tests. | internal/contracts is unwired. No broker, analytics service or ledger runtime installed. |

Existing browser/RPC mutation fallbacks remain a release blocker. No fallback downgrade was added. Direct acceptance, RPC eligibility parity and exact acceptance money are deferred. Existing Go offer acceptance now also locks ride before offer: this minimal dependency prevents a lock inversion with the repaired rejection command. It changes no consent, expiry or assignment-reservation policy.

## Exact patch inventory

Modified tracked paths on top of user changes:

- backend/internal/rides/handler.go: reject adapter, withdrawal route, cancellation identity/effects and compatible offer-acceptance lock order.
- backend/internal/rides/handler_test.go: obsolete driver-only reject tests replaced by contract suite, boolean fake-row support; pre-existing revocation test preserved.
- backend/internal/business/handler.go: guards, fee authority, commit callback and narrow transaction test seam.
- backend/cmd/server/main.go: wire business cancellation callback.

New source/tests:

- backend/internal/rides/offer_commands.go
- backend/internal/rides/offer_commands_test.go
- backend/internal/rides/cancellation_effects.go
- backend/internal/rides/cancellation_effects_test.go
- backend/internal/business/cancellation_test.go
- backend/internal/business/cancellation_postgres_test.go
- backend/internal/contracts/contracts.go
- backend/internal/contracts/contracts_test.go

New documents: [architecture](CRUIZE-RIDE-FULL-STACK-ARCHITECTURE.md), [matrix](CRUIZE-RIDE-INTEGRATION-MATRIX.md), this tracker, [contracts](CRUIZE-RIDE-EVENT-AND-API-CONTRACTS.md), [gates](CRUIZE-RIDE-PRODUCTION-READINESS-GATES.md).

## Validation

Installed Go: 1.26.5 windows/amd64; module requires 1.26.3. Runs use GOTOOLCHAIN=local and GOPROXY=off (no installation). Initial consolidated run failed during setup: default Go cache access denied. Temporary-cache retry reached the tests. The first compile caught missing context arguments in new test doubles; those were corrected, and the final rides package passed on a standalone rerun. Package outcomes are recorded below.

Node v24.22.1 does not satisfy package >=20 <24 or AGENTS Node20/22 test requirement. No frontend source changed; frontend tests not run. Docker CLI exists but daemon connection failed. No PostgreSQL or Redis infrastructure was started, and no production endpoints were used.

Mocks validate route/state/transaction/effect behavior, not PostgreSQL concurrency. Opt-in PostgreSQL tests use actual cancellation transactions, simultaneous duplicate cancellation, completion/cancellation and fee immutability. They require explicit loopback CRUIZE_P01_TEST_DSN and exact disposable database cruize_p01_test; absent DSN means skipped, not proven. Local fixtures do not verify deployed schema, RLS or provider behavior.

## Next groups and decisions

- P0.2: independent owner for room/location canonical identity, continued session/eligibility checks and recoverable revocation. Requires real schema and two-gateway tests.
- P0.3: one database owner for acceptance authority, consistent locks and driver reservations; verify actual staging RPC/grants/triggers and duplicate rows before DDL.
- P0.4: proposals/mobile UX can use contract fixtures while writes stay disabled; depends on P0.3 ownership and consent/expiry policy.
- P0.5: broker-independent worker/reconnect work can proceed, but receipts/outbox schema must coordinate with P0.3/P0.4.
- Payments/risk/analytics/infra: independently review adapters/fixtures and measured needs; no credentials, money or infrastructure rollout.

GO for bounded P0.1 review and scoped P0.2 development with tests. NO-GO for acceptance/schema expansion, invented fee policy, broad frontend rewrites or production deployment. Applied schema, continuing realtime authorization, durable recovery and settlement correctness remain blockers.
## Verified package results

| Check | Actual result |
|---|---|
| internal/rides | PASS, 14.116s; includes repaired rejection/withdrawal routes, state/identity/repeat-effect matrix and shared ride-first acceptance lock test. |
| internal/business | PASS, 13.925s; three opt-in PostgreSQL cases explicitly SKIPPED without disposable DSN. |
| internal/websocket | PASS, 16.761s; existing auth, local/cross-node fake-PubSub revocation and replay tests preserved. This is not real Redis evidence. |
| internal/contracts | PASS, 2.871s; unwired event envelope bounds/identity and GPS freshness/epoch ordering. |
| cmd/server | PASS, 5.646s, including server configuration regressions; no HTTP server was started. |
| git diff --check | PASS; only existing line-ending conversion warnings. |
| Frontend | Not run: installed Node24 incompatible; no frontend source changes. |
| Actual PostgreSQL/Redis races | Not run: Docker daemon unavailable, no disposable DSN supplied. |

Invocation from backend used `go test -v -timeout 90s -p 1 ./internal/rides ./internal/business ./internal/websocket ./internal/contracts ./cmd/server` with local Go, GOPROXY/GOSUMDB off, temporary GOCACHE and CRUIZE_P01_TEST_DSN explicitly empty. The initial multi-package invocation recorded the now-corrected rides test compile failure; its other package results and the successful final rides rerun are distinguished above. No successful production, migration, ledger, load or real service integration test is claimed.

Final Git review retained HEAD and the staged scripts/verify.mjs blob above. Status contains 40 unstaged paths and 31 normally grouped untracked entries (71 total rows including the AM file). The additional tracked path is main.go; this patch adds eight source/test files and five documents. All original dirty paths remain present. Source line anchors in architecture inspection tables refer to the captured pre-edit baseline; the exact incremental file inventory above identifies the new implementation.

Final server check completed with exit 0 using `go test -x -timeout 90s -p 1 ./cmd/server`. The successful final rides rerun used `go test -v -timeout 90s -p 1 ./internal/rides` (exit 0). Business, WebSocket and contracts packages passed in the earlier multi-package run; all five final package checks therefore have successful evidence, while the initial combined command's corrected test-signature compile failure is retained above. No source changes followed these passing results.

A separate read-only review found no additional actionable regression within the bounded offer/cancellation/identity/lock-order patch. The projection-versus-reservation distinction and all production gates remain open as documented. No new infrastructure was installed, no server process launched and no deployment performed.
## P0.2 bounded implementation (26 October 2026)

### Preserved starting baseline

Branch fix/ecc-sprint-1-accessibility-wallet, HEAD 31c9ae007b8c5e6f4741139a4b2ed98e693e2184. Start: 40 unstaged tracked paths, one staged path (AM scripts/verify.mjs), 31 normally grouped untracked entries. The staged scripts/verify.mjs blob is 2096bd1626940f7402bd7211e5cba47d47251512 (142 staged lines). These counts include existing P0.1 and unrelated user changes. No reset, clean, stash, commit or push was used. Earlier P0.1 rejection/withdrawal, cancellation guards/fees/canonical identities, revocation callback and ride-first locks remain intact; their focused suites were rerun.

### Exact incremental P0.2 file inventory

Changed existing paths (these may already contain unrelated user/P0.1 work, which is retained):

- backend/cmd/server/main.go
- backend/internal/auth/supabase_jwt.go
- backend/internal/drivers/handler.go
- backend/internal/drivers/types.go
- backend/internal/rides/handler.go
- backend/internal/websocket/auth.go
- backend/internal/websocket/authorizer.go
- backend/internal/websocket/handler.go
- backend/internal/websocket/manager.go
- src/hooks/useDriverTracking.ts
- src/hooks/useRideRealtime.ts
- src/lib/backendSocketClient.ts
- src/pages/LiveTrackingPage.tsx
- src/pages/RideMatching.tsx
- src/test/apiCalls.test.ts

New P0.2 source/test paths:

- backend/internal/rides/snapshot_security_test.go
- backend/internal/websocket/authorizer_postgres_test.go
- backend/internal/websocket/security.go
- backend/internal/websocket/security_test.go
- backend/internal/websocket/session_security_test.go
- src/lib/rideLocationSubscription.ts
- src/test/backendSocketSecurity.test.ts
- src/test/rideLocationSubscription.test.ts

All five existing architecture documents updated: CRUIZE-RIDE-FULL-STACK-ARCHITECTURE.md, CRUIZE-RIDE-INTEGRATION-MATRIX.md, this tracker, CRUIZE-RIDE-EVENT-AND-API-CONTRACTS.md and CRUIZE-RIDE-PRODUCTION-READINESS-GATES.md. They remain untracked from the preceding stage; that status is preserved. No migration, package/lockfile, financial module, deployment or infrastructure configuration is part of this increment.

### Implemented behavior and compatibility

Canonical room authorization resolves driver FK to auth subject and uses rides.user_id for owner identity. Only active permitted states authorize rooms, and pending expiry is checked. Location ingest/delivery binds actual active assignment, sender and recipient room scope. Terminal lifecycle messages have a database-confirmed final-participant exception without reopening membership. GetRide retains driver_id and adds driver_user_id for authenticated participant snapshots. Both acceptance paths notify rider and actual assigned driver after commit, without changing assignment rules.

Verified JWT subject, server-derived role, session_id if present and expiry live in connection state. Missing/expired exp is denied; idle expiry closes the socket. Current driver eligibility and room rights are checked periodically and at delivery, including queued writer delivery. The optional session authorizer is deliberately unwired pending deployed model verification; server session deletion before JWT expiry is not guaranteed.

Revocation preserves local and cross-manager propagation, marks connection tombstones and fences in-flight joins. Reordered revocation cannot be discarded merely because a newer data envelope advanced sequence. Existing data sequence fencing is retained. This conservative rule may close valid membership following a delayed old revoke; it cannot grant access. Missed PubSub revokes are mitigated by database revalidation, not durable replay. Final DB-check-to-write races and bytes in transit remain practical limits.

Browser reconnect uses a fresh token and canonical authenticated API snapshot before room join. Revokes/denials remove room refs and persist across automatic reconnect; late old-socket events and acknowledgements cannot restore them. Snapshot API failures do not trigger weaker reads. Main precise tracking flows share ride-scoped filtering/freshness checks and no longer fall back to raw live_locations. Other Supabase readers/RLS remain unverified. Participant-only tracking changes unauthenticated share-link behavior; a separate sharing capability needs explicit design. The driver tracking hook requires ride scope and fails closed for its old two-argument form; no call sites were found.

Existing ride_offer remains a driver dispatch request. This patch does not broadcast negotiated bids, certify offer RLS, implement immutable negotiations or expiry cleanup, or claim durable snapshot/replay. Existing multiple-offer reads are preserved. P0.3 acceptance/reservations, P0.4 proposals/expiry and P0.5 receipts/outbox/versioned recovery remain dependencies. Kafka/Python/native/Kubernetes boundaries remain unchanged.

### P0.2 validation evidence

Frontend command (isolated official Node v22.23.4):

```text
node node_modules/vitest/vitest.mjs run src/test/backendSocketSecurity.test.ts src/test/rideLocationSubscription.test.ts src/test/apiCalls.test.ts
```

PASS: 3 files, 13 tests (socket security 5, scoped location 1, existing API helpers 7), 40.42s. The first run caught pre-existing API fixture drift: missing session.user and authReady bootstrap; only mocks were corrected, without changing application authentication. Initial sandbox startup could not resolve esbuild parent paths; the same mocked tests passed after approved sandbox escalation. No production API/database was used.

Isolated Node executable: C:/Users/MUSAE/AppData/Local/Temp/cruize-p02-node22-5c590de3cb8e46d6a328181d0bbd2143/node-v22.23.4-win-x64/node.exe. Official archive SHA256 cbc74b5e0982c9dbb41525fd8fb5dcd32fbee237863f7829072f4639a1ce5f20 was checked before extraction. Global Node v24.22.1 is unchanged. Typecheck command is node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json; its outcome is recorded below.

Go command from backend, installed Go1.26.5, GOTOOLCHAIN=local, GOPROXY=off, GOSUMDB=off, temporary GOCACHE=cruize-p01-go-cache, both disposable test DSNs explicitly empty:

```text
go test -timeout 90s -p 1 ./internal/websocket ./internal/drivers ./internal/rides ./internal/business ./cmd/server
```

Coverage includes state/identity matrices, driver row versus auth subject, denial/error paths, queued authorization, terminal exception, join/revoke races, fake-PubSub cross-manager/reordered revocation, expiry, suspension/reassignment, additive snapshot compatibility and P0.1 regressions. Package outcomes are recorded below. This is mock/unit evidence, not real Redis/PostgreSQL concurrency or deployed session/RLS verification.

Opt-in PostgreSQL room-policy harness added, requiring loopback CRUIZE_P02_TEST_DSN and exact database cruize_p02_test; fixture DDL runs in a rollback-only random schema. No DSN supplied means skipped. Driver eligibility is stubbed in that harness. Existing P0.1 PostgreSQL races likewise remain skipped. Docker daemon is unavailable, so real PostgreSQL/Redis tests were not run. No durable outbox, load, physical-device, provider/payment or production test is claimed.

### Decision

GO for bounded P0.2 source review. NO-GO for full P0.2 acceptance until deployed schema/session semantics and real two-gateway service tests pass; NO-GO for production. Next work is evidence and session integration under the gates document, with coordinated P0.3/P0.4/P0.5 ownership. No broader business-rule or migration authorization is inferred.

### Final P0.2 package and Git results

| Check | Result |
|---|---|
| internal/websocket | PASS (cached final rerun); preceding uncached run 25.166s includes new cross-manager security and opt-in PostgreSQL harness. |
| internal/drivers | PASS, 13.754s. |
| internal/rides | PASS, 6.228s, including new canonical snapshot tests and P0.1 regressions. |
| internal/business | PASS (cached); P0.1 guarded cancellation regressions preserved. |
| cmd/server | PASS (cached); composition compiles with canonical authorizer wiring. |
| Frontend focused suites | PASS, 13/13 tests under Node22.23.4. |
| git diff --check | PASS; existing LF/CRLF conversion warnings only. |
| PostgreSQL/Redis real services | NOT RUN; no disposable DSN and Docker daemon unavailable. |

The final consolidated Go command exited 0 after all last source changes. HEAD and staged scripts/verify.mjs blob remain exactly as at start. Final status: 47 unstaged tracked paths, one staged path, 39 grouped untracked entries (86 rows including AM). This increment touches 15 existing source/test paths, adds 8 source/test paths and updates the 5 existing architecture documents. The whole Git diff also contains unrelated earlier user and P0.1 changes; it is not a P0.2-only patch. No source change followed the passing focused tests.

Supported-Node typecheck: FAIL (exit 1), solely src/hooks/useNearbyDrivers.ts(112,15), TS2367 comparing UPDATE with DELETE. The file was already dirty at the starting baseline and is untouched by this increment. The same diagnostic occurred under the global runtime. Focused tests pass; a clean project typecheck is not claimed.

## P0.2 completion and integration verification follow-up

Starting branch fix/ecc-sprint-1-accessibility-wallet and HEAD31c9ae007b8c5e6f4741139a4b2ed98e693e2184 retained. Starting status: 47 unstaged tracked paths, one staged path (AM scripts/verify.mjs), 39 grouped untracked entries, 86 rows. Staged blob2096bd1626940f7402bd7211e5cba47d47251512 retained. All existing P0.1/P0.2 and unrelated user work was preserved.

Exact files changed in this increment:

- src/hooks/useNearbyDrivers.ts: remove the unreachable DELETE branch and else wrapper from the pre-existing UPDATE-only subscription; preserve online removal, initial read, coordinate/radius and batching/cleanup behavior. No new unsafe cast/suppression or subscription broadening.
- src/test/useNearbyDrivers.test.ts (new): mocked hook regression for initial/UPDATE/offline behavior and cleanup.
- docs/CRUIZE-RIDE-P02-VERIFICATION-RUNBOOK.md (new): observed environment, exact executed checks, source schema anchors/conflicts, resource-capped disposable setup/cleanup, real Redis acceptance gaps, session/account design and metadata prerequisites.
- docs/CRUIZE-RIDE-FULL-STACK-ARCHITECTURE.md
- docs/CRUIZE-RIDE-INTEGRATION-MATRIX.md
- docs/CRUIZE-RIDE-EVENT-AND-API-CONTRACTS.md
- docs/CRUIZE-RIDE-PRODUCTION-READINESS-GATES.md
- This docs/CRUIZE-RIDE-P0-IMPLEMENTATION-TRACKER.md

| Check | Actual follow-up result |
|---|---|
| TypeScript app typecheck | PASS, exit0, isolated Node22.23.4. Earlier TS2367 blocker closed. |
| Frontend | PASS, seven files/26 tests, 103.17s. Includes socket/location/API, presence/availability/GPS and new nearby hook regression. |
| Go | PASS, six packages (websocket/rides/business/drivers/contracts/cmd/server), consolidated exit0; cache reuse allowed. |
| PostgreSQL | NOT RUN against a real service. Room policy and three cancellation cases explicitly skipped without disposable DSNs. |
| Redis | Fake PubSub tests pass; no real-service/two-gateway suite was executed or claimed. |
| Source schema | Canonical fields/FK/status supported by migrations and committed generated types; conflicting legacy index/RPC/state constraints documented. |
| Applied schema/session/RLS | Unverified; no live metadata or auth rows were queried. |

Exact invocations and isolated runtime path are in the runbook. No dependency/global Node installation was needed. No backend source or migration changed. Docker CLI/Desktop and docker-desktop WSL distro are installed; default engine pipe is missing even outside the sandbox. Native database tools were not on PATH, and no relevant services/listeners were found. Initial read-only escalation review timed out; a single retry succeeded. No service was started on this approximately8GB PC. Future commands are documentation, not executed integration evidence.

Server session/account revocation stays unwired. Provider documentation supports session identity lookup in principle; deployed columns/grants/lifetime policy and account-ban authority are unverified. Existing JWT expiry, driver eligibility, terminal/assignment checks and revocation are preserved. Source inspection also identified an idle blocking-read cancellation path in Redis Subscribe that requires targeted regression before clean-recovery claims. These are explicit blockers, not silently deferred successes.

GO for P0.3 design/source inventory/isolated fixture preparation; NO-GO for P0.3 runtime assignment/acceptance/migrations until verified authority/schema/integration prerequisites. P0.2 completion and production remain NO-GO. P0.4 proposals/expiry and P0.5 receipts/outbox/versioned replay remain open. No production service, infrastructure deployment, financial/assignment rule, commit/push or prior staged work was changed.

Final follow-up Git check: diff --check PASS; HEAD and staged blob unchanged. Final status has 47 unstaged tracked paths, one staged path and 41 grouped untracked entries (88 rows). Only the eight files listed above were changed by this follow-up. Setup commands explicitly bind Docker operations to the local named pipe; no future run is authorized to inherit a remote Docker context accidentally. No source changes followed the passing tests/typecheck.

## Real infrastructure verification and P0.3 preparation attempt

Baseline retained: branch fix/ecc-sprint-1-accessibility-wallet, HEAD31c9ae007b8c5e6f4741139a4b2ed98e693e2184; staged scripts/verify.mjs blob2096bd1626940f7402bd7211e5cba47d47251512. Start:47 unstaged tracked paths,1 staged path,41 grouped untracked entries (88 rows). No reset, clean, stash, commit, push or deployment.

Resource gate:7888 MiB usable physical RAM,1457 MiB free at initial inspection;1283 MiB free during one-worker frontend validation. Free virtual memory3672/3383 MiB. Two isolated Node processes sampled92 MiB working set each; point samples are not peak usage. No Docker/WSL resource allocation was changed. .wslconfig absent; selected Desktop settings identify WSL2 but explicit resource caps were not available. Effective daemon allocation remains unknown.

Docker context is desktop-linux; its inspected local endpoint dockerDesktopLinuxEngine and the default docker_engine pipe are both absent. WSL reports docker-desktop stopped/version2. Read-only local version/ps/volume/info requests failed, so existing containers/volumes could not be inventoried and must not be described as empty. No remote Docker endpoint was contacted. Low RAM plus unavailable engine stops the infrastructure phase; no image/container/volume/service/fixture/migration was created, started, stopped or removed.

Exact changed files in this attempt (documentation only):

- docs/CRUIZE-RIDE-P03-ASSIGNMENT-PREPARATION.md (new): proposed authority/storage/lock protocol and prepared PostgreSQL test matrix, decision gates and explicit coverage gap. These are test specifications, not an implemented or passing assignment suite.
- docs/CRUIZE-RIDE-P02-VERIFICATION-RUNBOOK.md: measured resource/engine evidence, conservative free-RAM guard and verified local-context endpoint resolution; PowerShell-safe cleanup label parsing; real-test blockers.
- docs/CRUIZE-RIDE-PRODUCTION-READINESS-GATES.md: actual verification status and P0.3 prerequisites.
- This docs/CRUIZE-RIDE-P0-IMPLEMENTATION-TRACKER.md.

No application source, existing tests, dependency, migration, global runtime or production configuration changed. P0.1/P0.2 source remains intact. Future Docker example commands were corrected/prepared but were NOT executed.

Validation command from backend: local installed Go1.26.5, GOTOOLCHAIN=local, GOPROXY/GOSUMDB=off, GOMAXPROCS=2, temporary GOCACHE=cruize-p01-go-cache; both disposable DSNs explicitly empty:

```text
go test -count=1 -v -timeout 90s -p 1 ./internal/websocket ./internal/rides ./internal/business ./internal/drivers ./internal/contracts ./cmd/server
```

All six packages PASS, exit0, test-result cache disabled. Real-service PostgreSQL cases explicitly SKIP: TestPostgresCanonicalRoomAuthorization, TestPostgresConcurrentCancellationHasOneCommittedEffect, TestPostgresCompletionRacingCancellationHasOneTerminalWinner and TestPostgresTerminalCancellationPreservesStoredFee. Zero real PostgreSQL tests passed or failed in this attempt. These four do not cover real rider-offer rejection; that additional transaction test remains necessary. Existing rejection/rollback regressions are mocks, not PostgreSQL evidence.

After Go completed, isolated Node22.23.4 ran the existing seven focused frontend files with --max-old-space-size=512, --maxWorkers=1 and --no-file-parallelism: all26 tests PASS,94.02s. Exact file arguments remain in the runbook. Frontend and Go suites did not overlap. Real Redis cross-manager/targeted/reordered/interruption/terminal/reassignment cases remain NOT RUN; fake tests passed without being relabeled. No real writer/socket transport or Redis idle cancellation recovery success is claimed.

Effective fixture schema/index/trigger/grant/RPC evidence is unavailable because no fixture ran. Source mappings and migration/RPC conflicts remain as previously documented. Session/account source and backend privileges require independently authorized nonproduction inspection; no production or staging auth.sessions queries or adapter changes occurred. JWT expiry and driver eligibility remain enforced; immediate logout/general account-ban revocation is not implemented.

P0.3 preparation now specifies atomic reservation ownership, one active assignment, driver-row/auth identity, competing acceptances, both legal accept/cancel serial histories, deterministic locks, exact terms, rollback/uncertain commit, Redis-lock failure and scoped receipt/idempotency tests. Suspending a driver must not silently free a live reservation. Direct-vs-negotiated consent, effective writer/RPC/grant authority and coordinated P0.4/P0.5 storage are unresolved prerequisites.

P0.2 completion:NO-GO. P0.3 implementation/assignment migrations:NO-GO; design and isolated test preparation:GO only. Production:NO-GO. Safe next action is to free sufficient host RAM and verify the local engine/resource allocation without modifying existing services/settings; only then may disposable fixture commands proceed. No task-created infrastructure needs cleanup.

Final resource-limited validation note: an additional app typecheck rerun using isolated Node22 with --max-old-space-size=512 exited1 after V8 exhausted that heap cap (approximately508 MiB live heap at final GC). No TypeScript diagnostic was emitted; this rerun did not complete and is not a PASS. The preceding stage's normal Node22 typecheck passed and application source is unchanged, but no new typecheck success is claimed. The heap cap was not raised on this low-headroom PC. Go six-package and frontend26-test PASS results above are independent completed checks.

Final baseline review: HEAD31c9ae007b8c5e6f4741139a4b2ed98e693e2184 and staged scripts/verify.mjs blob2096bd1626940f7402bd7211e5cba47d47251512 are unchanged. Status:47 unstaged tracked paths,1 staged path,42 grouped untracked entries,89 rows. The one new grouped entry is the P0.3 preparation document. git diff --check passed. No application source changes, executable test additions, migrations or infrastructure cleanup occurred in this attempt.

## 27 October: P0.3 source preparation and infrastructure alternative

Starting baseline: branch fix/ecc-sprint-1-accessibility-wallet, HEAD31c9ae007b8c5e6f4741139a4b2ed98e693e2184; staged scripts/verify.mjs blob2096bd1626940f7402bd7211e5cba47d47251512;47 unstaged tracked paths,1 staged path,42 grouped untracked entries (89 rows). Existing P0.1/P0.2 and unrelated changes were preserved. No reset/stash/clean/commit/push/deploy.

Local bounded discovery measured7888 MiB usable RAM and1041 MiB free. No native PostgreSQL, pg_ctl/psql/pg_config, Redis or Memurai executable/service, matching installation directory or inspected database-port listener was found in the searched locations. WSL lists docker-desktop stopped/version2. No Docker Desktop start/restart, native server installation, settings change, paid resource creation, remote connection or production service operation occurred. The initial read-only approval review timed out; the one retry succeeded. Typecheck/heap increase is deferred because RAM is insufficient; historical normal Node22 typecheck and26-test frontend PASS remain prior results, not newly executed checks.

### Exact incremental file inventory

New test-only Go source:

- backend/internal/assignmenttest/assignment_postgres_test.go: ten scenario groups/eleven integration leaf cases, guarded disposable destination identity and one destination-guard unit test. No server import, runtime authority or alternative SQL implementation. candidateFixture is intentionally unset pending the actual shared-authority adapter.

New review artifacts/document:

- docs/p03-drafts/assignment-contracts.go.txt: typed Commands/UnitOfWork/Tx contract for all six requested operations; not compiled/wired.
- docs/p03-drafts/assignment-storage.sql.txt: accepted agreement/reservation/receipt draft, unconditional abort and final rollback, outside migrations; no execution.
- docs/CRUIZE-RIDE-INTEGRATION-INFRASTRUCTURE.md: one reusable isolated Linux-host recommendation, requirements/cost references, native/remote alternatives, extensions/provider compatibility and production-isolation procedure.

Updated existing documents:

- docs/CRUIZE-RIDE-P03-ASSIGNMENT-PREPARATION.md
- docs/CRUIZE-RIDE-FULL-STACK-ARCHITECTURE.md
- docs/CRUIZE-RIDE-INTEGRATION-MATRIX.md
- docs/CRUIZE-RIDE-EVENT-AND-API-CONTRACTS.md
- docs/CRUIZE-RIDE-PRODUCTION-READINESS-GATES.md
- This docs/CRUIZE-RIDE-P0-IMPLEMENTATION-TRACKER.md.

Only one test-only source file was added. Existing Go handlers/dispatch/Redis/frontend behavior, production mutation paths, server wiring, package/lockfiles and migration directories were not changed. The whole existing Git diff includes earlier user work and is not this increment's patch.

### Prepared authority and integration boundaries

Six operations: ReserveDriver/ReleaseDriverReservation/RejectConflictingAssignment are internal Tx operations; AcceptOfferAndAssignDriver/CancelAssignedRide/CompleteAndReleaseDriver are authenticated application commands. One authority across Go/retained RPC remains mandatory. Common order is receipt -> sorted ride -> existing driver serialization anchor/reservation -> all affected sorted offers -> terms; fresh database time/eligibility/consent are rechecked after waits. Matching tuple release never frees another assignment. Exact amounts use canonical minor units/currency, not float64. Deterministic business denial receipts commit their result; infrastructure errors roll back; unknown commit reconciles the same identity. No event publication inside transaction callbacks; durable intents require shared P0.5 outbox ownership.

Migration artifacts are review drafts only: M0 metadata/duplicates/privacy review -> M1 accepted agreement/reservation/receipt storage -> M2 one writer plus direct-write/RPC enforcement and compatible cutover -> M3 coordinated P0.4 immutable terms/P0.5 versions/outbox. Current effective public schema, policies/grants/triggers, consent/currency/terms and provider-session authority are unverified. No deployment migration was created or applied.

The executable suite calls no mock reference authority. A verified database plus missing candidate adapter is an explicit FAIL; absence of CRUIZE_P03_TEST_DSN is explicit SKIP. Guard requires literal loopback endpoints including fallbacks, exact cruize_p03_test database AND role, and cruize_test_guard.metadata(environment)=p03-disposable-v1 before factory writes. The future factory must call the reviewed actual authority, query physical SQL row counts and observe real waits on independent connections. Redis expiry case requires a verified actual disposable Redis fixture. Ten scenarios cover all requested races/rollback/idempotency/completion/cross-instance cases; accept/cancel has two valid histories.

### Validation and environment decision

The new package compiled; its destination-guard unit test passed and all eleven integration leaf cases skipped explicitly without a test DSN. The parent accept/cancel test container may show PASS when both child cases SKIP; this is not a real integration success. First targeted package run exited0; final post-edit run's package duration5.918s. No real PostgreSQL/Redis or Supabase RLS/session success is claimed.

Final focused command from backend uses local Go1.26.5, GOTOOLCHAIN=local, GOPROXY/GOSUMDB=off, GOMAXPROCS=2, existing temporary GOCACHE=cruize-p01-go-cache and all three disposable DSNs empty:

```text
go test -count=1 -v -timeout 90s -p 1 ./internal/assignmenttest ./internal/websocket ./internal/rides ./internal/business ./internal/drivers ./internal/contracts ./cmd/server
```

Final collected outcomes are recorded below; the combined run was stopped at its bounded wait. No frontend source changed; no fresh frontend suite or typecheck was attempted under1041 MiB headroom. Prior six Go/26 frontend passes retain their earlier provenance. No app change was made to hide memory exhaustion.

Preferred infrastructure is an approved dedicated Linux test host with a minimal isolated PostgreSQL/Redis/test-runner pod, sequential resource-capped jobs, no production credentials/routes and explicit instance/DB/role/marker/channel guards. The infrastructure report contains sizing, official pricing references and approval prerequisites; no host was contacted or provisioned. Plain PostgreSQL cannot replay the full Supabase migration chain or verify provider auth automatically; PostGIS is not needed for the inspected reservation fixtures, while source migrations also reference pg_cron/pg_net and provider schemas/functions.

Unified dependency ownership is maintained in CRUIZE-RIDE-INTEGRATION-MATRIX.md: P0.2 real transport/PG/rejection/session evidence; P0.3 one authority/reservation/consent/migration readiness; P0.4 immutable terms/expiry; P0.5 coordinated receipts/outbox/versions/recovery. Contracts/drafts/test adapter preparation may proceed independently. Activation of P0.3, P0.2 completion and production remain NO-GO.

### Final collected validation and preservation

- New assignmenttest package: compiled, destination-guard unit PASS, all11 integration leaf cases explicitly SKIP; package5.918s in the final post-edit run. No PostgreSQL candidate adapter or real Redis fixture was supplied, and no concurrency success is claimed.
- Existing websocket package: PASS13.202s in that run; its real TestPostgresCanonicalRoomAuthorization explicitly SKIP.
- The combined command was stopped by terminating only its verified task-owned Go PID14680 after644 seconds of wall time. It had not yielded outcomes for rides/business/drivers/contracts/cmd/server. Stop exit was -1, not a passing consolidated command. No test failure was observed; the slow pre-test/build progress cause is unverified. Earlier six-package PASS remains historical evidence, not a fresh result for these remaining five packages. Business PostgreSQL cases were not reached in this run.
- No fresh frontend suite/typecheck; insufficient1041 MiB free RAM and unchanged frontend source. Prior normal Node22/26-test PASS and later512MiB typecheck exhaustion retain their original provenance.
- Additional Valkey/KeyDB/Dragonfly executable/service/directory names were also checked without discovering a usable native server. This remains bounded discovery.
- git diff --check PASS; HEAD and staged scripts/verify.mjs blob unchanged. Final status47 unstaged tracked paths,1 staged path,45 grouped untracked entries (92 rows). New grouped entries are the test-only package, infrastructure report and draft directory. No user path was removed or existing staged content changed.

Collected Go output is in the temporary local log C:/Users/MUSAE/AppData/Local/Temp/cruize-p03-tests-da3d637655b3444488182492a8569964.log. The log and package OK lines must be interpreted with the explicit SKIP/partial-run caveats above. No migrations or production operations were executed. P0.3 activation and production remain NO-GO; prepared artifacts are available for review and a future approved isolated runner.

## 2026-10-28 P0.3 integration test readiness

### Preserved baseline and patch boundaries

Branch `fix/ecc-sprint-1-accessibility-wallet`, HEAD `31c9ae007b8c5e6f4741139a4b2ed98e693e2184`. The staged `scripts/verify.mjs` blob remains `2096bd1626940f7402bd7211e5cba47d47251512`; its unstaged edits and all other existing work were preserved. Baseline47 unstaged tracked paths/one staged path were not reset, cleaned, stashed, committed or overwritten. Existing handlers, frontend, module/lockfiles, deployment wiring, public SQL/RPCs and active migration directories were not changed by this increment. No production endpoint or live service was accessed.

Exact incremental file scope (these preparation artifacts were already untracked except the newly added files, so normal git diff --stat does not inventory their contents):

- Updated backend/internal/assignmenttest/assignment_postgres_test.go.
- Added backend/internal/assignmenttest/postgres_fixture_test.go and schema.sql.
- Added nonproduction/p03/.gitignore, compose.yaml, bootstrap-postgres.sh, bootstrap-redis.sh, runner.sh, Dockerfile, source-manifest.txt, lab.sh and README.md.
- Appended current findings to this tracker, CRUIZE-RIDE-INTEGRATION-INFRASTRUCTURE.md, CRUIZE-RIDE-P03-ASSIGNMENT-PREPARATION.md and CRUIZE-RIDE-PRODUCTION-READINESS-GATES.md.

### Physical storage and infrastructure changes

The command adapter no longer owns setup, state snapshots, driver locks, expiry changes or schema cleanup. The harness itself creates a random test schema/seed, observes physical PostgreSQL rows in one read-only repeatable-read transaction, checks identity/terms/agreement/receipt/reservation consistency and drops only its owned schema with an independent cleanup deadline. Candidate factory remains deliberately nil: verified DB plus no reviewed shared authority is explicit FAIL/BLOCKED. A missing DSN explicitly skips real cases. No parallel SQL/model assignment authority was invented to get a green suite.

Guard requires literal loopback including fallbacks, exact database and role cruize_p03_test before connecting, a64hex per-run token, current/session role equality, nonprivileged role, static environment marker and matching admin-owned per-run marker before fixture writes. It does not load application .env. New storage smoke tests actual PostgreSQL23505 uniqueness and rollback, independently of command wiring. Additional physical command assertions check terminal cancellation, no rollback offer/agreement residue, committed receipt identity and historical agreement retention on driver reuse.

The concrete Linux lab is documented at nonproduction/p03/README.md. Host2 vCPU/4 GiB, sequential compilation/test jobs, runtime caps PG0.50CPU/512 MiB, Redis0.25CPU/96 MiB, runner1.25CPU/2 GiB. PG network none; Redis/runner share only loopback, no published ports. SSH is the control connection; no public DB port or arbitrary tunnel. Root-owned host marker, explicit acknowledgement, reviewed image digests, private state/per-run credentials, source-only compilation and label-checked cleanup are mandatory. Build-time public dependency downloads are separate from isolated runtime and receive no secrets. Reset uses new state/token/credentials and task-container removal, not blanket schema/public resets. No cloud resource, native server or container was provisioned, installed or started.

Pricing example to reconfirm before approval: DigitalOcean2 vCPU/4 GiB/80 GiB $0.03571/h or $24/month;40 hours about $1.43 compute, excluding tax/options/extra usage. Confirm regional SKU, transfer/egress, IPv4, storage/backups/snapshots and billing terms using the official pricing link in the lab README. This is not an approved purchase. Plain PostgreSQL fixture16 needs no PostGIS SQL; full Supabase history includes provider auth/storage/pg_cron/pg_net and requires a separate verified provider-compatible environment.

### Case-level evidence

| Test or check | Status | Evidence/limit |
|---|---|---|
| TestDestinationGuard | PASS | Initial focused package run; offline destination parsing only |
| TestSnapshotRejectsBrokenInvariants | PASS | Initial focused package run; offline oracle unit only |
| TestTwoRidersOneDriver | SKIPPED / BLOCKED | No DSN; reviewed authority adapter also absent |
| TestTwoOffersOneRide | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestAcceptanceVersusCancellation/accept_then_cancel | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestAcceptanceVersusCancellation/cancel_before_accept | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestAcceptanceVersusExpiry | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestSuspensionDuringAssignment | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestRedisDispatchLeaseExpiry | SKIPPED / BLOCKED | No DSN; command adapter and guarded real Redis fixture absent |
| TestTransactionRollback | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestDuplicateIdempotencyKeys | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestCompletionReleasesDriver | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestConflictingCrossInstanceRequests | SKIPPED / BLOCKED | No DSN; adapter absent |
| TestPostgresFixtureStorage | SKIPPED | No DSN; independent physical smoke can run once host approved/verified |
| Four shell scripts individually bash -n | PASS | Static syntax only, no Docker/Linux runtime verification |
| Compose YAML/limits/namespace/no-ports and LF file checks | PASS | Parsed using isolated Node22/js-yaml; no services started |
| Controller invocation on this Windows host | PASS (expected refusal) | Fails closed with Linux-host-required before Docker/services |
| git diff --check | PASS | Existing tracked working tree whitespace check; untracked artifacts separately parsed/formatted |
| Linux Engine/Compose caps/network/grants/initdb/cleanup | BLOCKED | No approved verified host; no runtime evidence |
| Effective Supabase schema/RPC/grants/session/RLS parity | BLOCKED | No live/provider metadata accessed |

Initial focused package exit0, package duration3.665s, two offline test functions PASS and12 integration leaves SKIP (11 commands plus storage smoke). The cancellation parent may report PASS while both children SKIP; do not count it as integration success. Early gofmt found a generated separator syntax error, corrected before the successful package run. A later Node -e invocation failed due to PowerShell argument quoting; rerunning the same static checks through stdin passed. These corrected tooling errors are not hidden test successes. Final post-assertion Go rerun is recorded in the following addendum when collected; the earlier pass does not certify edits made afterward. No broad Go/frontend builds were attempted in this increment; historical P0.1/P0.2 results retain their earlier provenance.

### Open authority/schema conflicts and decisions

Canonical rides.user_id/status and rides.driver_id -> drivers.id differ from legacy rider_id/ride_status indexes; offers.driver_id is drivers.user_id auth subject. Current Go negotiated path still scans NUMERIC as float64 and locks ride then offer without a shared driver reservation; direct acceptance and retained RPC remain separate writers with approval/expiry/consent differences. Effective deployed grants/functions/triggers are unknown. Draft tables/offer expiry, immutable revisions, currency/exponents, deletion/history and duplicate remediation require review. Reservation uniqueness alone cannot protect against a legacy accepted-ride writer. See exact source line references and the receipt -> ride -> driver -> sorted offers lock contract in the updated assignment preparation document.

Prerequisites: approve/identify a truly nonproduction host; pin images and verify actual versions/limits/network/role/marker rejection; pass independent storage smoke/cleanup; choose and implement the single authority and candidate adapter; add guarded actual Redis lease fixture and physical blocking observation; reconcile every writer/RPC and all state transitions; agree consent/exact terms/P0.5 receipt-event ownership; review effective provider schema and migration sequence outside active migration directories.

GO for artifact review/preparation. Conditional GO for storage-only execution after explicit host/service approval and verification. NO-GO for full11 command execution now, P0.3 activation and production. Preparation does not claim the user's requested real-environment concurrency proof has been completed.

### Final post-edit validation collected

Final focused command from backend, Go1.26.5/local toolchain, GOMAXPROCS2, GOPROXY/GOSUMDB off, existing temporary cruize-p01-go-cache and no P03 DSN/token:

```text
go test -buildvcs=false -count=1 -v -timeout 45s -p 1 ./internal/assignmenttest
```

Exit0; package16.417s after a slow compilation/link phase. Both offline checks PASS on the final source; all12 integration leaves SKIP (11 command cases plus storage smoke). No real database, concurrency, Redis or provider success is asserted. No process was killed or broader build launched. Four scripts parse individually; Compose/limits/namespace/no-public-ports/LF checks PASS through Node22 stdin; Windows controller refusal PASS. HEAD and staged index blob match the baseline; git diff --check PASS. Full11 execution, activation and production decisions remain NO-GO for the prerequisites above.

## 2026-10-28 P0.3 execution sprint disposition

The execution sprint was advanced through all independently safe stages. Infrastructure remains unavailable on this Windows workstation: no approved Linux host, Docker Engine, PostgreSQL or Redis endpoint was identified or started. The `nonproduction/p03` controller fails closed before Docker on this host. No cloud spending, production connection, migration or deployment occurred.

The production assignment adapter was deliberately not wired because the repository still lacks verified effective assignment storage, grants and writer ownership. Current Go acceptance at `backend/internal/rides/handler.go:1295` locks a ride and offer, scans price as `float64` at `:1337`, resolves a driver and updates rides/offers without a durable reservation or shared receipt. The retained `accept_ride_offer` RPC in `supabase/migrations/20260823120000_lock_down_rides_writes.sql:136` is a separate writer with different approval/expiry semantics. The only accepted-agreement/reservation/receipt DDL is guarded draft/test SQL. Implementing a production adapter against those unverified names would violate the sprint restriction against inventing deployed schema and could create a third conflicting writer.

Safe implementation completed in the prior preparation increment remains available: physical PostgreSQL fixture setup and snapshots, owner-checked random-schema cleanup, SQL uniqueness/rollback smoke coverage, fail-closed DSN/role/run-marker guards, resource-capped nonproduction lab scripts and exact command-test boundaries. No runtime handler or active migration was changed in this sprint.

The eleven command cases therefore remain BLOCKED/SKIPPED until all of these prerequisites exist: verified disposable PostgreSQL target and metadata, reviewed assignment migration/grants, one selected authority, production adapter wired only through that authority, actual Redis lease/coordination fixture, and independent-instance concurrency evidence. P0.3 activation and production remain NO-GO. The focused offline checks remain PASS from the final preparation run; no race result is claimed from the later unreported invocation.

## 2026-10-28 authoritative database contract resolution

Deployed Supabase metadata is UNVERIFIED. No authorized project connection or credential was present, and no live query was executed. A read-only catalog audit was prepared at `docs/p03-drafts/assignment-metadata-readonly.sql.txt`; it runs inside `BEGIN; SET TRANSACTION READ ONLY; ... ROLLBACK;` and returns metadata only. It does not select ride, offer, driver or trip records.

Repository evidence still shows one unresolved writer split: Go `AcceptOffer` in `backend/internal/rides/handler.go:1295` locks a ride and offer, maps offers.driver_id (auth subject) to drivers.id, scans fare through float64, updates the ride and offer statuses, and has no assignment reservation or command receipt. The Supabase `public.accept_ride_offer` RPC source in `supabase/migrations/20260823120000_lock_down_rides_writes.sql:136` is a separate writer with different approval/expiry behavior. Frontend acceptance reaches the existing compatibility path through `src/pages/RideMatching.tsx:591`/offer helpers. Redis dispatch coordination remains advisory and cannot become assignment authority.

Chosen target authority, pending metadata verification: one server-owned Go application command backed by a PostgreSQL transaction, with retained RPC/direct paths reduced to compatibility adapters that call the same command or are revoked after client cutover. PostgreSQL must enforce the accepted agreement, one active reservation per driver, one assignment per ride, exact accepted terms and actor-scoped idempotency. Redis may coordinate dispatch and publish revocations, but it cannot authorize or restore an assignment. This authority has not been wired or activated because its deployed table names, grants, RLS and migration compatibility remain unknown.

Contract decisions supported by repository evidence: `rides.user_id` is the rider auth identity; `rides.driver_id` references the internal driver row; `drivers.user_id` is the driver auth identity; offers are rider-owned through their ride and offers.driver_id is the driver auth subject. Canonical ride states are pending/scheduled/accepted/arrived/in_progress/completed/cancelled/expired; offer states currently include pending/accepted/rejected and later trigger logic permits cancelled/expired. Fare must be represented as server-approved integer minor units plus currency/exponent; the current float64 acceptance scan is a blocker. Acceptance requires rider ownership/consent, pending unexpired offer, pending eligible ride and approved driver after lock waits. Lock order must be deterministic (receipt identity, sorted ride, driver serialization/reservation, sorted offers), with cancellation/start/complete/release using the same compatible order and assignment predicates.

Still policy or metadata dependent: whether scheduled rides may accept, offer expiry column and source of truth, currency registry/exponents, immutable terms revision/fingerprint, cancellation after acceptance, fee/refund ownership, outbox/event schema, RLS/provider session identity, legacy data remediation and exact RPC grants. No migration was added to an active production directory. Required migration sequence remains metadata/duplicate audit -> reviewed storage expand -> one-writer enforcement and compatibility cutover -> immutable terms/versions/outbox; each step requires disposable parity tests before activation.

This pass added only the read-only metadata audit script and preserved all runtime behavior. No production adapter, migration, RPC, grant, Redis authority or handler wiring was changed. P0.3 activation and production remain NO-GO.

## 2026-10-28 isolated authoritative Go command implementation

Added inactive package `backend/internal/assignment` with dependency-injected `Service`, `Store` and `Tx` boundaries. `AcceptOfferAndAssignDriver` performs actor/consent/terms validation, locks receipt -> ride -> offer read -> driver -> offer, rechecks state/eligibility/expiry after waits, creates the agreement and reservation, updates ride/offers, commits an actor-scoped receipt and rolls back on any failure. Typed domain codes cover authentication, authorization, invalid state, driver eligibility/busy, expiry, idempotency conflict, consent and unavailable policy. Exact money is represented as positive integer minor units plus uppercase currency. No handler, RPC, startup wiring, migration or production adapter imports this package.

Added unit tests in `backend/internal/assignment/service_test.go` for deterministic operation order, exact terms, rider authorization, consent, missing expiry policy, idempotency replay/conflict and rollback injection. Focused Go compilation was attempted with local toolchain/cache limits, but the execution wrapper returned no test output or exit status; therefore these tests are recorded as UNVERIFIED, not PASS. No real PostgreSQL/Redis target was available, so integration cases remain SKIPPED/BLOCKED.

The service intentionally fails closed when expiry or immutable terms policy is absent. A future PostgreSQL adapter must implement the Tx methods against the reviewed private schema draft, translate unique reservation conflicts to DRIVER_BUSY, enforce receipt request hashes, and keep the package inactive until migration/client/RPC parity tests pass. P0.3 activation and production remain NO-GO.


## 2026-10-28 Remote verification gate

- Added dormant .github/workflows/p03-verification.yml for Go 1.26.3 module compilation and focused assignment tests with bounded Linux execution and uploaded logs.
- Added
onproduction/p03/REMOTE-VERIFICATION.md describing reviewed-snapshot transfer, DSN safety and evidence gates.
- No workflow was dispatched and no source was uploaded or pushed. PostgreSQL/Redis integration remains SKIPPED pending an approved disposable target. P0.3 and production remain NO-GO.

