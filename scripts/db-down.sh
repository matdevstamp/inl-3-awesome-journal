#!/usr/bin/env bash
# Stops and removes the local Postgres container started by scripts/db-up.sh.
set -euo pipefail

CONTAINER_NAME="awesome-journal-pg"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "${CONTAINER_NAME}"; then
  docker rm -f "${CONTAINER_NAME}" >/dev/null
  echo "Removed container '${CONTAINER_NAME}'."
else
  echo "No running '${CONTAINER_NAME}' container to stop."
fi
