# Site assistant

A floating on-site helper that **educates and routes** — it explains mortgage
concepts in plain language, points to the right calculator, program, or page, and
offers to connect the visitor with a licensed loan officer. It is top-of-funnel
lead capture, not advice.

## What it never does

The assistant is a regulated surface (it talks to consumers about mortgages), so
the guardrails are structural, not just prompt text:

- **Never quotes a rate or an APR**, and never says what someone "would get".
- **Never says anyone is approved, pre-approved, qualified, or eligible**, and
  never makes or implies a lending or credit decision.
- **Never gives individualized financial, legal, or tax advice.**
- **Never asks for or accepts** an SSN, income documents, account numbers, or a
  date of birth (invariant 2 — a marketing surface is not an application).

Three layers enforce this:

1. **System prompt** — the model is instructed with the hard rules above.
2. **Structured output** — the model answers through a tool whose schema is a
   short reply, an `offerConnect` flag, and links chosen from a **fixed whitelist
   of real site routes** (it cannot invent a URL).
3. **Post-filter (`scrubReply`)** — the server scans the reply for a rate quote
   or a decision phrase and, if found, discards it for a safe deflection that
   points to a licensed officer. Defense in depth over the model.

## How it runs

It reuses the existing AI provider and the reserve-before-spend budget
(invariant 8): spend is reserved before the provider call and settled after, and
with the AI budgets at their zero default every paid call is refused — so the
assistant falls back to a safe canned reply until AI is explicitly funded. Any
failure (disabled, budget refused, timeout) returns that same fallback, so the
visitor is never left without an answer (never blocked on the third party).

The endpoint (`POST /api/v1/assistant`) is public — the assistant helps anonymous
visitors — so it carries same-origin, a tight per-network rate limit, and the
budget. The conversation is the visitor's own words: only length and turn count
are logged, never the content, and nothing is stored.

## Config

- `FEATURE_ASSISTANT` (default off) — the feature flag. Its derived public flag
  also requires a non-disabled `AI_MODE`, so it cannot run without AI configured.
- Uses the same `AI_MODE`, provider key (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`),
  and `AI_DAILY_PLATFORM_BUDGET_CENTS` / `AI_DEFAULT_USER_DAILY_BUDGET_CENTS` as
  the rest of the AI surface.

**Dark by default.** It ships off and only turns on when AI is funded and the
flow has been reviewed — a consumer-facing AI on a mortgage site is exactly the
surface to gate behind an explicit, reviewed switch.
