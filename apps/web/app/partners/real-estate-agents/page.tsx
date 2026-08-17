import type { Metadata } from "next";
import { Card, Disclosure, FeatureStatus, Section, SectionHeading } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { EMAIL_CONSENT_TEXT, LEAD_DISCLOSURE_TEXT, SMS_CONSENT_TEXT } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "For real estate agents",
  description:
    "What a mortgage partner should actually provide: communication, education your clients can use, and tools that make you look good.",
  path: "/partners/real-estate-agents"
});

const VALUE = [
  {
    heading: "Communication you do not have to chase",
    body: "Status at each stage, proactively. If something changes, you hear it from us before you hear it from your client."
  },
  {
    heading: "Education your buyers can actually use",
    body: "Calculators that show their assumptions and guides that explain the Florida-specific parts — insurance, taxes, condo project review — that derail transactions."
  },
  {
    heading: "Straight answers about what is possible",
    body: "If a scenario will not work, we say so early rather than letting a contract run to a deadline."
  }
];

export default function AgentPartnerPage() {
  const features = publicFeatures();
  return (
    <Section>
      <SectionHeading
        as="h1"
        eyebrow="For agents"
        title="A financing partner who communicates"
        description="Built around service and education, not around anything that would resemble payment for referrals."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {VALUE.map((item) => (
          <Card key={item.heading}>
            <h2 className="text-lg font-semibold text-purple-900">{item.heading}</h2>
            <p className="mt-3 text-sm text-muted">{item.body}</p>
          </Card>
        ))}
      </div>

      {/*
        This paragraph is not boilerplate. RESPA Section 8 prohibits giving or
        accepting a thing of value for the referral of settlement service
        business, and a partner page is exactly where that line gets blurred.
        Stating it plainly sets the expectation before the first conversation.
      */}
      <Card className="mt-8 border-purple-300 bg-purple-50">
        <h2 className="text-lg font-semibold text-purple-900">How we work with agents</h2>
        <p className="mt-3 text-sm text-muted">
          We do not pay for referrals, and we do not accept payment for sending business your way.
          There are no per-lead fees, no per-closing payments, and no arrangements priced against
          production volume. Federal law prohibits those, and honestly, a relationship that needs
          them is not a relationship worth having. What we offer is responsiveness, education, and
          doing our job well enough that you want to work with us again.
        </p>
      </Card>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <LeadForm
          intent="agent_partner"
          formId="agent-partner"
          heading="Start a conversation"
          submitLabel="Request an introduction"
          disclosureText={LEAD_DISCLOSURE_TEXT}
          smsConsentText={SMS_CONSENT_TEXT}
          emailConsentText={EMAIL_CONSENT_TEXT}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
        <Card>
          <h2 className="text-lg font-semibold text-purple-900">RendProp listing media</h2>
          <p className="mt-3 text-sm text-muted">
            A guided phone-capture workflow that turns a walkthrough into a shareable tour with
            clear labeling for any enhanced or staged imagery. It is in development and is not
            available yet — and we will not describe it as survey-grade or claim measurement
            accuracy it has not been benchmarked against.
          </p>
          <div className="mt-4">
            <FeatureStatus label="RendProp" status={features.rendProp ? "live" : "coming_soon"} />
          </div>
        </Card>
      </div>

      <Disclosure
        headline="No payment flows in either direction for referrals."
        body="Any co-marketing arrangement must be for actual services at documented fair market value, reviewed by counsel before it begins, and never priced by referral or production volume."
      />
    </Section>
  );
}
