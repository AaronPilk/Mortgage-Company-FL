import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Security",
  description: "How we protect information and how to report a vulnerability.",
  path: "/security"
});

/**
 * DRAFT — REQUIRES QUALIFIED REVIEW.
 *
 * This page states how the system is built, which is factual and useful. It is
 * NOT a substitute for the reviewed legal text that counsel must supply before
 * launch. See docs/compliance/launch-gates.md.
 */
export default function Page() {
  return (
    <Section width="narrow">
      <p className="mb-4 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
        Draft. This page requires review by qualified counsel before launch.
      </p>
      <h1 className="text-4xl font-bold">Security</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>How this system is built</h2>
          <ul>
            <li>Calculators run entirely in your browser. Those values never reach our servers.</li>
            <li>
              Marketing forms are built so they cannot accept government identifiers, account
              numbers, or documents.
            </li>
            <li>
              Applications and documents go through a separate secure system, never through this
              website or email.
            </li>
            <li>
              Network addresses are stored only as a one-way hash of a truncated prefix, used for
              rate limiting.
            </li>
            <li>
              Logs are redacted before they are written; contact details and credentials cannot
              enter them.
            </li>
            <li>Access to records is enforced at the database as well as in the application.</li>
          </ul>
          <h2>Reporting a vulnerability</h2>
          <p>
            If you believe you have found a security issue, contact us with the details. We will
            acknowledge your report and will not pursue action against good-faith research that
            avoids privacy violations, service disruption, and data destruction.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
