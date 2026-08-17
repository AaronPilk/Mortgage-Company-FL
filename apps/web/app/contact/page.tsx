import type { Metadata } from "next";
import { Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import { pageMetadata } from "@/lib/metadata";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  SMS_CONSENT_TEXT,
  businessIdentity
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Talk to a mortgage professional",
  description:
    "Start a conversation about your financing. No application, no credit pull, no obligation.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Contact"
        title="Tell us what you are working on"
        gradientWord="working on"
        description="A licensed mortgage professional will get back to you to understand your situation and lay out what your options actually are."
      />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <LeadForm
          intent="general"
          formId="contact-primary"
          disclosureText={LEAD_DISCLOSURE_TEXT}
          smsConsentText={SMS_CONSENT_TEXT}
          emailConsentText={EMAIL_CONSENT_TEXT}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text)]">What happens next</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--text-muted)]">
              <li>A licensed mortgage professional reviews what you sent and reaches out.</li>
              <li>
                You have a conversation about your situation. No credit is pulled and no application
                is taken at this stage.
              </li>
              <li>
                If it makes sense to move forward, you receive a secure link to apply. Documents and
                sensitive information go there, never through this form or by email.
              </li>
            </ol>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text)]">What we will not do</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
              <li>Pull your credit without your explicit permission</li>
              <li>Quote you a rate before we understand your situation</li>
              <li>Tell you that you are approved for anything before a lender says so</li>
              <li>Sell or share your information with unaffiliated marketers</li>
            </ul>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text)]">Licensing</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {businessIdentity.brandName} is a Florida mortgage brokerage. Our license identifiers
              appear in the footer and can be verified on NMLS Consumer Access.
            </p>
          </Card>
        </div>
      </div>
      <Disclosure
        headline="Submitting this form is not an application."
        body="Contacting us does not create an application for credit, does not obligate you to anything, and does not result in a credit inquiry. Any figures discussed are estimates until a lender issues a Loan Estimate."
      />
    </Section>
  );
}
