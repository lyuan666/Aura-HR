#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEEP_API_DIST=false

for arg in "$@"; do
  case "$arg" in
    --keep-api-dist)
      KEEP_API_DIST=true
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

cd "$ROOT_DIR"

rm -rf \
  .next \
  .superpowers \
  apps/web/.next \
  apps/extension/dist \
  apps/web/tsconfig.tsbuildinfo \
  apps/api/api.log \
  apps/api/server_log.txt \
  apps/web/web.log \
  web.log

if [ "$KEEP_API_DIST" = false ]; then
  rm -rf apps/api/dist
fi

find . \
  -path './node_modules' -prune -o \
  -path './docker-data' -prune -o \
  -path './.git' -prune -o \
  -type d -name '__pycache__' -exec rm -rf {} +

find . \
  -path './node_modules' -prune -o \
  -path './docker-data' -prune -o \
  -path './.git' -prune -o \
  -type f \( -name '*.log' -o -name '.DS_Store' \) -exec rm -f {} +

echo "Runtime artifacts cleaned."
