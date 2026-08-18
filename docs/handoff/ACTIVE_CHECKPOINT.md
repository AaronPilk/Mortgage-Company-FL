# Active checkpoint

Checkpoint: Phase 6 — SEO, AEO, content and analytics
Active agent: Codex
Started: 2026-08-18T01:35:01Z
Status: in progress

## Integration prerequisite

origin/main advanced by five large, overlapping implementation commits while the isolated recovery
branch was completing Phase 5. Before new Phase 6 implementation:

- inspect the newer root and app-level instructions from origin/main;
- compare its property, Vision, planner, RendProp, content, migration and handoff contracts against
  the verified recovery implementation;
- preserve both histories and integrate in a new recoverable branch/worktree;
- do not overwrite the new main, discard either implementation, renumber migrations by guess, or
  deploy a mixed artifact before the merged database and browser contracts pass.

This is a repository-integration prerequisite, not permission to change any remote infrastructure.

## Exact scope

- Reconcile the verified Phase 0–5 recovery branch with the five newer origin/main commits before
  adding overlapping public product or database work.
- Keep the Resources route noindex until it contains substantive, reviewed material.
- Add a small reviewed resource batch with visible author, reviewer, source, publication and review
  evidence; do not mass-publish drafts.
- Complete content/source/revision workflow presentation and truthful Article/BlogPosting,
  WebPage, Breadcrumb, Organization and WebSite schema tests.
- Confirm sitemap, robots, manifest and offline behavior; add an RSS or Atom feed and glossary only
  when each has deliberate useful content.
- Complete the closed, PII-rejecting analytics vocabulary and wire only approved product events.
- Add configuration-name-only readiness for Search Console, Bing and approved analytics; do not
  create external properties or tags without established configuration and authority.
- Ship one original, cited linkable asset whose claims are supportable and review state is explicit.

## Allowed files and directories

- Integration-only worktree/branch metadata and conflict resolutions that preserve verified behavior
- Public resource/content/glossary/feed routes and reviewed content data
- SEO, structured-data, sitemap, robots, manifest, offline and analytics contracts
- Content workflow/admin read surfaces where Phase 6 evidence requires them
- Focused tests and docs/**

## Acceptance criteria

- The integrated base preserves all Phase 0–5 safety and product contracts plus every intentional
  newer-main capability selected during review.
- No placeholder or unreviewed draft is indexable.
- Every indexable route has unique metadata, useful visible content, deliberate canonical behavior
  and schema that matches the page.
- Reviewed resources expose author/reviewer/source/review evidence and the feed contains only
  eligible published content.
- Analytics accepts only the closed event vocabulary and rejects contact, income, debt, credit,
  precise address, prompt and narrative data.
- Search/analytics verification uses names and explicit unconfigured states only.
- Full repository, database, desktop/mobile, OpenNext and 50-route Worker checks pass after
  integration.

## Expected commands

Read-only Git graph/diff inspection, isolated integration worktree creation, focused migration
comparison, pnpm check, local PostgreSQL-backed pnpm db:verify, pnpm test:e2e,
pnpm cf:build, pnpm cf:preview, pnpm smoke:routes, git diff --check and secret scanning.

## Do not touch

- Production database data, migrations, RLS, Auth settings, credentials or Storage.
- Vercel projects, deployments, domains or environment settings.
- Cloudflare deployment configuration, secrets, remote tags or verification properties.
- Unreviewed mass content, unsupported market statistics or invented report data.
- Remote CRM, email, MLS, media or paid AI provider calls.
- The existing main working tree or either side of the divergent history through destructive Git
  operations.
