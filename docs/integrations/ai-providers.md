# AI providers

## Status: disabled

`AI_MODE=disabled` by default. The disabled provider refuses every request, so a
misconfiguration cannot spend money.

## Two layers

The **application orchestrator** owns policy: feature gating, redaction, data
classification, provider selection, prompt version, budget reservation, and
output validation.

A **gateway** (Cloudflare AI Gateway or equivalent) adds observability, caching
where safe, traffic control, and cost visibility.

The gateway does not replace application authorization or the usage ledger. It
sits in front of the provider, not in front of the policy.

## Model identifiers are configuration

`ModelRoute` maps a stable internal key to a provider identifier. Feature code
references `"narrative"`, never a vendor model string. A model change is a
configuration change.

Each route declares `allowedDataClasses`. `assertRouteAccepts` refuses any class
a route has not been explicitly cleared for, and refuses `restricted` data
outright regardless of route — restricted data does not reach an AI provider
without an approved data map, full stop.

## Spend

Reservation happens before the provider call, inside a transaction that locks the
quota bucket. Without the lock, two concurrent requests both read "budget
available" and both spend it.

Settlement:

| Outcome                     | Ledger effect                                     |
| --------------------------- | ------------------------------------------------- |
| Succeeded                   | Charge actual, release the surplus                |
| Failed before billable work | Release everything                                |
| Failed after billable work  | Charge actual                                     |
| **Unknown**                 | **Hold the reservation, flag for reconciliation** |

The unknown case matters. Releasing understates spend against a charge the
provider may still bill; holding overstates it until a human resolves it.
Overstating is the safe direction.

## Output is untrusted input

Model output is validated against a registered schema. On failure: one repair
attempt with a schema-repair instruction, then fall back to deterministic content
or a human-review state. Exactly one — more than one is a retry storm against a
paid API.

Malformed partial JSON is never rendered as a report.

## What AI may never do

Determine creditworthiness · approve, deny, or counteroffer · issue adverse
action · make a final product, lender, rate, fee, lock, or suitability decision ·
claim a consumer qualifies · negotiate terms · pull credit · submit an
application · deliver a regulated disclosure · choose an affiliate for a consumer
· file or reference a SAR · publish a rate or a mortgage advertisement · send a
production communication without human review · perform the arithmetic behind any
financial figure.

## Prompt registry

Versioned, with input schema, output schema, allowed data classes, prohibited
outputs, evaluation fixtures, owner, and review date. The prompt version is
recorded on every output. A prompt change that could alter a consumer-facing
financial interpretation requires evaluation and review.

## Provider notes

Verify current documentation before implementing any of these; retention,
pricing, and endpoints change.

- **OpenAI** — Responses API for supported flows. Review the retention behaviour
  of the specific endpoint; it is not uniform across features.
- **Anthropic** — Messages API. Prompt caching only where a stable reusable
  prefix exists. Do not assume every model or feature is zero-retention; verify
  for the selected model and account.
- **Higgsfield / BytePlus Seedance** — media generation, both disabled. Implement
  only against official account documentation. Never an endpoint from a
  third-party blog, and never an unofficial reseller without a vendor decision,
  a contract, and a data review.

## Generated media

Every visual output records source media, transformation request, provider, model
key, seed where available, rights status, and a visible "Concept visualization"
label. Cleanup may remove movable clutter in a labelled visualization. It may not
remove damage, structural elements, utilities, permanent features, or
neighbouring conditions. Virtual staging is always labelled.
