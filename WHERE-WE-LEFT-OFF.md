# Where we left off — 2026-08-26

Everything below is **built, verified, and already on this Mac** (uncommitted).
Nothing is lost. One deploy makes it all live. Come back whenever you're ready.

## What's built this session
- **WML lead page (wsmlending.com)** — rebuilt from the bland version into a real
  lead-capture page: hero photo + the same 4-step form as the TRACT homepage,
  wired to your CRM. Its own WML header/footer, FAQ schema, canonical to the WML domain.
- **Analytics + cookie consent** — Google Tag Manager + Consent Mode v2 + a
  privacy-first cookie banner + page-view/click tracking. Dormant until you add
  your GTM ID (step 2 below).
- **Security** — session-cookie Secure flag + Dependabot. Both your checklists were
  reviewed (SEO 18/20 done, security 15/20 done; the rest are the dashboard steps below).
- **The AI assistant** — was repeating one canned line; now a real intent router that
  answers across the whole TRACT product (homes, value, calculators, refinancing,
  agents, portal). Built so bots can't run up your AI bill, and it works even with AI off.
- **UI/UX motion pass** — crisper animations site-wide (Emil Kowalski audit).
- **SEO Launch Playbook** — https://claude.ai/code/artifact/cbedaf17-3a63-444d-bfbc-3e52d245f645
  (share with Dan from the page's share menu).

## To go live — do these in order
1. From this folder:
   `git add -A && git commit -m "WML lead landing + analytics + assistant + security + UI polish"`
   then  **`pnpm cf:build && pnpm cf:deploy`**   <- this makes everything live.
2. Turn analytics on: add `NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXX` to
   `apps/web/.env.production`, then deploy again. (Until then: no banner, no tracking — intentional.)
3. Cloudflare -> Turnstile: add `wsmlending.com` to the widget's allowed hostnames
   (confirm tractrealestate.com is there too) or the WML lead form's bot check fails.
4. Test a lead on wsmlending.com after deploy — confirm it lands in your CRM.
5. Supabase -> Auth: confirm rate limits + turn on the Turnstile CAPTCHA
   (stops login / credential-stuffing bots).
6. Cloudflare: confirm "Always Use HTTPS" is on.
7. Google Search Console + Bing Webmaster: verify BOTH domains, submit the sitemaps.

## Optional / later
- Want a hard guarantee of **$0 AI spend** before launch? Set `AI_MODE=disabled` —
  the assistant still works great on its deterministic brain.
- Nonce-based CSP (drops `unsafe-inline` from scripts) — a nice hardening, not urgent.
- Codify the loan-docs storage bucket limits in a migration (infra tidy-up).
- The SEO playbook's content calendar + Google Business Profile checklist — revisit
  once WML is licensed.

## How the site is wired (quick reminder)
- Two domains, one Cloudflare Worker, routed by host in `apps/web/middleware.ts`.
  wsmlending.com = mortgage (WML); tractrealestate.com = TRACT (the product).
- Deploy is MANUAL: `pnpm cf:build && pnpm cf:deploy` from this folder.
  **Pushing to GitHub does not deploy.**
- Check everything's healthy: `pnpm check` (all green — 2127 tests).

_You can delete this file once you've deployed — it's just a place-marker._
