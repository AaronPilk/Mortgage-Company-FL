# Secrets

## Rules

1. Never in a tracked file. `.env.example` holds names and empty values only.
2. Never in a `NEXT_PUBLIC_*` variable. That prefix compiles the value into the
   browser bundle.
3. Never in a log line, an error body, a fixture, a screenshot, an issue title,
   or a commit message.
4. Separate credentials per environment. A staging key must not work in
   production, and vice versa.
5. Least privilege. Start every integration read-only where the provider allows.

## Where they live

| Environment       | Store                                  |
| ----------------- | -------------------------------------- |
| Local development | `.env.local`, git-ignored              |
| Preview           | `wrangler secret put --env preview`    |
| Production        | `wrangler secret put --env production` |

`wrangler.jsonc` contains only non-sensitive `vars`. Its comments say so, and the
CI secret scan is the backstop.

## Rotation

Rotate on suspected exposure, on offboarding anyone who had access, on a material
vendor change, and on a schedule set by the information security program.

Order matters: rotate at the provider, then update the binding, then redeploy,
then verify via `/api/v1/health` that the integration reports healthy.

`HASH_PEPPER` is a special case. Rotating it changes every dedupe hash and every
rate-limit bucket, so expect a short window of duplicate leads afterwards. That
is the correct tradeoff and is not a reason to leave a compromised pepper in
place.

## Integration register

Maintained in `docs/integrations/`. Each entry records owner, purpose, scopes,
environment, data classes handled, contract, sub-processors, retention, last
review date, and revocation method.
