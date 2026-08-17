import type { Metadata } from "next";
import { ButtonLink, Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";

export const metadata: Metadata = pageMetadata({
  title: "RendProp",
  description: "Listing media capture and enhancement for agents, with honest labeling.",
  path: "/rendprop",
  noIndex: true
});

export default function RendPropPage() {
  const features = publicFeatures();

  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow="RendProp"
        title="Listing media from a phone walkthrough"
        gradientWord="phone walkthrough"
        description="A guided capture workflow that produces a shareable tour — with any enhanced or staged imagery clearly labeled."
      />

      {!features.rendProp && (
        <Card className="border-[var(--purple)] bg-[var(--purple-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">In development</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            RendProp is not available yet. The capture guidance, processing pipeline, and rights
            workflow are specified; the media providers are not connected.
          </p>
          <div className="mt-5">
            <ButtonLink href="/partners/real-estate-agents" variant="secondary">
              See how we work with agents
            </ButtonLink>
          </div>
        </Card>
      )}

      <div className="mt-10">
        <Prose>
          <h2>What we will claim</h2>
          <ul>
            <li>A navigable media experience assembled from a guided phone capture</li>
            <li>Room organization and cleaned-up stills where you have the rights to the source</li>
            <li>Clearly labeled virtual staging</li>
            <li>Share pages and QR codes with attribution to you</li>
          </ul>

          <h2>What we will not claim</h2>
          {/*
            Written before the feature exists, on purpose. It is far easier to
            hold a line you set in advance than one you retrofit onto marketing
            copy that already overpromised.
          */}
          <p>
            We will not describe output as survey-grade, will not state measurement accuracy we have
            not benchmarked, and will not compare it to dedicated capture hardware until there is a
            published benchmark to point at. A floor plan derived from ordinary video is a candidate
            for review, not a survey.
          </p>

          <h2>Disclosure rules for altered imagery</h2>
          <p>
            Virtual staging is labeled. Cleanup may remove movable clutter in a labeled
            visualization; it may not remove damage, structural elements, utilities, permanent
            features, or neighbouring conditions. Hiding a defect a buyer would want to know about
            is not a product feature, and the pipeline is built so it cannot be done silently.
          </p>

          <h2>Rights and privacy</h2>
          <p>
            You confirm you have the right to capture and publish the property before anything is
            processed. Capture guidance steers away from faces, personal documents, and neighbouring
            property. Deletion propagates to originals, derivatives, thumbnails, and anything a
            provider still holds.
          </p>
        </Prose>
      </div>

      <Disclosure
        headline="Media is marketing, not a representation of condition."
        body="Any enhanced, staged, or generated imagery is labeled as such. It does not represent the condition of the property, and it is never a substitute for an inspection."
      />
    </Section>
  );
}
