# Dependency baseline

Versions selected on 2026-08-17 and verified to be mutually compatible by running
the full check suite against them. The lockfile is authoritative; this file
records the reasoning.

| Package               | Version  | Note                                                                       |
| --------------------- | -------- | -------------------------------------------------------------------------- |
| next                  | ^16.3.1  | App Router, Turbopack build                                                |
| react / react-dom     | ^19.2.8  |                                                                            |
| typescript            | ~5.9.3   | See ADR-010. 7.0.2 works, but `typescript-eslint` does not support it yet. |
| zod                   | ^4.4.3   | Runtime validation and shared schemas                                      |
| vitest                | ^4.1.10  | Unit and integration                                                       |
| @playwright/test      | ^1.62.1  | End-to-end                                                                 |
| tailwindcss           | ^4.3.3   | CSS-first configuration via `@theme`                                       |
| turbo                 | ^2.10.10 | Task orchestration                                                         |
| eslint                | ^10.8.1  | Flat config                                                                |
| typescript-eslint     | ^8.67.0  | Constrains the TypeScript version — see ADR-010                            |
| pnpm                  | 10.28.0  | Workspaces                                                                 |
| @supabase/supabase-js | ^2.112.3 |                                                                            |
| @supabase/ssr         | ^0.12.4  | Cookie-based server auth                                                   |
| node                  | >= 20.11 | Verified on 22                                                             |

## Decisions

**TypeScript 5.9 rather than 7.0.** The build was verified on 7.0.2 and passes
under it. `typescript-eslint` does not support 7 yet, and for this codebase a
working linter is worth more than the compiler speedup. Nothing in the source
depends on a 7-only feature, so the upgrade is a version bump once the linter
catches up. See ADR-010.

**Tailwind 4's CSS-first configuration.** Tokens live in `@theme` inside
`app/globals.css` and are mirrored as typed exports in `@tract/tokens` for a
future native client. There is no `tailwind.config.js`.

**No dependency for a one-line helper.** Contact normalization, redaction,
attribution parsing, and backoff are small typed modules with tests rather than
packages, because each one encodes a decision specific to this domain.

## Upgrade procedure

1. Bump one ecosystem at a time.
2. `pnpm check` must pass.
3. `pnpm db:verify` must pass.
4. `pnpm test:e2e` must pass.
5. Re-verify Cloudflare compatibility on any Next.js major, since the OpenNext
   adapter tracks Next.js releases.
6. Update this table.
