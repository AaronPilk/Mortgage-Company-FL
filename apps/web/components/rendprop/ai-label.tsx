import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import {
  TRANSFORMATION_CATALOGUE,
  disclosureLabelFor,
  requiresVisibleDisclosure,
  type RendPropTransformation
} from "@/lib/rendprop/pipeline";

/**
 * Visible disclosure for altered imagery.
 *
 * This is a legal requirement, not a design flourish. Virtual staging and
 * digital alteration are disclosable in real-estate marketing, and a label
 * carried only in metadata is a label no buyer will ever read. So the label is
 * rendered in the layout, in the same visual block as the image, and it is not
 * possible to render `<AlteredMedia>` without it — the label is not a prop the
 * caller can forget, it is derived from the transformation itself.
 */

export function AiMediaLabel({
  transformations,
  compact = false
}: {
  transformations: readonly RendPropTransformation[];
  compact?: boolean;
}) {
  const disclosed = transformations.filter(requiresVisibleDisclosure);
  if (disclosed.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 border-t px-3 ${compact ? "py-2" : "py-3"}`}
      style={{ borderColor: "var(--border)", background: "var(--purple-subtle)" }}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
        style={{ background: "var(--purple)" }}
      >
        AI
      </span>
      <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text)" }}>
        {disclosed.map((key) => disclosureLabelFor(key)).join(" · ")}
      </p>
    </div>
  );
}

/**
 * Wraps any altered visual. The label is emitted by the wrapper, so a caller
 * cannot render the picture and skip the disclosure.
 */
export function AlteredMedia({
  transformations,
  children,
  className = ""
}: {
  transformations: readonly RendPropTransformation[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-2xl border ${className}`}
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {children}
      <figcaption>
        <AiMediaLabel transformations={transformations} />
      </figcaption>
    </figure>
  );
}

/** The unaltered original, labelled just as explicitly so the pair reads clearly. */
export function OriginalMedia({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-2xl border ${className}`}
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {children}
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
          Unaltered frame from the walkthrough — preserved as captured
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * The standing disclosure that accompanies a shared tour. It states what cleanup
 * may never do, because "we removed the clutter" and "we removed the water stain"
 * are the same button to a viewer unless somebody says otherwise.
 */
export function AlterationPolicyNote() {
  return (
    <div
      className="rounded-2xl border p-5 text-sm"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warning">Disclosure</Badge>
        <span className="font-semibold" style={{ color: "var(--text)" }}>
          What altered imagery may never hide
        </span>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5" style={{ color: "var(--text-muted)" }}>
        {TRANSFORMATION_CATALOGUE.clutter_cleanup.mayNotConceal.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-3" style={{ color: "var(--text-muted)" }}>
        Cleanup removes movable personal items. It is not a repair, and no altered image represents
        the condition of a property or substitutes for an inspection.
      </p>
    </div>
  );
}
