#!/bin/sh
set -eu
export REDISCLI_AUTH="$(cat /run/secrets/redis_password)"
redis-server --bind 127.0.0.1 --protected-mode yes --port 6379 --aclfile /lab/redis.acl --save '' --appendonly no --dir /data --maxmemory 32mb --maxmemory-policy noeviction &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' TERM INT EXIT
ready=false
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if redis-cli --no-auth-warning -h 127.0.0.1 ping >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
[ "$ready" = true ] || exit 1
redis-cli --no-auth-warning -h 127.0.0.1 SET cruize:p03:environment p03-disposable-v1 >/dev/null
redis-cli --no-auth-warning -h 127.0.0.1 SET cruize:p03:run_token "$(cat /run/secrets/run_token)" >/dev/null
wait "$pid"
