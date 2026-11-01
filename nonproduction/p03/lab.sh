#!/usr/bin/env bash
# Manual, approved nonproduction Linux hosts only. No provisioning/cloud calls.
set -euo pipefail
umask 077
fail(){ printf '%s\n' "BLOCKED: $*" >&2; exit 1; }
[[ $(uname -s) == Linux ]] || fail 'Linux test host required; do not invoke WSL/Docker Desktop'
[[ ${CRUIZE_NONPRODUCTION_ACK:-} == P03_DISPOSABLE_ONLY ]] || fail 'explicit nonproduction operator acknowledgement required'
[[ -f /etc/cruize-integration-host && ! -L /etc/cruize-integration-host ]] || fail 'independently approved test-host marker missing'
[[ $(cat /etc/cruize-integration-host) == cruize-nonproduction-v1 ]] || fail 'host marker mismatch'
[[ $(stat -c %u /etc/cruize-integration-host) == 0 && $(stat -c %a /etc/cruize-integration-host) =~ ^(444|644)$ ]] || fail 'host marker must be root owned and not operator writable'
for cmd in docker openssl jq realpath sha256sum; do command -v "$cmd" >/dev/null || fail "prerequisite missing: $cmd"; done
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
repo=$(cd "$root/../.." && pwd -P)
action=${1:-}
state=${2:-}
[[ -n $state ]] || fail 'usage: lab.sh prepare|build|up|check|run|status|cleanup STATE_DIRECTORY'
[[ $state == /* && ! -L $state ]] || fail 'absolute nonsymlink state path required'
state=$(realpath -m -- "$state")
[[ $state =~ ^[a-zA-Z0-9_./-]+$ && ! -L $state ]] || fail 'choose an absolute, nonsymlink state path without spaces'
d(){ env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH DOCKER_CONFIG="$state/docker-config" docker --host unix:///var/run/docker.sock "$@"; }
if [[ $action == prepare ]]; then
  [[ ! -e $state ]] || fail 'refusing to overwrite state; choose a NEW run directory'
  for image in "${GO_IMAGE:-}" "${POSTGRES_IMAGE:-}" "${REDIS_IMAGE:-}" "${RUNTIME_BASE:-}"; do
    [[ $image =~ ^[a-z0-9./:_-]+@sha256:[a-f0-9]{64}$ ]] || fail 'four independently reviewed image digests required'
  done
  mkdir -m 700 -p -- "$state/bundle/backend/internal/assignmenttest" "$state/bundle/bin" "$state/docker-config"
  chmod 700 "$state"
  RUN_ID=$(openssl rand -hex 8)
  for name in admin_password test_password redis_password run_token; do openssl rand -hex 32 >"$state/$name"; chmod 444 "$state/$name"; done
  # Host directory700 protects the readable container secret mounts. No source .env.
  password=$(cat "$state/redis_password")
  printf 'user default on >%s ~cruize:p03:* &cruize:p03:* +ping +select +get +set +del +pttl +pexpire +publish +subscribe +unsubscribe +quit +client|setname\n' "$password" >"$state/redis.acl"
  chmod 444 "$state/redis.acl"
  while IFS= read -r file; do
    [[ -n $file ]] || continue
    [[ $file == backend/* && $file != *..* && ! -L $repo/$file && -f $repo/$file ]] || fail 'invalid source-export manifest'
    cp -- "$repo/$file" "$state/bundle/$file"
  done <"$root/source-manifest.txt"
  cp -- "$root/runner.sh" "$root/Dockerfile" "$state/bundle/"
  (cd "$state/bundle"; find . -type f -print0 | sort -z | xargs -0 sha256sum >"$state/source.sha256")
  printf 'RUN_ID=%s\nSTATE_DIR=%s\nGO_IMAGE=%s\nPOSTGRES_IMAGE=%s\nREDIS_IMAGE=%s\nRUNTIME_BASE=%s\nRUNNER_IMAGE=cruize-p03-%s-runner:local\n' "$RUN_ID" "$state" "$GO_IMAGE" "$POSTGRES_IMAGE" "$REDIS_IMAGE" "$RUNTIME_BASE" "$RUN_ID" >"$state/lab.env"
  chmod 600 "$state/lab.env"
  printf 'Prepared source-only bundle for run %s; no service started.\n' "$RUN_ID"
  exit 0
fi
[[ -d $state && -f $state/lab.env && ! -L $state/lab.env ]] || fail 'prepared state missing'
[[ $(stat -c %a "$state") == 700 && $(stat -c %u "$state") == "$(id -u)" ]] || fail 'private state must be owned by this operator with mode700'
# Parse a fixed whitelist; never source/eval editable env files as shell commands.
while IFS='=' read -r key value; do
 case "$key" in RUN_ID|STATE_DIR|GO_IMAGE|POSTGRES_IMAGE|REDIS_IMAGE|RUNTIME_BASE|RUNNER_IMAGE) printf -v "$key" '%s' "$value"; export "$key" ;; *) fail 'unexpected state key' ;; esac
done <"$state/lab.env"
[[ $RUN_ID =~ ^[a-f0-9]{16}$ && $STATE_DIR == "$state" && $RUNNER_IMAGE == "cruize-p03-$RUN_ID-runner:local" ]] || fail 'state identity mismatch'
for image in "$GO_IMAGE" "$POSTGRES_IMAGE" "$REDIS_IMAGE" "$RUNTIME_BASE"; do [[ $image =~ ^[a-z0-9./:_-]+@sha256:[a-f0-9]{64}$ ]] || fail 'invalid pinned image'; done
project="cruize-p03-$RUN_ID"
c(){ d compose --project-directory "$root" --env-file "$state/lab.env" --project-name "$project" --file "$root/compose.yaml" "$@"; }
check_owned(){
 local id=$1
 d inspect "$id" | jq -e --arg p "$project" --arg r "$RUN_ID" '.[0] | .Config.Labels["com.docker.compose.project"]==$p and .Config.Labels["cruize.purpose"]=="p03-disposable" and .Config.Labels["cruize.run"]==$r and (.Config.Labels["com.docker.compose.service"] | IN("postgres","redis","runner","builder"))' >/dev/null || fail 'refusing to change a foreign container'
}
case "$action" in
 build)
  [[ $(awk '/MemAvailable:/ {print $2}' /proc/meminfo) -ge 3145728 ]] || fail '3GiB free host RAM task guard for build'
  (cd "$state/bundle"; sha256sum --check "$state/source.sha256" >/dev/null)
  for image in "$GO_IMAGE" "$POSTGRES_IMAGE" "$REDIS_IMAGE" "$RUNTIME_BASE"; do d image inspect "$image" >/dev/null || fail 'pre-pull reviewed pinned images on this approved host'; done
  # Only the explicit source bundle enters this network-enabled compilation step.
  # No runtime credentials/secrets, home, .git, Docker socket or app env mounted.
  d run --rm --name "$project-builder" --label "com.docker.compose.project=$project" --label com.docker.compose.service=builder --label cruize.purpose=p03-disposable --label "cruize.run=$RUN_ID" --memory 2g --cpus 1.25 --pids-limit 128 --mount "type=bind,src=$state/bundle,dst=/src" --env GOMAXPROCS=2 --env CGO_ENABLED=0 --env GOTOOLCHAIN=local "$GO_IMAGE" sh -ec 'cd /src/backend; go mod download; go test -buildvcs=false -c -p 1 -o /src/bin/assignmenttest ./internal/assignmenttest'
  (cd "$state/bundle"; sha256sum --check "$state/source.sha256" >/dev/null)
  sha256sum "$state/bundle/bin/assignmenttest" >"$state/binary.sha256"
  d build --network none --pull=false --build-arg "RUNTIME_BASE=$RUNTIME_BASE" --build-arg "RUN_ID=$RUN_ID" -t "$RUNNER_IMAGE" "$state/bundle"
  ;;
 up)
  [[ $(awk '/MemAvailable:/ {print $2}' /proc/meminfo) -ge 3145728 ]] || fail '3GiB free host RAM task guard for startup'
  [[ ! -e $state/used ]] || fail 'reset requires cleanup and a NEW prepared run, never reuse credentials/data'
  [[ -z $(d ps -aq --filter "label=com.docker.compose.project=$project") ]] || fail 'refusing to modify existing containers'
  d image inspect "$RUNNER_IMAGE" >/dev/null || fail 'reviewed runner build required'
  touch "$state/used"
  c up --pull never --detach --wait --wait-timeout 90 postgres redis
  ;;
 check|run)
  ids=$(d ps -q --filter "label=com.docker.compose.project=$project")
  [[ -n $ids ]] || fail 'lab is not running'
  for id in $ids; do check_owned "$id"; done
  pg=$(c ps -q postgres)
  [[ -n $pg ]] || fail 'task-owned PostgreSQL missing'
  d inspect "$pg" | jq -e '.[0] | .HostConfig.NetworkMode=="none" and ((.HostConfig.PortBindings // {})|length)==0 and ((.NetworkSettings.Ports // {})|[.[]|select(.!=null)]|length)==0' >/dev/null || fail 'network/port isolation mismatch'
  if [[ $action == check ]]; then c run --rm --no-deps runner check; else c run --rm --no-deps runner all; fi
  ;;
 status) c ps --all ;;
 cleanup)
  ids=$(d ps -aq --filter "label=com.docker.compose.project=$project")
  for id in $ids; do check_owned "$id"; done
  for id in $ids; do d stop --time 10 "$id"; d rm "$id"; done
  printf 'Task containers removed. No global prune/volume delete. Private state retained for reviewed manual disposal.\n'
  ;;
 *) fail 'unknown action' ;;
esac
