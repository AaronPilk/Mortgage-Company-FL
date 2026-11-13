import type { Metadata } from "next";
import Link from "next/link";
import { Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { DpaFinder } from "@/components/dpa/dpa-finder";
import { DPA_AS_OF, DPA_PROGRAMS } from "@/lib/dpa-programs";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Florida Down Payment Assistance",
  description:
    "Hometown Heroes, Florida Assist, and FL HLP explained — how much each offers, who they're for, and a quick finder for which to ask about.",
  path: "/florida-down-payment-assistance"
});

/**
 * Florida down-payment-assistance overview.
 *
 * Education plus lead capture, not a program application or an eligibility
 * decision. The statewide Florida Housing programs are described with their own
 * published criteria and a source link each; the finder narrows them to what is
 * worth a conversation. Nothing here says "you qualify" or states a rate — the
 * eligibility and the money remain a licensed officer's determination.
 */
export default function FloridaDownPaymentAssistancePage() {
  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow="Florida"
        title="Florida down payment assistance"
        gradientWord="assistance"
        description="The down payment is the wall most first-time buyers hit. Florida runs real programs that help with it — here's what they offer and how to find the ones worth asking about."
      />

      <Prose>
        <p>
          The down payment, not the monthly payment, is what stops most Florida first-time buyers.
          The state&rsquo;s housing agency runs assistance programs that put money toward your down
          payment and closing costs — usually as a second mortgage you don&rsquo;t pay back until
          you sell, refinance, or move. They stack on top of an ordinary first mortgage, so you can
          use them with a conventional, FHA, VA, or USDA loan.
        </p>
        <p>
          Two things to know up front. These programs have income and purchase-price limits that
          change every year and vary by county, so eligibility is something a licensed loan officer
          confirms against the current tables — not something a web page can decide for you. And
          funding is finite: popular programs open, run down, and reopen, so timing matters.
        </p>
      </Prose>

      <div className="mt-8">
        <DpaFinder />
      </div>

      <h2 className="mt-12 text-2xl font-bold text-[var(--text)]">
        The statewide programs, in plain terms
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Current as of {DPA_AS_OF}. Programs, amounts, and limits change — confirm the latest with
        the source linked on each.
      </p>

      <div className="mt-5 space-y-5">
        {DPA_PROGRAMS.map((program) => (
          <Card key={program.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl font-bold text-[var(--text)]">{program.name}</h3>
              <span className="text-sm font-semibold" style={{ color: "var(--purple)" }}>
                {program.assistance}
              </span>
            </div>
            <p className="mt-1 text-sm italic" style={{ color: "var(--text-muted)" }}>
              {program.tagline}
            </p>
            <p className="mt-3 text-sm text-[var(--text)]">{program.structure}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Who it&apos;s for
            </p>
            <ul className="mt-2 space-y-1.5">
              {program.criteria.map((criterion) => (
                <li key={criterion} className="flex gap-2 text-sm text-[var(--text-muted)]">
                  <span aria-hidden style={{ color: "var(--purple)" }}>
                    •
                  </span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
            <a
              href={program.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-xs underline"
              style={{ color: "var(--text-muted)" }}
            >
              Source: {program.sourceLabel} ↗
            </a>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Don&apos;t forget your county and city
        </h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Beyond the statewide programs, many Florida counties and cities — Hillsborough,
          Miami-Dade, Orange, Pinellas, and others — run their own down payment assistance with
          different limits and funding. They can sometimes be combined with a state program. A
          licensed loan officer who works your county will know which local programs are open and
          how they fit together.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/calculators/affordability"
            className="text-sm font-semibold underline"
            style={{ color: "var(--purple)" }}
          >
            Estimate what you can afford
          </Link>
          <Link
            href="/mortgage/first-time-home-buyers"
            className="text-sm font-semibold underline"
            style={{ color: "var(--purple)" }}
          >
            First-time buyer guide
          </Link>
        </div>
      </Card>

      <Disclosure
        headline="This is education about public programs, not an offer, an approval, or advice about your situation."
        body="We are an independent mortgage broker and are not Florida Housing Finance Corporation, nor affiliated with or endorsed by it. Program terms, income and purchase-price limits, and funding availability change and vary by county — confirm the current details with the official source linked above. Nothing here is a commitment to lend or a determination that you qualify; a licensed loan officer confirms eligibility."
      />
    </Section>
  );
}
