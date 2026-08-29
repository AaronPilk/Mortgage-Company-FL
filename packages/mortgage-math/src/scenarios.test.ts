import { describe, expect, it } from "vitest";
import { dollarsToCents } from "./money";
import { monthlyHousingCost } from "./payment";
import {
  DEFAULT_BACK_END_RATIO_BP,
  DEFAULT_FRONT_END_RATIO_BP,
  affordability,
  cashToClose,
  flipScenario,
  refinanceBreakEven,
  rentVsBuy,
  rentalCashFlow,
  visionPlanningPreview
} from "./scenarios";
import { disclosureFor } from "./disclosure";

describe("affordability", () => {
  const base = {
    grossMonthlyIncomeCents: dollarsToCents(9_000),
    monthlyDebtObligationsCents: dollarsToCents(600),
    downPaymentCents: dollarsToCents(60_000),
    annualRateBasisPoints: 650,
    termMonths: 360,
    propertyTaxAnnualRateBasisPoints: 110,
    annualHomeownersInsuranceCents: dollarsToCents(4_200)
  };

  it("caps the housing payment at the tighter of the two ratios", () => {
    const result = affordability(base);
    const frontCap = Math.round(
      (base.grossMonthlyIncomeCents * DEFAULT_FRONT_END_RATIO_BP) / 10_000
    );
    const backCap =
      Math.round((base.grossMonthlyIncomeCents * DEFAULT_BACK_END_RATIO_BP) / 10_000) -
      base.monthlyDebtObligationsCents;
    expect(result.maxHousingPaymentCents).toBe(Math.min(frontCap, backCap));
    expect(result.bindingConstraint).toBe("front_end");
  });

  it("identifies the back-end ratio as binding when debts are heavy", () => {
    const result = affordability({
      ...base,
      monthlyDebtObligationsCents: dollarsToCents(2_200)
    });
    expect(result.bindingConstraint).toBe("back_end");
  });

  it("solves a price whose full housing cost fits inside the ceiling", () => {
    const result = affordability(base);
    expect(result.housingBreakdown.totalMonthlyCents).toBeLessThanOrEqual(
      result.maxHousingPaymentCents
    );
    // One cent more must break the ceiling, proving the solve is tight.
    const oneMore = result.estimatedPurchasePriceCents + 1;
    const overshoot = monthlyHousingCost({
      loanAmountCents: oneMore - base.downPaymentCents,
      annualRateBasisPoints: base.annualRateBasisPoints,
      termMonths: base.termMonths,
      annualPropertyTaxCents: Math.round((oneMore * 110) / 10_000),
      annualHomeownersInsuranceCents: base.annualHomeownersInsuranceCents
    });
    expect(overshoot.totalMonthlyCents).toBeGreaterThan(result.maxHousingPaymentCents);
  });

  it("returns no capacity when obligations exhaust the back-end ratio", () => {
    const result = affordability({
      ...base,
      monthlyDebtObligationsCents: dollarsToCents(8_000)
    });
    expect(result.maxHousingPaymentCents).toBe(0);
    expect(result.bindingConstraint).toBe("none");
  });

  it("lowers capacity as the rate rises, holding everything else equal", () => {
    const cheap = affordability({ ...base, annualRateBasisPoints: 500 });
    const dear = affordability({ ...base, annualRateBasisPoints: 800 });
    expect(dear.estimatedPurchasePriceCents).toBeLessThan(cheap.estimatedPurchasePriceCents);
  });
});

describe("cashToClose", () => {
  it("nets credits and earnest money against funds required", () => {
    const result = cashToClose({
      purchasePriceCents: dollarsToCents(400_000),
      downPaymentCents: dollarsToCents(40_000),
      estimatedClosingCostsCents: dollarsToCents(9_500),
      estimatedPrepaidsAndEscrowCents: dollarsToCents(4_200),
      sellerCreditsCents: dollarsToCents(5_000),
      earnestMoneyAlreadyPaidCents: dollarsToCents(10_000)
    });
    expect(result.estimatedCashToCloseCents).toBe(dollarsToCents(38_700));
  });

  it("never reports a negative amount owed", () => {
    const result = cashToClose({
      purchasePriceCents: dollarsToCents(300_000),
      downPaymentCents: dollarsToCents(0),
      estimatedClosingCostsCents: dollarsToCents(6_000),
      sellerCreditsCents: dollarsToCents(20_000)
    });
    expect(result.estimatedCashToCloseCents).toBe(0);
  });
});

