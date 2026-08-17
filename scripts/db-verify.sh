#!/usr/bin/env bash
# Apply every migration to a throwaway PostgreSQL database and run the RLS suite.
#
# This exists so the database contract is executed, not eyeballed. It runs in CI
# against a plain postgres service container; locally, `pnpm db:reset` against
# the Supabase CLI is the equivalent for day-to-day work.
set -euo pipefail

DB_NAME="${DB_NAME:-tract_rls_check}"
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> recreating ${DB_NAME}"
psql -q -d postgres -c "drop database if exists ${DB_NAME};"
psql -q -d postgres -c "create database ${DB_NAME};"

echo "==> installing local auth shim"
psql -q -v ON_ERROR_STOP=1 -d "${DB_NAME}" -f "${ROOT}/scripts/local-auth-shim.sql"

echo "==> applying migrations"
for migration in "${ROOT}"/supabase/migrations/*.sql; do
  echo "    $(basename "${migration}")"
  psql -q -v ON_ERROR_STOP=1 -d "${DB_NAME}" -f "${migration}"
done

echo "==> running row level security suite"
psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" -f "${ROOT}/scripts/rls-tests.sql"

echo "==> dropping ${DB_NAME}"
psql -q -d postgres -c "drop database if exists ${DB_NAME};"
echo "database contract verified"
