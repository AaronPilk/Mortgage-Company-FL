# Runbook

Operating instructions for the TRACT Mortgage platform.

## Local development

```bash
pnpm install
cp .env.example .env.local     # no secret needed; everything defaults to off
pnpm dev                       # http://localhost:3000
```

The application boots with every integration disabled or on fixtures. You do not
need a production credential to work on it, and you should not use one.

## Database

The Supabase CLI runs the full local stack:

```bash
pnpm db:start          # starts Postgres, Auth, Studio
pnpm db:reset          # drop, re-apply every migration, run seed.sql
pnpm db:types          # regenerate packages/database/src/generated.ts
pnpm db:stop
```

### Verifying the database contract without Supabase

`pnpm db:verify` applies every migration to a throwaway database on a plain
PostgreSQL instance and runs the row-level-security suite. This is what CI runs.

```bash
PGHOST=localhost PGPORT=5432 PGUSER=postgres PGPASSWORD=postgres pnpm db:verify
```

`scripts/local-auth-shim.sql` recreates only the pieces the migrations depend on
— the `auth` schema, `auth.uid()`, and the `anon` / `authenticated` /
`service_role` roles. It is never applied to a Supabase project.

### Migrations

Migrations are append-only once shared. To add one:

1. Create `supabase/migrations/<timestamp>_<description>.sql`.
2. Run `pnpm db:reset` locally and confirm it applies cleanly from scratch.
3. Add or update assertions in `scripts/rls-tests.sql` for anything the change
   affects. A new table with RLS enabled but no policy test is not done.
4. Run `pnpm db:verify`.
5. Regenerate types with `pnpm db:types`.

Never edit a migration that has been applied anywhere but your own machine.

## Testing

```bash
pnpm test                 # unit and integration (Vitest)
pnpm test:e2e             # Playwright, against a production build
pnpm content:lint         # route registry, metadata, links, trust signals
pnpm typecheck
pnpm check                # everything above except e2e and db
```

If your environment has a preinstalled Chromium whose revision does not match
this Playwright version, point at it:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium pnpm test:e2e
```

## Environment

`.env.example` is the reference. Every variable is annotated `[browser-safe]` or
`[server-only]`. A `[server-only]` value must never gain a `NEXT_PUBLIC_` prefix.

`NEXT_PUBLIC_SITE_URL` is read at **build** time as well as at runtime, because
`robots.txt` and `sitemap.xml` are statically generated. Set it in the build
environment or those files will point at localhost.

### Feature modes

`disabled` → no external effect. `fixture` → deterministic local double.
`sandbox` / `production` → the real provider, and the mode requires its
credential to be present or the environment fails to parse.

## Deployment

Cloudflare Workers via the supported OpenNext adapter.

```bash
pnpm deploy:preflight     # refuses if the configuration is not production-ready
pnpm --filter @tract/web preview
pnpm --filter @tract/web deploy
```

The preflight prints the NAME of any misconfigured variable and never its value.
It currently blocks on: the development `HASH_PEPPER`, fixture listing data, a
missing service-role key, and a bot challenge that is not in production mode.

### Secrets

Never in `wrangler.jsonc`. Set them as secret bindings:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
npx wrangler secret put TURNSTILE_SECRET_KEY --env production
npx wrangler secret put GHL_PRIVATE_INTEGRATION_TOKEN --env production
npx wrangler secret put HASH_PEPPER --env production
```

Rotating `HASH_PEPPER` resets deduplication and rate-limit buckets. Expect a
short window of duplicate leads after a rotation; that is the correct tradeoff.

### Rollback

Worker deployments roll back through Cloudflare's deployment history. Database
migrations do not roll back automatically — take a backup before applying one to
production and write the reverse statement into the migration's comment header
when a reversal is practical.

## Incidents

### The lead endpoint is returning 503

`INTEGRATION_UNAVAILABLE` from `/api/v1/leads` means the database is unreachable.
Leads are not being stored. This is a full outage of the conversion path.

1. Check `/api/v1/health` — `database: "unconfigured"` means the service-role key
   or Supabase URL is missing from the environment.
2. Check the Supabase project status.
3. The endpoint fails closed on purpose. Do not add a fallback that returns
   success without a durable write.

### CRM syncs are backing up

Leads are safe; only the projection is behind.

1. `/admin/integrations` shows mode, health, and backlog.
2. Rows retry with bounded exponential backoff, then dead-letter after six
   attempts. A 4xx is terminal and never retried.
3. Replay from `/admin/jobs` requires a stated reason and writes an audit record.

### AI spend looks wrong

1. `/admin/usage` separates reserved from charged.
2. Jobs with `requires_reconciliation` are those whose provider outcome was
   unknown; their reservation is held rather than released, so spend is
   overstated rather than understated until a human resolves them.
3. Kill switches exist per feature, per provider, and globally. Engaging the
   global switch causes `reserve_ai_budget` to refuse every new reservation
   immediately.

### A credential may have leaked

1. Rotate at the provider first, then update the secret binding.
2. `SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security. Treat its exposure as
   a data incident, not a configuration error.
3. Check `audit_events` for privileged actions in the window. The table is
   append-only and has no update or delete path.
4. Follow `docs/security/incident-runbook.md`.

## Things that must not happen

- No secret in a `NEXT_PUBLIC_` variable, a log line, an error body, or a fixture.
- No borrower personal information in git, an issue title, a commit message, a
  URL, an analytics event, or a prompt.
- No fixture listing data published. The database constraint blocks it; do not
  work around it.
- No production provider call, message send, or paid AI request from a test.
