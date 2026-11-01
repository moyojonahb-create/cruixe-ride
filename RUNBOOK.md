# Operations Runbook

## Backend Restart

Docker:

```bash
docker compose restart backend
curl -fsS http://localhost:3000/health/ready
docker compose logs --since 15m backend
```

Systemd:

```bash
sudo systemctl restart pickme-backend
sudo systemctl status pickme-backend
journalctl -u pickme-backend --since "15 minutes ago"
```

## Redis Restart

```bash
docker compose restart redis
docker compose logs --tail=100 redis
curl -fsS http://localhost:3000/health/dependencies
```

## Monitoring Access

Prometheus, Grafana, and Loki are localhost-bound by default. Use a VPN, SSH tunnel, Cloudflare Access, or authenticated/allowlisted NGINX route for remote access.

SSH tunnel examples:

```bash
ssh -L 9090:127.0.0.1:9090 -L 3001:127.0.0.1:3001 ops@<host>
curl -fsS http://127.0.0.1:9090/-/ready
curl -fsS http://127.0.0.1:3001/api/health
```

Validate config after monitoring changes:

```bash
docker compose config
promtool check config ops/prometheus/prometheus.yml
promtool check rules ops/prometheus/alerts.yml
```

Restart monitoring:

```bash
docker compose restart node-exporter prometheus grafana
docker compose logs --tail=100 prometheus grafana node-exporter
```

## Asynq Restart

```bash
docker compose --profile worker restart asynq-worker
docker compose --profile scheduler restart asynq-scheduler
curl -fsS -H "Authorization: Bearer $ADMIN_JWT" http://localhost:3000/admin/jobs/stats
docker compose --profile worker --profile scheduler logs --since 15m asynq-worker asynq-scheduler
```

Systemd:

```bash
sudo systemctl restart pickme-asynq-worker pickme-asynq-scheduler
sudo systemctl status pickme-asynq-worker
sudo systemctl status pickme-asynq-scheduler
journalctl -u pickme-asynq-worker -u pickme-asynq-scheduler --since "15 minutes ago"
```

## Database Failover

1. Confirm Supabase incident status.
2. Pause deploys.
3. Point `DATABASE_URL` to the promoted database endpoint.
4. Restart backend.
5. Run `/health/ready` and a ride lifecycle smoke test.

## Notification Outage

1. Check provider endpoint and token status.
2. Check Asynq queue depth and dead-letter count.
3. Disable affected channel at provider/config level if needed.
4. Continue critical ride/wallet flows.

## Wallet Incident

1. Stop payment provider callbacks at ingress if duplicate credits are suspected.
2. Preserve logs and database snapshots.
3. Run reconciliation reports.
4. Do not manually mutate balances without finance approval.

## Ride Incident

1. Check API health, database health, Redis health, and dispatch queue depth.
2. Check WebSocket connection metrics.
3. If dispatch is degraded, pause pilot onboarding and notify operations.

## WebSocket Incident

1. Confirm `/ws` upgrade through NGINX.
2. Check Redis Pub/Sub status.
3. Check backend logs for auth failures and room authorization denials.
4. Restart backend only after capturing connection counts.

## High CPU

1. Check request rate and rate-limit rejections.
2. Check k6 or external traffic.
3. Run `docker compose ps` or `systemctl status pickme-backend pickme-asynq-worker pickme-asynq-scheduler`.
4. Scale backend or worker vertically based on the hot process.
5. Capture process profile before restart if possible.

## High RAM

1. Check Redis memory and backend RSS.
2. Check WebSocket connection count.
3. Restart affected process if memory is rising without bound.

## Disk Full

1. Stop noncritical services.
2. Check Docker logs and volumes.
3. Rotate logs.
4. Confirm Redis AOF/RDB and Prometheus retention.

## Redis Full

1. Do not switch to eviction without incident approval.
2. Increase memory or purge noncritical cache keys.
3. Preserve Asynq queues.

## Database Full

1. Contact Supabase support or increase plan/storage.
2. Stop high-volume background writes if needed.
3. Do not delete ledger/wallet records.

## Rollback

Docker:

```bash
IMAGE_TAG=<previous-tag> docker compose --profile worker --profile scheduler up -d --no-deps backend frontend asynq-worker asynq-scheduler
curl -fsS http://localhost:3000/health/ready
```

Git:

```bash
git checkout <known-good-sha>
docker compose build
docker compose up -d
```

---

## Capacitor background-location build — added scenarios and watch items

Added 7 Sep 2026 alongside the native background-location + push work. S0–S6 are
defined in `apps/spike-background-location/RUNBOOK.md` and apply unchanged; the
scenarios below are specific to the Capacitor transport.

### S7 — terminated app (measure, do not pre-solve)

`stopOnTerminate: false` and `startOnBoot: true` are set, but **posting lives in
JS and there is no JS runtime once the app is killed** — the WebView is gone.
Per the plugin's own documentation, after termination only the native
background-service remains, and it uploads to a configured `http.url`. We have
no `url`, deliberately (see `src/lib/backgroundLocation.ts` for why posting stays
in `driverLocation.ts`).

So the expected terminated-state behaviour is: **positions recorded faithfully
into the plugin's SQLite database and never uploaded.** The config currently
advertises a guarantee the transport cannot honour.

