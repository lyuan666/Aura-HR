#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/yzschros}"
BRANCH="${BRANCH:-main}"
LOG_FILE="${LOG_FILE:-$REPO_DIR/logs/macmini-worker-sync.log}"
LOCK_DIR="${LOCK_DIR:-/tmp/yzschros-worker-sync.lock}"
BUILT_COMMIT_FILE="${BUILT_COMMIT_FILE:-$REPO_DIR/.worker-built-commit}"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"
}

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "sync skipped: another sync is running"
  exit 0
fi
trap 'rm -rf "$LOCK_DIR"' EXIT

cd "$REPO_DIR"

current_commit="$(git rev-parse HEAD)"
built_commit=""
if [ -f "$BUILT_COMMIT_FILE" ]; then
  built_commit="$(cat "$BUILT_COMMIT_FILE")"
fi
log "sync start: current=$current_commit branch=$BRANCH"

git fetch origin "$BRANCH" --prune
remote_commit="$(git rev-parse "origin/$BRANCH")"

if [ "$current_commit" = "$remote_commit" ] && \
  [ "$built_commit" = "$current_commit" ] && \
  [ -f apps/api/dist/main.js ]; then
  log "already current: $current_commit"
  if [ -x scripts/clean-runtime-artifacts.sh ]; then
    scripts/clean-runtime-artifacts.sh --keep-api-dist >> "$LOG_FILE" 2>&1
  fi
  exit 0
fi

if [ "$current_commit" != "$remote_commit" ]; then
  log "updating: $current_commit -> $remote_commit"
  git reset --hard "origin/$BRANCH"
else
  log "rebuilding current commit: $current_commit"
fi

if [ -x scripts/clean-runtime-artifacts.sh ]; then
  scripts/clean-runtime-artifacts.sh --keep-api-dist >> "$LOG_FILE" 2>&1
fi

pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1
pnpm build:api >> "$LOG_FILE" 2>&1
git rev-parse HEAD > "$BUILT_COMMIT_FILE"

if pm2 describe yzschros-worker >/dev/null 2>&1; then
  pm2 restart yzschros-worker >> "$LOG_FILE" 2>&1
else
  pm2 start ecosystem.worker.config.js >> "$LOG_FILE" 2>&1
fi

pm2 save >> "$LOG_FILE" 2>&1

new_commit="$(git rev-parse HEAD)"
log "sync complete: current=$new_commit"
