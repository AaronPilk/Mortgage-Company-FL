import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetImage } from "@/components/asset-image";
import { Badge, Card, Disclosure, Section, SectionHeading } from "@/components/ui";
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
  imagePath: "/images/og/vision.png",
  noIndex: true
});

export const dynamic = "force-dynamic";

const VISION_PAIRS = [
  {
    key: "renovation",
    eyebrow: "Cosmetic renovation",
    before: "/images/vision/renovation-before.webp",
    beforeAlt: "Dated synthetic Florida bungalow before cosmetic renovation planning",
    after: "/images/vision/renovation-after-concept.webp",
    afterAlt: "Concept visualization of the same bungalow after cosmetic updates",
    note: "Paint, trim and landscaping visualization only; permanent conditions remain visible."
  },
  {
    key: "addition",
    eyebrow: "Addition study",
    before: "/images/vision/addition-before.webp",
    beforeAlt: "Synthetic Orlando home before an addition planning study",
    after: "/images/vision/addition-after-concept.webp",
    afterAlt: "Concept visualization placing a modest addition beside the same home",
    note: "A massing concept, not a zoning, engineering, setback or permit conclusion."
  },
  {
    key: "land",
    eyebrow: "Land placement",
    before: "/images/vision/land-aerial.webp",
    beforeAlt: "Elevated synthetic view across an undeveloped Florida land parcel",
    after: "/images/vision/land-home-concept.webp",
    afterAlt: "Concept visualization of a modest home placed within the same land view",
    note: "Parcel and setback geometry is deliberately excluded until sourced survey data exists."
  }
];

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
        <SectionHeading
          eyebrow="Visual planning fixtures"
          title="Same subject. Visible assumptions. Clear labels."
          gradientWord="Clear labels."
          description="These generated pairs demonstrate how TRACT separates source imagery from a concept. They do not predict feasibility, cost, condition, or approval."
        />
        <div className="grid gap-6" data-testid="vision-media-pairs">
          {VISION_PAIRS.map((pair) => (
            <Card key={pair.key} className="overflow-hidden p-0">
              <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
                <p className="font-semibold">{pair.eyebrow}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{pair.note}</p>
              </div>
              <div className="grid md:grid-cols-2">
                <figure className="relative border-b border-[var(--border)] md:border-b-0 md:border-r">
                  <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
                    <AssetImage
                      src={pair.before}
                      alt={pair.beforeAlt}
                      width={1440}
                      height={900}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fallbackLabel="Original fixture unavailable"
                    />
                  </div>
                  <figcaption className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    Original fixture
                  </figcaption>
                </figure>
                <figure className="relative">
                  <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
                    <AssetImage
                      src={pair.after}
                      alt={pair.afterAlt}
                      width={1440}
                      height={900}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fallbackLabel="Concept visualization unavailable"
                    />
                  </div>
                  <figcaption className="absolute left-4 top-4 rounded-full bg-[var(--purple-dark)] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    Concept visualization
                  </figcaption>
                </figure>
              </div>
            </Card>
          ))}
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

      <Section pad="tight" width="wide" tone="surface">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Badge tone="neutral">Sample report presentation</Badge>
            <h2 className="mt-4 text-3xl font-bold">
              A report keeps facts, assumptions and ranges apart.
            </h2>
            <p className="mt-4 text-[var(--text-muted)]">
              The visual cover is presentation only. The useful part is the versioned calculation,
              source ledger and sensitivity table generated by the workspace above.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-card)]">
            <div className="aspect-[4/3] overflow-hidden">
              <AssetImage
                src="/images/vision/report-cover.webp"
                alt="Synthetic bungalow image used on a sample TRACT Vision report cover"
                width={1200}
                height={900}
                sizes="(max-width: 1024px) 100vw, 58vw"
                fallbackLabel="Sample report cover unavailable"
              />
            </div>
            <div className="border-t border-[var(--border)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--purple)]">
                TRACT Vision · Synthetic example
              </p>
              <p className="mt-2 text-xl font-bold">Property planning preview</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Deterministic model · editable assumptions · not an appraisal
              </p>
            </div>
          </div>
        </div>
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
