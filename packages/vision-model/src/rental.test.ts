import { describe, expect, it } from "vitest";
import { resolveAssumptions } from "./assumptions";
import { caseFactors } from "./cases";
import { computeRentalCase, incomeBasis } from "./rental";
import { figureByKey, runVisionScenario } from "./engine";
import type { VisionInput } from "./types";

const rental = (overrides: Partial<VisionInput> = {}): VisionInput => ({
  analysisType: "long_term_rental",
  ownership: "purchasing",
  purchasePriceCents: 38_000_000,
  downPaymentCents: 9_500_000,
  annualRateBasisPoints: 700,
  termMonths: 360,
  grossMonthlyRentCents: 300_000,
  annualPropertyTaxCents: 620_000,
  annualInsuranceCents: 480_000,
  ...overrides
});

describe("income basis", () => {
  it("uses the rent the user entered", () => {
    const basis = incomeBasis(rental(), resolveAssumptions());
    expect(basis.suppliedByUser).toBe(true);
    expect(basis.grossMonthlyCents).toBe(300_000);
  });

  it("falls back to a placeholder share of value and says so plainly", () => {
    const input = rental();
    delete (input as { grossMonthlyRentCents?: number }).grossMonthlyRentCents;
    const basis = incomeBasis(input, resolveAssumptions());
    expect(basis.suppliedByUser).toBe(false);
    expect(basis.basis).toContain("not a rent estimate");
    expect(basis.grossMonthlyCents).toBe(Math.round((38_000_000 * 70) / 10_000));
  });

  it("treats a zero rent as not supplied rather than as a real figure of zero", () => {
    const basis = incomeBasis(rental({ grossMonthlyRentCents: 0 }), resolveAssumptions());
    expect(basis.suppliedByUser).toBe(false);
  });

  it("turns a nightly rate into a monthly figure for a short-term rental", () => {
    const basis = incomeBasis(
      rental({ analysisType: "short_term_rental", nightlyRateCents: 25_000 }),
      resolveAssumptions()
    );
    expect(basis.suppliedByUser).toBe(true);
    expect(basis.grossMonthlyCents).toBe(Math.round(25_000 * 30.4));
  });

  it("marks a derived nightly placeholder as not market data", () => {
    const basis = incomeBasis(rental({ analysisType: "short_term_rental" }), resolveAssumptions());
    expect(basis.suppliedByUser).toBe(false);
    expect(basis.basis).toContain("Neither is market data");
  });
});

describe("rental case arithmetic", () => {
  const assumptions = resolveAssumptions();
  const base = computeRentalCase(rental(), assumptions, caseFactors("base", assumptions));

  it("reconciles income, expenses, debt service, and cash flow", () => {
    expect(base.netOperatingIncomeCents).toBe(
      base.effectiveGrossIncomeCents - base.operatingExpensesCents
    );
    expect(base.monthlyCashFlowCents).toBe(base.netOperatingIncomeCents - base.debtServiceCents);
    expect(base.annualCashFlowCents).toBe(base.monthlyCashFlowCents * 12);
  });

  it("finances only the balance after the down payment", () => {
    expect(base.loanAmountCents).toBe(38_000_000 - 9_500_000);
  });

  it("charges no debt service when the purchase is all cash", () => {
    const allCash = computeRentalCase(
      rental({ downPaymentCents: 38_000_000 }),
      assumptions,
      caseFactors("base", assumptions)
    );
    expect(allCash.loanAmountCents).toBe(0);
    expect(allCash.debtServiceCents).toBe(0);
  });

  it("solves a break-even income that actually produces zero cash flow", () => {
    const breakEven = base.breakEvenGrossIncomeCents;
    expect(breakEven).not.toBeNull();
    const atBreakEven = computeRentalCase(
      rental({ grossMonthlyRentCents: breakEven as number }),
      assumptions,
      caseFactors("base", assumptions)
    );
    // Cents rounding inside the expense terms leaves a tolerance of a few cents.
    expect(Math.abs(atBreakEven.monthlyCashFlowCents)).toBeLessThan(500);
  });

  it("has no break-even income when the variable costs consume every dollar of rent", () => {
    const impossible = resolveAssumptions({
      longTermVacancyRateBasisPoints: 5_000,
      longTermManagementRateBasisPoints: 4_000,
      maintenanceRateBasisPoints: 4_000,
      capitalReserveRateBasisPoints: 4_000
    });
    const result = computeRentalCase(rental(), impossible, caseFactors("base", impossible));
    expect(result.breakEvenGrossIncomeCents).toBeNull();
  });

  it("reports no cash-on-cash when no cash was invested", () => {
    const nothingDown = computeRentalCase(
      rental({ downPaymentCents: 0 }),
      resolveAssumptions({ acquisitionCostRateBasisPoints: 0 }),
      caseFactors("base", resolveAssumptions({ acquisitionCostRateBasisPoints: 0 }))
    );
    expect(nothingDown.cashOnCashBasisPoints).toBeNull();
  });

  it("worsens every headline figure in the conservative case", () => {
    const conservative = computeRentalCase(
      rental(),
      assumptions,
      caseFactors("conservative", assumptions)
    );
    const optimistic = computeRentalCase(
      rental(),
      assumptions,
      caseFactors("optimistic", assumptions)
    );
    expect(conservative.grossMonthlyIncomeCents).toBeLessThan(base.grossMonthlyIncomeCents);
    expect(optimistic.grossMonthlyIncomeCents).toBeGreaterThan(base.grossMonthlyIncomeCents);
    expect(conservative.debtServiceCents).toBeGreaterThan(base.debtServiceCents);
    expect(conservative.monthlyCashFlowCents).toBeLessThan(optimistic.monthlyCashFlowCents);
  });
});

