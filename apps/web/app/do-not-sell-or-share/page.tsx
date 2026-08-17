import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Do not sell or share my personal information",
  description: "How to exercise your choices about personal information.",
  path: "/do-not-sell-or-share"
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
      <h1 className="text-4xl font-bold">Do not sell or share my personal information</h1>
      <p className="mt-3 text-sm text-muted">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>Our position</h2>
          <p>
            We do not sell your personal information, and we do not share it with unaffiliated
            parties for their own marketing.
          </p>
          <h2>Making a request</h2>
          <p>
            You can ask us what we hold about you, ask us to correct it, or ask us to delete it.
            Contact us and we will respond. Some records must be retained for a period required by
            law regardless of a deletion request; where that applies we will tell you which records
            and why.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
