/**
 * Human-readable summaries.
 *
 * `scenarioSummary` produces the text that travels with a report request. It has
 * to fit the existing lead schema's bounded free-text field, so it is length
 * capped here rather than trusting a caller to truncate it — and the cap trims
 * whole lines, never mid-sentence, because a summary that stops halfway through
 * a disclaimer is worse than one that omits a figure.
 */

import { formatUsd } from "@tract/mortgage-math";
import { confidenceLabel } from "./confidence";
import { ANALYSIS_TYPE_LABELS, figureByKey, HEADLINE_FIGURE_KEYS } from "./engine";
import type { CentsRange, RatioRange } from "./range";
import type { VisionFigure, VisionResult } from "./types";

export function formatCentsRange(range: CentsRange): string {
  if (range.lowCents === range.highCents) return formatUsd(range.baseCents);
  return `${formatUsd(range.lowCents)} to ${formatUsd(range.highCents)} (mid ${formatUsd(range.baseCents)})`;
}

export function formatPercentRange(range: RatioRange): string {
  const asPercent = (basisPoints: number | null): string =>
    basisPoints === null ? "—" : `${(basisPoints / 100).toFixed(1)}%`;
  if (range.baseBasisPoints === null) return "not calculable from these inputs";
  if (range.lowBasisPoints === range.highBasisPoints) return asPercent(range.baseBasisPoints);
  return `${asPercent(range.lowBasisPoints)} to ${asPercent(range.highBasisPoints)}`;
}

export function formatMultipleRange(range: RatioRange): string {
  const asMultiple = (basisPoints: number | null): string =>
    basisPoints === null ? "—" : `${(basisPoints / 10_000).toFixed(2)}x`;
  if (range.baseBasisPoints === null) return "not calculable from these inputs";
  if (range.lowBasisPoints === range.highBasisPoints) return asMultiple(range.baseBasisPoints);
  return `${asMultiple(range.lowBasisPoints)} to ${asMultiple(range.highBasisPoints)}`;
}

export function formatFigure(figure: VisionFigure): string {
  switch (figure.kind) {
    case "cents":
      return formatCentsRange(figure.cents);
    case "ratio_percent":
      return formatPercentRange(figure.ratio);
    case "ratio_multiple":
      return formatMultipleRange(figure.ratio);
    case "months":
      return `${figure.months} months`;
  }
}

export const SUMMARY_MAX_LENGTH = 1_500;

/**
 * The text attached to a report request. It carries what the person entered and
 * the headline bands so whoever picks the request up is looking at the same
 * scenario, and it opens with the statement that none of it is an appraisal so
 * the disclaimer survives being pasted anywhere.
 */
export function scenarioSummary(
  result: VisionResult,
  options: { maxLength?: number } = {}
): string {
  const maxLength = options.maxLength ?? SUMMARY_MAX_LENGTH;
  const lines: string[] = [
    `Vision scenario — ${ANALYSIS_TYPE_LABELS[result.analysisType]}.`,
    "Modelled from assumptions I chose. Not an appraisal, valuation, or offer of credit."
  ];

  lines.push("", "What I entered:");
  for (const item of result.inputs) {
    lines.push(`- ${item.label}: ${item.display}`);
  }

  const headlineKeys = HEADLINE_FIGURE_KEYS[result.analysisType];
  const headlines = headlineKeys
    .map((key) => figureByKey(result, key))
    .filter((figure): figure is VisionFigure => figure !== undefined);
  if (headlines.length > 0) {
    lines.push("", "Modelled ranges:");
    for (const figure of headlines) {
      lines.push(`- ${figure.label}: ${formatFigure(figure)}`);
    }
  }

  lines.push(
    "",
    `Model confidence: ${confidenceLabel(result.confidence.level)} (${result.confidence.score}/100, capped at moderate).`
  );

  const blocking = result.unverified.filter((item) => item.severity === "blocking");
  if (blocking.length > 0) {
    lines.push("", "Unverified and needs checking:");
    for (const item of blocking) lines.push(`- ${item.label}`);
  }

  lines.push("", `Calculation ${result.calculationVersion}.`);

  // Trim whole lines from the end rather than cutting a sentence in half.
  while (lines.join("\n").length > maxLength && lines.length > 3) {
    lines.pop();
  }
  return lines.join("\n").slice(0, maxLength).trim();
}