describe("short-term rental", () => {
  it("charges platform, turnover, and utility costs a long-term rental does not", () => {
    const assumptions = resolveAssumptions();
    const factors = caseFactors("base", assumptions);
    const longTerm = computeRentalCase(
      rental({ grossMonthlyRentCents: 300_000 }),
      assumptions,
      factors
    );
    const shortTerm = computeRentalCase(
      rental({ analysisType: "short_term_rental", nightlyRateCents: 9_868 }),
      assumptions,
      factors
    );
    // Comparable gross income, materially higher operating cost.
    expect(shortTerm.operatingExpensesCents).toBeGreaterThan(longTerm.operatingExpensesCents);
  });

  it("measures coverage against income after unbooked nights, not the headline rate", () => {
    const result = runVisionScenario(
      rental({ analysisType: "short_term_rental", nightlyRateCents: 25_000 })
    );
    const gross = figureByKey(result, "grossBookingIncome");
    const effective = figureByKey(result, "effectiveGrossIncome");
    expect(gross?.kind).toBe("cents");
    expect(effective?.kind).toBe("cents");
    if (gross?.kind === "cents" && effective?.kind === "cents") {
      expect(effective.cents.baseCents).toBeLessThan(gross.cents.baseCents);
    }
  });
});

describe("buy and hold", () => {
  it("projects value and balance only over the hold that was asked for", () => {
    const short = runVisionScenario(rental({ analysisType: "buy_and_hold", holdMonths: 12 }));
    const long = runVisionScenario(rental({ analysisType: "buy_and_hold", holdMonths: 120 }));
    const shortValue = figureByKey(short, "projectedValue");
    const longValue = figureByKey(long, "projectedValue");
    if (shortValue?.kind === "cents" && longValue?.kind === "cents") {
      expect(longValue.cents.baseCents).toBeGreaterThan(shortValue.cents.baseCents);
    } else {
      throw new Error("projected value should be a money band");
    }
  });

  it("lets value fall when the appreciation assumption is negative", () => {
    const falling = runVisionScenario(
      rental({
        analysisType: "buy_and_hold",
        holdMonths: 60,
        overrides: { annualAppreciationBasisPoints: -1_000 }
      })
    );
    const value = figureByKey(falling, "projectedValue");
    if (value?.kind !== "cents") throw new Error("projected value should be a money band");
    expect(value.cents.baseCents).toBeLessThan(38_000_000);
  });

  it("does not project anything for a plain long-term rental", () => {
    const result = runVisionScenario(rental({ analysisType: "long_term_rental" }));
    expect(figureByKey(result, "projectedValue")).toBeUndefined();
  });
});
