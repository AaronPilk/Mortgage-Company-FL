import type { Metadata } from "next";
import { Prose, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: "How TRACT Mortgage collects, uses, protects, and shares information.",
  path: "/privacy"
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
      <h1 className="text-4xl font-bold">Privacy policy</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">Last updated 17 August 2026.</p>
      <div className="mt-8">
        <Prose>
          <h2>What this page covers</h2>
          <p>
            This describes how information moves through our systems. Counsel must review and
            complete it, including the Gramm-Leach-Bliley Act privacy notice, before launch.
          </p>
          <h2>What we collect from this website</h2>
          <ul>
            <li>
              Contact details you submit through a form: name, email, phone, and the optional
              context you provide.
            </li>
            <li>
              Consent records: what you agreed to, the exact wording shown, the page, and when.
            </li>
            <li>
              Attribution: the page you landed on, the referring site host, and advertising click
              identifiers.
            </li>
            <li>
              Technical signals: a coarse browser family and a one-way hash of a truncated network
              address, used for rate limiting and abuse prevention.
            </li>
          </ul>
          <h2>What our calculators do not collect</h2>
          <p>
            Every calculator on this site runs entirely in your browser. The purchase price, income,
            debts, and other values you enter are not transmitted to us, not stored, and not used to
            contact you. No credit inquiry of any kind occurs.
          </p>
          <h2>What we never collect through this website</h2>
          <p>
            We do not collect Social Security numbers, dates of birth, bank or card numbers, credit
            reports, income documentation, or file uploads through any form on this site. Those
            belong in the secure application system, and our marketing forms are built so they
            cannot accept them.
          </p>
          <h2>Advertising and analytics</h2>
          <p>
            We never send your name, email, phone, address, income, credit information, application
            contents, or any protected characteristic to an analytics or advertising platform. This
            is enforced in code by a filter that blocks such values from leaving the application.
          </p>
          <h2>Your choices</h2>
          <p>
            Asking to be contacted and consenting to marketing messages are separate choices. You
            can withdraw marketing consent at any time by replying STOP to a text, using the
            unsubscribe link in an email, or contacting us directly. Withdrawing marketing consent
            does not stop us from responding to an inquiry you made.
          </p>
        </Prose>
      </div>
    </Section>
  );
}
