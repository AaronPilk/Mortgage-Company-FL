import type { Metadata } from "next";
import Link from "next/link";
import { AssetImage } from "@/components/asset-image";
import { LeadForm } from "@/components/lead-form";
import { TourShareActions } from "@/components/rendprop/tour-share-actions";
import { Badge, ButtonLink, Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import {
  RENDPROP_DEMO_AGENT_ATTRIBUTION,
  RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH,
  RENDPROP_DEMO_TOUR_PATH
} from "@/lib/rendprop-demo";
import { EMAIL_CONSENT_TEXT, LEAD_DISCLOSURE_TEXT, SMS_CONSENT_TEXT } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Synthetic coastal home sample tour",
  description:
    "A noindex RendProp demonstration with original and altered synthetic media, source attribution and clear floor-plan limitations.",
  path: RENDPROP_DEMO_TOUR_PATH,
  imagePath: "/images/og/rendprop.png",
  noIndex: true
});

const LIVING_ROOM_MEDIA = [
  {
    src: "/images/rendprop/living-room-original.webp",
    label: "Original synthetic fixture",
    alt: "Synthetic original living room with ordinary movable clutter",
    note: "Generated source fixture. Ordinary movable clutter remains visible."
  },
  {
    src: "/images/rendprop/living-room-staged-concept.webp",
    label: "Virtually staged",
    alt: "Virtually staged version of the synthetic living room",
    note: "Furniture is digitally replaced. Room geometry and permanent finishes are preserved."
  }
] as const;

const KITCHEN_MEDIA = [
  {
    src: "/images/rendprop/kitchen-original.webp",
    label: "Original synthetic fixture",
    alt: "Underexposed synthetic kitchen with a visible wall scuff",
    note: "Generated source fixture with a visible scuff beside the refrigerator."
  },
  {
    src: "/images/rendprop/kitchen-enhanced.webp",
    label: "Enhanced synthetic fixture",
    alt: "Exposure-corrected synthetic kitchen retaining the visible wall scuff",
    note: "Light and white balance are corrected; objects, edges and the scuff remain."
  }
] as const;

function MediaPair({
  items,
  testId
}: {
  items: typeof LIVING_ROOM_MEDIA | typeof KITCHEN_MEDIA;
  testId: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2" data-testid={testId}>
      {items.map((item) => (
        <Card key={item.src} className="overflow-hidden p-0">
          <figure className="relative">
            <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
              <AssetImage
                src={item.src}
                alt={item.alt}
                width={1440}
                height={900}
                sizes="(max-width: 768px) 100vw, 50vw"
                fallbackLabel={`${item.label} unavailable`}
              />
            </div>
            <figcaption className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white">
              {item.label}
            </figcaption>
          </figure>
          <p className="p-5 text-sm text-[var(--text-muted)]">{item.note}</p>
        </Card>
      ))}
    </div>
  );
}

function UnpublishedState() {
  return (
    <Section orbs width="narrow">
      <Badge tone="warning">Sample unavailable state</Badge>
      <h1 className="mt-5 text-4xl font-bold">This tour is not available.</h1>
      <p className="mt-4 text-[var(--text-muted)]">
        This is the explicit unpublish-state demonstration. Media, sharing and inquiry controls are
        withheld when a tour is unavailable; no listing status is implied.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <ButtonLink href={RENDPROP_DEMO_TOUR_PATH}>Return to the published sample</ButtonLink>
        <ButtonLink href="/rendprop" variant="secondary">
          RendProp overview
        </ButtonLink>
      </div>
    </Section>
  );
}

