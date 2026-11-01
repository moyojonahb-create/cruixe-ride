# P0.2 completion verification and disposable test runbook

26 October 2026. This runbook records local evidence and commands for a future disposable run. Docker/SQL commands below were NOT executed. No live project metadata or production credentials were used.

## Verified local environment

- Node22.23.4 isolated executable: C:/Users/MUSAE/AppData/Local/Temp/cruize-p02-node22-5c590de3cb8e46d6a328181d0bbd2143/node-v22.23.4-win-x64/node.exe. Global Node24 unchanged.
- Installed Go1.26.5; module1.26.3; use local toolchain and existing dependencies, temporary cache.
- postgres, pg_ctl, psql and redis-server were not found on PATH; no matching Windows services or listeners on inspected standard/test ports were found. This does not prove no dormant installation exists elsewhere.
- Docker CLI29.9.2 and per-user Docker Desktop launcher exist. With an empty temporary config path, the explicit local daemon check still reports missing docker_engine pipe. A read-only check outside the sandbox confirms WSL has docker-desktop registered. No running verified engine, PostgreSQL or Redis environment is available. The initial automatic approval review timed out; its single read-only retry succeeded. No services were started.
- On an approximately 8 GB PC, prefer the existing Docker installation after its engine/resource settings are verified. Do not install a full local Supabase stack for these narrow tests. Require sufficient free RAM and a reviewed WSL/Docker memory cap; the limits below cap containers, not the entire Docker VM.

## Minimal correction and executed checks

useNearbyDrivers intentionally subscribes to UPDATE. Supabase types correctly narrow eventType to UPDATE, making its old DELETE branch impossible (TS2367). Remove that branch and the else wrapper; retain the UPDATE filter, initial query, online removal, coordinate updates, radius/distance logic, 400ms batching and cleanup. No new production type cast, suppression or type weakening was added. This does not add DELETE notifications or resolve the separate discovery-table RLS/privacy/freshness gates.

```powershell
$node22 = 'C:\Users\MUSAE\AppData\Local\Temp\cruize-p02-node22-5c590de3cb8e46d6a328181d0bbd2143\node-v22.23.4-win-x64\node.exe'
& $node22 node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
& $node22 node_modules/vitest/vitest.mjs run src/test/useNearbyDrivers.test.ts src/test/backendSocketSecurity.test.ts src/test/rideLocationSubscription.test.ts src/test/apiCalls.test.ts src/test/driverPresence.test.ts src/test/driverLocationState.test.ts src/test/driverAvailability.test.ts
```

Typecheck PASS, exit0. Vitest PASS: 7 files, 26 tests, 103.17s. The new hook regression covers initial discovery, UPDATE-only subscription, coordinates, offline removal and cleanup with mocked Supabase. Existing P0.1/P0.2 suites remain intact. Vitest ran after approved filesystem sandbox escalation for esbuild configuration access.

From backend, with GOTOOLCHAIN=local, GOPROXY=off, GOSUMDB=off, temporary GOCACHE=cruize-p01-go-cache and both CRUIZE_P01_TEST_DSN/CRUIZE_P02_TEST_DSN empty:

```text
go test -v -timeout 90s -p 1 ./internal/websocket ./internal/rides ./internal/business ./internal/drivers ./internal/contracts ./cmd/server
```

All six packages PASS, consolidated exit0 (cache reuse allowed). The room-policy PostgreSQL test and three P0.1 cancellation PostgreSQL cases SKIP without DSNs. Redis coverage remains fake PubSub; no real service, race, load or deployed-RLS success is claimed.

## Source schema evidence and unresolved conflicts

