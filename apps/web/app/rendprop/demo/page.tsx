import type { Metadata } from "next";
import { AssetImage } from "@/components/asset-image";
import { LeadForm } from "@/components/lead-form";
import { RendPropDemoWorkflow } from "@/components/rendprop/rendprop-demo-workflow";
import { Badge, ButtonLink, Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH } from "@/lib/rendprop-demo";
import { EMAIL_CONSENT_TEXT, LEAD_DISCLOSURE_TEXT, SMS_CONSENT_TEXT } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "RendProp fixture workflow",
  description:
    "Try a fixture-only RendProp capture, deterministic processing and recovery walkthrough without uploading media or calling a provider.",
  path: "/rendprop/demo",
  imagePath: "/images/og/rendprop.png",
  noIndex: true
});

export default function RendPropDemoPage() {
  return (
    <>
      <Section pad="head" orbs width="wide">
        <SectionHeading
          as="h1"
          eyebrow="RendProp sample"
          title="Try the workflow without uploading a thing."
          gradientWord="without uploading a thing."
          description="A deterministic browser demonstration of rights review, guided fixture selection, processing states, recovery and a labeled sample tour."
        />
        <div className="flex flex-wrap gap-3">
          <Badge tone="success">Interactive fixture demo</Badge>
          <Badge tone="neutral">No camera · no upload · no provider</Badge>
          <Badge tone="warning">Synthetic media only</Badge>
        </div>
      </Section>

      <Section width="wide" pad="tight">
        <RendPropDemoWorkflow />
      </Section>

      <Section tone="surface" width="wide" id="share">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Card className="overflow-hidden p-0">
            <div className="aspect-square overflow-hidden bg-[var(--surface-2)]">
              <AssetImage
                src="/images/agents/open-house-qr-demo.webp"
                alt="Abstract non-scannable QR-style card for the RendProp sample tour"
                width={900}
                height={900}
                sizes="(max-width: 1024px) 100vw, 40vw"
                fallbackLabel="QR presentation fixture unavailable"
              />
            </div>
          </Card>
          <div>
            <Badge tone="neutral">Presentation-only QR pattern</Badge>
            <h2 className="mt-4 text-3xl font-bold">Show the handoff and preserve its source.</h2>
            <p className="mt-4 text-[var(--text-muted)]">
              The pictured pattern is intentionally non-scannable. The button below is the real
              local demonstration link and carries only bounded campaign labels accepted by the
              first-party attribution contract.
            </p>
            <div className="mt-6">
              <ButtonLink href={RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH} variant="secondary">
                Open the QR-attributed sample tour
              </ButtonLink>
            </div>
            <p className="mt-3 font-mono text-xs text-[var(--text-muted)] break-all">
              /tour/rendprop-coastal-demo · source: rendprop_demo · medium: onsite_qr
            </p>
          </div>
        </div>
      </Section>

      <Section width="wide" id="agent-demo">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <LeadForm
            intent="agent_partner"
            formId="rendprop-agent-demo"
            heading="Request an agent demo"
            submitLabel="Request the demo"
            disclosureText={LEAD_DISCLOSURE_TEXT}
            smsConsentText={SMS_CONSENT_TEXT}
            emailConsentText={EMAIL_CONSENT_TEXT}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          />
          <div>
            <Card>
              <h2 className="text-xl font-bold">What this request records</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
                <li>An agent-partner marketing inquiry, never a mortgage application</li>
                <li>Separate contact and optional marketing consent</li>
                <li>First, last and conversion attribution with bounded values</li>
                <li>One idempotent first-party receipt and one outbox event when configured</li>
              </ul>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                The request contains no fixture state, upload path, personal media or provider
                payload. Operations can trace it by the RendProp source route and intent.
              </p>
            </Card>
            <div className="mt-5">
              <ButtonLink href="/rendprop" variant="ghost">
                Return to the product presentation
              </ButtonLink>
            </div>
          </div>
        </div>
        <Disclosure
          headline="This sample does not activate a media service."
          body="All displayed media is generated and local. Production upload, processing, retention, deletion, agent identity, listing publication and provider terms require separate reviewed implementation and configuration."
          excludes={[
            "Camera or file access",
            "Survey-grade measurements or automatic defect detection",
            "Remote processing, storage or public listing publication"
          ]}
        />
      </Section>
    </>
  );
}
