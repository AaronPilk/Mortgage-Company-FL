import { describe, expect, it } from "vitest";
import {
  ANALYSIS_TYPES,
  HEADLINE_FIGURE_KEYS,
  VISION_CALCULATION_VERSION,
  VISION_DISCLAIMERS,
  figureByKey,
  isAnalysisType,
  runVisionScenario
} from "./index";
import type { AnalysisType, VisionInput, VisionResult } from "./types";

function baseInput(overrides: Partial<VisionInput> = {}): VisionInput {
  return {
    analysisType: "existing_home_renovation",
    ownership: "purchasing",
    purchasePriceCents: 42_500_000,
    squareFeet: 1_800,
    addedSquareFeet: 400,
    buildSquareFeet: 2_200,
    improvementBudgetCents: 12_000_000,
    holdMonths: 8,
    downPaymentCents: 8_500_000,
    annualRateBasisPoints: 725,
    termMonths: 360,
    grossMonthlyRentCents: 320_000,
    nightlyRateCents: 28_000,
    ...overrides
  };
}

const everyType: AnalysisType[] = [...ANALYSIS_TYPES];

describe("analysis type guard", () => {
  it("accepts every declared type", () => {
    for (const type of everyType) expect(isAnalysisType(type)).toBe(true);
  });

  it("rejects anything else, including near misses", () => {
    expect(isAnalysisType("flip")).toBe(false);
    expect(isAnalysisType("")).toBe(false);
    expect(isAnalysisType("EXISTING_HOME_RENOVATION")).toBe(false);
  });
});

