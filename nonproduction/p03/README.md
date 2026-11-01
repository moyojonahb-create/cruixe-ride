# P0.3 disposable assignment test lab

Prepared 2026-10-28. REVIEWABLE CONFIGURATION ONLY: no host was provisioned, contacted or started. Linux/Docker runtime behavior is still UNVERIFIED. This directory is outside every active migration directory and is not an application deployment.

## Scope and execution gates

This lab can run `TestPostgresFixtureStorage` independently of the pending command implementation. The eleven assignment command cases still require `candidateFixture` to call the single reviewed acceptance authority. A configured verified database with that adapter missing produces FAIL/BLOCKED, never a fabricated integration pass. No DSN produces explicit SKIP. The storage smoke case verifies physical schema setup, SQLSTATE23505 driver uniqueness, transaction rollback and cleanup; it does not prove assignment concurrency, RPC parity, provider RLS or session security.

There is no reference assignment implementation here. `backend/internal/assignmenttest/schema.sql` is a deliberately small test model with proposed agreement/reservation/receipt tables, not a copy of the effective Supabase schema. Test USD/exponent2 is synthetic and does not establish product currency policy. Real provider schemas, auth, policies, pg_cron/pg_net and migrations are not replayed. PostGIS is not required by this package's SQL; it is required only if later reviewed test imports actually use spatial SQL. The broader source migration history needs provider services and cannot be treated as a plain-PostgreSQL bootstrap.

## Exact host and resource envelope

Use a newly approved, dedicated x86_64 Linux host: 2 vCPU, 4 GiB RAM, at least 20 GiB available SSD (80 GiB included in the pricing example), Docker Engine with Compose v2, Bash, OpenSSL, jq, realpath, sha256sum and an SSH client/server. No application server, production credentials, Railway/Supabase environment, production VPC peering or production VPN routes belong on this host. The controller requires at least 3 GiB MemAvailable before build/start; 4 GiB is a small sequential fixture host, not full Supabase or load-test sizing. Run one job at a time; do not overlap compilation and tests. Use Go 1.26.5 (module minimum1.26.3), a reviewed PostgreSQL16 Debian image, Redis 7.4 Alpine image and a Debian bookworm-slim runtime. These are proposed test versions; the deployed PostgreSQL/extension versions remain unverified. All four image references must be pinned to independently reviewed SHA256 digests; no mutable default tags are accepted.

| Process | CPU cap | Memory cap | PID cap | Storage |
|---|---:|---:|---:|---|
| PostgreSQL |0.50|512 MiB|96|256 MiB tmpfs;64 MiB shared memory;12 connections;32 MiB shared buffers|
| Redis |0.25|96 MiB|32|16 MiB tmpfs;32 MiB maxmemory;no persistence;noeviction|
| Test runner |1.25|2 GiB|128|128 MiB /tmp;readonly root;GOMAXPROCS2|
| Separate compiler, services stopped |1.25|2 GiB|128|source-only bundle;CGO disabled;Go package parallelism1|

Runtime CPU caps sum to 2; container RAM caps sum to 2656 MiB, leaving1440 MiB of a nominal4 GiB for Linux/Docker. tmpfs/page cache count toward cgroups, so these are ceilings, not available heap guarantees. PostgreSQL initdb/WAL and process limits need the actual smoke run; increase limits only after reviewing evidence. There is no swap dependency. Logs are bounded at2 x5 MiB per service. Images/build cache and logs consume host disk and need monitored manual retention.

Costs to verify before approval: DigitalOcean's current basic table lists2 vCPU/4 GiB/80 GiB at $0.03571/hour or $24/month;40 hours is about$1.43 compute. This is a pricing example, not a purchase or quote. Confirm region, SKU availability, taxes/VAT, billing minimum/cap, included transfer, excess egress, public IPv4, storage, snapshots/backups and retained-resource billing. No backup, extra volume, paid registry or monitoring service is provisioned here. [Official pricing](https://www.digitalocean.com/pricing/droplets).

## Isolation and credentials

PostgreSQL uses Docker `network_mode: none`. Redis and the runner join only that container's network namespace. There are no published ports, Docker bridge interfaces, default routes or external database routes at test runtime. Redis and PostgreSQL bind127.0.0.1 inside that namespace, not the host. The runner checks for non-loopback interfaces/default IPv4 routes before execution. [Docker documents the none driver as loopback only](https://docs.docker.com/engine/network/drivers/none/). Actual Engine/Compose enforcement must be checked on the approved host; static YAML parsing is not runtime proof.

Only task containers share this namespace; do not attach other containers. Redis has per-run ACL authentication restricted to cruize:p03:* keys/channels and the enumerated commands. The default ACL user is password protected for compatibility with the existing password-only RESP adapter. It has no FLUSHALL/FLUSHDB/CONFIG/ACL/SHUTDOWN rights. Redis logical DB14 is a convention, not a security boundary. The eventual Redis fixture must independently verify both marker keys and run token before using the real production adapter; that adapter is still absent.

PostgreSQL initialization alone has an ephemeral admin password. Tests receive a different temporary role `cruize_p03_test` with no superuser/createdb/createrole/replication/bypassrls rights and no memberships. It has CONNECT/CREATE on the dedicated database, no public-schema creation, and SELECT-only access to the admin-owned guard marker. Each case creates a cryptographically random p03_<32hex> schema transactionally, seeds distinct driver-row/auth-subject UUIDs and cleans only its owned schema. The pool is capped at4, statement10 s/lock3 s/idle-transaction15 s; each fixture has a30 s context and cleanup 10 s. Cleanup runs before pool closure even when setup fails. The guard checks literal loopback including all fallbacks, exact DB/role/session identity, role privileges, static environment marker and a fresh64hex run token before fixture DDL. Markers are not a substitute for an independently approved host; never create them on production to bypass the guard.