| Contract | Exact source evidence | Conclusion |
|---|---|---|
| Rider identity | 20260125152047_4686c435-3d99-4ba6-b0f5-4aec93c6f1d4.sql:26; generated types.ts:1925 | rides.user_id references auth.users; no canonical rides.rider_id established. |
| Assignment FK | 20260125160929_f5dbcea5-22a3-4053-b222-ac5d4dd68044.sql:265; generated rides_driver_id_fkey | rides.driver_id references drivers.id; it is not an auth subject. |
| Driver identity | Same migration:49-52; 20260326094954_5dcaae9a-6c38-4a92-9b36-2e1093a25683.sql | drivers.user_id references auth.users and is unique in source. |
| Offers | 20260131152655_be10e267-afae-4e61-924e-2f55ab9701c2.sql:2-11; 20260823120000_lock_down_rides_writes.sql:171-173 | offers.ride_id FK targets rides; offers.driver_id is an auth subject in current acceptance RPC. Initial driver column has no FK. No active driver reservation/one-active-assignment uniqueness was established by this inspection. |
| Conflicting historical RPC | 20260603095534_8c007527-9aa0-4ce5-8027-5dbc037f8ec4.sql:52 | Earlier join uses d.id=o.driver_id; later RPC explicitly resolves drivers.user_id. Effective function definitions must be inspected; do not assume newest files were applied. |
| Ride states | 20260823120000_lock_down_rides_writes.sql:18-19; 20260824100000_add_expired_to_rides_status_check.sql:10-12 | Source CHECK includes pending, scheduled, accepted, arrived, in_progress, completed, cancelled, expired. Terminal states never grant room/location rights. |
| Pending expiry | 20260210060944_8c2a17a5-870b-4802-a32c-d162f5c3029b.sql:3-16 | Nullable expires_at exists in source; trigger populates pending expiry. Current room policy rejects elapsed non-null pending expiry; null remains compatible. |
| Unsupported index dialect | 20260619113000_postgres_hot_path_indexes.sql:4-23 | References rides.rider_id/ride_status and ride_offers.ride_id despite canonical rides.user_id/status and separate ride_requests/ride_offers model. No canonical rename was found. Do not blindly apply migration history. |
| Offer state drift | Initial offers CHECK permits pending/accepted/rejected; 20260805145609_2a57ecd5-1cf7-4694-a826-6cac82a23862.sql trigger also permits cancelled/expired | A permissive trigger does not widen an existing CHECK. Effective constraints and expiry cleanup must be reconciled before P0.4. |

Generated types are committed source, not independently verified deployment metadata. docs/staging/DATABASE-SECURITY-GPS-READINESS.md explicitly labels its SQL/contracts proposal-only. This session did not apply them or run migrations. RLS, grants, definer functions, actual uniqueness, existing-data duplicates and provider schema remain unverified.

## Disposable PostgreSQL/Redis setup (future operator run)

Prerequisites: an operational local Linux-container Docker engine; reviewed memory cap/free RAM; available loopback ports55432/16379; Node22 and local Go. Do not copy application .env, cloud links, production DSNs or provider keys. Verify the independently resolved local endpoint has a Server section first. If Docker Desktop must be opened manually, its verified launcher is C:/Users/MUSAE/AppData/Local/Programs/DockerDesktop/Docker Desktop.exe; allow its engine to become ready and inspect resource settings before continuing.

Run in a fresh PowerShell session from the repository. Every Docker command below explicitly targets the local Windows named pipe and a temporary empty client config; never substitute a remote context. These images require a download if uncached. Record the resolved image digests for reproducibility; no image was installed during this verification.

