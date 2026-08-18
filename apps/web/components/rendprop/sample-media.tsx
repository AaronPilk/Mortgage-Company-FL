import type { ReactNode } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { AlteredMedia, OriginalMedia } from "./ai-label";

/**
 * Illustrative fixtures for the RendProp marketing page.
 *
 * No provider is connected, so RendProp has produced none of this. Every image
 * here was generated for this page to show what each transformation does to a
 * room, and the page says so above the gallery rather than leaving a reader to
 * infer it from an absence.
 *
 * The altered halves go through `AlteredMedia`, which derives its disclosure
 * from the transformation itself. That is not a stylistic preference: virtual
 * staging and digital alteration are disclosable in real-estate marketing, and a
 * label a component could choose to omit is a label that eventually gets
 * omitted. Passing the transformation is the only way to render one of these.
 *
 * The interactive walkthrough at /rendprop/demo stays on diagrams — see
 * `frames.tsx` — because a photograph inside a simulated product screen reads as
 * output in a way a photograph in a marketing gallery does not.
 */

type Picture = { src: string; alt: string };

const SIZE = { width: 1440, height: 900 } as const;

function Frame({ src, alt }: Picture) {
  return (
    <Image
      src={src}
      alt={alt}
      width={SIZE.width}
      height={SIZE.height}
      sizes="(max-width: 1024px) 100vw, 50vw"
      className="block aspect-[8/5] w-full object-cover"
    />
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
      {children}
    </p>
  );
}

export function RendPropSampleMedia() {
  return (
    <div className="space-y-10">
      <div
        className="rounded-2xl border-2 p-5 sm:p-6"
        style={{ borderColor: "var(--color-warning)", background: "var(--surface-2)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="warning">Illustrative fixtures</Badge>
          <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
            None of these images was produced by RendProp.
          </p>
        </div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          No provider is connected, so RendProp has processed nothing and these are not its output.
          They were generated for this page to show what each transformation does, and they do not
          depict a real property, a real client, or anyone who works here. Each altered image
          nevertheless carries the exact label the pipeline would attach to it, because that label
          is a property of the transformation rather than a decision this page makes.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          Step one: walk the property
        </h3>
        <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
          <Image
            src="/images/rendprop/phone-capture.webp"
            alt="An over-the-shoulder view of a phone held in landscape, framing a living room on its screen"
            width={SIZE.width}
            height={SIZE.height}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="aspect-[8/5] w-full rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-float)" }}
          />
          <Caption>
            Waist height, lights on, room by room, on the phone already in the agent&rsquo;s pocket.
            The person in this illustration is not a member of staff, an agent we work with, or a
            client, and the room is not a property that exists.
          </Caption>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          Declutter, then stage — and the original stays one click away
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <OriginalMedia>
            <Frame
              src="/images/rendprop/living-room-original.webp"
              alt="A lived-in living room with a throw over the sofa, shoes by the door and a box of toys"
            />
          </OriginalMedia>
          <AlteredMedia transformations={["clutter_cleanup"]}>
            <Frame
              src="/images/rendprop/living-room-cleanup-concept.webp"
              alt="The same living room with the movable personal items removed and the furniture unchanged"
            />
          </AlteredMedia>
          <AlteredMedia transformations={["virtual_staging"]}>
            <Frame
              src="/images/rendprop/living-room-staged-concept.webp"
              alt="The same living room shown with different, digitally added furniture and accessories"
            />
          </AlteredMedia>
        </div>
        <Caption>
          Cleanup took away the throw, the shoes and the toy box — movable personal items, and
          nothing else. It did not touch the floor, the fan, the walls, or anything a buyer would
          want to see. The staged frame replaces the furniture entirely; none of that furniture
          exists, which is precisely what its label says.
        </Caption>
      </div>

      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          Lighting correction shows the room, not a better room
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <OriginalMedia>
            <Frame
              src="/images/rendprop/kitchen-original.webp"
              alt="An underexposed kitchen with white cabinets, an island and a scuff on the wall at the right"
            />
          </OriginalMedia>
          <AlteredMedia transformations={["lighting_correction", "still_enhancement"]}>
            <Frame
              src="/images/rendprop/kitchen-enhanced.webp"
              alt="The same kitchen with exposure and colour corrected, the wall scuff still visible"
            />
          </AlteredMedia>
        </div>
        <Caption>
          The scuff on the wall survives the correction, deliberately. Exposure is a camera problem;
          a mark on a wall is a fact about the property, and a transformation that quietly removed
          it would be concealing a condition rather than fixing a photograph.
        </Caption>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Floor plan
          </h3>
          <div className="mt-3">
            <AlteredMedia transformations={["floor_plan"]}>
              <Frame
                src="/images/rendprop/sample-floor-plan.webp"
                alt="A line-drawn floor plan of a three-bedroom single-storey layout, with no dimensions marked"
              />
            </AlteredMedia>
          </div>
          <Caption>
            Derived from ordinary phone video, with no dimensions on it because none have been
            benchmarked. A candidate for review, not a survey.
          </Caption>
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            The tour cover a viewer opens
          </h3>
          <div className="mt-3">
            <AlteredMedia transformations={["virtual_staging"]}>
              <Image
                src="/images/rendprop/sample-tour-cover.webp"
                alt="A staged living room framed as the cover image of a shared property tour"
                width={1200}
                height={900}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="block aspect-[4/3] w-full object-cover"
              />
            </AlteredMedia>
          </div>
          <Caption>
            The disclosure travels with the media rather than the page, so it survives the cover
            being embedded, screenshotted, or forwarded away from anything that qualified it.
          </Caption>
        </div>
      </div>
    </div>
  );
}
