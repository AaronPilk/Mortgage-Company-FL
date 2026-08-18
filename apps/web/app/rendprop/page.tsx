import type { Metadata } from "next";
import { AssetImage } from "@/components/asset-image";
import {
  Badge,
  ButtonLink,
  Card,
  Disclosure,
  FeatureStatus,
  Section,
  SectionHeading
} from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";

export const metadata: Metadata = pageMetadata({
  title: "RendProp listing media demo",
  description:
    "Explore a synthetic, clearly labeled demonstration of guided capture, cleanup, virtual staging, enhancement, floor-plan candidates and shareable tours.",
  path: "/rendprop",
  imagePath: "/images/og/rendprop.png",
  noIndex: true
});

const CAPTURE_STEPS = [
  ["01", "Capture", "Follow room-by-room framing guidance with a phone you already have."],
  [
    "02",
    "Review",
    "Confirm rights, remove personal material and choose permitted transformations."
  ],
  [
    "03",
    "Label",
    "Publish originals and visualizations with the alteration visible beside the media."
  ]
] as const;

const LIVING_MEDIA = [
  {
    src: "/images/rendprop/living-room-original.webp",
    label: "Original",
    alt: "Synthetic original living room with ordinary movable clutter",
    detail: "Generated source fixture with furniture and ordinary movable clutter."
  },
  {
    src: "/images/rendprop/living-room-cleanup-concept.webp",
    label: "Cleanup visualization",
    alt: "Cleanup visualization of the same living room after movable clutter is removed",
    detail: "Only loose clutter is removed; architecture and permanent conditions stay visible."
  },
  {
    src: "/images/rendprop/living-room-staged-concept.webp",
    label: "Virtually staged",
    alt: "Virtually staged concept of the same living room with modern coastal furniture",
    detail: "Furniture is replaced digitally; room geometry and permanent finishes are preserved."
  }
] as const;