```powershell
$os = Get-CimInstance Win32_OperatingSystem
$freeMB = [math]::Round($os.FreePhysicalMemory / 1024)
# Task guard, not a vendor minimum: leave Windows/WSL/test-runner headroom.
if ($freeMB -lt 3072) { throw 'Below the 3 GiB free-RAM task guard; do not start infrastructure' }
$testDockerHost = docker context inspect desktop-linux --format '{{.Endpoints.docker.Host}}'
if ($LASTEXITCODE -ne 0 -or $testDockerHost -notmatch '^npipe:/{4}\./pipe/[A-Za-z0-9_.-]+$') {
  throw 'Expected independently verified local Docker Desktop named pipe'
}
docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost version
if ($LASTEXITCODE -ne 0) { throw 'Local Docker engine required' }
$occupied = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 55432,16379 }
if ($occupied) { throw 'Test ports already in use; identify their owner first' }
$tag = [guid]::NewGuid().ToString('N')
$pgName = 'cruize-p02-pg-' + $tag
$redisName = 'cruize-p02-redis-' + $tag
$env:POSTGRES_PASSWORD = [guid]::NewGuid().ToString('N')
docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost run --detach --rm --name $pgName --label cruize.scope=p02-disposable --memory 384m --cpus 1 --shm-size 64m --tmpfs /var/lib/postgresql/data:rw,size=256m --publish 127.0.0.1:55432:5432 --env POSTGRES_USER=cruize_test --env POSTGRES_DB=cruize_p02_test --env POSTGRES_PASSWORD postgres:16-alpine postgres -c shared_buffers=32MB -c max_connections=20
if ($LASTEXITCODE -ne 0) { throw 'Disposable PostgreSQL startup failed' }
docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost run --detach --rm --name $redisName --label cruize.scope=p02-disposable --memory 96m --cpus 0.5 --tmpfs /data:rw,size=16m --publish 127.0.0.1:16379:6379 redis:7-alpine redis-server --appendonly no --maxmemory 32mb --maxmemory-policy noeviction
if ($LASTEXITCODE -ne 0) { throw 'Disposable Redis startup failed' }
$ready = $false
for ($attempt=0; $attempt -lt 30; $attempt++) {
  docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost exec $pgName pg_isready -U cruize_test -d cruize_p02_test
  if ($LASTEXITCODE -eq 0) { $ready=$true; break }
  Start-Sleep -Seconds 1
}
if (-not $ready) { throw 'Disposable PostgreSQL not ready' }
docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost exec $pgName createdb -U cruize_test cruize_p01_test
if ($LASTEXITCODE -ne 0) { throw 'Disposable P0.1 database creation failed' }
docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost exec $redisName redis-cli PING
if ($LASTEXITCODE -ne 0) { throw 'Disposable Redis not ready' }
docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost image inspect postgres:16-alpine --format '{{index .RepoDigests 0}}'
docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost image inspect redis:7-alpine --format '{{index .RepoDigests 0}}'
$env:CRUIZE_P02_TEST_DSN = 'postgres://cruize_test:' + $env:POSTGRES_PASSWORD + '@127.0.0.1:55432/cruize_p02_test?sslmode=disable'
$env:CRUIZE_P01_TEST_DSN = 'postgres://cruize_test:' + $env:POSTGRES_PASSWORD + '@127.0.0.1:55432/cruize_p01_test?sslmode=disable'
$env:GOTOOLCHAIN='local'
$env:GOPROXY='off'
$env:GOSUMDB='off'
$env:GOCACHE=Join-Path ([IO.Path]::GetTempPath()) 'cruize-p01-go-cache'
Push-Location backend
try { go test -count=1 -v -timeout 90s -p 1 ./internal/websocket ./internal/business } finally { Pop-Location }
```

The prepared harnesses restrict hosts (including fallback hosts) and exact test database names. They create isolated fixtures, not an applied full Supabase schema. Passing them proves guarded SQL/transaction behavior against PostgreSQL, not migration-chain, RLS, actual auth or production identity correctness. Capture tests' PASS/SKIP status and engine/image versions. Do not feed the cloud schema scripts arbitrary application environment variables.

After collecting results, stop only containers created above. Verify their label and keep the shell variables from that same session. --rm removes those disposable containers on stop; data paths use tmpfs; no host directories or persistent data volumes were mounted.

```powershell
foreach ($testContainer in @($pgName,$redisName)) {
  if ([string]::IsNullOrWhiteSpace($testContainer)) { throw 'Missing disposable container name' }
  $labelJSON = docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost inspect --format '{{json .Config.Labels}}' $testContainer
  if ($LASTEXITCODE -ne 0) { throw 'Cannot verify disposable container labels' }
  $scope = ($labelJSON | ConvertFrom-Json).'cruize.scope'
  if ($scope -ne 'p02-disposable') { throw 'Refusing to stop an unverified container' }
  docker --config "$env:TEMP\cruize-p02-empty-docker-config" --host $testDockerHost stop $testContainer
}
Remove-Item Env:CRUIZE_P01_TEST_DSN,Env:CRUIZE_P02_TEST_DSN,Env:POSTGRES_PASSWORD -ErrorAction SilentlyContinue
```

## Real Redis test gate (not implemented/executed here)

