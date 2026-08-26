# GoHighLevel integration

## Role

Marketing lifecycle and communications. **Not** the system of record for an
application, a loan file, or any sensitive borrower information.

The CRM is a projection of application truth. If the two disagree, the database
is right.

## Field boundary

The complete set of fields permitted to leave this application for the CRM is the
`CrmLead` type in `packages/integrations/src/crm/port.ts`. Anything not in that
type does not go.

Explicitly never transmitted, enforced by `assertCrmPayloadSafe` at any nesting
depth and in any casing:

Social Security or tax identifiers · dates of birth · bank, routing, or card
numbers · credit reports and scores · income, asset, or employment documentation
· AUS findings · appraisals · underwriting conditions · loan documents ·
passwords or portal credentials · AI prompts · report narrative · full calculator
detail.

Use a secure link to the POS/LOS. Store only the minimum status and identifiers
needed for marketing coordination.

## Modes

| Mode                     | Behaviour                                                                    |
| ------------------------ | ---------------------------------------------------------------------------- |
| `disabled`               | Default. No external effect. Leads are stored first-party only.              |
| `fixture`                | In-memory double for development and tests.                                  |
| `sandbox` / `production` | Real API. Requires token and location id, or the environment fails to parse. |

## Configuration, not code

`GHL_CUSTOM_FIELD_MAP` and `GHL_PIPELINE_MAP` are JSON maps from internal
semantic keys to provider identifiers. A GoHighLevel rebuild is therefore a
variable change, not a code change. An unmapped field is simply not transmitted —
never guessed.

The adapter emits `tract_`-prefixed semantic keys (receipt id, intent, timeline,
source path, consent metadata, UTM/gclid, planner bands, plan summary). The
agent referral engine adds one more: **`tract_referring_agent`**, the slug of
the consenting partner who referred the lead, present only when a `/r/<slug>`
visit resolved to a claimed, approved agent. Map it to a text custom field in
GoHighLevel to receive it; leave it unmapped and referrals still ride the
`agent:<slug>` tag, which needs no configuration. The value is a public agent
slug and nothing more — never a payment, a fee, or anything owed in either
direction.

## Reliability

Writes go through the transactional outbox, never inline in a request.

- Retry: 429 and 5xx and network errors. **Never a 4xx** — a 400 will not become
  a 200 on the fifth attempt, it will just cost five attempts.
- Backoff: bounded exponential with full jitter, capped at five minutes.
- Dead letter after six attempts, visible in `/admin/jobs`.
- Replay requires a stated reason and writes an audit record.
- Idempotency: `leadSyncIdempotencyKey(receiptId, eventType)`, stable across
  retries and distinct across events, plus a unique index on the outbox key.

## Webhooks

`POST /api/v1/webhooks/ghl`. Every check is mandatory:

1. Body size limit before reading.
2. Ed25519 signature verified against `GHL_WEBHOOK_PUBLIC_KEY`. No key configured
   means no webhook is accepted — it fails closed.
3. Replay window of five minutes when the payload carries a timestamp.
4. Deduplication on `(provider, event_id)` with a unique index, so a replayed
   delivery collides rather than being processed twice.
5. Only a redacted payload is stored.

Rejections return a bare 400 without saying which check failed.

## Lifecycle events

Named events rather than tag-driven automation:

`lead.received` · `lead.crm_synced` · `lead.crm_sync_failed` ·
`lead.contact_requested` · `calculator.saved` · `vision.project_created` ·
`vision.report_requested` · `vision.report_ready` ·
`application.handoff_clicked` · `partner.inquiry_received` ·
`consent.sms_revoked` · `consent.email_revoked`

A marketing stage change must never create a legally inaccurate status.
"Preapproved", "approved", "locked", "clear to close", "denied", and "funded"
originate only in the approved authoritative workflow — which is why
`MarketingLeadStatusSchema` does not contain any of them.

## Blocked

- Live token and location id — needs the company-owned GoHighLevel account.
- Custom field and pipeline identifiers — needs the account built.
- Webhook public key — from the provider's current documentation.
- A2P 10DLC brand and campaign registration before any SMS is sent.
