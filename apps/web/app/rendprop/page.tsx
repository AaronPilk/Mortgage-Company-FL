import type { Metadata } from "next";
import {
  Badge,
  ButtonLink,
  Card,
  CtaPanel,
  Disclosure,
  Faq,
  Prose,
  Section,
  SectionHeading
} from "@/components/ui";
import { AlterationPolicyNote } from "@/components/rendprop/ai-label";
import { PipelineDiagram } from "@/components/rendprop/frames";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { mediaProviderStatus } from "@/lib/rendprop/adapter";
import { TRANSFORMATION_CATALOGUE, RENDPROP_TRANSFORMATIONS } from "@/lib/rendprop/pipeline";
import { RENDPROP_UPLOAD_POLICY } from "@/lib/rendprop/uploads";

export const metadata: Metadata = pageMetadata({
  title: "RendProp",
  description:
    "Listing media from a phone walkthrough: declutter, lighting, virtual staging, stills, floor plan, and a shareable tour — with every altered image labelled.",
  path: "/rendprop",
  noIndex: true
});

/**
 * RendProp.
 *
 * The status block is derived from the adapter rather than written into the
 * copy. A page that says "coming soon" in prose keeps saying it after the thing
 * arrives; a page that asks the adapter cannot.
 */

const PIPELINE_STEPS = [
  {
    title: "Walk the property",
    detail:
      "A guided capture on the phone you already have. Room by room, waist height, lights on. No rig, no tripod, no second visit.",
    where: "phone" as const
  },
  {
    title: "Upload over a signed URL",
    detail:
      "An authenticated request mints a short-lived upload URL and the file goes straight to storage. There is no public endpoint to abuse.",
    where: "request" as const
  },
  {
    title: "Tag the rooms",
    detail:
      "Each clip gets a proposed room label. You confirm every one — a suggestion is never treated as a confirmation.",
    where: "phone" as const
  },
  {
    title: "Queue the work",
    detail:
      "The request inserts queued rows and returns immediately. Nothing heavy runs in a request handler, because a request that exceeds its CPU budget is killed and the person gets nothing.",
    where: "request" as const
  },
  {
    title: "A worker processes it",
    detail:
      "A background worker claims a job, reserves the spend under a lock, calls the provider, and settles. Retries are bounded and jittered; an ambiguous outcome parks for reconciliation rather than quietly releasing budget.",
    where: "worker" as const
  },
  {
    title: "Review, approve, publish",
    detail:
      "Every altered image is shown beside its unaltered original with its disclosure label attached, and nothing reaches a tour until you approve it.",
    where: "phone" as const
  }
] as const;

const FAQS = [
  {
    question: "Is the floor plan a survey?",
    answer:
      "No. It is derived from ordinary phone video and is approximate. We do not state measurement accuracy we have not benchmarked, and we will not compare it to dedicated capture hardware until there is a published benchmark to point at. Treat it as a candidate for review."
  },
  {
    question: "How is virtual staging disclosed?",
    answer:
      "In the visible layout, beside the image, on every surface that renders it — the project view, the review screen, and the public tour. The label is a property of the transformation rather than something a component chooses to show, and it is frozen in the database at creation so it cannot be edited away afterwards."
  },
  {
    question: "Can cleanup remove a problem from a photo?",
    answer:
      "No. Cleanup removes movable personal items. It may not remove damage, structural elements, utilities, permanent fixtures, or a neighbouring condition. Hiding a defect a buyer would want to know about is not a feature, and the pipeline is built so it cannot be done silently."
  },
  {
    question: "Who owns the media?",
    answer:
      "You do. You confirm you have the right to capture and publish the property before anything is uploaded, the originals are preserved unmodified, and every generated asset records which original it came from. Deletion propagates to originals, derivatives, thumbnails, and anything a provider still holds."
  },
  {
    question: "What happens to faces and personal items?",
    answer:
      "The capture guidance steers away from people, post, screens, documents, and neighbouring property. Anything that identifies somebody should not be filmed in the first place, because the cheapest way to protect it is not to capture it."
  }
];