**Procedure:** driver online → swipe the app away from recents → wait 3 minutes →
report (a) whether the backend still sees the driver, and (b) whether positions
resume on relaunch. **Report what happens, not what anyone predicted.**

**Known gap, not to be solved speculatively.** A native uploader via `http.url` +
`autoSync` needs an auth token, and Supabase JWTs expire in about an hour. A
terminated app cannot refresh one, so a native uploader would begin 401-ing
mid-shift. The likely answer is a device-scoped token the backend can validate
without a live session — but that is real design work and it is not worth doing
until S7 says how much the terminated case actually matters.

### S8 — push reaches a backgrounded and a killed app

FCM via `@capacitor/push-notifications`. **Backgrounded and killed are different
code paths and both must be tested** — a notification that arrives while the app
is merely backgrounded proves nothing about the killed case, which is the one
that matters at 3am.

### S9 — arrival announcement reaches a locked screen

`useArrivalDetection` fires correctly and the ride transitions correctly, but the
driver's two original channels cannot reach a locked screen: `sonner` renders
into a DOM nobody is looking at, and `useVoiceNavigation` uses
`window.speechSynthesis`, which a backgrounded WebView will not reliably speak.
**Detection was never the broken half — delivery was.**

Arrival now also fires a local notification via `@capacitor/local-notifications`,
*in addition to* the toast and voice rather than replacing them.

**Procedure:** accept a ride, lock the screen, approach the pickup point, and
confirm the driver is notified without unlocking.

### WATCH — no-show detection may change behaviour after this build

`src/hooks/useDriverNoShow.ts` flags a driver as a no-show if they have not moved
100m closer to pickup across five one-minute checks. It reads the driver's
`live_locations` row — **data this build makes dramatically more reliable.**

A checker that has been quietly starved of data may start behaving differently,
possibly firing correctly for the first time. `cancellation_fees` exists as a
table, so a no-show flag plausibly has a money path attached.

**The logic is deliberately unchanged.** After the first real driver session,
check whether no-show flags appear at a different rate than before. A behavioural
change nobody predicted tends to surface first as a driver disputing a fee.

Note also that this hook runs on the **rider's** device, so it is suspended by
the rider's screen lock and is unreliable by construction. No-show detection
belongs server-side eventually; that is a separate decision.

### Wallet settlement — schema present, credit path absent

Corrected 7 Sep 2026. The tables exist and have never been written to:
`driver_wallets` 0, `wallet_transactions` 0, `platform_ledger` 0,
`admin_earnings` 0, `withdrawals` 0, `wallets` 2. `pay_ride_from_wallet` and
`request_wallet_ride` exist; **there is no driver-credit or payout function
anywhere in `public`.**

So: the schema is present, the debit path is partially built, the credit path
does not exist, and no money has ever moved. That is an unbuilt pipeline, not a
corrupt ledger — there is no financial state to reconcile before building it.

Also flagged, not acted on: `ride_offers` has 0 rows while `offers` has 21. One
of the two is likely dead.

### `notifications` is the delivery log — and the write belongs to a sender that does not exist yet

`notifications` is reachable (Go `insertOne`, `business/handler.go:276`) and
correctly shaped for delivery records. **Do not wire the client to write it.**

A client that logs its own received pushes only ever logs pushes that arrived on
a device awake enough to receive them — precisely the population that does not
need auditing. The failures worth recording (token expired, device asleep, FCM
dropped it) leave no client running to write the row.

Delivery logging belongs to the **sender**: it writes the row when it sends and
updates it on receipt confirmation. **There is no Go push sender yet**, so there
is nothing to wire, and inventing one is out of scope.

Two halves of the same missing piece, to be built together:

- **No push sender.** Nothing in the backend sends an FCM message on a ride
  offer. `registerForPush()` in `src/lib/notifications.ts` obtains a token and
  hands it to `onToken`, but nothing consumes it.
- **No token storage.** There is no column or table holding a device's FCM
  token, so even a finished sender would not know where to send.

**S8 evidence therefore comes from outside the app** — the Firebase console's
delivery report plus `adb logcat` on the receiving device. That is what you want
when the app is the thing under test.

### Superseded schema — empty by design, not by failure

Two pairs where one side is dead. Recorded so a future reader does not mistake
either for a live table and "fix" the wrong one:

| Table | Rows | Status |
|---|---|---|
| `driver_queue` | 0 | **No writer anywhere** — client, Go and triggers all checked. Mentioned only in its own migrations |
| `driver_offline_actions` | 0 | **No writer anywhere** — mentioned only in the migration that created it |
| `ride_offers` | 0 | Superseded by `offers` (21 rows) |
| `offers` | 21 | The live table |

Not to be fixed. To be deleted or documented as part of a schema tidy-up, which
is its own decision.

**Method note, because it changes what a verdict is worth:** an earlier sweep of
`driver_sessions` concluded "the only writer is the client's
`createFatigueBreak`". That was a **client-only sweep**, and a Go writer existed
at `business/handler.go:745`. The conclusion survived — that endpoint *is* the
server side of the same call, so the circular gating is real — but the method
would have produced a confident false negative on any table written only by the
backend. **"No writer" must mean client, backend and triggers all checked**, and
the verdicts above were reached to that standard.