describe("refinanceBreakEven", () => {
  it("computes break-even months from real monthly savings", () => {
    const result = refinanceBreakEven({
      currentBalanceCents: dollarsToCents(300_000),
      currentAnnualRateBasisPoints: 750,
      currentRemainingTermMonths: 360,
      newAnnualRateBasisPoints: 600,
      newTermMonths: 360,
      refinanceCostsCents: dollarsToCents(6_000)
    });
    expect(result.newPaymentCents).toBeLessThan(result.currentPaymentCents);
    expect(result.breakEvenMonths).not.toBeNull();
    const savings = result.currentPaymentCents - result.newPaymentCents;
    expect(result.breakEvenMonths).toBe(Math.ceil(dollarsToCents(6_000) / savings));
  });

  it("reports no break-even when the new payment is not lower", () => {
    const result = refinanceBreakEven({
      currentBalanceCents: dollarsToCents(300_000),
      currentAnnualRateBasisPoints: 500,
      currentRemainingTermMonths: 360,
      newAnnualRateBasisPoints: 700,
      newTermMonths: 360,
      refinanceCostsCents: dollarsToCents(6_000)
    });
    expect(result.breakEvenMonths).toBeNull();
    expect(result.monthlyPaymentChangeCents).toBeGreaterThan(0);
  });

  it("adds financed costs to the new loan amount", () => {
    const financed = refinanceBreakEven({
      currentBalanceCents: dollarsToCents(300_000),
      currentAnnualRateBasisPoints: 750,
      currentRemainingTermMonths: 360,
      newAnnualRateBasisPoints: 600,
      newTermMonths: 360,
      refinanceCostsCents: dollarsToCents(6_000),
      financeCosts: true
    });
    expect(financed.newLoanAmountCents).toBe(dollarsToCents(306_000));
  });

  it("surfaces the total-interest tradeoff of a longer term", () => {
    const result = refinanceBreakEven({
      currentBalanceCents: dollarsToCents(200_000),
      currentAnnualRateBasisPoints: 700,
      currentRemainingTermMonths: 180,
      newAnnualRateBasisPoints: 625,
      newTermMonths: 360,
      refinanceCostsCents: dollarsToCents(5_000)
    });
    expect(result.newPaymentCents).toBeLessThan(result.currentPaymentCents);
    expect(result.totalInterestNewCents).toBeGreaterThan(result.totalInterestCurrentCents);
  });
});

