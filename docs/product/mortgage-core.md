# Mortgage core

The product surface that must work when every advanced integration is off.

## Journeys

**Direct consultation.** Landing page → CTA → short lead form → Turnstile →
first-party transactional save → thank-you state with a receipt reference →
outbox enqueued → human follow-up.

**Calculator.** Open → manipulate inputs locally → see the estimate with its
assumptions → optionally save. Nothing typed into a calculator is transmitted.

**Agent partner.** Partner page → inquiry form → routed to the partner pipeline.
The page states plainly that no payment flows in either direction for referrals.

**Secure application.** `/apply` explains the boundary and links out. No
sensitive value is ever appended to that URL. While unconfigured it says
applications are not open rather than collecting anything.

## Page contract

Every primary mortgage page carries: one intent-aligned H1, an honest summary,
who it may fit, who should look elsewhere, how the process works, the variables
that move the outcome, visible FAQs, primary sources, a reviewed date, related
internal links, a human CTA, and the broker disclosure.

A hero plus a form is not publishable. `site-contract.test.ts` enforces the
minimum structure and scans for promissory phrasing.

## Calculators

Payment · Affordability · Refinance break-even · Rent versus buy · Cash to close.

All five run client-side, delegate every calculation to `@tract/mortgage-math`,
render their inputs and assumptions, and carry a versioned disclosure. Each shows
what it excludes, which is usually the more useful half.

## Rates

Not published. A rate depends on credit profile, loan-to-value, property type,
occupancy, loan amount, and lock period. Publishing one without those is an
advertisement, not a quote, and triggers disclosure obligations that a static
page cannot satisfy. The site says so rather than quietly omitting the topic.
