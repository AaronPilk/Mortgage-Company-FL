# Handoff template

Copy this when ending a session. Replace every bracket. Delete nothing.

The point of this document set is that the next person is **not misled**. If
something is a fixture, unconfigured, or unverified, write those words. An
overstatement here costs more than a gap, because a gap gets found and an
overstatement gets believed.

---

## Rules for filling this in

- **Never write a secret value.** Environment variable **names** only.
- **Verify before asserting.** If you did not run it, say you did not run it.
- Distinguish three states explicitly and by name: **implemented and working**,
  **fixture**, **unconfigured**. "Built" is not a state — a built-but-unconfigured
  integration delivers nothing.
- Distinguish **committed locally** from **pushed** from **deployed** from
  **verified live**. They are four different facts.
- No marketing language. Short sentences. Tables where they help.
- Record the reasoning for each decision **and** the condition under which it
  should be revisited.

---

## Session summary

- **Date:** [YYYY-MM-DD]
- **Branch:** [branch name]
- **Commits on this branch, not on `main`:** [`hash` — summary, one line each]
- **Pushed?** [yes / no — if no, state exactly why]
- **Deployed?** [yes / no]
- **Production is currently serving:** [commit hash on `main`]

---

## What was delivered

| Commit | What it does | Tested how |
| ------ | ------------ | ---------- |
|        |              |            |

---

## Verification

State the exact command, the exact outcome, and the date.

| Command          | Outcome | Counts | Re-run this session? |
| ---------------- | ------- | ------ | -------------------- |
| `pnpm check`     |         |        |                      |
| `pnpm db:verify` |         |        |                      |
| `pnpm test:e2e`  |         |        |                      |

Anything you did **not** run, list under its own heading. Do not leave it
implied.

---

## What changed in the environment contract

| Variable name | Added / changed / removed | Where it is set | Why |
| ------------- | ------------------------- | --------------- | --- |
|               |                           |                 |     |

Names only. If you added a variable, it must also appear in `.env.example` with
its `[browser-safe]` or `[server-only]` annotation, and in the schema at
`packages/schemas/src/env.ts`.

---

## Decisions made

For each one:

- **Decision.** What was chosen.
- **Reasoning.** Why, including what the alternative would have cost.
- **Revisit when.** The specific condition that should reopen this. If you cannot
  name one, the decision is not finished being thought about.

---

## Blockers

For each one:

- **What** is blocked.
- **What is NOT blocked by it** — this line prevents the most common
  misunderstanding.
- **Smallest concrete action** that clears it.
- **Who** can take that action.
- **What is already built**, so it reads as a switch rather than a project.

---

## Where work stopped, and the exact next action

One paragraph on where it stopped. Then one named action with one named owner.
Not a list of options.

---

## Anything that contradicts what you were told

If a fact you were handed turned out to be wrong, stale, or unverifiable, say so
here in plain terms, with what you checked and what you found. This section is
the most valuable one in the document. Leaving it empty when it should not be is
the single worst thing you can do to the next person.
