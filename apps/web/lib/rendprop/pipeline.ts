/**
 * The RendProp transformation catalogue.
 *
 * Two things live here that are not cosmetic. First, `disclosureLabel` — the
 * exact words rendered beside the output in the visible UI. Virtual staging is a
 * regulated disclosure in real-estate marketing, so the label is part of the
 * transformation's definition rather than a decision a component makes.
 *
 * Second, `mayNotConceal`. Cleanup removes movable clutter. It does not remove
 * damage, structural elements, utilities, permanent fixtures, or a neighbouring
 * condition, and the catalogue says so per transformation so the rule survives
 * the next person who adds one.
 *
 * Pure data and pure functions. No provider, no network, no secrets — this
 * module is imported by client components as well as by the worker.
 */

export const RENDPROP_TRANSFORMATIONS = [
  "clutter_cleanup",
  "lighting_correction",
  "virtual_staging",
  "still_enhancement",
  "floor_plan",
  "tour_sequencing",
  "room_classification"
] as const;

export type RendPropTransformation = (typeof RENDPROP_TRANSFORMATIONS)[number];

export type TransformationSpec = {
  readonly key: RendPropTransformation;
  readonly label: string;
  readonly blurb: string;
  /** Produces pixels a viewer could mistake for a photograph. */
  readonly altersImagery: boolean;
  /** Rendered next to the output. Empty only where nothing visual is produced. */
  readonly disclosureLabel: string;
  /** Rough per-asset provider cost, in integer cents. Used to size a reservation. */
  readonly estimatedCostCents: number;
  readonly mayNotConceal: readonly string[];
};

const NEVER_CONCEALED = [
  "damage or deferred maintenance",
  "structural elements",
  "utilities, panels, and mechanical equipment",
  "permanent fixtures",
  "a neighbouring property or condition"
] as const;

export const TRANSFORMATION_CATALOGUE: Readonly<
  Record<RendPropTransformation, TransformationSpec>
> = {
  clutter_cleanup: {
    key: "clutter_cleanup",
    label: "Declutter",
    blurb: "Removes movable personal items — laundry, cables, worktop clutter, bins.",
    altersImagery: true,
    disclosureLabel: "Digitally decluttered — movable items removed",
    estimatedCostCents: 18,
    mayNotConceal: NEVER_CONCEALED
  },
  lighting_correction: {
    key: "lighting_correction",
    label: "Lighting correction",
    blurb: "Balances exposure and colour so a phone-lit room reads the way it looks.",
    altersImagery: true,
    disclosureLabel: "Digitally enhanced — exposure and colour corrected",
    estimatedCostCents: 9,
    mayNotConceal: NEVER_CONCEALED
  },
  virtual_staging: {
    key: "virtual_staging",
    label: "Virtual staging",
    blurb: "Adds furniture to an empty room. The furniture does not exist.",
    altersImagery: true,
    disclosureLabel: "Virtually staged — furnishings are digital and not included in the sale",
    estimatedCostCents: 45,
    mayNotConceal: NEVER_CONCEALED
  },
  still_enhancement: {
    key: "still_enhancement",
    label: "Enhanced stills",
    blurb: "Pulls sharp frames out of the walkthrough and upscales them for a listing.",
    altersImagery: true,
    disclosureLabel: "AI-enhanced still extracted from video",
    estimatedCostCents: 12,
    mayNotConceal: NEVER_CONCEALED
  },
  floor_plan: {
    key: "floor_plan",
    label: "Floor plan",
    blurb: "A room-adjacency sketch derived from the walkthrough. Not a survey.",
    altersImagery: true,
    disclosureLabel: "AI-generated floor plan — approximate, not a measured survey",
    estimatedCostCents: 60,
    mayNotConceal: NEVER_CONCEALED
  },
  tour_sequencing: {
    key: "tour_sequencing",
    label: "Tour sequencing",
    blurb: "Orders the scenes into a walk a viewer can follow.",
    altersImagery: false,
    disclosureLabel: "Scene order arranged automatically",
    estimatedCostCents: 4,
    mayNotConceal: NEVER_CONCEALED
  },
  room_classification: {
    key: "room_classification",
    label: "Room tagging",
    blurb: "Suggests a room label for each clip. You confirm every one.",
    altersImagery: false,
    estimatedCostCents: 3,
    disclosureLabel: "Room labels suggested automatically and confirmed by the agent",
    mayNotConceal: NEVER_CONCEALED
  }
};

export const ROOM_TAGS = [
  "exterior",
  "entry",
  "living",
  "kitchen",
  "dining",
  "bedroom",
  "bathroom",
  "utility",
  "outdoor",
  "other"
] as const;

export type RoomTag = (typeof ROOM_TAGS)[number];

/**
 * True when the output must carry a visible label. Every imagery-altering
 * transformation does; a UI that renders one of these without the label from
 * `disclosureLabelFor` is a compliance defect, not a styling choice.
 */
export function requiresVisibleDisclosure(transformation: RendPropTransformation): boolean {
  return TRANSFORMATION_CATALOGUE[transformation].altersImagery;
}

export function disclosureLabelFor(transformation: RendPropTransformation): string {
  return TRANSFORMATION_CATALOGUE[transformation].disclosureLabel;
}

export function estimatedCostCentsFor(transformations: readonly RendPropTransformation[]): number {
  return transformations.reduce(
    (total, key) => total + TRANSFORMATION_CATALOGUE[key].estimatedCostCents,
    0
  );
}

/**
 * Deterministic fingerprint of a job's parameters.
 *
 * FNV-1a over a stably-ordered serialization. It is not a security hash and is
 * not used as one — it exists so that the same request produces the same
 * idempotency key in the browser, in a route handler, and in the worker,
 * without dragging a crypto dependency into a client bundle.
 */
export function fingerprintParameters(parameters: Readonly<Record<string, unknown>>): string {
  let hash = 0x811c9dc5;
  for (const character of stableStringify(parameters)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`);
  return `{${entries.join(",")}}`;
}
