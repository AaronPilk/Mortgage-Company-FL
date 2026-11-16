#!/usr/bin/env bash
# Scan tracked files for credential-shaped strings.
#
# Runs in CI (security job) and locally: `./scripts/secret-scan.sh`.
#
# One allowance, and it is narrow on purpose: NEXT_PUBLIC_* lines in
# apps/web/.env.production. Next compiles every NEXT_PUBLIC_* value into the
# browser bundle, so nothing on those lines can be secret, and
# scripts/check-site-url.mjs fails the build if a non-NEXT_PUBLIC_ key ever
# lands in that file. The Supabase anon key is a JWT, which is why it matches
# the pattern below; it is public by design and Row Level Security is what
# protects the data behind it. Every other file, including that one on any
# non-NEXT_PUBLIC_ line, is scanned in full.
set -euo pipefail

PATTERN='(sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'
PUBLIC_ENV_FILE='apps/web/.env.production'

# .env.example holds names and empty values by design; docs and the lockfile
# hold hashes and examples, never credentials.
matches="$(git grep -nIE "$PATTERN" -- ':!.env.example' ':!*.md' ':!pnpm-lock.yaml' || true)"

# Drop the one allowed shape: "<public env file>:<line>:NEXT_PUBLIC_…=…".
filtered="$(printf '%s\n' "$matches" | grep -vE "^${PUBLIC_ENV_FILE//./\\.}:[0-9]+:NEXT_PUBLIC_[A-Z0-9_]+=" || true)"

if [ -n "$filtered" ]; then
  printf '%s\n' "$filtered"
  echo "::error::a credential-shaped string is present in a tracked file"
  exit 1
fi
echo "secret scan: clean"