A PING only verifies transport availability. There is currently no real-Redis two-gateway acceptance suite in these P0.2 tests; existing fake PubSub tests must not be relabeled. Before signoff, add an opt-in harness using the production internal/redis.Client and two independent managers, an explicit loopback-only test endpoint, randomly isolated channel, disposable instance identity check, bounded waits/subscription readiness and cleanup. A Redis database number alone does not isolate Pub/Sub channels.

Required cases: room revoke reaches both managers; user revoke removes only its target; delayed/reordered data after a revoke does not restore membership; current driver/owner identity changes invalidate queued location and new joins; outage loses a revoke but canonical delivery checks deny stale assignment; reconnect resubscribes and reauthorizes instead of reconstructing old rooms. Verify real writer queues/sockets as well as manager channels. Exercise both Redis process loss and broken subscriber connections; startup cancellation must unblock reads. The current RESP Subscribe clears the network deadline and only checks context before blocking read (internal/redis/client.go:288 onward), so cancellation while idle needs a dedicated regression and possibly a bounded correction before claiming clean recovery/shutdown. This observation was not changed or proven by a real-service test here.

P0.5 must supply durable event IDs, aggregate versions, receipts/outbox, replay and gap recovery. Pub/Sub cannot replay events missed during a disconnect. P0.2 database checks limit unauthorized delivery, but cannot recall in-flight bytes or make notification delivery durable.

## Session and account suspension gate