export default function RendPropPage() {
  const features = publicFeatures();

  return (
    <>
      <Section pad="head" orbs width="wide">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <SectionHeading
              as="h1"
              eyebrow="RendProp"
              title="Show the room. Show the edit. Never blur the line."
              gradientWord="Never blur the line."
              description="A guided phone-capture concept for assembling listing media, with every cleanup, enhancement and staged view labeled at the point of use."
            />
            <div className="flex flex-wrap items-center gap-3">
              <FeatureStatus
                label="Interactive capture"
                status={features.rendProp ? "live" : "coming_soon"}
              />
              <Badge tone="warning">Synthetic product demonstration</Badge>
            </div>
            <p className="mt-5 text-sm text-[var(--text-muted)]">
              The media demonstration below is usable now. Upload, processing and public-tour
              publishing remain disabled until Phase 4 completes the rights and deletion workflow.
            </p>
          </div>
          <div
            className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-2)] shadow-[var(--shadow-float)]"
            data-testid="rendprop-capture-demo"
          >
            <div className="aspect-[8/5] overflow-hidden">
              <AssetImage
                src="/images/rendprop/phone-capture.webp"
                alt="Agent using a phone to frame a synthetic living room capture"
                width={1440}
                height={900}
                sizes="(max-width: 1024px) 100vw, 56vw"
                priority
                fallbackLabel="Capture demonstration unavailable"
              />
            </div>
            <div className="grid gap-px bg-[var(--border)] sm:grid-cols-3">
              {CAPTURE_STEPS.map(([step, title, body]) => (
                <div key={step} className="bg-[var(--bg)] p-4">
                  <p className="text-xs font-bold text-[var(--purple)]">{step}</p>
                  <p className="mt-1 font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface" width="wide">
        <SectionHeading
          eyebrow="Living room sequence"
          title="One source. Two disclosed visualizations."
          gradientWord="disclosed visualizations."
          description="All three generated fixtures preserve the same viewpoint and room shell. Labels live in HTML, not inside the pixels."
        />
        <div className="grid gap-5 lg:grid-cols-3" data-testid="rendprop-living-sequence">
          {LIVING_MEDIA.map((item, index) => (
            <Card key={item.src} className="overflow-hidden p-0">
              <figure className="relative">
                <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
                  <AssetImage
                    src={item.src}
                    alt={item.alt}
                    width={1440}
                    height={900}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    fallbackLabel={`${item.label} unavailable`}
                  />
                </div>
                <figcaption
                  className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg ${index === 0 ? "bg-black/75 backdrop-blur-sm" : "bg-[var(--purple-dark)]"}`}
                >
                  {item.label}
                </figcaption>
              </figure>
              <p className="p-5 text-sm text-[var(--text-muted)]">{item.detail}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section width="wide">
        <SectionHeading
          eyebrow="Exposure and color"
          title="Enhancement cannot erase a condition."
          gradientWord="cannot erase"
          description="The enhanced fixture corrects light and white balance while retaining every object, edge and the visible scuff near the refrigerator."
        />
        <div className="grid gap-6 md:grid-cols-2" data-testid="rendprop-kitchen-pair">
          {[
            {
              src: "/images/rendprop/kitchen-original.webp",
              label: "Original",
              alt: "Underexposed synthetic kitchen source fixture with a visible wall scuff"
            },
            {
              src: "/images/rendprop/kitchen-enhanced.webp",
              label: "Enhanced",
              alt: "Exposure-corrected version of the same kitchen retaining the visible wall scuff"
            }
          ].map((item) => (
            <Card key={item.src} className="overflow-hidden p-0">
              <figure className="relative">
                <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
                  <AssetImage
                    src={item.src}
                    alt={item.alt}
                    width={1440}
                    height={900}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    fallbackLabel={`${item.label} kitchen fixture unavailable`}
                  />
                </div>
                <figcaption className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {item.label}
                </figcaption>
              </figure>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="surface" width="wide">
        <SectionHeading
          eyebrow="Candidate outputs"
          title="Useful presentation, bounded claims."
          gradientWord="bounded claims."
          description="A floor-plan candidate and tour cover can organize a walkthrough. Neither establishes dimensions, condition or value."
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden p-0">
            <div className="aspect-[8/5] overflow-hidden bg-white">
              <AssetImage
                src="/images/rendprop/sample-floor-plan.webp"
                alt="Generated sample floor-plan candidate without dimensions or scale"
                width={1440}
                height={900}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain"
                fallbackLabel="Floor-plan candidate unavailable"
              />
            </div>
            <div className="border-t border-[var(--border)] p-5">
              <Badge tone="warning">Floor-plan candidate</Badge>
              <p className="mt-3 text-sm font-semibold">
                Not for measurement, appraisal, survey or construction.
              </p>
            </div>
          </Card>
          <Card className="overflow-hidden p-0">
            <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
              <AssetImage
                src="/images/rendprop/sample-tour-cover.webp"
                alt="Virtually staged synthetic living room used as a sample tour cover"
                width={1200}
                height={900}
                sizes="(max-width: 1024px) 100vw, 40vw"
                fallbackLabel="Tour cover unavailable"
              />
            </div>
            <div className="p-5">
              <Badge tone="neutral">Sample tour cover</Badge>
              <p className="mt-3 text-lg font-semibold">
                Room sequence, media labels and agent attribution
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Public sharing and QR attribution ship with the complete rights and deletion flow.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      <Section width="narrow">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/partners/real-estate-agents">See the agent workflow</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Discuss the product concept
          </ButtonLink>
        </div>
        <Disclosure
          headline="Media is marketing, not a representation of condition."
          body="Every image on this page is an AI-generated synthetic fixture. Cleanup, staging and enhancement are labeled and cannot substitute for inspection, appraisal, survey, measurements, engineering, permitting or an in-person view."
          excludes={[
            "Silent removal of damage, permanent features or neighboring conditions",
            "Publishing without capture and alteration rights",
            "Measurement, survey or construction accuracy"
          ]}
        />
      </Section>
    </>
  );
}
