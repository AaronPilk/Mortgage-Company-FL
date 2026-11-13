import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { LicensingFacts, NmlsVerifyLinks } from "@/components/licensing-facts";
import { pageMetadata } from "@/lib/metadata";
import { businessIdentity } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Licensing",
  description: "License identifiers and how to verify them.",
  path: "/licenses"
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
      <h1 className="text-4xl font-bold">Licensing</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">Last updated 12 November 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>Verify us independently</h2>
          <p>
            Every mortgage company and loan originator operating lawfully appears on NMLS Consumer
            Access. Look us up there rather than taking a website at its word — including this one.
          </p>
          <h2>Current status</h2>
          <p>
            {businessIdentity.legalName} is listed in NMLS under the company NMLS ID below. These
            identifiers also appear in the footer of every page. Where a value shows as pending, we
            have not yet confirmed it ourselves, so we do not display it.
          </p>
        </Prose>
        <div className="my-6 space-y-2">
          <LicensingFacts originator />
          <NmlsVerifyLinks originator />
        </div>
        <Prose>
          <h2>Individual loan originators</h2>
          <p>
            Mortgage loan origination requires an individual license, separate from the company
            license. Anyone who discusses loan terms with you should be able to give you their NMLS
            identifier, and you can verify it on Consumer Access.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
