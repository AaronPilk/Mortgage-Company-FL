# Editorial policy

## Every indexable page must have

One primary intent · unique value beyond a paraphrase of the top search results ·
verified facts with primary sources · calculations checked by tests or a reviewer
· no unsupported rate, fee, limit, approval, savings, or return claim · a visible
author and reviewer · publication and review dates · internal links chosen for
the reader · a title and description written for the page · no hidden text · a
page-specific CTA · image rights and alt text · indexation changed deliberately
from `noindex` to `index` · compliance approval where policy requires it.

## Enforced mechanically

`content_items` carries a database constraint: a page cannot be `index` unless it
is `published`, has an author, has a reviewer, and has a review date. That is the
quality gate as a constraint rather than a checklist someone can skip.

`pnpm content:lint` checks route registration, metadata presence, title and
description length and uniqueness, internal link resolution, legal-draft
labelling, and fabricated trust signals.

Neither certifies that a claim is true. That is human review, and the linter
prints a reminder saying so.

## Publishing sequence

1. Brief, with the intent and the sources to check.
2. Draft, `noindex`.
3. Review by a qualified person against the primary sources.
4. Compliance review where required.
5. Publish, still `noindex`.
6. Flip to `index` — a separate privileged action, not a side effect of saving.
7. Set the next review date. Time-sensitive financial material expires.

## Scale

A small reviewed batch, then measure indexing, engagement, conversion,
corrections, and the questions support still receives. Update the standard before
increasing volume.

Retire or consolidate weak pages rather than keeping them for the page count.
Keep a redirect map. Never change `lastmod` because a build ran.

## Prohibited

Templated city pages with only a name substituted · doorway pages · automatically
generated articles published without review · fabricated citations, reviews,
awards, or statistics · marked-up content the visitor cannot see · content
written only to be quoted by a model.

A city page that carries its own real, sourced local material and clears the
county bar — the settlement's geography and flood reality, the questions a buyer
there must research, coupled to a real parent county, asserting no market figure
or tax rate — is not a substituted template and is permitted (see DECISIONS.md,
2026-08-26). It ships noindex until a named reviewer verifies its sources
(`docs/compliance/city-pages.md`).
