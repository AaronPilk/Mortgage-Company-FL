import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

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
      <p className="mb-4 rounded-[--radius-sm] border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
        Draft. This page requires review by qualified counsel before launch.
      </p>
      <h1 className="text-4xl font-bold">Licensing</h1>
      <p className="mt-3 text-sm text-muted">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>Verify us independently</h2>
          <p>
            Every mortgage company and loan originator operating lawfully appears on NMLS Consumer
            Access. Look us up there rather than taking a website at its word — including this one.
          </p>
          <h2>Current status</h2>
          <p>
            Our company license identifiers appear in the footer of every page. Where a value shows
            as pending, that means it has not yet been issued and confirmed on the public record. We
            do not display a license number before it exists.
          </p>
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