export default function RendPropPage() {
  const features = publicFeatures();
  const provider = mediaProviderStatus();

  return (
    <>
      <Section width="default" orbs pad="head">
        <SectionHeading
          as="h1"
          eyebrow="RendProp"
          title="Listing media from a phone walkthrough"
          gradientWord="phone walkthrough"
          description="Record the property once, on the phone in your pocket. RendProp turns the walkthrough into a room-by-room tour, enhanced stills, an approximate floor plan, and a share page with a QR code — with every altered image labelled as altered."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/rendprop/demo" data-cta="rendprop-hero-demo">
            Walk through the product
          </ButtonLink>
          <ButtonLink href="/partners/real-estate-agents" variant="secondary">
            How we work with agents
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          The walkthrough is an illustrative demonstration. It processes nothing and stores nothing.
        </p>
      </Section>

      <Section width="default" pad="tight">
        <Card className="border-[var(--purple)]">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="warning">Current status</Badge>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              {provider.headline}
            </h2>
          </div>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            {provider.detail}
          </p>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            {features.rendProp
              ? "The RendProp surface is enabled in this environment, but the processing step still has no provider behind it."
              : "The RendProp feature flag is off in this environment as well, so no project, upload, or job can be created here."}
          </p>
        </Card>
      </Section>

      <Section width="default" tone="surface" id="how-it-works">
        <SectionHeading
          eyebrow="The workflow"
          title="One walk through the house, then six steps"
          gradientWord="six steps"
          description="Where each step runs matters. Anything a person waits on happens on the phone or in a request that returns immediately; anything that takes minutes happens in a worker."
        />
        <PipelineDiagram steps={PIPELINE_STEPS} />
      </Section>

      <Section width="default">
        <SectionHeading
          eyebrow="What it produces"
          title="Seven transformations, each with its own disclosure"
          gradientWord="its own disclosure"
          description="Anything that alters pixels carries a label. The label is written into the record at creation and rendered next to the image everywhere it appears."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RENDPROP_TRANSFORMATIONS.map((key) => {
            const spec = TRANSFORMATION_CATALOGUE[key];
            return (
              <Card key={key} as="article">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                    {spec.label}
                  </h3>
                  {spec.altersImagery && <Badge tone="warning">Labelled</Badge>}
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  {spec.blurb}
                </p>
                {spec.altersImagery && (
                  <p className="mt-3 text-xs" style={{ color: "var(--purple)" }}>
                    Output label: “{spec.disclosureLabel}”
                  </p>
                )}
              </Card>
            );
          })}
        </div>
        <div className="mt-8">
          <AlterationPolicyNote />
        </div>
      </Section>

      <Section width="default" tone="surface">
        <SectionHeading
          eyebrow="How it is built"
          title="The parts that are real today"
          gradientWord="real today"
          description="No provider is connected, so nothing here can process a walkthrough. What is built is everything around that gap, and it is built the way it will ship."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Work never runs in a request
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              The runtime enforces a hard CPU budget per request. A transcode plus several provider
              round-trips is not request-shaped work, so the request path inserts a queued row and
              returns, and a separate worker drains the queue. That is the only shape that does not
              produce a killed request and a confused agent.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Spend is reserved before it is spent
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              The worker reserves the estimated cost under a lock on the quota bucket and only then
              may call a provider. If the provider's outcome is ambiguous, the reservation is held
              and the job is flagged for a human — releasing budget against a bill that may still
              arrive is how a spend cap stops being a cap.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Originals are never overwritten
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Captured media is immutable. Every generated asset records the frame it came from, the
              job that made it, and the model that ran — so “show me the unedited original” is
              always answerable, which is what makes a disclosure checkable rather than decorative.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Uploads have a front door and no back door
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Accepted types are MP4, MOV, JPEG, PNG, WebP, and HEIC; a clip is capped at{" "}
              {RENDPROP_UPLOAD_POLICY.maxVideoBytes / 1_073_741_824} GB and a photo at{" "}
              {RENDPROP_UPLOAD_POLICY.maxImageBytes / 1_048_576} MB. Upload URLs are minted for an
              authenticated owner, expire in {RENDPROP_UPLOAD_POLICY.signedUrlTtlSeconds / 60}{" "}
              minutes, and land at a path derived from ids rather than from a filename. There is no
              unauthenticated upload endpoint.
            </p>
          </Card>
        </div>
      </Section>

      <Section width="narrow">
        <SectionHeading
          eyebrow="Limits"
          title="What RendProp will not claim"
          gradientWord="will not claim"
        />
        <Prose>
          {/*
            Written before the feature exists, on purpose. It is far easier to
            hold a line you set in advance than one you retrofit onto marketing
            copy that already overpromised.
          */}
          <p>
            Not survey-grade. No stated measurement accuracy without a published benchmark. No
            comparison to dedicated capture hardware until there is one to point at. A floor plan
            derived from ordinary video is a candidate for review, not a survey.
          </p>
          <p>
            Media is marketing. An enhanced or staged image is not a representation of condition, is
            not a substitute for an inspection, and does not become one because it looks convincing.
          </p>
          <p>
            And while no provider is connected, RendProp does not process anything at all. That is
            stated here rather than implied by an empty dashboard.
          </p>
        </Prose>
      </Section>

      <Section width="narrow" tone="surface">
        <SectionHeading eyebrow="Questions" title="Common questions" gradientWord="questions" />
        <Faq items={FAQS} />
        <Disclosure
          headline="Media is marketing, not a representation of condition."
          body="Any enhanced, staged, or generated imagery is labelled as such in the visible interface. It does not represent the condition of the property and is never a substitute for an inspection."
          version="rendprop-disclosure@0.1.0"
        />
      </Section>

      <Section width="default" pad="tight">
        <CtaPanel
          title="See the whole workflow"
          body="Click through project creation, capture, tagging, transformations, before-and-after review, approval, and a shared tour. Illustrative throughout."
          primary={{
            href: "/rendprop/demo",
            label: "Open the walkthrough",
            cta: "rendprop-cta-demo"
          }}
          secondary={{ href: "/contact", label: "Talk to us about it" }}
        />
      </Section>
    </>
  );
}
