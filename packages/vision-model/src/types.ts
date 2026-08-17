/**
 * The shape of a Vision scenario, in and out.
 *
 * The result is deliberately split into five labelled parts rather than a flat
 * bag of numbers: what you told us, what we made up, what falls out of the two,
 * how much weight the result can carry, and what nobody has checked. A figure
 * separated from its assumptions is how a model gets mistaken for an appraisal.
 */

import type { BasisPoints, Cents } from "@tract/mortgage-math";
import type { AssumptionOverrides, ResolvedAssumption } from "./assumptions";
import type { CentsRange, RatioRange } from "./range";

export const VISION_CALCULATION_VERSION = "vision-model@1.0.0";

export const ANALYSIS_TYPES = [
  "existing_home_renovation",
  "addition",
  "interior_upgrade",
  "land_new_construction",
  "long_term_rental",
  "short_term_rental",
  "fix_and_flip",
  "buy_and_hold"
] as const;

export type AnalysisType = (typeof ANALYSIS_TYPES)[number];

export function isAnalysisType(value: string): value is AnalysisType {
  return (ANALYSIS_TYPES as readonly string[]).includes(value);
}

export const SCENARIO_CASES = ["conservative", "base", "optimistic"] as const;
export type ScenarioCase = (typeof SCENARIO_CASES)[number];

export type Ownership = "purchasing" | "already_owned";

export type VisionInput = {
  analysisType: AnalysisType;
  ownership: Ownership;
  /**
   * Whatever the person typed to identify the property — an address, a parcel
   * number, or a nickname. It is echoed back and may travel with a report
   * request, and it must never reach an analytics parameter.
   */
  propertyLabel?: string;
  /** Purchase price when buying, or the current value you believe it has when you already own it. */
  purchasePriceCents: Cents;
  squareFeet?: number;
  addedSquareFeet?: number;
  buildSquareFeet?: number;
  improvementBudgetCents?: Cents;
  /** Overrides the modelled after-improvement or completed value entirely. */
  expectedAfterValueCents?: Cents;
  holdMonths?: number;
  downPaymentCents?: Cents;
  annualRateBasisPoints?: BasisPoints;
  termMonths?: number;
  grossMonthlyRentCents?: Cents;
  nightlyRateCents?: Cents;
  annualPropertyTaxCents?: Cents;
  annualInsuranceCents?: Cents;
  monthlyHoaCents?: Cents;
  overrides?: AssumptionOverrides;
};

export type InputEcho = {
  key: string;
  label: string;
  display: string;
  /** True when the person entered it; false when the model filled the gap. */
  suppliedByUser: boolean;
};

export type VisionFigure =
  | { key: string; label: string; kind: "cents"; cents: CentsRange; note: string }
  | {
      key: string;
      label: string;
      kind: "ratio_multiple" | "ratio_percent";
      ratio: RatioRange;
      note: string;
    }
  | { key: string; label: string; kind: "months"; months: number; note: string };

export type UnverifiedSeverity = "blocking" | "material" | "note";

export type UnverifiedItem = {
  key: string;
  label: string;
  detail: string;
  severity: UnverifiedSeverity;
};

/**
 * There is no "high". Nothing in this package is backed by market data, so the
 * ceiling is `moderate` by construction and the type says so.
 */
export type ConfidenceLevel = "very_low" | "low" | "moderate";

export type ConfidenceDriver = {
  label: string;
  direction: "raises" | "lowers";
  detail: string;
};

export type Confidence = {
  level: ConfidenceLevel;
  /** 0 to 100. Comparative only — it is not a probability. */
  score: number;
  ceiling: ConfidenceLevel;
  ceilingReason: string;
  drivers: ConfidenceDriver[];
};

export type VisionResult = {
  analysisType: AnalysisType;
  calculationVersion: string;
  /** Stated in the payload so a stored result can never be mistaken for a generated one. */
  producedBy: "deterministic_model";
  inputs: InputEcho[];
  assumptions: ResolvedAssumption[];
  figures: VisionFigure[];
  confidence: Confidence;
  unverified: UnverifiedItem[];
  disclaimers: readonly string[];
};

/**
 * The sentence that has to survive every redesign, every summary, and every
 * export. It is part of the result, not part of the page, so a figure cannot be
 * rendered anywhere without it being available beside it.
 */
export const VISION_DISCLAIMERS: readonly string[] = [
  "These figures are a model built from assumptions you chose and placeholders we supplied. They are not an appraisal, a valuation, a broker price opinion, an offer of credit, or a guarantee of value, rent, cost, or return.",
  "No comparable sales, construction bids, cost databases, or rent data were used. Where a real data source would be required, a labelled placeholder was used instead and is listed in the assumptions.",
  "Zoning, permitted use, setbacks, permitting, impact fees, flood zone, and insurance availability are not checked here and are not asserted. Verify each with the applicable city, county, state, or federal authority before relying on any figure.",
  "Ranges are not confidence intervals. They show how far the result moves between one unfavourable and one favourable set of assumptions, nothing more."
];