describe("every analysis type", () => {
  it.each(everyType)("produces a well-formed result for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));

    expect(result.analysisType).toBe(analysisType);
    expect(result.producedBy).toBe("deterministic_model");
    expect(result.calculationVersion).toBe(VISION_CALCULATION_VERSION);
    expect(result.figures.length).toBeGreaterThan(3);
    expect(result.assumptions.length).toBeGreaterThan(3);
    expect(result.inputs.length).toBeGreaterThan(3);
    expect(result.unverified.length).toBeGreaterThan(3);
    expect(result.disclaimers).toEqual(VISION_DISCLAIMERS);
  });

  it.each(everyType)("orders every money band low to high for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    for (const figure of result.figures) {
      if (figure.kind !== "cents") continue;
      expect(figure.cents.lowCents, `${analysisType}:${figure.key}`).toBeLessThanOrEqual(
        figure.cents.baseCents
      );
      expect(figure.cents.baseCents, `${analysisType}:${figure.key}`).toBeLessThanOrEqual(
        figure.cents.highCents
      );
    }
  });

  it.each(everyType)("keeps every money figure in whole cents for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    for (const figure of result.figures) {
      if (figure.kind !== "cents") continue;
      for (const value of [figure.cents.lowCents, figure.cents.baseCents, figure.cents.highCents]) {
        expect(Number.isInteger(value), `${analysisType}:${figure.key}`).toBe(true);
        expect(Number.isSafeInteger(value), `${analysisType}:${figure.key}`).toBe(true);
      }
    }
  });

  it.each(everyType)("orders every ratio band for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    for (const figure of result.figures) {
      if (figure.kind !== "ratio_percent" && figure.kind !== "ratio_multiple") continue;
      const { lowBasisPoints, baseBasisPoints, highBasisPoints } = figure.ratio;
      if (baseBasisPoints === null) {
        expect(lowBasisPoints).toBeNull();
        expect(highBasisPoints).toBeNull();
        continue;
      }
      expect(lowBasisPoints).not.toBeNull();
      expect(lowBasisPoints as number).toBeLessThanOrEqual(baseBasisPoints);
      expect(highBasisPoints as number).toBeGreaterThanOrEqual(baseBasisPoints);
    }
  });

  it.each(everyType)("explains every figure it prints for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    for (const figure of result.figures) {
      expect(figure.note.length, `${analysisType}:${figure.key}`).toBeGreaterThan(20);
      expect(figure.label.length, `${analysisType}:${figure.key}`).toBeGreaterThan(3);
    }
  });

  it.each(everyType)("emits every headline figure it promises for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    for (const key of HEADLINE_FIGURE_KEYS[analysisType]) {
      expect(figureByKey(result, key), `${analysisType}:${key}`).toBeDefined();
    }
  });

  it.each(everyType)("never claims a market-data source for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    for (const assumption of result.assumptions) {
      expect(assumption.marketDataBacked, assumption.key).toBe(false);
    }
  });

  it.each(everyType)("always leaves something unverified for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    const blocking = result.unverified.filter((item) => item.severity === "blocking");
    expect(blocking.length, analysisType).toBeGreaterThan(0);
    expect(result.unverified[0]?.severity).toBe("blocking");
  });

  it.each(everyType)("caps confidence at moderate for %s", (analysisType) => {
    const result = runVisionScenario(baseInput({ analysisType }));
    expect(result.confidence.ceiling).toBe("moderate");
    expect(["very_low", "low", "moderate"]).toContain(result.confidence.level);
    expect(result.confidence.score).toBeLessThanOrEqual(85);
    expect(result.confidence.score).toBeGreaterThanOrEqual(0);
  });

  it.each(everyType)("is deterministic for %s", (analysisType) => {
    const first = runVisionScenario(baseInput({ analysisType }));
    const second = runVisionScenario(baseInput({ analysisType }));
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

describe("degenerate inputs", () => {
  const bareInput = (analysisType: AnalysisType): VisionInput => ({
    analysisType,
    ownership: "purchasing",
    purchasePriceCents: 0
  });

  it.each(everyType)("survives a scenario with nothing but a type for %s", (analysisType) => {
    const result = runVisionScenario(bareInput(analysisType));
    expect(result.figures.length).toBeGreaterThan(0);
    for (const figure of result.figures) {
      if (figure.kind !== "cents") continue;
      expect(Number.isFinite(figure.cents.baseCents), figure.key).toBe(true);
    }
  });

  it("flags a missing price as blocking rather than modelling around it", () => {
    const result = runVisionScenario(bareInput("long_term_rental"));
    expect(result.unverified.some((item) => item.key === "no_price")).toBe(true);
    expect(result.confidence.level).toBe("very_low");
  });

  it("treats an addition with no scope as blocking instead of inventing one", () => {
    const result = runVisionScenario({
      analysisType: "addition",
      ownership: "already_owned",
      purchasePriceCents: 35_000_000
    });
    const modelled = result.unverified.find((item) => item.key === "modelled_budget");
    expect(modelled?.severity).toBe("blocking");
    expect(figureByKey(result, "improvementBudget")).toMatchObject({
      cents: { lowCents: 0, baseCents: 0, highCents: 0 }
    });
  });

  it("does not divide by a zero square footage", () => {
    const result = runVisionScenario(
      baseInput({ analysisType: "existing_home_renovation", squareFeet: 0 })
    );
    expect(figureByKey(result, "costPerSquareFoot")).toBeUndefined();
  });

  it("survives a purchase with no financing at all", () => {
    const result = runVisionScenario(
      baseInput({
        analysisType: "long_term_rental",
        downPaymentCents: 42_500_000
      })
    );
    const debtService = figureByKey(result, "debtService");
    expect(debtService).toMatchObject({ cents: { baseCents: 0 } });
    const dscr = figureByKey(result, "dscr");
    expect(dscr?.kind).toBe("ratio_multiple");
  });

  it("survives a down payment larger than the price without producing a negative loan", () => {
    const result = runVisionScenario(
      baseInput({ analysisType: "buy_and_hold", downPaymentCents: 90_000_000 })
    );
    for (const figure of result.figures) {
      if (figure.kind !== "cents") continue;
      expect(Number.isSafeInteger(figure.cents.lowCents), figure.key).toBe(true);
    }
  });

  it("tolerates a term of one month", () => {
    const result = runVisionScenario(
      baseInput({ analysisType: "long_term_rental", termMonths: 1 })
    );
    expect(figureByKey(result, "debtService")).toBeDefined();
  });

  it("tolerates a zero interest rate", () => {
    const result = runVisionScenario(
      baseInput({ analysisType: "long_term_rental", annualRateBasisPoints: 0 })
    );
    const debtService = figureByKey(result, "debtService");
    expect(debtService?.kind).toBe("cents");
  });

  it("keeps every band ordered under an extreme cost spread override", () => {
    const result = runVisionScenario(
      baseInput({
        analysisType: "fix_and_flip",
        overrides: { costSpreadUpBasisPoints: 8_000, costSpreadDownBasisPoints: 5_000 }
      })
    );
    for (const figure of result.figures) {
      if (figure.kind !== "cents") continue;
      expect(figure.cents.lowCents, figure.key).toBeLessThanOrEqual(figure.cents.baseCents);
      expect(figure.cents.baseCents, figure.key).toBeLessThanOrEqual(figure.cents.highCents);
    }
  });

  it("collapses to a point band when every spread is switched off", () => {
    const flat = {
      costSpreadDownBasisPoints: 0,
      costSpreadUpBasisPoints: 0,
      valueSpreadDownBasisPoints: 0,
      valueSpreadUpBasisPoints: 0,
      incomeSpreadDownBasisPoints: 0,
      incomeSpreadUpBasisPoints: 0,
      rateSpreadBasisPoints: 0,
      vacancySpreadBasisPoints: 0
    };
    const result = runVisionScenario(
      baseInput({ analysisType: "existing_home_renovation", overrides: flat })
    );
    const total = figureByKey(result, "totalProjectCost");
    expect(total?.kind).toBe("cents");
    if (total?.kind === "cents") {
      expect(total.cents.lowCents).toBe(total.cents.highCents);
    }
  });
});

describe("provenance", () => {
  const withResult = (input: VisionInput, assertion: (result: VisionResult) => void): void =>
    assertion(runVisionScenario(input));

  it("echoes only what the user actually entered", () => {
    withResult(
      {
        analysisType: "interior_upgrade",
        ownership: "already_owned",
        purchasePriceCents: 30_000_000
      },
      (result) => {
        const keys = result.inputs.map((item) => item.key);
        expect(keys).toContain("purchasePrice");
        expect(keys).not.toContain("improvementBudget");
        expect(keys).not.toContain("annualRate");
      }
    );
  });

  it("does not echo a property label that was never given", () => {
    withResult(baseInput(), (result) => {
      expect(result.inputs.some((item) => item.key === "propertyLabel")).toBe(false);
    });
  });

  it("echoes a property label when one was given", () => {
    withResult(baseInput({ propertyLabel: "  Lot 14, Pine Street  " }), (result) => {
      const label = result.inputs.find((item) => item.key === "propertyLabel");
      expect(label?.display).toBe("Lot 14, Pine Street");
    });
  });

  it("labels a supplied rate as an assumption rather than a quote", () => {
    withResult(baseInput({ analysisType: "long_term_rental" }), (result) => {
      const rate = result.inputs.find((item) => item.key === "annualRate");
      expect(rate?.display).toContain("not a quote");
    });
  });

  it("changes the value figure when the uplift assumption changes, and says it is an assumption", () => {
    const conservative = runVisionScenario(
      baseInput({ overrides: { valueUpliftShareOfSpendBasisPoints: 2_000 } })
    );
    const generous = runVisionScenario(
      baseInput({ overrides: { valueUpliftShareOfSpendBasisPoints: 12_000 } })
    );
    const low = figureByKey(conservative, "afterImprovementValue");
    const high = figureByKey(generous, "afterImprovementValue");
    expect(low?.kind).toBe("cents");
    expect(high?.kind).toBe("cents");
    if (low?.kind === "cents" && high?.kind === "cents") {
      expect(high.cents.baseCents).toBeGreaterThan(low.cents.baseCents);
    }
    expect(low?.note).toContain("not an appraisal");
  });

  it("uses the user's after value instead of the uplift model when one is given", () => {
    const result = runVisionScenario(baseInput({ expectedAfterValueCents: 70_000_000 }));
    const figure = figureByKey(result, "afterImprovementValue");
    expect(figure?.note).toContain("you entered");
    expect(result.unverified.some((item) => item.key === "modelled_after_value")).toBe(false);
  });

  it("drops acquisition cost entirely for a property already owned", () => {
    const owned = runVisionScenario(baseInput({ ownership: "already_owned" }));
    expect(figureByKey(owned, "acquisitionCost")).toBeUndefined();
    const buying = runVisionScenario(baseInput({ ownership: "purchasing" }));
    expect(figureByKey(buying, "acquisitionCost")).toBeDefined();
  });
});

describe("the sentences that must never disappear", () => {
  it("states in every result that this is not an appraisal or an offer of credit", () => {
    const joined = VISION_DISCLAIMERS.join(" ").toLowerCase();
    expect(joined).toContain("not an appraisal");
    expect(joined).toContain("offer of credit");
    expect(joined).toContain("zoning");
    expect(joined).toContain("flood");
  });

  it("carries the zoning, permitting, and flood items on every construction scenario", () => {
    for (const analysisType of [
      "existing_home_renovation",
      "addition",
      "land_new_construction",
      "fix_and_flip"
    ] as const) {
      const keys = runVisionScenario(baseInput({ analysisType })).unverified.map(
        (item) => item.key
      );
      expect(keys, analysisType).toContain("zoning_and_land_use");
      expect(keys, analysisType).toContain("permitting");
      expect(keys, analysisType).toContain("flood_and_elevation");
    }
  });

  it("warns that short-term rental may be prohibited before anything else", () => {
    const result = runVisionScenario(baseInput({ analysisType: "short_term_rental" }));
    const item = result.unverified.find((entry) => entry.key === "str_regulation");
    expect(item?.severity).toBe("blocking");
  });

  it("lists each unverified item once, most severe first", () => {
    const result = runVisionScenario(baseInput({ analysisType: "fix_and_flip" }));
    const keys = result.unverified.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    const rank = { blocking: 0, material: 1, note: 2 } as const;
    const ranks = result.unverified.map((item) => rank[item.severity]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
});
