/**
 * Labelled imagery for Vision.
 *
 * A picture of a house that has been changed is a claim, and an unlabelled one
 * is a claim nobody can check. Digitally altered property imagery is disclosable
 * in real-estate marketing, and the same reasoning applies whether the change is
 * furniture in a room or a wing on a bungalow: a reader must be able to tell
 * which image is the starting point and which is an invention.
 *
 * RendProp solves this with `AlteredMedia`, whose label is derived from the
 * transformation the pipeline actually ran. Vision has no such pipeline and no
 * transformation vocabulary — these are illustrations of what a scenario type
 * means, not outputs — so it gets the same structure with its own closed set of
 * kinds. What is copied deliberately is the property that matters: the label is
 * emitted by the wrapper and derived from `kind`, so it is not a prop a caller
 * can forget to pass.
 *
 * Nothing here depicts a real project, a real client, or a real address.
 */

const CONCEPT_LABEL = {
  renovation:
    "Concept visualization — a generated illustration of one possible outcome. Not a photograph of completed work, a design, or a prediction of result.",
  addition:
    "Concept visualization — a generated illustration of one possible outcome. Not a design, not an approval, and not evidence that anything may be built.",
  land_placement:
    "Concept visualization — a generated illustration of one possible outcome. Placement, access, permitted use, and flood zone are not established here."
} as const;

export type ConceptKind = keyof typeof CONCEPT_LABEL;

type Picture = { src: string; alt: string; width: number; height: number };

function Photo({ src, alt, width, height }: Picture) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className="block aspect-[8/5] w-full object-cover"
    />
  );
}

/** The unaltered starting image, labelled just as explicitly so the pair reads. */
export function SourceVisual({ image }: { image: Picture }) {
  return (
    <figure
      className="m-0 overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <Photo {...image} />
      <figcaption
        className="flex items-center gap-2 border-t px-3 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.6rem] font-bold"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          ◻
        </span>
        <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text-muted)" }}>
          Starting point — shown unaltered
        </p>
      </figcaption>
    </figure>
  );
}

/** The altered image. The disclosure comes from `kind`, not from the caller. */
export function ConceptVisual({ kind, image }: { kind: ConceptKind; image: Picture }) {
  return (
    <figure
      className="m-0 overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <Photo {...image} />
      <figcaption
        className="flex flex-wrap items-start gap-2 border-t px-3 py-3"
        style={{ borderColor: "var(--border)", background: "var(--purple-subtle)" }}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
          style={{ background: "var(--purple)" }}
        >
          AI
        </span>
        <p className="flex-1 text-xs font-semibold leading-snug" style={{ color: "var(--text)" }}>
          {CONCEPT_LABEL[kind]}
        </p>
      </figcaption>
    </figure>
  );
}

/** A before/after pair. Both halves are labelled; neither can render without one. */
export function ConceptPair({
  kind,
  heading,
  body,
  before,
  after
}: {
  kind: ConceptKind;
  heading: string;
  body: string;
  before: Picture;
  after: Picture;
}) {
  return (
    <article>
      <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
        {heading}
      </h3>
      <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
        {body}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SourceVisual image={before} />
        <ConceptVisual kind={kind} image={after} />
      </div>
    </article>
  );
}
