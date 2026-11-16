# Blockers

**As of 2026-11-16.** The site is live and nothing here takes it down. Each item
blocks one feature, a green CI or a listing. None of them permits weakening a
test or inventing a production claim. The 2026-08-18 blockers (Vercel
duplicate, missing licensing facts, empty Supabase project, CRM with no
credentials) no longer describe production.

## 1. ATTOM runs on a free trial key

| Field                | Value                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status               | Owner decision. Production home lookup and homeowner value dashboard use a 30-day free trial key (500 calls a day)                                                           |
| Risk                 | When the trial ends those features will probably stop returning property data                                                                                                |
| Not blocked by it    | Every other page, the sitemap, lead capture, calculators, `/mortgage-rates`                                                                                                  |
| Option A             | Paid plan (sales quote, 800-462-5125). Also step 1 of 3 for `/what-is-my-home-worth`                                                                                         |
| Option B             | Labelled samples: set `ATTOM_MODE=fixture`. `SHOW_SAMPLE_PROPERTY_DATA` is already `true` in `wrangler.jsonc`. One variable plus a deploy                                    |
| Fixed in this branch | `ATTOM_PLAN=trial` in `wrangler.jsonc`; the readiness board now reads "in progress" until it is `paid`. A refused key logs `AttomAuthError`, a spent quota `AttomQuotaError` |
| Owner                | Aaron                                                                                                                                                                        |

## 2. CI on `main` was red; the fix is in this branch (ADR-016)

Red since 2026-11-13 for two reasons: the secret scan matched the public
Supabase anon key in `apps/web/.env.production`, and the contact-form e2e test
never got a Turnstile token because the e2e build inlined the production
sitekey. Both are fixed on `claude/wml-fixes-20261116`: `scripts/secret-scan.sh`
allows only `NEXT_PUBLIC_*` lines in that one file, and e2e builds use
Cloudflare's test sitekey. Local run: `pnpm check` green (2217 tests),
`pnpm test:e2e` 128 of 128 on desktop and mobile. ADR-016 records the reasoning
and is marked proposed until the owner approves the PR, because it touches the
security gate. Owner: Aaron.

## 3. Seven Dependabot pull requests

Open since 2026-11-13. Disposition:

| PRs                                                      | What                                                           | Do                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| checkout, setup-node, upload-artifact, pnpm/action-setup | Runner action majors                                           | Already applied in this branch's `ci.yml`; close them after merge (or let Dependabot) |
| minor-and-patch group (20 packages)                      | Next 16.4, React 19.3, zod 4.6, wrangler, opennextjs, Supabase | Merge after this PR, once its CI is green on the rebase; it is the routine group      |
| typescript 6.0.3                                         | Major                                                          | Close. ADR-010 holds 5.9; `dependabot.yml` now ignores TypeScript majors              |
| vitest 5.1.0                                             | Major                                                          | Leave for a separate, deliberate bump; not security-relevant                          |

Owner: Aaron.

## 4. Listing verifications

| Listing                 | Waiting on                                              |
| ----------------------- | ------------------------------------------------------- |
| Google Business Profile | Dan: phone code or verification video                   |
| Bing Places             | Dan: PIN from the postcard due 2026-11-20 to 2026-11-23 |
| Yelp                    | Yelp moderation                                         |
| BBB                     | BBB review; they email Dan                              |

Not started, owner to choose: Foursquare (CAPTCHA and login wall), Data Axle
(would spread the street address), Apple Maps (needs a walk-in location, cannot
hide the address), Nextdoor (not looked at).

## 5. `/what-is-my-home-worth` stays off

Three steps, in order: paid ATTOM plan; sign-off from Dan or counsel on the
page; set `FEATURE_SELLER_TOOLS`. Until then it 404s and is noindex.

## 6. Dashboard settings not confirmed since 2026-11-12

From `2026-11-12_SEO_DOMAIN.md`. Nobody has recorded these as done:

- Supabase Auth: Site URL `https://wsmlending.com`, and
  `https://wsmlending.com/**` in Redirect URLs.
- Turnstile: the widget's allowed hostnames include `wsmlending.com`. (Separate
  from item 2.)

## 7. CRM delivery not proven end to end

GoHighLevel is in `production` mode and points at the WML sub-account, with
`GHL_CUSTOM_FIELD_MAP` set to `{}`. No consented test lead has been confirmed
landing there. Smallest action: one approved test lead through `/contact`, then
check the WML sub-account and `/admin/jobs` for dead letters. Rebuild the
custom-field map against the WML location afterwards.

## 8. Licensing, people side

Confirm with OFR that Dan Cuesta (NMLS ID 132852) is the designated principal
loan originator. `/apply` still fails closed with no approved POS/LOS URL; keep
it that way until a secure application system is approved.

## Carried over from 2026-08-18, not re-checked

- No contracted MLS/display provider; listings remain labelled fixtures.
- POS/LOS selection, transactional email, storage policy and privacy-request
  execution are undecided.
- Engineering follow-ups: shared rate-limit store before scale, nonce-based
  CSP, broader audit-event emission, a recorded accessibility and Lighthouse
  pass.
