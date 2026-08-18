import type { Metadata } from "next";
import { AssetImage } from "@/components/asset-image";
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
    <Section orbs>
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionHeading
          as="h1"
          eyebrow="For agents"
          title="A financing partner who communicates"
          gradientWord="communicates"
          description="Built around service and education, not around anything that would resemble payment for referrals."
        />
        <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-2)] shadow-[var(--shadow-float)]">
          <div className="aspect-[8/5] overflow-hidden">
            <AssetImage
              src="/images/agents/agent-toolkit.webp"
              alt="Synthetic flat lay of an agent toolkit with phone, tablet, tripod and open-house materials"
              width={1440}
              height={900}
              sizes="(max-width: 1024px) 100vw, 58vw"
              priority
              fallbackLabel="Agent toolkit preview unavailable"
            />
          </div>
          <p className="border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--text-muted)]">
            A synthetic toolkit fixture illustrating capture, share and client-education
            touchpoints.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {VALUE.map((item) => (
          <Card key={item.heading}>
            <h2 className="text-lg font-semibold text-[var(--text)]">{item.heading}</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">{item.body}</p>
          </Card>
        ))}
      </div>

      {/*
        This paragraph is not boilerplate. RESPA Section 8 prohibits giving or
        accepting a thing of value for the referral of settlement service
        business, and a partner page is exactly where that line gets blurred.
        Stating it plainly sets the expectation before the first conversation.
      */}
      <Card className="mt-8 border-[var(--purple)] bg-[var(--purple-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">How we work with agents</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          We do not pay for referrals, and we do not accept payment for sending business your way.
          There are no per-lead fees, no per-closing payments, and no arrangements priced against
          production volume. Federal law prohibits those, and honestly, a relationship that needs
          them is not a relationship worth having. What we offer is responsiveness, education, and
          doing our job well enough that you want to work with us again.
        </p>
      </Card>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <Card className="overflow-hidden p-0">
          <div className="aspect-square overflow-hidden bg-[var(--surface-2)]">
            <AssetImage
              src="/images/agents/open-house-qr-demo.webp"
              alt="Synthetic open-house toolkit crop with an abstract non-scannable QR-style card"
              width={900}
              height={900}
              sizes="(max-width: 1024px) 100vw, 40vw"
              fallbackLabel="Open-house attribution preview unavailable"
            />
          </div>
        </Card>
        <div>
          <p className="text-sm font-semibold text-[var(--purple)]">
            Open-house attribution concept
          </p>
          <h2 className="mt-2 text-3xl font-bold">A useful handoff, not a referral payment.</h2>
          <p className="mt-4 text-[var(--text-muted)]">
            A future QR handoff can preserve the agent and event source when a visitor opens a
            planner or media tour. The pictured pattern is intentionally non-scannable; no public
            tour, attribution record or compensation arrangement is implied.
          </p>
        </div>
      </div>

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
          <h2 className="text-lg font-semibold text-[var(--text)]">RendProp listing media</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
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
