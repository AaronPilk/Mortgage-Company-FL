# Roadmap

Dependency-ordered. Nothing here is a date; each item is gated on the one above it.

## Now — unblocked engineering

- [x] Monorepo, design system, app shell, PWA
- [x] Mortgage math with tests
- [x] Database contract with an executed RLS suite
- [x] Lead receipt, consent ledger, attribution, outbox
- [x] Calculators and program pages
- [x] SEO foundation and content linter
- [x] Property, Vision, and AI contracts behind flags
- [x] Admin and readiness board
- [x] CI and documentation

## Next — needs a business decision

1. **Select the POS/LOS.** Blocks the application boundary, the disclosure
   responsibility matrix, and what the CRM may hold. Highest leverage.
2. **Affiliated-business posture.** Blocks every cross-entity flow. Must precede
   any shared data or referral design.
3. **Lender agreements.** Blocks describing any product as available.
4. **Provision Supabase.** Unblocks the entire admin surface.
5. **First content batch.** Ten Florida-specific guides with sources and a named
   reviewer.

## Then — needs a contract or credential

6. GoHighLevel account and field map
7. Turnstile keys and production mode
8. MLS data agreement, then the contracted adapter
9. Email and SMS provider, A2P registration, approved templates
10. AI providers, model routes, quota policies

## After launch approval

11. Controlled paid-media tests under the advertising review process
12. Offline conversion import from the POS/LOS
13. Vision vertical slice with real property data
14. RendProp capture benchmark, then the Expo client
15. Cohort and channel economics, funded-loan attribution

## Engineering follow-ups, any time

- CSP nonce replacing `unsafe-inline` for scripts
- Shared-store rate limiting for horizontal scale
- Outbox worker scheduled trigger
- Full axe audit and recorded Lighthouse numbers
