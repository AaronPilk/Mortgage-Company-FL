# Meta Conversions API integration

## Role

Server-side conversion signal for paid social. It reports a single `Lead`
conversion to Meta from the transactional outbox so a campaign can optimize on a
real lead instead of a browser click.

It is **not** the system of record and **not** a marketing database. It holds no
state, receives no data back, and stores nothing. Like the CRM, it is a
one-way projection of application truth; if it and the database disagree, the
database is right.

The whole feature ships dark behind `META_CAPI_MODE` and stays off until the
company is licensed and Meta advertising is live (see **Blocked** below).

## Field boundary — hashed identifiers only

The complete set of data permitted to leave the application for Meta is the
`MetaConversionEvent` type in `packages/integrations/src/meta-capi/ports.ts`,
assembled by `mapLeadToConversion` from an explicit whitelist. The lead is never
spread into the event, so a field cannot ride along by accident.

What crosses the boundary, and in what form:

| Field                     | Value                                                        |
| ------------------------- | ------------------------------------------------------------ |
| `user_data.em`            | SHA-256 of the trimmed, lowercased email                     |
| `user_data.ph`            | SHA-256 of the digits-only phone (country code kept)         |
| `user_data.fbc`           | `fb.1.<ms>.<fbclid>` click id — an opaque Meta token, no PII |
| `event_id`                | our submission id, for pixel/server deduplication            |
| `event_time`              | the consent receipt time (seconds), not the send time        |
| `event_source_url`        | the landing path resolved against the site origin            |
| `custom_data.lead_intent` | a coarse intent label (e.g. `purchase`) — never a figure     |

An empty identifier is never hashed. Hashing `""` would emit the SHA-256 of the
empty string — a constant every consentless or malformed lead would share, which
Meta would match to one phantom person. An absent identifier stays absent, and a
lead with no hashable email or phone produces no event at all.

## Consent gate

Enforced inside `dispatchLeadConversion`, before anything is mapped or sent:

```
hasMarketingConsent = consent.emailMarketing === true || consent.smsMarketing === true
```

Only an explicit email- or SMS-marketing opt-in qualifies. `privacyAccepted` and
`contactRequested` are literally true on every lead and say nothing about
marketing consent, so they are deliberately not consulted. A lead without
marketing consent is skipped with `no_consent` and **no network call is made**.

## Suppression gate — do not sell/share

Consent is necessary but not sufficient. Before the dispatch runs, the drain
checks the `suppressions` table (`leadAdSuppressed`) for the lead's email or
phone against the `all` (global opt-out) and `ads` (do-not-sell/share) channels.
A match blocks the send — the person opted out of having their data shared with
an ad platform, even if they accepted marketing contact. The check uses exact
`.eq()` matches (never an interpolated filter) and **fails closed**: if the
table cannot be read, the person's status is unknown, so the conversion is
skipped rather than sent. The `ads` channel is added by
`20260825000800_suppression_ads_channel.sql`; a do-not-sell/share flow writes it,
and a global `all` opt-out blocks the ad send regardless.

## Modes

| Mode                     | Behaviour                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disabled`               | Default. No external effect. Nothing is transmitted.                                                                                                                          |
| `fixture`                | In-memory double for development and tests; records events, never sends.                                                                                                      |
| `sandbox` / `production` | Real API. Requires the pixel id and access token, or the environment fails to parse. A live mode missing a credential at runtime falls back to Disabled rather than guessing. |

`META_CAPI_ACCESS_TOKEN` is a secret (`SECRET_ENV_KEYS`) and is `server-only`.
It is sent to Meta **in the JSON request body, never in the URL**, so it cannot
end up in an access log, a referer header, or a proxy trace.
`META_CAPI_TEST_EVENT_CODE` routes events to the Events Manager test tab and is
the intended way to verify delivery before go-live.

## Reliability

Sends go through the transactional outbox, never inline in a consumer request,
and reuse the CRM port's retry classification and backoff rather than a second
copy of that logic. The dispatch fires from the outbox drain — both the
token-guarded `/api/v1/internal/outbox/drain` route and the Cloudflare worker
cron (`worker-entry.js`) — and only **after** the row has been settled, so a
slow Meta call can never strand a row mid-completion. In the drain it runs with
a single attempt (`maxAttempts: 1`): Meta deduplicates on `event_id`, and a
later re-drain gives the natural retry, so no backoff sits on the drain loop.

- Dispatch **never throws.** Every outcome is a `LeadConversionDispatch`
  (`skipped` / `sent` / `failed`), so a Meta outage can never touch the CRM
  completion path or the outbox worker.
- Retry: 429, 5xx, and network/abort errors. **Never a 4xx** — a 400 will not
  become a 200 on a later attempt.
- Backoff: bounded exponential with full jitter (`backoffMs`), shared with the
  CRM.
- Attempts are capped (default 3) before giving up as `failed`.
- The mapped event passes `assertCrmPayloadSafe` — the same screen the CRM uses —
  as a second barrier over the whitelist before transmission.
- The request is `AbortController`-bounded (default 3s) and its error is generic:
  it carries only the HTTP status and Meta's opaque `fbtrace_id`, never the
  provider's response body and never the access token.

## What is never sent

No name, no raw email, no raw phone, no address. Nothing from the mortgage side
of the product: no government identifier, no credit score or band, no income,
debt, or asset figure, no calculator detail, no loan-file data, no planner
answers. `custom_data` carries a coarse intent label and nothing else — never a
monetary value. The `assertCrmPayloadSafe` screen enforces this at any nesting
depth and in any casing, and a unit test asserts a contaminated source cannot
leak.

## The launch interlock

Two independent switches must both say go, so a single flag can never start
sharing PII:

- `META_CAPI_MODE` = `sandbox`/`production` **and** both credentials present.
- `META_CAPI_LIVE_CLEARED` = true — the explicit operational acknowledgement
  that licensing and advertising review have cleared.

The app factory (`apps/web/lib/meta-capi.ts`) additionally refuses while
`isPreLaunch()` is true. The worker cron cannot read that code-level signal, so
`META_CAPI_LIVE_CLEARED` is its licensing gate — set it true **only** once the
business is licensed and ad review is operating. With either switch off, the
port is Disabled and no identifier leaves; the suppression query does not even
run.

## Blocked

- **Advertising review and licensing.** This is a pre-launch, unlicensed
  lead-gen surface. Until the company is licensed and paid mortgage advertising
  is permitted to run (see `licensingStatus` / `isPreLaunch` in
  `apps/web/lib/site.ts`), leave `META_CAPI_MODE` `disabled` and
  `META_CAPI_LIVE_CLEARED` false.
- **Privacy representation.** The published privacy page states the site does not
  send identifiers to an advertising platform. That copy must be reconciled by
  counsel with the hashed-identifier sharing this feature performs, and the
  consumer disclosure/consent language updated, before `META_CAPI_LIVE_CLEARED`
  is set true.
- Live pixel id and access token — needs the company-owned Meta Business
  account and a reviewed, approved ad account.
- A verified pixel and a passing test event in Meta Events Manager before the
  first live conversion is trusted.