describe("rentVsBuy", () => {
  const base = {
    horizonYears: 7,
    monthlyRentCents: dollarsToCents(2_400),
    annualRentGrowthBasisPoints: 300,
    purchasePriceCents: dollarsToCents(420_000),
    downPaymentCents: dollarsToCents(42_000),
    annualRateBasisPoints: 650,
    termMonths: 360,
    annualPropertyTaxCents: dollarsToCents(4_600),
    annualHomeownersInsuranceCents: dollarsToCents(4_800),
    annualAppreciationBasisPoints: 300,
    closingCostsCents: dollarsToCents(9_000)
  };

  it("grows rent over the horizon rather than holding it flat", () => {
    const result = rentVsBuy(base);
    expect(result.totalRentPaidCents).toBeGreaterThan(base.monthlyRentCents * result.horizonMonths);
  });

  it("moves the outcome when appreciation assumptions change", () => {
    const flat = rentVsBuy({ ...base, annualAppreciationBasisPoints: 0 });
    const strong = rentVsBuy({ ...base, annualAppreciationBasisPoints: 600 });
    expect(strong.buyingAdvantageCents).toBeGreaterThan(flat.buyingAdvantageCents);
  });

  it("echoes every assumption it used", () => {
    const result = rentVsBuy(base);
    expect(result.assumptions.annualRentGrowthBasisPoints).toBe(300);
    expect(result.assumptions.sellingCostRateBasisPoints).toBe(700);
  });

  it("charges no principal & interest for horizon years beyond the loan term", () => {
    // The 360-month loan is paid off at 30 years. A year that still amortizes the
    // loan must cost more than a year past payoff, which adds only the perpetual
    // carrying costs. A regression that keeps charging P&I after payoff makes the
    // two equal.
    const amortizingYear =
      rentVsBuy({ ...base, horizonYears: 30 }).totalOwnershipOutflowCents -
      rentVsBuy({ ...base, horizonYears: 29 }).totalOwnershipOutflowCents;
    const postPayoffYear =
      rentVsBuy({ ...base, horizonYears: 40 }).totalOwnershipOutflowCents -
      rentVsBuy({ ...base, horizonYears: 39 }).totalOwnershipOutflowCents;
    expect(postPayoffYear).toBeGreaterThan(0);
    expect(postPayoffYear).toBeLessThan(amortizingYear);
  });
});

describe("rentalCashFlow", () => {
  it("subtracts vacancy before management and reports coverage", () => {
    const result = rentalCashFlow({
      purchasePriceCents: dollarsToCents(320_000),
      downPaymentCents: dollarsToCents(80_000),
      annualRateBasisPoints: 725,
      termMonths: 360,
      grossMonthlyRentCents: dollarsToCents(2_800),
      vacancyRateBasisPoints: 500,
      managementRateBasisPoints: 800,
      maintenanceRateBasisPoints: 500,
      capitalReserveRateBasisPoints: 500,
      annualPropertyTaxCents: dollarsToCents(4_000),
      annualInsuranceCents: dollarsToCents(3_600),
      closingCostsCents: dollarsToCents(7_000)
    });
    expect(result.effectiveGrossIncomeCents).toBe(dollarsToCents(2_660));
    expect(result.netOperatingIncomeCents).toBeLessThan(result.effectiveGrossIncomeCents);
    expect(result.totalCashInvestedCents).toBe(dollarsToCents(87_000));
    expect(result.debtServiceCoverageRatio).not.toBeNull();
  });

  it("returns null ratios instead of dividing by zero", () => {
    const result = rentalCashFlow({
      purchasePriceCents: 0,
      downPaymentCents: 0,
      annualRateBasisPoints: 700,
      termMonths: 360,
      grossMonthlyRentCents: 0,
      vacancyRateBasisPoints: 0,
      managementRateBasisPoints: 0,
      maintenanceRateBasisPoints: 0,
      capitalReserveRateBasisPoints: 0,
      annualPropertyTaxCents: 0,
      annualInsuranceCents: 0
    });
    expect(result.cashOnCashReturnBasisPoints).toBeNull();
    expect(result.capRateBasisPoints).toBeNull();
    expect(result.debtServiceCoverageRatio).toBeNull();
  });
});

describe("flipScenario", () => {
  it("includes contingency, financing, holding, and selling costs", () => {
    const result = flipScenario({
      purchasePriceCents: dollarsToCents(240_000),
      acquisitionCostsCents: dollarsToCents(6_000),
      rehabBudgetCents: dollarsToCents(60_000),
      contingencyRateBasisPoints: 1_500,
      holdingMonths: 6,
      monthlyHoldingCostsCents: dollarsToCents(900),
      financedAmountCents: dollarsToCents(240_000),
      financingAnnualRateBasisPoints: 1_100,
      financingPointsBasisPoints: 200,
      afterRepairValueCents: dollarsToCents(400_000),
      sellingCostRateBasisPoints: 700
    });
    expect(result.contingencyCents).toBe(dollarsToCents(9_000));
    expect(result.totalRehabCents).toBe(dollarsToCents(69_000));
    expect(result.sellingCostCents).toBe(dollarsToCents(28_000));
    expect(result.totalProjectCostCents).toBeGreaterThan(dollarsToCents(240_000));
    expect(result.returnOnCostBasisPoints).not.toBeNull();
  });

  it("reports a loss rather than clamping to zero", () => {
    const result = flipScenario({
      purchasePriceCents: dollarsToCents(380_000),
      acquisitionCostsCents: dollarsToCents(8_000),
      rehabBudgetCents: dollarsToCents(90_000),
      contingencyRateBasisPoints: 2_000,
      holdingMonths: 12,
      monthlyHoldingCostsCents: dollarsToCents(1_500),
      financedAmountCents: dollarsToCents(380_000),
      financingAnnualRateBasisPoints: 1_200,
      afterRepairValueCents: dollarsToCents(430_000),
      sellingCostRateBasisPoints: 700
    });
    expect(result.estimatedGrossProfitCents).toBeLessThan(0);
  });
});

