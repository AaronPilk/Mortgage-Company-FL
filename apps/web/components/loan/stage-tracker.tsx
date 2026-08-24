import {
  LOAN_STAGE_FLOW,
  LOAN_STAGE_META,
  isTerminalStage,
  stageProgress,
  stageToneAt,
  type LoanStage,
  type StageTone
} from "@tract/domain";

/**
 * The borrower's status tracker — a vertical timeline of the loan's checkpoints.
 * Presentation only: it reflects the stage a loan officer set, and decides
 * nothing (ECOA / Reg B). Colour carries the meaning: green is behind you,
 * purple is where you are now, muted is still ahead.
 */

const TONE: Record<StageTone, { ring: string; fill: string; text: string }> = {
  done: { ring: "var(--color-success)", fill: "var(--color-success)", text: "var(--text)" },
  active: { ring: "var(--purple)", fill: "var(--purple)", text: "var(--text)" },
  upcoming: { ring: "var(--border)", fill: "transparent", text: "var(--text-muted)" },
  stopped: { ring: "var(--border)", fill: "var(--surface-2)", text: "var(--text-muted)" }
};

function Check() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 10.5 8 14.5 16 5.5"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StageTracker({ stage }: { stage: LoanStage }) {
  if (isTerminalStage(stage)) {
    const meta = LOAN_STAGE_META[stage];
    const denied = stage === "denied";
    return (
      <div
        className="rounded-2xl border p-6"
        style={{
          borderColor: denied ? "rgb(164 93 7 / 0.4)" : "var(--border)",
          background: denied ? "rgb(164 93 7 / 0.08)" : "var(--surface-2)"
        }}
      >
        <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
          {meta.label}
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          {meta.blurb}
        </p>
      </div>
    );
  }

  const { index: current } = stageProgress(stage);

  return (
    <ol className="relative">
      {LOAN_STAGE_FLOW.map((flowStage, i) => {
        const tone = stageToneAt(i, current);
        const meta = LOAN_STAGE_META[flowStage];
        const isLast = i === LOAN_STAGE_FLOW.length - 1;
        const style = TONE[tone];
        return (
          <li key={flowStage} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connector line to the next node. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-8 h-full w-0.5"
                style={{ background: i < current ? "var(--color-success)" : "var(--border)" }}
              />
            )}
            {/* Node marker. */}
            <span
              className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
              style={{
                borderColor: style.ring,
                background: style.fill,
                color: tone === "done" || tone === "active" ? "#fff" : "var(--text-muted)",
                boxShadow: tone === "active" ? "0 0 0 4px var(--purple-subtle)" : undefined
              }}
            >
              {tone === "done" ? <Check /> : i + 1}
            </span>
            <div className={`pt-0.5 ${tone === "active" ? "" : ""}`}>
              <p className="font-semibold leading-tight" style={{ color: style.text }}>
                {meta.label}
                {tone === "active" && (
                  <span
                    className="ml-2 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide"
                    style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}
                  >
                    You are here
                  </span>
                )}
              </p>
              {tone === "active" && (
                <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {meta.blurb}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
