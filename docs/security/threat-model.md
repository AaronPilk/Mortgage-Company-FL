# Threat model

Assets, actors, the paths that matter, and what stops them.

## Assets, in order of consequence

1. Borrower personal information and any nonpublic personal information.
2. Credentials — above all the Supabase service-role key, which bypasses RLS.
3. Consent records, which are the evidence for every message sent.
4. The audit trail.
5. Provider spend.
6. Reputation and licence standing: a false claim on a public page is a
   regulatory exposure, not a copy problem.

## Actors

- Opportunistic scanners and form-spam bots.
- Competitors scraping content and probing structure.
- A motivated attacker after borrower data or provider credit.
- An insider with legitimate access exceeding their need.
- An honest developer making a mistake at 2am. The most likely one.

## Paths and controls

### Lead endpoint abuse

Content-type and body-size limits before parsing. Same-origin required for the
mutation. Two rate-limit dimensions: a coarse network bucket and a tighter
per-contact bucket, because a distributed script defeats the first and not the
second. Honeypot before Turnstile so the cheap check runs first. Turnstile
verified server-side and **failing closed** on provider unavailability — letting
traffic through during an outage is how a form gets flooded.

### Enumeration of who is in our records

A per-contact rate-limit rejection returns the same generic response as a network
rejection. The success response returns a receipt, not a database identifier. No
error distinguishes "this address already exists" from "this one does not".

### Server-side request forgery via a pasted property link

`resolvePastedLink` parses the URL and returns a host for the consumer to
confirm. The server never fetches an arbitrary URL. Non-HTTP schemes, private
address ranges, and link-local addresses (including the cloud metadata endpoint)
are rejected explicitly, with tests.

### Privilege escalation

Roles live in `user_roles`, never in a client-supplied claim. `has_role` is
`security definer` with an empty `search_path` so it cannot be hijacked by a
schema the caller controls. The RLS suite asserts that a consumer cannot grant
themselves a role, cannot enumerate other users' roles, and cannot call any
privileged function directly.

### Credential exposure

`server-only` imports make a client-side leak a build error. `SECRET_ENV_KEYS`
enumerates what must never appear in a bundle. CI greps tracked files for
credential-shaped strings. The logger redacts before writing, with tests. No
admin view has a reveal-token control.

### Structured-data and canonical injection

Canonical URLs are built from configured origin, never from a request header, and
`absoluteUrl` throws on a protocol-relative path, a foreign origin, or header
injection characters. JSON-LD serialization escapes `<` so a value cannot
terminate its own script element.

### Runaway provider spend

Reservation before the provider call, inside a transaction that locks the quota
bucket. Per-subject, per-feature, and platform ceilings. Concurrency limits. Kill
switches per feature, per provider, and globally, checked at the top of
`reserve_ai_budget`. An unknown outcome holds the reservation rather than
releasing it.

### Misrepresentation on a public page

The most likely regulatory failure, and the one an attacker does not need to be
involved in. Controls: licence values typed as nullable with a pending render
path; a unit test that scans every program page for promissory phrasing; a
content linter that rejects unsubstantiated volume, rating, award, ranking, and
tenure claims and the phrase "Equal Housing Lender"; an end-to-end test asserting
the broker disclosure is present and the lender claim is absent.

## Accepted, with a plan

- **In-process rate limiting.** Correct for a single instance. A shared store
  (KV or Durable Objects) is required before horizontal scale; the interface is
  already abstracted so the swap does not touch the routes.
- **No CSP nonce.** `unsafe-inline` for scripts is a documented exception for
  Next.js inline bootstrap. A nonce-based policy is the follow-up.
- **Service-role key in the request path.** Necessary for the lead write, which
  must not require an authenticated session. Confined to `createServiceClient`
  and to narrow `security definer` functions with fixed signatures.

## Out of scope here

Physical security, employee device management, vendor due diligence, and the
written information security program. Those are the human-owned launch gates in
`docs/compliance/launch-gates.md`.
