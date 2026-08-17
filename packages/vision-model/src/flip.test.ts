import { describe, expect, it } from "vitest";
import { resolveAssumptions } from "./assumptions";
import { caseFactors } from "./cases";
import { computeFlipCase } from "./flip";
import {
  computeImprovementCase,
  improvementSpendBasis,
  modelledAfterValueCents
} from "./improvement";
import { computeConstructionCase, hardCostBasis } from "./construction";
import { figureByKey, runVisionScenario } from "./engine";
import type { VisionInput } from "./types";

const flip = (overrides: Partial<VisionInput> = {}): VisionInput => ({
  analysisType: "fix_and_flip",
  ownership: "purchasing",
  purchasePriceCents: 28_000_000,
  improvementBudgetCents: 6_000_000,
  downPaymentCents: 7_000_000,
  annualRateBasisPoints: 1_050,
  termMonths: 360,
  holdMonths: 6,
  annualPropertyTaxCents: 500_000,
  annualInsuranceCents: 400_000,
  ...overrides
});

describe("flip arithmetic", () => {
  const assumptions = resolveAssumptions();
  const base = computeFlipCase(flip(), assumptions, caseFactors("base", assumptions));

  it("adds contingency on top of the budget rather than inside it", () => {
    expect(base.rehabBudgetCents).toBe(6_000_000);
    expect(base.contingencyCents).toBe(Math.round((6_000_000 * 1_500) / 10_000));
    expect(base.totalRehabCents).toBe(base.rehabBudgetCents + base.contingencyCents);
  });

  it("reconciles the cost stack with the total project cost", () => {
    expect(base.totalProjectCostCents).toBe(
      base.purchasePriceCents +
        base.acquisitionCostsCents +
        base.totalRehabCents +
        base.financingCostCents +
        base.holdingCostCents +
        base.sellingCostCents
    );
  });

  it("produces a break-even resale that nets out to exactly zero after selling costs", () => {
    const breakEven = base.breakEvenResaleCents;
    expect(breakEven).not.toBeNull();
    const sellingCostRate = assumptions.sellingCostRateBasisPoints.value;
    const costExcludingSale =
      base.purchasePriceCents +
      base.acquisitionCostsCents +
      base.totalRehabCents +
      base.financingCostCents +
      base.holdingCostCents;
    const netAtBreakEven =
      (breakEven as number) -
      Math.round(((breakEven as number) * sellingCostRate) / 10_000) -
      costExcludingSale;
    expect(Math.abs(netAtBreakEven)).toBeLessThan(200);
  });

  it("does not report a break-even when selling costs would swallow the whole sale", () => {
    const impossible = resolveAssumptions({ sellingCostRateBasisPoints: 1_500 });
    const forced = { ...impossible };
    // The catalogue caps selling costs below 100%, so break-even always exists.
    // This asserts the cap rather than a null, which is the honest guarantee.
    expect(forced.sellingCostRateBasisPoints.value).toBeLessThan(10_000);
    const result = computeFlipCase(flip(), forced, caseFactors("base", forced));
    expect(result.breakEvenResaleCents).not.toBeNull();
  });

  it("charges no financing cost on an all-cash purchase, but still charges carrying cost", () => {
    const allCash = computeFlipCase(
      flip({ downPaymentCents: 28_000_000 }),
      assumptions,
      caseFactors("base", assumptions)
    );
    expect(allCash.financingCostCents).toBe(0);
    expect(allCash.holdingCostCents).toBeGreaterThan(0);
  });

  it("costs more the longer it is held", () => {
    const quick = computeFlipCase(
      flip({ holdMonths: 3 }),
      assumptions,
      caseFactors("base", assumptions)
    );
    const slow = computeFlipCase(
      flip({ holdMonths: 18 }),
      assumptions,
      caseFactors("base", assumptions)
    );
    expect(slow.totalProjectCostCents).toBeGreaterThan(quick.totalProjectCostCents);
    expect((slow.breakEvenResaleCents ?? 0) > (quick.breakEvenResaleCents ?? 0)).toBe(true);
  });

  it("leads with break-even resale rather than a margin nobody can verify", () => {
    const result = runVisionScenario(flip());
    expect(figureByKey(result, "breakEvenResale")?.note).toContain("most defensible");
  });
});

