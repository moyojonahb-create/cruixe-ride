#!/bin/sh
set -eu
# Runtime has no compiler/download/build step and no Railway/Supabase configuration.
# The shared network namespace must contain only loopback, not a bridge/default route.
awk -F: 'NR>2 {gsub(/ /,"",$1); if ($1!="lo") exit 1}' /proc/net/dev || { echo 'BLOCKED: non-loopback network interface'; exit 1; }
[ "$(awk 'NR>1 && $2=="00000000" {print $2}' /proc/net/route)" = '' ] || { echo 'BLOCKED: default route exists'; exit 1; }
export CRUIZE_P03_RUN_TOKEN="$(cat /run/secrets/run_token)"
export CRUIZE_P03_TEST_DSN="postgres://cruize_p03_test:$(cat /run/secrets/test_password)@127.0.0.1:5432/cruize_p03_test?sslmode=disable"
export CRUIZE_P03_REDIS_URL="redis://:$(cat /run/secrets/redis_password)@127.0.0.1:6379/14"
unset DATABASE_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY REDIS_URL PGHOST PGSERVICE PGPASSWORD PGOPTIONS || true
case "${1:-all}" in
 check) exec /opt/assignmenttest -test.v -test.count=1 -test.timeout=90s -test.run '^TestPostgresFixtureStorage$' ;;
 all) exec /opt/assignmenttest -test.v -test.count=1 -test.timeout=600s ;;
 *) echo 'Expected check or all'; exit 2 ;;
esac
