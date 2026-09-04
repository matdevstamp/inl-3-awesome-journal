#!/usr/bin/env bash
# Starts a local PostgreSQL 16 container for development and prints the
# DATABASE_URL to use. Idempotent — safe to run every session.
#
# Requires Docker (or Podman with a `docker` alias). No container runtime
# on PATH? Fall back to a local postgres binary if one exists.
set -euo pipefail

CONTAINER_NAME="awesome-journal-pg"
DB_NAME="healthaccess"
DB_USER="healthaccess"
DB_PASS="healthaccess"
PORT="${PGPORT:-5432}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${PORT}/${DB_NAME}"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "${CONTAINER_NAME}"; then
  echo "Postgres container '${CONTAINER_NAME}' is already running."
  echo "DATABASE_URL=${DATABASE_URL}"
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "Starting postgres:16 container '${CONTAINER_NAME}' on port ${PORT}..."
  docker run -d \
    --name "${CONTAINER_NAME}" \
    -e POSTGRES_DB="${DB_NAME}" \
    -e POSTGRES_USER="${DB_USER}" \
    -e POSTGRES_PASSWORD="${DB_PASS}" \
    -p "${PORT}:5432" \
    --health-cmd "pg_isready -U ${DB_USER} -d ${DB_NAME}" \
    --health-interval 2s \
    --health-timeout 2s \
    --health-retries 30 \
    postgres:16 >/dev/null

  echo "Waiting for Postgres to accept connections..."
  for _ in $(seq 1 30); do
    if docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
      echo "Postgres is ready."
      echo "DATABASE_URL=${DATABASE_URL}"
      echo
      echo "Next: npm run db:migrate && npm run db:seed"
      exit 0
    fi
    sleep 1
  done
  echo "Timed out waiting for Postgres. Check: docker logs ${CONTAINER_NAME}" >&2
  exit 1
fi

if command -v pg_ctl >/dev/null 2>&1; then
  echo "No Docker found; assuming a local Postgres server on port ${PORT}."
  echo "DATABASE_URL=${DATABASE_URL}"
  exit 0
fi

echo "Neither Docker nor a local Postgres was found." >&2
echo "Install Docker or Postgres, or ask a teammate for the shared dev DB." >&2
exit 1