describe("Vision planning preview", () => {
  const input = {
    purchasePriceCents: 400_000_00,
    downPaymentCents: 80_000_00,
    annualRateBasisPoints: 650,
    termMonths: 360,
    annualPropertyTaxCents: 5_000_00,
    annualInsuranceCents: 4_000_00,
    monthlyHoaCents: 0,
    acquisitionCostsCents: 12_000_00,
    improvementBudgetCents: 75_000_00,
    contingencyRateBasisPoints: 1_000,
    expectedAfterImprovementValueCents: 520_000_00
  };

  it("keeps every output deterministic and identifies the calculation version", () => {
    const first = visionPlanningPreview(input);
    const second = visionPlanningPreview(input);

    expect(first).toEqual(second);
    expect(first.calculationVersion).toBe("mortgage-math@1.0.0");
    expect(first.loanAmountCents).toBe(320_000_00);
    expect(first.cases.map((scenario) => scenario.key)).toEqual([
      "conservative",
      "planning",
      "upside"
    ]);
  });

  it("shows a higher payment at a rate one percentage point higher", () => {
    const result = visionPlanningPreview(input);
    expect(result.monthlyPaymentSensitivity.lowerRateBasisPoints).toBe(550);
    expect(result.monthlyPaymentSensitivity.higherRateBasisPoints).toBe(750);
    expect(result.monthlyPaymentSensitivity.lowerTotalMonthlyCents).toBeLessThan(
      result.monthlyPaymentSensitivity.planningTotalMonthlyCents
    );
    expect(result.monthlyPaymentSensitivity.higherTotalMonthlyCents).toBeGreaterThan(
      result.monthlyPaymentSensitivity.planningTotalMonthlyCents
    );
  });

  it("puts higher costs and lower value in the conservative case", () => {
    const result = visionPlanningPreview(input);
    const [conservative, planning, upside] = result.cases;
    expect(conservative.improvementCostCents).toBeGreaterThan(planning.improvementCostCents);
    expect(conservative.postImprovementValueCents).toBeLessThan(planning.postImprovementValueCents);
    expect(upside.improvementCostCents).toBeLessThan(planning.improvementCostCents);
    expect(upside.postImprovementValueCents).toBeGreaterThan(planning.postImprovementValueCents);
  });

  it("rejects a down payment larger than the purchase price", () => {
    expect(() =>
      visionPlanningPreview({ ...input, downPaymentCents: input.purchasePriceCents + 1 })
    ).toThrow(/must not exceed/);
  });
});

describe("disclosures", () => {
  it("registers approved copy for every shipped calculator", () => {
    for (const key of [
      "payment",
      "affordability",
      "refinance",
      "rent_vs_buy",
      "closing_cost",
      "investment"
    ]) {
      const disclosure = disclosureFor(key);
      expect(disclosure.body.length).toBeGreaterThan(40);
      expect(disclosure.version).toMatch(/^calc-disclosure@/);
    }
  });

  it("refuses to invent a disclosure for an unregistered calculator", () => {
    expect(() => disclosureFor("guaranteed_approval")).toThrow();
  });
});
