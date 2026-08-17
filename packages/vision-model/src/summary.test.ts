import { describe, expect, it } from "vitest";
import {
  SUMMARY_MAX_LENGTH,
  formatCentsRange,
  formatFigure,
  formatMultipleRange,
  formatPercentRange,
  scenarioSummary
} from "./summary";
import { runVisionScenario } from "./engine";
import { ANALYSIS_TYPES } from "./types";
import type { AnalysisType, VisionInput } from "./types";

const input = (analysisType: AnalysisType): VisionInput => ({
  analysisType,
  ownership: "purchasing",
  propertyLabel: "1420 Palmetto Way, Sarasota",
  purchasePriceCents: 45_000_000,
  squareFeet: 1_900,
  addedSquareFeet: 450,
  buildSquareFeet: 2_400,
  improvementBudgetCents: 9_500_000,
  downPaymentCents: 11_250_000,
  annualRateBasisPoints: 712,
  termMonths: 360,
  holdMonths: 9,
  grossMonthlyRentCents: 335_000,
  nightlyRateCents: 31_000,
  annualPropertyTaxCents: 700_000,
  annualInsuranceCents: 550_000
});

describe("formatting", () => {
  it("renders a band as a range, not a single number", () => {
    expect(formatCentsRange({ lowCents: 100_000, baseCents: 150_000, highCents: 200_000 })).toBe(
      "$1,000 to $2,000 (mid $1,500)"
    );
  });

  it("renders a collapsed band as one figure rather than a fake range", () => {
    expect(formatCentsRange({ lowCents: 500, baseCents: 500, highCents: 500 })).toBe("$5");
  });

  it("renders percentages and multiples in their own idiom", () => {
    expect(
      formatPercentRange({ lowBasisPoints: 250, baseBasisPoints: 400, highBasisPoints: 610 })
    ).toBe("2.5% to 6.1%");
    expect(
      formatMultipleRange({
        lowBasisPoints: 9_000,
        baseBasisPoints: 11_000,
        highBasisPoints: 13_500
      })
    ).toBe("0.90x to 1.35x");
  });

  it("says a ratio is not calculable rather than printing a zero", () => {
    const empty = { lowBasisPoints: null, baseBasisPoints: null, highBasisPoints: null };
    expect(formatPercentRange(empty)).toBe("not calculable from these inputs");
    expect(formatMultipleRange(empty)).toBe("not calculable from these inputs");
  });

  it("dispatches on figure kind", () => {
    expect(
      formatFigure({
        key: "x",
        label: "x",
        kind: "months",
        months: 9,
        note: "n"
      })
    ).toBe("9 months");
  });
});

describe("scenarioSummary", () => {
  it.each([...ANALYSIS_TYPES])("fits the bounded lead message field for %s", (analysisType) => {
    const summary = scenarioSummary(runVisionScenario(input(analysisType)));
    expect(summary.length).toBeLessThanOrEqual(SUMMARY_MAX_LENGTH);
    expect(summary.length).toBeGreaterThan(100);
  });

  it("opens with the statement that this is not an appraisal", () => {
    const summary = scenarioSummary(runVisionScenario(input("fix_and_flip")));
    expect(summary.split("\n")[1]).toContain("Not an appraisal");
  });

  it("carries what the user entered so the reader sees the same scenario", () => {
    const summary = scenarioSummary(runVisionScenario(input("long_term_rental")));
    expect(summary).toContain("1420 Palmetto Way, Sarasota");
    expect(summary).toContain("What I entered:");
  });

  it("states the confidence level and its cap", () => {
    const summary = scenarioSummary(runVisionScenario(input("buy_and_hold")));
    expect(summary).toContain("capped at moderate");
  });

  it("lists the blocking unverified items", () => {
    const summary = scenarioSummary(runVisionScenario(input("short_term_rental")));
    expect(summary).toContain("Unverified and needs checking:");
  });

  it("trims whole lines rather than cutting a sentence in half", () => {
    const summary = scenarioSummary(runVisionScenario(input("land_new_construction")), {
      maxLength: 300
    });
    expect(summary.length).toBeLessThanOrEqual(300);
    expect(summary).toContain("Not an appraisal");
  });

  it("keeps the disclaimer even at an absurdly small budget", () => {
    const summary = scenarioSummary(runVisionScenario(input("addition")), { maxLength: 60 });
    expect(summary.length).toBeLessThanOrEqual(60);
    expect(summary.startsWith("Vision scenario")).toBe(true);
  });
});
