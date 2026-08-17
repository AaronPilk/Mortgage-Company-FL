"use client";

import {
  type VisionFigure,
  type VisionResult,
  HEADLINE_FIGURE_KEYS,
  confidenceLabel,
  figureByKey,
  formatFigure
} from "@tract/vision-model";
import { Badge, Card } from "@/components/ui";

/**
 * The result surface.
 *
 * Three rules govern everything below.
 *
 * One: no figure appears without its band. If the low and high ends collapsed to
 * a point, that is shown as a point and labelled, rather than dressed up as a
 * range that does not exist.
 *
 * Two: the assumptions sit beside the figures on the same screen, not behind a
 * link. A number whose assumptions are one click away is a number that gets
 * quoted without them.
 *
 * Three: the words "estimate", "appraisal", and "valuation" are not used
 * interchangeably. This is a model. It is not the other two, and the copy says
 * so wherever a figure is rendered.
 */

function FigureBand({ figure }: { figure: VisionFigure }) {
  const collapsed = figure.kind === "cents" && figure.cents.lowCents === figure.cents.highCents;
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums text-[var(--text)] sm:text-3xl">
        {formatFigure(figure)}
      </p>
      {collapsed && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Every case agrees here because you switched the spread assumptions off.
        </p>
      )}
    </div>
  );
}

function HeadlineCard({ figure }: { figure: VisionFigure }) {
  return (
    <Card className="border-[var(--purple)]">
      <p className="text-sm font-semibold text-[var(--text-muted)]">{figure.label}</p>
      <div className="mt-2">
        <FigureBand figure={figure} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">{figure.note}</p>
    </Card>
  );
}

function FigureRow({ figure }: { figure: VisionFigure }) {
  return (
    <div className="border-t border-[var(--border)] py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <dt className="font-medium text-[var(--text)]">{figure.label}</dt>
        <dd className="tabular-nums font-semibold text-[var(--text)]">{formatFigure(figure)}</dd>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{figure.note}</p>
    </div>
  );
}

function severityTone(severity: string): "warning" | "purple" | "neutral" {
  if (severity === "blocking") return "warning";
  if (severity === "material") return "purple";
  return "neutral";
}

function severityWord(severity: string): string {
  if (severity === "blocking") return "Could change the answer entirely";
  if (severity === "material") return "Material";
  return "Worth knowing";
}

function unitSuffix(unit: string): string {
  switch (unit) {
    case "basis_points":
      return "basis points";
    case "cents":
      return "cents";
    case "cents_per_square_foot":
      return "cents per square foot";
    case "cents_per_night":
      return "cents per night";
    case "months":
      return "months";
    default:
      return "";
  }
}

function displayAssumptionValue(unit: string, value: number): string {
  switch (unit) {
    case "basis_points":
      return `${(value / 100).toFixed(2).replace(/\.?0+$/, "")}%`;
    case "cents":
    case "cents_per_square_foot":
    case "cents_per_night":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(value / 100);
    case "months":
      return `${value} months`;
    default:
      return String(value);
  }
}

export function VisionPreview({ result }: { result: VisionResult }) {
  const headlineKeys = HEADLINE_FIGURE_KEYS[result.analysisType];
  const headlines = headlineKeys
    .map((key) => figureByKey(result, key))
    .filter((figure): figure is VisionFigure => figure !== undefined);
  const headlineSet = new Set(headlines.map((figure) => figure.key));
  const rest = result.figures.filter((figure) => !headlineSet.has(figure.key));

  const blocking = result.unverified.filter((item) => item.severity === "blocking");
  const others = result.unverified.filter((item) => item.severity !== "blocking");

  return (
    <div className="space-y-8">
      {/* The statement that has to be read before any number is. */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
      >
        <p className="font-semibold text-[var(--text)]">
          This is a model, not an appraisal or a valuation.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Every figure below is arithmetic on assumptions you chose and placeholders we supplied.
          Nothing here is an appraisal, a valuation, a broker price opinion, an offer of credit, or
          a guarantee of value, rent, cost, or return. No comparable sales, contractor bids, cost
          databases, or rent data were used anywhere in it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {headlines.map((figure) => (
          <HeadlineCard key={figure.key} figure={figure} />
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Model confidence: {confidenceLabel(result.confidence.level)}
          </h3>
          <Badge tone="neutral">{result.confidence.score} / 100 — capped at moderate</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          {result.confidence.ceilingReason}
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {result.confidence.drivers.map((driver) => (
            <li key={driver.label} className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 font-bold"
                style={{
                  color: driver.direction === "raises" ? "var(--purple)" : "var(--text-muted)"
                }}
              >
                {driver.direction === "raises" ? "+" : "−"}
              </span>
              <span>
                <span className="font-medium text-[var(--text)]">{driver.label}.</span>{" "}
                <span className="text-[var(--text-muted)]">{driver.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)]">What you told us</h3>
          <dl className="mt-4 space-y-2 text-sm">
            {result.inputs.map((item) => (
              <div key={item.key} className="flex flex-wrap justify-between gap-x-4">
                <dt className="text-[var(--text-muted)]">{item.label}</dt>
                <dd className="font-medium text-[var(--text)]">{item.display}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              What we assumed on your behalf
            </h3>
            <Badge tone="warning">Not market data</Badge>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Each of these is a configurable placeholder. Change any of them on the previous step and
            every figure above moves.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            {result.assumptions.map((assumption) => (
              <div key={assumption.key}>
                <div className="flex flex-wrap justify-between gap-x-4">
                  <dt className="text-[var(--text-muted)]">
                    {assumption.label}
                    {assumption.source === "user" && (
                      <span className="ml-2 text-xs font-semibold text-[var(--purple)]">
                        you set this
                      </span>
                    )}
                  </dt>
                  <dd className="font-medium tabular-nums text-[var(--text)]">
                    {displayAssumptionValue(assumption.unit, assumption.value)}
                    <span className="sr-only"> {unitSuffix(assumption.unit)}</span>
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-[var(--text)]">Every figure, in full</h3>
        <dl className="mt-4">
          {rest.map((figure) => (
            <FigureRow key={figure.key} figure={figure} />
          ))}
        </dl>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-[var(--text)]">What is missing or unverified</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          None of this is something arithmetic can settle. The items marked first can change the
          answer entirely.
        </p>
        <ul className="mt-5 space-y-4">
          {[...blocking, ...others].map((item) => (
            <li
              key={item.key}
              className="border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[var(--text)]">{item.label}</p>
                <Badge tone={severityTone(item.severity)}>{severityWord(item.severity)}</Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <aside
        className="rounded-2xl border p-6 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p className="font-semibold text-[var(--text)]">
          Read this before you use any figure above
        </p>
        <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
          {result.disclaimers.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Calculation {result.calculationVersion}. Produced by a deterministic model — no AI was
          used to generate any number on this page.
        </p>
      </aside>
    </div>
  );
}
