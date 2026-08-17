import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "SMS terms",
  description: "Message frequency, opt-out instructions, and what consent covers.",
  path: "/sms-terms"
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
      <h1 className="text-4xl font-bold">SMS terms</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>What you are agreeing to</h2>
          <p>
            If you check the text-message box on a form, you are agreeing to receive text messages
            from TRACT Mortgage about your inquiry and about mortgage education. Consent to
            marketing texts is never a condition of any service, and declining it does not affect
            our response to your inquiry.
          </p>
          <h2>Frequency and cost</h2>
          <p>Message frequency varies. Message and data rates may apply.</p>
          <h2>How to stop</h2>
          <p>
            Reply STOP to any message to opt out. Reply HELP for help. Opting out is honoured across
            our systems, not just the one that sent the message.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
