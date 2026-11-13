import type { MarketRatesView } from "@/lib/market-rates-types";

/**
 * Market-rate display.
 *
 * A presentational component (no hooks) so both the public page and the account
 * card can render it. It shows a published national weekly average and its
 * week-over-week movement — never a quote, an offer, or "your rate". Basis points
 * in; this formats to a percentage for reading only.
 */

function pct(bp: number): string {
  return (bp / 100).toFixed(2);
}

function Movement({ changeBp }: { changeBp: number | null }) {
  if (changeBp === null || changeBp === 0) {
    return (
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {changeBp === 0 ? "Unchanged this week" : "First reading"}
      </span>
    );
  }
  const down = changeBp < 0;
  return (
    <span
      className="text-xs font-medium"
      style={{ color: down ? "var(--purple)" : "var(--text-muted)" }}
    >
      {down ? "▼" : "▲"} {pct(Math.abs(changeBp))}% {down ? "lower" : "higher"} this week
    </span>
  );
}

function RateSparkline({ history }: { history: number[] }) {
  if (history.length < 2) return null;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const width = 260;
  const height = 44;
  const pad = 4;
  const points = history
    .map((value, index) => {
      const x = pad + (index * (width - 2 * pad)) / (history.length - 1);
      const y = height - pad - ((value - min) / range) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const first = history[0] ?? 0;
  const last = history.at(-1) ?? 0;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 h-11 w-full max-w-[260px]"
      role="img"
      aria-label={`30-year average trend from ${pct(first)}% to ${pct(last)}%`}
      preserveAspectRatio="none"
    >
      <polyline points={points} fill="none" stroke="var(--purple)" strokeWidth="2" />
    </svg>
  );
}

export function MarketRates({ rates }: { rates: MarketRatesView }) {
  return (
    <div>
      {rates.sampleData && (
        <p
          className="mb-3 rounded-lg border p-3 text-xs"
          style={{ borderColor: "var(--color-warning)", color: "var(--text-muted)" }}
          role="note"
        >
          Sample data — not a real market average. Development only.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            30-year fixed · national average
          </p>
          <p className="text-3xl font-bold" style={{ color: "var(--purple)" }}>
            {pct(rates.thirtyYearBp)}%
          </p>
          <Movement changeBp={rates.thirtyYearChangeBp} />
          <RateSparkline history={rates.thirtyYearHistoryBp} />
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            15-year fixed · national average
          </p>
          <p className="text-3xl font-bold text-[var(--text)]">{pct(rates.fifteenYearBp)}%</p>
          <Movement changeBp={rates.fifteenYearChangeBp} />
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Freddie Mac Primary Mortgage Market Survey (PMMS) weekly average via FRED, as of{" "}
        {rates.asOfDate}. Market information only — not a quote, an offer, or your rate, and not an
        APR. Your rate depends on your own file.
      </p>
    </div>
  );
}
