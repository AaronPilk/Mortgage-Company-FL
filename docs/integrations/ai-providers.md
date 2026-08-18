# AI providers

## Status: disabled

`AI_MODE=disabled` by default. The disabled provider refuses every request, so a
misconfiguration cannot spend money.

## Implemented: Anthropic and OpenAI, structured extraction only

`AnthropicAiProvider` (packages/integrations/src/ai/adapters.ts) implements the
`structured_extraction` capability against the Anthropic Messages API with a
forced tool call, so the model can only answer inside the caller's JSON schema.
One request per execute — no retries, because a retry is a second spend the
reservation never covered. Timeouts throw `AnthropicTimeoutError`, which callers
settle as an _unknown_ outcome (reservation held); HTTP errors throw
`AnthropicApiError` and settle as failed-before-billable.

`OpenAiAiProvider` (same file) mirrors that contract exactly against the OpenAI
Chat Completions API: the same `StructuredExtractionInput` becomes a forced
function tool call (`tools` + `tool_choice`), so call sites do not change per
vendor. OpenAI returns the tool arguments as a JSON string the model composed;
the adapter parses it defensively and a missing or malformed answer is a `null`
output for the caller's validation, never a throw that masks the rules
fallback. Its errors are `OpenAiApiError` and `OpenAiTimeoutError`. Both
vendors' error classes extend the shared `AiProviderApiError` /
`AiProviderTimeoutError` bases so a caller can classify any vendor's failure
uniformly.

### Vendor precedence

Selection is application policy, in `apps/web/lib/ai-vendor.ts` as a pure
function: in a live `AI_MODE` (sandbox or production), **Anthropic when
`ANTHROPIC_API_KEY` is set, else OpenAI when `OPENAI_API_KEY` is set, else the
disabled provider**. Non-live modes never select a vendor. The route registry
(`apps/web/lib/ai.ts`) carries one model identifier per vendor and resolves the
pair for whichever vendor the environment selected, so model ids stay in the
registry and a vendor switch is a secret change, not a code change.

First consumer: `/api/v1/properties/interpret`, which turns a shopper's free
text into search criteria. It has a deterministic rule-based parser as its
baseline and fallback (`apps/web/components/properties/nl-parser.ts`), so the
feature works with `AI_MODE=disabled` and degrades to it on any provider
refusal, error, or timeout. The response labels its provenance honestly:
`source: "ai"` only when a model interpreted the text.

Activation is configuration, not code:

- `AI_MODE=production` (or `sandbox`) — the environment schema requires at
  least one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` once the mode is live.
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — deployment secret store only; both
  already listed in `SECRET_ENV_KEYS`.
- `AI_DAILY_PLATFORM_BUDGET_CENTS` and `AI_DEFAULT_USER_DAILY_BUDGET_CENTS`
  non-zero — at their zero defaults every paid reservation is refused and the
  feature stays on the deterministic parser. Spending money is a deliberate act.

Data classification: the query is a consumer's own free text about a property
(`consumer_property`). It is never logged (length and outcome only) and never
echoed back; the response restates the validated criteria.

Model identifiers live in the application's route registry
(`apps/web/lib/ai.ts`, `PROPERTY_QUERY_ROUTE`), one per vendor, with
`DEFAULT_ANTHROPIC_STRUCTURED_MODEL` / `DEFAULT_OPENAI_STRUCTURED_MODEL` as the
constructor defaults.

Known asymmetry: the interpret route settles a caught `AnthropicApiError` as
failed-before-billable, while any other failure — including `OpenAiApiError` —
settles as _unknown_ and holds the reservation. With OpenAI selected, a
provider HTTP error therefore holds budget until reconciliation instead of
releasing it. That errs in the safe direction (invariant 8); switching the
route's check to the shared `AiProviderApiError` base would remove the
pessimism.

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
