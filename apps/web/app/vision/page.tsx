import type { Metadata } from "next";
import { ButtonLink, Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";

export const metadata: Metadata = pageMetadata({
  title: "TRACT Vision",
  description: "A property planning workspace that shows every assumption and every source.",
  path: "/vision",
  noIndex: true
});

/**
 * TRACT Vision.
 *
 * Gated behind both the feature flag and a configured AI provider. Until both
 * are on, this page explains what the tool will and will not do rather than
 * demonstrating a fixture as though it were analysis.
 */
export default function VisionPage() {
  const features = publicFeatures();

  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow="TRACT Vision"
        title="Model a property before you commit"
        gradientWord="before you commit"
        description="Renovation, addition, rental, and flip scenarios — with the sources and assumptions visible, not hidden behind a score."
      />

      {!features.vision && (
        <Card className="border-[var(--purple)] bg-[var(--purple-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Not available yet</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Vision is in development. It is switched off rather than running on sample data, because
            a workspace that presents synthetic figures as analysis is worse than one that is
            honestly unavailable.
          </p>
          <div className="mt-5">
            <ButtonLink href="/contact" variant="secondary">
              Talk through a scenario with a person instead
            </ButtonLink>
          </div>
        </Card>
      )}

      <div className="mt-10">
        <Prose>
          <h2>What it does</h2>
          <ul>
            <li>
              Pulls what is knowable about a property and shows where each fact came from and when
            </li>
            <li>Asks you to confirm every assumption that drives a number</li>
            <li>Runs the financial model deterministically, with a versioned calculation</li>
            <li>Shows a range with sensitivity, not a single figure</li>
            <li>Separates sourced facts, your assumptions, and anything a model inferred</li>
          </ul>

          <h2>What it will never do</h2>
          <p>
            It will not tell you a property is a good deal or a bad one. It will not produce an
            appraisal, a construction bid, a zoning opinion, or an investment recommendation. It
            will not treat a model&rsquo;s guess as a confirmed input, and it will not let a
            generated image imply that a renovation is feasible or permitted.
          </p>
          <p>
            Where a fact is unavailable, the report says so. A gap stated plainly is more useful
            than a plausible number nobody can trace.
          </p>

          <h2>How the arithmetic works</h2>
          <p>
            All financial output comes from the same tested, versioned functions that power the
            calculators on this site. A language model may help draft narrative around those numbers
            or organize what you tell it — it never performs the arithmetic. Every report records
            which calculation version and which prompt version produced it.
          </p>
        </Prose>
      </div>

      <Disclosure
        headline="A scenario model, not advice."
        body="Construction costs, rental estimates, comparable sales, and value ranges come from third-party data with its own coverage limits and dates, or from assumptions you supply. Nothing here establishes value, feasibility, permitting, or return."
      />
    </Section>
  );
}