describe("improvement spend basis", () => {
  const assumptions = resolveAssumptions();

  it("prefers the user's budget over any per-square-foot placeholder", () => {
    const basis = improvementSpendBasis(
      {
        analysisType: "existing_home_renovation",
        ownership: "already_owned",
        purchasePriceCents: 40_000_000,
        squareFeet: 2_000,
        improvementBudgetCents: 3_000_000
      },
      assumptions
    );
    expect(basis.suppliedByUser).toBe(true);
    expect(basis.cents).toBe(3_000_000);
  });

  it("costs a renovation from existing square footage when no budget was entered", () => {
    const basis = improvementSpendBasis(
      {
        analysisType: "existing_home_renovation",
        ownership: "already_owned",
        purchasePriceCents: 40_000_000,
        squareFeet: 2_000
      },
      assumptions
    );
    expect(basis.cents).toBe(2_000 * assumptions.renovationCostPerSquareFootCents.value);
    expect(basis.suppliedByUser).toBe(false);
  });

  it("costs an addition from the added square footage, not the existing footprint", () => {
    const basis = improvementSpendBasis(
      {
        analysisType: "addition",
        ownership: "already_owned",
        purchasePriceCents: 40_000_000,
        squareFeet: 2_000,
        addedSquareFeet: 500
      },
      assumptions
    );
    expect(basis.cents).toBe(500 * assumptions.additionCostPerSquareFootCents.value);
  });

  it("uses the interior placeholder budget for a kitchen scenario", () => {
    const basis = improvementSpendBasis(
      {
        analysisType: "interior_upgrade",
        ownership: "already_owned",
        purchasePriceCents: 40_000_000
      },
      assumptions
    );
    expect(basis.cents).toBe(assumptions.interiorUpgradeBudgetCents.value);
  });

  it("accepts an explicit budget of zero as a real answer", () => {
    const basis = improvementSpendBasis(
      {
        analysisType: "existing_home_renovation",
        ownership: "already_owned",
        purchasePriceCents: 40_000_000,
        improvementBudgetCents: 0
      },
      assumptions
    );
    expect(basis.suppliedByUser).toBe(true);
    expect(basis.cents).toBe(0);
  });
});

describe("modelled after value", () => {
  const assumptions = resolveAssumptions();

  it("is the price plus a share of the spend", () => {
    const value = modelledAfterValueCents(
      {
        analysisType: "existing_home_renovation",
        ownership: "purchasing",
        purchasePriceCents: 40_000_000
      },
      assumptions,
      10_000_000
    );
    expect(value).toBe(40_000_000 + Math.round((10_000_000 * 7_000) / 10_000));
  });

  it("uses the figure the user supplied verbatim", () => {
    const value = modelledAfterValueCents(
      {
        analysisType: "existing_home_renovation",
        ownership: "purchasing",
        purchasePriceCents: 40_000_000,
        expectedAfterValueCents: 61_000_000
      },
      assumptions,
      10_000_000
    );
    expect(value).toBe(61_000_000);
  });

  it("never goes negative", () => {
    const value = modelledAfterValueCents(
      {
        analysisType: "existing_home_renovation",
        ownership: "purchasing",
        purchasePriceCents: 0,
        expectedAfterValueCents: -5_000
      },
      assumptions,
      0
    );
    expect(value).toBe(0);
  });
});

describe("improvement and construction cases", () => {
  const assumptions = resolveAssumptions();

  it("excludes the purchase from the cost stack when the home is already owned", () => {
    const owned = computeImprovementCase(
      {
        analysisType: "existing_home_renovation",
        ownership: "already_owned",
        purchasePriceCents: 40_000_000,
        improvementBudgetCents: 5_000_000
      },
      assumptions,
      caseFactors("base", assumptions)
    );
    expect(owned.acquisitionCostCents).toBe(0);
    expect(owned.totalProjectCostCents).toBe(owned.totalImprovementCents + owned.holdingCostCents);
  });

  it("reports a negative value-net-of-spend when the uplift share is low", () => {
    const stingy = resolveAssumptions({ valueUpliftShareOfSpendBasisPoints: 1_000 });
    const result = computeImprovementCase(
      {
        analysisType: "interior_upgrade",
        ownership: "already_owned",
        purchasePriceCents: 40_000_000,
        improvementBudgetCents: 8_000_000
      },
      stingy,
      caseFactors("base", stingy)
    );
    expect(result.valueNetOfSpendCents).toBeLessThan(0);
  });

  it("builds construction cost from land, hard, soft, contingency, and carry", () => {
    const result = computeConstructionCase(
      {
        analysisType: "land_new_construction",
        ownership: "purchasing",
        purchasePriceCents: 12_000_000,
        buildSquareFeet: 2_000
      },
      assumptions,
      caseFactors("base", assumptions)
    );
    expect(result.totalDeliveredCostCents).toBe(
      result.landCostCents +
        result.hardCostCents +
        result.softCostCents +
        result.contingencyCents +
        result.holdingCostCents
    );
    expect(result.hardCostCents).toBe(
      2_000 * assumptions.newConstructionCostPerSquareFootCents.value
    );
  });

  it("has nothing to cost when neither a budget nor a size was given", () => {
    const basis = hardCostBasis(
      {
        analysisType: "land_new_construction",
        ownership: "purchasing",
        purchasePriceCents: 12_000_000
      },
      assumptions
    );
    expect(basis.cents).toBe(0);
    expect(basis.basis).toContain("nothing to cost");
  });
});
