# Working rules for this repository

## TRACT project constitution

Before substantive work, read `docs/TRACT_MASTER_RECOVERY_BUILD.md` and the
current files under `docs/handoff/`. The master recovery document defines
product scope, acceptance criteria, agent coordination, Git handoff and
deployment gates.

Read `docs/architecture/decisions.md` before changing anything load-bearing. It
records why, which is what makes a decision safe to revisit.

## Verify with

```bash
pnpm check        # format, lint, typecheck, test, content lint, build
pnpm db:verify    # migrations + RLS suite against real PostgreSQL
pnpm test:e2e     # Playwright against a production build
```

A change is not done until all three pass.

## Invariants

These are enforced by tests and constraints. If you find yourself weakening one
to make something pass, stop — the test is the requirement.

1. **Money is integer cents. Rates are basis points.** All arithmetic lives in
   `@tract/mortgage-math`. No component computes a financial figure inline.
2. **A marketing form is not an application.** No government identifier, account
   number, income documentation, or file upload — ever, anywhere on this site.
3. **The first-party write is authoritative.** Never make a consumer wait on a
   third party, and never return success without a durable write.
4. **RLS and an application check. Both.** A new table gets policies and
   assertions in `scripts/rls-tests.sql` in the same change.
5. **Revoke function EXECUTE from PUBLIC**, not just from `anon` and
   `authenticated`. PostgreSQL grants it to `PUBLIC` by default.
6. **Nothing claims an unestablished fact.** Licence values are nullable and
   render a pending state. Fixtures cannot be published.
7. **No personal data to analytics.** `inspectEvent` is the gate. Do not add a
   bypass.
8. **Reserve spend before calling a provider.** Under a lock. An unknown outcome
   holds the reservation.
9. **Secrets are `server-only`.** No `NEXT_PUBLIC_` secret, ever.
10. **Comments explain why, not what.** The code says what it does.

## Adding a page

1. Register it in `apps/web/content/routes.ts` with an explicit indexation
   decision. Unregistered means it never reaches the sitemap — that is intended.
2. Export metadata via `pageMetadata`.
3. If it is a program or content page, satisfy the page contract in
   `docs/product/mortgage-core.md`.
4. `pnpm content:lint`.

## Adding an integration

1. Define the port first, in `packages/integrations`.
2. Write the disabled adapter, then the fixture adapter, then the real one.
3. Add the mode to the environment schema; a live mode must require its
   credential.
4. Classify the data it handles against
   `docs/security/data-classification.md`.
5. Add it to `/admin/integrations` and to the readiness board.
6. Document it in `docs/integrations/`.

## Never

- Deploy, publish, message a real person, import a real contact, spend money, or
  mutate a production account without explicit approval.
- Use real borrower data in a fixture, a test, or a screenshot.
- Add a status that implies a credit decision to the marketing schema.
- Publish a page whose claims are not traced to a current primary source.
