# Agent referral dashboard — data-path decision record

Status: proposed (25 Aug 2026). This records the data-path and privacy decisions
behind the agent partner dashboard at `/agents/dashboard`: a signed-in,
claimed-and-approved real-estate-agent partner sees the referrals their
`/r/<slug>` link drove — coarse counts, three lifecycle buckets, and recency —
and nothing that identifies a consumer.

The whole surface is dark behind `FEATURE_AGENT_DASHBOARD` (which also requires
accounts). The application layer described here is delivered together with the
integrator's migration; this document is the contract the two sides meet on.

## 1. What the agent may see, and what they may never see

The agent sees only the **shape** of their referred pipeline:

- four counts — total, and the three buckets;
- a coarse per-referral timeline of `(bucket, day)` rows, newest first;
- the timestamp of the most recent referral.

The agent never sees a consumer's **name, email, phone, message, or intent** —
not on the page, not in the API, not in a payload that reaches the browser. This
is the marketing site's standing posture (invariant 2 and the no-personal-data
analytics gate, invariant 7) applied to a partner surface: a referrer is told
_that_ their link is working and _roughly where_ those people are, never _who_
they are.

## 2. Buckets, not statuses — so nothing implies a credit decision

The raw marketing lead status is folded into exactly three coarse buckets, and
the fold happens **in SQL**, inside the RPC, never in the app:

| bucket    | raw marketing statuses it absorbs               |
| --------- | ----------------------------------------------- |
| `new`     | `new`, `queued`, `synced`, `error`              |
| `working` | `contacted`, `qualified`, `application_invited` |
| `closed`  | `closed`, `suppressed`                          |

The point of the fold is invariant 6: **no status the agent sees may imply a
credit decision.** "Closed" means the referral lifecycle wrapped up — not
approved, not denied. The app-layer reader (`readReferralTimeline`) additionally
drops any row whose bucket is not one of the three, so a raw status that ever
slipped past the SQL fold can never render as a stray, meaning-bearing label.

## 3. Definer RPC on the RLS-subject client, not a table read

**Decision: the app reads through two `SECURITY DEFINER` Postgres RPCs called on
the request-scoped (RLS-subject) client — the exact precedent set by the loan
portal (`apps/web/lib/loan.ts`).**

```
agent_referral_summary()            → one row {total_count, new_count,
                                        working_count, closed_count,
                                        last_referral_at}
agent_referral_timeline(p_limit=50) → rows {status_bucket, referred_on},
                                        newest first
```

Both functions **self-scope to the caller's own approved agent row by
`auth.uid()`** and return zeros / an empty set for anyone who is not a claimed,
approved partner. `EXECUTE` is revoked from `PUBLIC` (invariant 5); the app calls
them on the RLS-subject client so the identity is the session's, never a
service-role escalation.

Why a definer RPC rather than a direct join the app assembles from `leads` and
the referral attribution tables:

- **The source rows carry consumer PII.** The lead tables live under strict RLS
  keyed to staff roles, not to referrers. An agent has no read grant there and
  must not get one. A definer function is the narrow, audited door that reads
  those rows on the caller's behalf and returns **only** the non-identifying
  aggregate — the join, the bucketing, and the redaction all happen behind the
  door, where the agent's grants cannot reach the underlying columns.
- **The aggregate is the boundary.** Exposing counts and a capped `(bucket,
day)` list — rather than event rows — means no per-consumer record ever
  crosses into the app tier. There is nothing to accidentally widen into a name.
- **Failure is closed.** Every reader defaults to zeros / empty on any error or
  null. The worst case for a bug in this path is a partner shown their own
  zeros; it can never fail open into another agent's numbers.

## 4. Column-vs-events — why counts, not a feed

The dashboard deliberately surfaces **derived counts and a coarse day-stamped
list**, not an event stream. A per-event feed (one row per consumer action)
would, even stripped of names, leak a re-identifiable shape — timing, sequence,
volume spikes tied to a specific campaign — and would tempt a future "just add
the city" change that crosses the PII line. The aggregate shape is the smallest
thing that answers the agent's real question ("is my link working, and roughly
where are those people?") while carrying nothing a consumer would recognize as
theirs. The timeline is capped (`p_limit`, default 50) so the surface stays
coarse even for a high-volume partner.

## 5. RLS and an application check — both (ADR-005)

Eligibility to see the dashboard is checked twice:

- **RLS**, in the RPCs' `auth.uid()` self-scoping and in the `agents` table's
  "owners read own agent row" policy.
- **An application check**, in `resolveApprovedAgent`: the row must be
  `owner_user_id = auth.uid()` **and** `status = 'approved'`. A pending
  applicant, an imported unclaimed public-record row, or a plain consumer
  resolves to null and the page renders an honest "profile pending / join"
  state — with **no referral read attempted at all**.

The agent↔user link already exists (`agents.owner_user_id = auth.uid()`, claimed
during account creation), so no new linking mechanism is introduced here.

## 6. Surfaces delivered

- `apps/web/lib/agent-referrals.ts` — `server-only` data access: the flag gate,
  the approved-agent resolver, and the two RPC readers (null/array-safe, default
  zeros / `[]`).
- `apps/web/app/agents/dashboard/page.tsx` — the server component: flag →
  `notFound`; signed-out → the account sign-in card; not-an-approved-partner →
  the pending/join state; approved → the dashboard. `force-dynamic`, `noIndex`,
  and unregistered in the route table (private surfaces are never in the
  sitemap, by design).
- `apps/web/components/agents/referral-dashboard.tsx` — the `"use client"`
  presentational surface: four stat tiles, the agent's own `/r/<slug>` share
  link with a copy button, relative recency, and the coarse timeline. It is
  handed only the agent's own first name and slug plus the coarse figures — no
  consumer field is in scope to render.
- `apps/web/app/api/v1/account/agent-referrals/route.ts` — a thin authed `GET`
  for a client refresh: same client, same RPCs, same eligibility gate,
  `Cache-Control: no-store`, shaped refusals (404 dark / 401 signed-out / 403
  non-partner).

## 7. Boundary — who owns what

The **integrator owns the migration**: the two `SECURITY DEFINER` functions with
their `auth.uid()` self-scoping and bucketing, the `EXECUTE` revokes, and the
`scripts/rls-tests.sql` coverage (invariant 4). The application codes against the
RPC **names and row shapes** in §3 exactly; the unit suite
(`apps/web/tests/unit/agent-referrals.test.ts`) pins those names, the `p_limit`
argument, the row→view mapping, and the fail-closed defaults, so a drift on
either side of the boundary shows up as a red test.