Secrets are generated with OpenSSL per run and are never copied from .env or logged. Container secret files are readable for the unprivileged runner; their host directory must be operator-owned mode700 (individual mounted files444). Only the explicit manifest's Go tests/module metadata enter the build context. The compiler can fetch public Go dependencies in a separate network-enabled container, with no runtime secrets, application environment, home directory, .git or Docker socket mounted. It compiles tests without executing them. Source hashes are checked before and after compilation; binary hash is recorded. The image build uses network none. Pre-pull reviewed images as a separate operator action; scripts do not purchase infrastructure or select an account.

## Secure remote workflow (manual; approval required first)

Run tests on the remote isolated host through an SSH control session, rather than opening database ports or forwarding production endpoints. Host firewall/security group: allow TCP22 only from explicitly trusted operator IPs or a dedicated nonproduction access network; deny inbound5432/6379 and all other unsolicited ingress, including IPv6. Require key authentication, disable password/root login, verify the host fingerprint through an independent channel, use StrictHostKeyChecking=yes and do not forward an SSH agent. Firewall/provisioning/account changes are not performed by these scripts. SSH access to Docker is effectively root; use a dedicated trusted test operator.

Transfer only this reviewed directory and the source-manifest files to a clean test checkout; do not transfer an application .env, full home, .git credentials or production keys. Check digests and scripts before execution. An approved host administrator creates `/etc/cruize-integration-host` containing exactly `cruize-nonproduction-v1`, root-owned mode644 or444, only after independently identifying this host as disposable. The controller rejects a missing/writable/foreign-owned marker and always selects the local Unix Docker socket. Do not create that marker on a workstation, production host or an unverified existing server.

After approval and verification, an operator can use these commands in the approved Linux checkout. Supply four real reviewed digest references instead of the placeholders; do not paste secrets into commands:

```bash
export CRUIZE_NONPRODUCTION_ACK=P03_DISPOSABLE_ONLY
export GO_IMAGE='golang@sha256:REPLACE_WITH_REVIEWED_64_HEX_DIGEST'
export POSTGRES_IMAGE='postgres@sha256:REPLACE_WITH_REVIEWED_64_HEX_DIGEST'
export REDIS_IMAGE='redis@sha256:REPLACE_WITH_REVIEWED_64_HEX_DIGEST'
export RUNTIME_BASE='debian@sha256:REPLACE_WITH_REVIEWED_64_HEX_DIGEST'
# Independently pre-pull these four pinned images on this test host.
bash nonproduction/p03/lab.sh prepare /opt/cruize-test-runs/p03-run-001
bash nonproduction/p03/lab.sh build   /opt/cruize-test-runs/p03-run-001
bash nonproduction/p03/lab.sh up      /opt/cruize-test-runs/p03-run-001
bash nonproduction/p03/lab.sh check   /opt/cruize-test-runs/p03-run-001
# Only after the reviewed candidate adapter and real Redis guard exist:
bash nonproduction/p03/lab.sh run     /opt/cruize-test-runs/p03-run-001
bash nonproduction/p03/lab.sh status  /opt/cruize-test-runs/p03-run-001
bash nonproduction/p03/lab.sh cleanup /opt/cruize-test-runs/p03-run-001
```

Use `ssh -o StrictHostKeyChecking=yes -o ForwardAgent=no test-operator@VERIFIED_TEST_HOST` for the control session. No DB tunnel is needed or supported by this lab's namespace isolation. A separately reviewed tunnel environment would require its own isolation evidence; a loopback DSN alone does not identify a database as nonproduction.

`prepare` refuses existing state, exports only manifest files and generates credentials; it starts nothing. `build` compiles only this test package with limits. `up` refuses existing containers and credential reuse, starts only PG/Redis and waits up to 90 s for health. `check` runs only the storage smoke case; `run` runs the entire package and currently FAILS/BLOCKED without the candidate adapter. Database queries/timeouts are bounded and Go test timeout is90 s/600 s respectively. `cleanup` first verifies every target's project/run/purpose/service labels, then stops/removes only those container IDs. No global prune, down --remove-orphans, volume delete, recursive host deletion or production DSN is used.

Reset: execute cleanup, verify no containers remain for that exact run, then prepare a NEW state path with NEW passwords/token/run ID. PG/Redis tmpfs disappears with container removal. Never reuse the old credentials or apply blanket DROP SCHEMA/public migration resets. Interrupted schema cleanup is contained in disposable tmpfs; remove the owned containers and start fresh. Host state/source bundle, runner image/build cache, bounded container logs and compiler cache may remain and incur disk use; after retaining redacted evidence, the operator must review and dispose only the exact resolved task directory and task image. No host-file deletion is automated. Credential revocation occurs when those containers disappear; rotate by a fresh run. Do not include secret files or DSNs in reports.

## Evidence required to change the gates

Record host identity/approval, CPU/RAM/disk, Engine/Compose versions, pinned image digests and PG/Redis versions; actual inspect output showing no external interfaces/routes/published ports and enforced limits; independent bad-target/marker/role/token rejection; storage smoke with successful schema cleanup; complete case-level command results after implementing the shared-authority adapter and guarded real Redis fixture. Runtime role/grant/RPC/provider/session tests need their own authorized nonproduction Supabase environment; this fixture does not satisfy them. Do not call a package PASS with skipped cases an integration PASS.

Current decision: GO for reviewing/preparing artifacts; conditional GO for storage-only execution after explicit host/service approval and verification; NO-GO for full command-conformance execution, P0.3 activation and production until the missing prerequisites are met.
