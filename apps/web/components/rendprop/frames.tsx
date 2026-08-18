/**
 * Illustrative visuals, drawn in SVG and CSS.
 *
 * The interactive walkthrough uses no image or video files at all, and that is a
 * deliberate constraint rather than an omission. A photograph of a beautifully
 * staged living room inside a simulated product screen would be the single most
 * misleading thing this feature could ship while no provider is connected — a
 * reader would reasonably take it as output. A diagram cannot be mistaken for a
 * photograph, so the demo stays on diagrams.
 *
 * The marketing page is a different context and does show generated fixtures
 * (`sample-media.tsx`): they sit under a heading that states no provider is
 * connected, and every altered one carries its disclosure. Keep that separation.
 * Nothing photographic belongs inside the walkthrough.
 *
 * Every colour is a theme token, so these read correctly in light and dark.
 */

import type { RoomTag } from "@/lib/rendprop/pipeline";

export type FrameVariant = "raw" | "processed";

const ROOM_GEOMETRY: Readonly<Record<RoomTag, { window: boolean; doorway: boolean }>> = {
  exterior: { window: true, doorway: true },
  entry: { window: false, doorway: true },
  living: { window: true, doorway: false },
  kitchen: { window: true, doorway: false },
  dining: { window: true, doorway: false },
  bedroom: { window: true, doorway: false },
  bathroom: { window: false, doorway: false },
  utility: { window: false, doorway: true },
  outdoor: { window: false, doorway: false },
  other: { window: true, doorway: false }
};

/**
 * A schematic room. `raw` is dim and holds scattered clutter; `processed` is
 * brighter, the clutter is gone, and staged furniture may be present. The
 * difference between the two is the product, so it has to actually be visible.
 */
export function RoomFrame({
  room,
  variant,
  staged = false,
  caption
}: {
  room: RoomTag;
  variant: FrameVariant;
  staged?: boolean;
  caption?: string;
}) {
  const geometry = ROOM_GEOMETRY[room];
  const processed = variant === "processed";
  const wall = processed ? "var(--surface-2)" : "var(--surface)";
  const veil = processed ? 0 : 0.22;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 320 190"
        role="img"
        aria-label={`${caption ?? room} — ${processed ? "processed" : "as captured"} (illustrative diagram, not a photograph)`}
        className="block h-auto w-full"
        style={{ background: "var(--surface)" }}
      >
        {/* Back wall and floor. */}
        <rect x="0" y="0" width="320" height="120" fill={wall} />
        <polygon points="0,120 320,120 320,190 0,190" fill="var(--surface-2)" />
        <line x1="0" y1="120" x2="320" y2="120" stroke="var(--border)" strokeWidth="1.5" />

        {geometry.window && (
          <g>
            <rect
              x="196"
              y="26"
              width="88"
              height="62"
              rx="3"
              fill={processed ? "var(--purple-subtle)" : "var(--surface-2)"}
              stroke="var(--border)"
              strokeWidth="2"
            />
            <line x1="240" y1="26" x2="240" y2="88" stroke="var(--border)" strokeWidth="2" />
            <line x1="196" y1="57" x2="284" y2="57" stroke="var(--border)" strokeWidth="2" />
            {processed && (
              <polygon points="196,88 284,88 316,148 228,148" fill="var(--purple)" opacity="0.1" />
            )}
          </g>
        )}

        {geometry.doorway && (
          <rect
            x="34"
            y="28"
            width="52"
            height="92"
            rx="3"
            fill="var(--surface-2)"
            stroke="var(--border)"
            strokeWidth="2"
          />
        )}

        {/* Clutter: movable personal items only, and only on the raw frame. */}
        {!processed && (
          <g fill="var(--text-muted)" opacity="0.5">
            <rect x="40" y="140" width="34" height="20" rx="3" />
            <rect x="86" y="152" width="22" height="14" rx="3" />
            <rect x="128" y="134" width="16" height="26" rx="3" />
            <rect x="248" y="150" width="40" height="16" rx="3" />
          </g>
        )}

        {/* Staged furniture. Digital, and labelled as such by the caller. */}
        {processed && staged && (
          <g>
            <rect
              x="46"
              y="132"
              width="120"
              height="34"
              rx="8"
              fill="var(--purple)"
              opacity="0.5"
            />
            <rect
              x="52"
              y="122"
              width="26"
              height="14"
              rx="4"
              fill="var(--purple)"
              opacity="0.35"
            />
            <rect
              x="86"
              y="122"
              width="26"
              height="14"
              rx="4"
              fill="var(--purple)"
              opacity="0.35"
            />
            <rect
              x="186"
              y="140"
              width="96"
              height="30"
              rx="6"
              fill="var(--purple-light)"
              opacity="0.35"
            />
            <circle cx="292" cy="104" r="10" fill="var(--purple)" opacity="0.4" />
            <line
              x1="292"
              y1="114"
              x2="292"
              y2="150"
              stroke="var(--purple)"
              strokeWidth="3"
              opacity="0.4"
            />
          </g>
        )}

        {/* Underexposure on the raw frame — the thing lighting correction fixes. */}
        {veil > 0 && (
          <rect x="0" y="0" width="320" height="190" fill="var(--text)" opacity={veil} />
        )}
      </svg>
      <span
        className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
        style={{
          background: "var(--surface)",
          color: "var(--text-muted)",
          border: "1px solid var(--border)"
        }}
      >
        {processed ? "After" : "As captured"}
      </span>
    </div>
  );
}

