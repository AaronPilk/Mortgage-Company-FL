import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Accessibility",
  description: "Our accessibility commitment and how to report a barrier.",
  path: "/accessibility"
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
      <h1 className="text-4xl font-bold">Accessibility</h1>
      <p className="mt-3 text-sm text-muted">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>Our target</h2>
          <p>
            We build to WCAG 2.2 Level AA. That is a target we test against, not a certification we
            claim. Specifically we verify colour contrast, keyboard access to every interactive
            element, visible focus, semantic headings and landmarks, form error announcement, and
            support for reduced-motion preferences.
          </p>
          <h2>Known limitations</h2>
          <p>
            Any known barrier will be listed here as it is identified, along with the workaround and
            the expected fix. An empty list means none is currently known — not that none exists.
          </p>
          <h2>Reporting a barrier</h2>
          <p>
            If any part of this site is difficult to use, tell us. We will respond and, where the
            information you need is on a page you cannot use, we will provide it another way.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
