import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Disclosure, Section, SectionHeading } from "@/components/ui";
import { VisionPlanner } from "@/components/vision/vision-planner";
import { demoListings } from "@/lib/listings";
import { pageMetadata } from "@/lib/metadata";
import {
  EMAIL_CONSENT_TEXT,
  SMS_CONSENT_TEXT,
  VISION_REPORT_DISCLOSURE_TEXT,
  VISION_REPORT_DISCLOSURE_VERSION
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "TRACT Vision planning workspace",
  description: "Edit property assumptions and compare a deterministic planning range.",
  path: "/vision",
  noIndex: true
});

export const dynamic = "force-dynamic";

export default async function VisionPage({
  searchParams
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const { property } = await searchParams;
  const provider = demoListings();
  const selected =
    property === undefined
      ? (await provider.search({ market: "FL", limit: 1, status: ["active"] })).items[0]
      : await provider.getByKey(property);

  if (selected === undefined || selected === null || selected.demoPlanningSeed === undefined) {
    notFound();
  }

  return (
    <>
      <Section pad="head" orbs>
        <SectionHeading
          as="h1"
          eyebrow="TRACT Vision"
          title="Model the plan before sharing your contact details."
          gradientWord="before sharing your contact details."
          description="Edit the assumptions, inspect the calculation range, and decide whether the scenario is worth a human conversation. No account or paid AI is required for the preview."
        />
        <div className="flex flex-wrap gap-3">
          <Badge tone="warning">Synthetic property example</Badge>
          <Badge tone="success">Deterministic math · no AI arithmetic</Badge>
          <Badge tone="neutral">Contact gate follows the preview</Badge>
        </div>
      </Section>

      <Section pad="tight" width="wide">
        <VisionPlanner
          listing={selected}
          disclosureText={VISION_REPORT_DISCLOSURE_TEXT}
          disclosureVersion={VISION_REPORT_DISCLOSURE_VERSION}
          smsConsentText={SMS_CONSENT_TEXT}
          emailConsentText={EMAIL_CONSENT_TEXT}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      </Section>

      <Section width="narrow" pad="tight">
        <Disclosure
          headline="A scenario model, not advice."
          body="The preview separates the synthetic property facts, your editable assumptions, and the versioned calculations. A range can help frame questions; it cannot establish value, project feasibility, permitting, insurability, financing eligibility, or return."
          excludes={[
            "Appraisal or broker price opinion",
            "Construction scope, bid, inspection, engineering, zoning, or permit review",
            "Rate quote, loan approval, tax advice, or investment recommendation"
          ]}
          version="vision-preview-disclosure@1.0.0"
        />
      </Section>
    </>
  );
}