/** A schematic floor plan. Approximate by construction, which is the honest claim. */
export function FloorPlanSketch() {
  return (
    <svg
      viewBox="0 0 320 190"
      role="img"
      aria-label="Illustrative floor plan diagram, approximate and not a measured survey"
      className="block h-auto w-full"
      style={{ background: "var(--surface)" }}
    >
      <g fill="none" stroke="var(--text-muted)" strokeWidth="2.5" opacity="0.75">
        <rect x="24" y="22" width="272" height="146" rx="3" />
        <line x1="150" y1="22" x2="150" y2="102" />
        <line x1="24" y1="102" x2="296" y2="102" />
        <line x1="222" y1="102" x2="222" y2="168" />
      </g>
      <g fill="var(--purple)" opacity="0.09">
        <rect x="26" y="24" width="122" height="76" />
        <rect x="224" y="104" width="70" height="62" />
      </g>
      <g fill="var(--text-muted)" fontSize="11" fontWeight="600">
        <text x="46" y="62">
          Living
        </text>
        <text x="176" y="62">
          Kitchen
        </text>
        <text x="46" y="142">
          Bedroom
        </text>
        <text x="238" y="142">
          Bath
        </text>
      </g>
      <g stroke="var(--purple)" strokeWidth="2" opacity="0.5">
        <line x1="24" y1="180" x2="296" y2="180" />
        <line x1="24" y1="176" x2="24" y2="184" />
        <line x1="296" y1="176" x2="296" y2="184" />
      </g>
      <text x="128" y="176" fill="var(--text-muted)" fontSize="10">
        approximate
      </text>
    </svg>
  );
}

/**
 * A QR-shaped block. It is drawn from a deterministic pattern and encodes
 * nothing — it is captioned as such wherever it appears, because a fake code
 * that looks scannable is a small lie that costs somebody a minute.
 */
export function QrPlaceholder({ seed, size = 128 }: { seed: string; size?: number }) {
  const modules = 21;
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  const cells: boolean[] = [];
  for (let index = 0; index < modules * modules; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    cells.push((state >>> 16) % 100 < 46);
  }

  const isFinder = (row: number, column: number): boolean =>
    (row < 7 && column < 7) ||
    (row < 7 && column >= modules - 7) ||
    (row >= modules - 7 && column < 7);

  return (
    <svg
      viewBox={`0 0 ${modules} ${modules}`}
      width={size}
      height={size}
      role="img"
      aria-label="Illustrative QR-style pattern. It is not a scannable code."
      style={{ background: "var(--surface)", borderRadius: 8 }}
    >
      {cells.map((filled, index) => {
        const row = Math.floor(index / modules);
        const column = index % modules;
        if (isFinder(row, column)) return null;
        if (!filled) return null;
        return (
          <rect
            key={index}
            x={column}
            y={row}
            width="1"
            height="1"
            fill="var(--text)"
            opacity="0.8"
          />
        );
      })}
      {[
        [0, 0],
        [0, modules - 7],
        [modules - 7, 0]
      ].map(([row, column]) => (
        <g key={`${row}-${column}`}>
          <rect x={column} y={row} width="7" height="7" fill="var(--text)" opacity="0.85" />
          <rect
            x={(column ?? 0) + 1}
            y={(row ?? 0) + 1}
            width="5"
            height="5"
            fill="var(--surface)"
          />
          <rect
            x={(column ?? 0) + 2}
            y={(row ?? 0) + 2}
            width="3"
            height="3"
            fill="var(--text)"
            opacity="0.85"
          />
        </g>
      ))}
    </svg>
  );
}

/** The pipeline, as a sequence a reader can follow without reading the prose. */
export function PipelineDiagram({
  steps
}: {
  steps: readonly { title: string; detail: string; where: "phone" | "request" | "worker" }[];
}) {
  const whereCopy = {
    phone: "On your phone",
    request: "Request — returns immediately",
    worker: "Background worker"
  } as const;

  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="surface hover-float relative rounded-2xl p-5"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--purple)" }}
          >
            {index + 1}
          </span>
          <h3 className="mt-3 font-semibold" style={{ color: "var(--text)" }}>
            {step.title}
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {step.detail}
          </p>
          <p
            className="mt-3 inline-block rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            {whereCopy[step.where]}
          </p>
        </li>
      ))}
    </ol>
  );
}