export default async function RendPropTourPage({
  searchParams
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  if (state === "unpublished") return <UnpublishedState />;

  return (
    <>
      <Section pad="head" orbs width="wide">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Published sample</Badge>
              <Badge tone="warning">Synthetic home · not a listing</Badge>
            </div>
            <SectionHeading
              as="h1"
              eyebrow="RendProp tour"
              title="A coastal-room walkthrough with the edits in plain sight."
              gradientWord="edits in plain sight."
              description="A stable, noindex demonstration route. Every altered view stays beside its source and carries a visible label."
            />
            <dl className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--text-muted)]">Property</dt>
                <dd className="mt-1 font-semibold">Synthetic Florida coastal-home fixture</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Presented by</dt>
                <dd className="mt-1 font-semibold">{RENDPROP_DEMO_AGENT_ATTRIBUTION}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Availability</dt>
                <dd className="mt-1 font-semibold">
                  Static demonstration · no expiration scheduled
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Tour key</dt>
                <dd className="mt-1 font-mono text-xs">rendprop-coastal-demo</dd>
              </div>
            </dl>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
              <AssetImage
                src="/images/rendprop/sample-tour-cover.webp"
                alt="Virtually staged synthetic living room used as the RendProp sample tour cover"
                width={1200}
                height={900}
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
                fallbackLabel="Sample tour cover unavailable"
              />
            </div>
            <p className="border-t border-[var(--border)] p-4 text-sm font-semibold">
              Virtually staged tour cover · synthetic fixture
            </p>
          </Card>
        </div>
      </Section>

      <nav
        aria-label="Sample tour rooms"
        className="sticky top-0 z-20 border-y border-[var(--border)] bg-[var(--bg)]/95 py-3 backdrop-blur"
      >
        <div className="container-wide flex gap-2 overflow-x-auto">
          {(
            [
              ["#living-room", "Living room"],
              ["#kitchen", "Kitchen"],
              ["#floor-plan", "Floor-plan candidate"],
              ["#inquiry", "Inquiry"]
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:border-[var(--purple)] hover:text-[var(--purple)]"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <Section width="wide" id="living-room">
        <SectionHeading
          eyebrow="Room 1 of 2"
          title="Living room"
          description="The original synthetic fixture remains available beside the virtual-staging visualization."
        />
        <MediaPair items={LIVING_ROOM_MEDIA} testId="tour-living-pair" />
      </Section>

      <Section width="wide" tone="surface" id="kitchen">
        <SectionHeading
          eyebrow="Room 2 of 2"
          title="Kitchen"
          description="Exposure enhancement improves presentation without removing the visible wall condition."
        />
        <MediaPair items={KITCHEN_MEDIA} testId="tour-kitchen-pair" />
      </Section>

      <Section width="wide" id="floor-plan">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Card className="overflow-hidden p-0">
            <div className="aspect-[8/5] overflow-hidden bg-white">
              <AssetImage
                src="/images/rendprop/sample-floor-plan.webp"
                alt="Generated sample floor-plan candidate without dimensions or scale"
                width={1440}
                height={900}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-contain"
                fallbackLabel="Floor-plan candidate unavailable"
              />
            </div>
            <p className="border-t border-[var(--border)] p-4 text-sm font-semibold">
              Floor-plan candidate · generated · not to scale
            </p>
          </Card>
          <div>
            <Badge tone="warning">Organization aid only</Badge>
            <h2 className="mt-4 text-3xl font-bold">No dimensions. No measurement claim.</h2>
            <p className="mt-4 text-[var(--text-muted)]">
              This diagram organizes the two-room fixture. It is not suitable for measurement,
              appraisal, survey, inspection, construction, accessibility evaluation or any
              representation of property condition.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface" width="wide">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <Card className="overflow-hidden p-0">
            <div className="aspect-square overflow-hidden bg-[var(--surface-2)]">
              <AssetImage
                src="/images/agents/open-house-qr-demo.webp"
                alt="Abstract non-scannable QR-style card for the sample tour"
                width={900}
                height={900}
                sizes="(max-width: 1024px) 100vw, 38vw"
                fallbackLabel="QR presentation fixture unavailable"
              />
            </div>
          </Card>
          <div>
            <Badge tone="neutral">Non-scannable presentation fixture</Badge>
            <h2 className="mt-4 text-3xl font-bold">Share a stable route, attribute a campaign.</h2>
            <p className="mt-4 text-[var(--text-muted)]">
              The pictured pattern cannot be scanned. The direct link below is real and carries only
              `utm_source`, `utm_medium` and `utm_campaign`; the inquiry contract stores those
              bounded fields without retaining the query string as a landing path.
            </p>
            <div className="mt-6 flex flex-wrap items-start gap-3">
              <ButtonLink href={RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH} variant="secondary">
                Open QR-attributed link
              </ButtonLink>
              <TourShareActions />
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              <Link
                className="underline underline-offset-2"
                href={`${RENDPROP_DEMO_TOUR_PATH}?state=unpublished`}
              >
                Preview the explicit unpublished state
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section width="wide" id="inquiry">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <LeadForm
            intent="purchase"
            formId="rendprop-tour-inquiry"
            heading="Ask about financing for a home like this"
            submitLabel="Request a conversation"
            disclosureText={LEAD_DISCLOSURE_TEXT}
            smsConsentText={SMS_CONSENT_TEXT}
            emailConsentText={EMAIL_CONSENT_TEXT}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          />
          <div className="space-y-5">
            <Card>
              <h2 className="text-xl font-bold">This is not an active property inquiry</h2>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                There is no seller, address, price or listing behind this sample. The form requests
                a mortgage conversation and records the tour source; it does not schedule a showing
                or create a credit application.
              </p>
            </Card>
            <Card>
              <h2 className="text-xl font-bold">Want to test a payment instead?</h2>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Build a local range first. Calculator inputs stay in the browser unless you
                separately choose to send a bounded planning snapshot.
              </p>
              <div className="mt-5">
                <ButtonLink
                  href="/mortgage/plan?utm_source=rendprop_demo&utm_medium=sample_tour&utm_campaign=mortgage_handoff"
                  variant="secondary"
                >
                  Build a mortgage plan
                </ButtonLink>
              </div>
            </Card>
          </div>
        </div>
        <Disclosure
          headline="Original and altered media remain distinguishable."
          body="All property media is synthetic. Staging, cleanup and enhancement are visual presentation aids and cannot replace inspection, appraisal, survey, measurements, permitting, engineering or an in-person view."
        />
      </Section>
    </>
  );
}
