import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { MarketRates } from "@/components/rates/market-rates";
import { rateWatchAvailable, readMarketRates } from "@/lib/rates";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Today's mortgage rates",
  description:
    "The national weekly average 30- and 15-year fixed rates from Freddie Mac's survey, and how they've moved — market information, never a quote.",
  path: "/mortgage-rates",
  noIndex: true
});

export const dynamic = "force-dynamic";

/**
 * Market-rate page.
 *
 * Noindex and gated: it renders only where `rateWatchAvailable()` permits, so it
 * stays dark (and off search) until a live feed is configured and reviewed. It
 * shows a published national weekly average — never a personalized quote, an
 * offer, or "your rate" — and funnels the alert signup into the account.
 */
export default async function MortgageRatesPage() {
  if (!rateWatchAvailable()) notFound();
  const rates = await readMarketRates();

  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow="Rates"
        title="Today's mortgage rates"
        gradientWord="rates"
        description="The national weekly average, and which way it's moving. It's market context for your planning — not a quote and not your rate."
      />

      {rates !== null ? (
        <div className="mt-6">
          <MarketRates rates={rates} />
        </div>
      ) : (
        <Card className="mt-6">
          <p className="text-sm text-[var(--text-muted)]">
            Rates are temporarily unavailable. Please check back shortly.
          </p>
        </Card>
      )}

      <Prose>
        <h2>What this number is — and isn&apos;t</h2>
        <p>
          The figure above is the Freddie Mac Primary Mortgage Market Survey average: a national,
          weekly reading published every Thursday. It is useful for seeing the trend — whether rates
          are drifting up or down — but it is not the rate you would be offered. Your rate depends
          on your credit, your down payment, the property, the loan type, and the points and fees on
          the specific loan, and it is quoted as an APR. Two people reading this page on the same
          day can be offered very different rates.
        </p>
        <p>
          Rates move on the market, not on the calendar, so the best time to lock is a conversation
          about your situation, not a number on a page. Use this as a signal to check in — not as a
          promise of what you&apos;ll get.
        </p>
      </Prose>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--text)]">Get a nudge when rates move</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Set a rate watch in your account — pick a term, optionally a number you&apos;d like to
          see, and we&apos;ll email you when the average moves. No obligation, and no credit pull to
          watch.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/account" variant="primary">
            Set up my rate watch
          </ButtonLink>
          <ButtonLink href="/talk" variant="secondary">
            Talk to a licensed officer
          </ButtonLink>
        </div>
      </Card>

      <Disclosure
        headline="Market information, not an offer of credit."
        body="Rates shown are the Freddie Mac PMMS national weekly average via FRED, provided for general information. They are not an advertisement of our own rates, a quote, an APR, or a commitment to lend, and your rate will differ. Confirm current figures with the source, and a licensed loan officer for your own situation."
      />
    </Section>
  );
}