[Supabase session documentation](https://supabase.com/docs/guides/auth/sessions) identifies JWT session_id with auth.sessions and describes checking session existence after logout. Its expiry/inactivity cleanup can lag, so row existence alone does not prove every configured lifetime limit. [Signout documentation](https://supabase.com/docs/guides/auth/signout) explains logout scopes and access-token validity until expiry. Those provider semantics are documented; this project's applied schema, configuration and backend privileges are not verified.

Source currently verifies HS256 or ES256/JWKS, configured issuer/audience and timestamps, records session_id and requires exp for sockets. DriverAuthorizationService rechecks drivers.status via user_id; this covers approved/suspended/banned driver eligibility, not general rider/account bans. Socket expiry, assignment/state checks and existing room revocation remain unchanged. SessionAuthorizer is unwired. Local client logout closes its socket but cannot revoke a copied token elsewhere; JWT expiry is not immediate logout.

Before wiring the adapter, verify auth.sessions identity/subject columns, provider lifetime policy, account-ban source and least-privilege read access using authorized nonproduction metadata. Bind verified subject AND session ID; deny missing/mismatched/inactive sessions and inactive accounts, deny lookup failures, bound deadlines, avoid positive caching beyond the agreed revocation bound, and check both periodic and delivery paths. Test logout scopes, deletion, ban, expiry, slow/erroring provider/database, reconnect and cross-manager revocation. Ordinary client getSession, token signature validity or getUser alone is not established as a session-revocation oracle. Never expose auth tables through a public API or add a service-role bypass.

If direct provider-session reads cannot be supported safely, design an application-owned durable session/denylist authority with an authenticated logout/admin gateway and expiry-bounded entries; that requires reviewed storage and full logout-path coverage. Until verified, retain the existing bounded JWT expiry and explicitly report its logout window. No session adapter, account-ban query or migration was invented in this increment.

For authorized nonproduction inspection only, begin with a read-only transaction and catalog metadata, not auth-user/session rows or tokens:

```sql
BEGIN READ ONLY;
SELECT current_database(), current_user;
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE (table_schema='public' AND table_name IN ('rides','drivers','offers','ride_requests','ride_offers'))
   OR (table_schema='auth' AND table_name IN ('sessions','users'))
ORDER BY table_schema,table_name,ordinal_position;
SELECT c.conrelid::regclass AS relation, c.conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
WHERE n.nspname='public' AND c.conrelid IN
 (SELECT oid FROM pg_class WHERE relname IN ('rides','drivers','offers') AND relnamespace=n.oid);
SELECT schemaname,tablename,indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename IN ('rides','drivers','offers');
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('rides','drivers','offers');
SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.table_privileges
WHERE table_schema IN ('public','auth') AND table_name IN ('rides','drivers','offers','sessions','users');
ROLLBACK;
```

Column and inherited grants, RLS flags, definer function definitions/search_path/execute grants and migration provenance must also be reviewed; the catalog query is a starting inventory, not a complete security certification. Blank local fixture databases will not contain Supabase auth metadata and must not be confused with staging. No such staging inspection was executed here.

## Decisions

Typecheck blocker CLOSED. Focused P0.1/P0.2 regressions PASS. Real PostgreSQL/Redis integration, applied schema/grants/RLS and server-side session/account revocation remain OPEN. P0.2 completion and production deployment: NO-GO. P0.3 design, source inventory and isolated test preparation: GO; runtime acceptance/reservation changes and migrations: NO-GO until schema/authority and integration prerequisites are established. P0.4 proposal/expiry and P0.5 durable recovery require coordinated storage ownership; no new broker, analytics, mobile rewrite or orchestration infrastructure is introduced.

## Real-infrastructure attempt and resource stop

The subsequent real-infrastructure verification measured TotalVisibleMemorySize=7888 MiB, FreePhysicalMemory=1457 MiB and free virtual memory3672 MiB before tests. During serial frontend validation, free physical RAM was1283 MiB and free virtual memory3383 MiB. These are point-in-time samples, not peak consumption. Two isolated Node processes sampled at92 MiB working set each. No Docker process was started and no container consumption was measured.

Active Docker context: desktop-linux. Its inspected endpoint is npipe:////./pipe/dockerDesktopLinuxEngine. Both that endpoint and the default docker_engine pipe are absent. WSL reports docker-desktop stopped, version2. .wslconfig does not exist; settings-store.json exists and identifies the WSL2 backend but did not expose explicit memory/CPU/swap caps in the inspected settings. Effective daemon resource allocation remains unknown. docker ps --all, volume ls and info were attempted read-only against the local endpoints and failed: existing inventory is unavailable, NOT verified empty. No remote context endpoint was contacted; DOCKER_HOST and DOCKER_CONTEXT overrides were unset.

Infrastructure was stopped at the resource/engine gate, before any start/pull/create/migration. The setup example now uses a conservative task guard of3 GiB free physical RAM (not a Docker/PostgreSQL vendor minimum), resolves the actual desktop-linux named pipe and rejects nonlocal endpoints. Changing Docker/WSL limits or existing containers still requires explicit approval. Safe next action: free memory by closing chosen applications manually, verify resource allocation without changing it, recheck both host and engine headroom, then use only the isolated capped fixtures. Existing services/containers/volumes were not modified; nothing created by this task needs cleanup.

All six focused Go packages passed again with cache disabled via -count=1, GOMAXPROCS=2 and package parallelism1; the four opt-in PostgreSQL tests explicitly skipped because both test DSNs were empty. All26 frontend tests passed under isolated Node22 with one worker, file parallelism disabled and512 MiB JS heap cap (94.02s); Go and frontend suites ran sequentially. Real Redis cases remain NOT RUN; no executable production-adapter/two-gateway Redis suite was added by this documentation-only attempt.

Coverage clarification: the four prepared PostgreSQL cases do not test actual rider-offer-rejection transactions. That fifth real transaction gate must be implemented and executed before claiming the requested rejection integration coverage. Fixture identity CHECK/FK/index/trigger/grant/RPC catalogs were not inspected because no fixture ran; source migrations/generated types are still only source evidence. No production or staging auth.sessions was queried. Existing session/account revocation limitations remain unchanged.

The [P0.3 assignment preparation](CRUIZE-RIDE-P03-ASSIGNMENT-PREPARATION.md) specifies atomic reservations, common lock order, exact terms, rollback, Redis-failure and receipt/idempotency cases with expected database outcomes. Its test matrix is prepared specification, not executed P0.3 tests. In particular, accept-then-cancel can legitimately return two successful commands where accepted cancellation is permitted; assert the valid serial history and released reservation rather than only one HTTP success.

Final resource-limited validation note: an additional app typecheck rerun using isolated Node22 with --max-old-space-size=512 exited1 after V8 exhausted that heap cap (approximately508 MiB live heap at final GC). No TypeScript diagnostic was emitted; this rerun did not complete and is not a PASS. The preceding stage's normal Node22 typecheck passed and application source is unchanged, but no new typecheck success is claimed. The heap cap was not raised on this low-headroom PC. Go six-package and frontend26-test PASS results above are independent completed checks.
