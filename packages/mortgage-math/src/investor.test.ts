import { describe, expect, it } from "vitest";
import { debtServiceCoverage } from "./dscr";
import {
  estimateShortTermMonthlyRevenue,
  grossRentMultiplier,
  investorSnapshot,
  rentToPriceBasisPoints
} from "./investor";
import { rentalCashFlow } from "./scenarios";

const base = {
  purchasePriceCents: 450_000_00,
  downPaymentCents: 112_500_00,
  annualRateBasisPoints: 725,
  termMonths: 360,
  grossMonthlyRentCents: 4_500_00,
  vacancyRateBasisPoints: 0,
  managementRateBasisPoints: 2_000,
  maintenanceRateBasisPoints: 500,
  capitalReserveRateBasisPoints: 500,
  annualPropertyTaxCents: 6_300_00,
  annualInsuranceCents: 4_800_00,
  monthlyHoaCents: 0
};

describe("estimateShortTermMonthlyRevenue", () => {
  it("multiplies nightly rate by booked nights and spreads it over twelve months", () => {
    const result = estimateShortTermMonthlyRevenue({
      averageDailyRateCents: 250_00,
      occupancyRateBasisPoints: 6_000
    });
    expect(result.bookedNightsPerYear).toBe(219);
    expect(result.annualRevenueCents).toBe(250_00 * 219);
    expect(result.monthlyRevenueCents).toBe(Math.round((250_00 * 219) / 12));
  });

  it("clamps available nights to a calendar year", () => {
    const result = estimateShortTermMonthlyRevenue({
      averageDailyRateCents: 100_00,
      occupancyRateBasisPoints: 10_000,
      availableNightsPerYear: 900
    });
    expect(result.bookedNightsPerYear).toBe(365);
  });

  it("is zero at zero occupancy", () => {
    expect(
      estimateShortTermMonthlyRevenue({
        averageDailyRateCents: 300_00,
        occupancyRateBasisPoints: 0
      }).monthlyRevenueCents
    ).toBe(0);
  });

  it("rejects a negative rate and an out-of-range occupancy", () => {
    expect(() =>
      estimateShortTermMonthlyRevenue({
        averageDailyRateCents: -1,
        occupancyRateBasisPoints: 5_000
      })
    ).toThrow();
    expect(() =>
      estimateShortTermMonthlyRevenue({
        averageDailyRateCents: 100,
        occupancyRateBasisPoints: 10_001
      })
    ).toThrow();
  });
});

describe("screens", () => {
  it("computes gross rent multiplier as price over annual rent", () => {
    expect(grossRentMultiplier(450_000_00, 4_500_00)).toBe(8.33);
    expect(grossRentMultiplier(450_000_00, 0)).toBeNull();
  });

  it("computes rent-to-price in basis points, 100 being the one-percent rule", () => {
    expect(rentToPriceBasisPoints(450_000_00, 4_500_00)).toBe(100);
    expect(rentToPriceBasisPoints(0, 4_500_00)).toBeNull();
  });
});

describe("investorSnapshot", () => {
  it("composes the existing engines rather than recomputing them", () => {
    const snapshot = investorSnapshot(base);
    expect(snapshot.cashFlow).toEqual(rentalCashFlow(base));
    expect(snapshot.coverage).toEqual(
      debtServiceCoverage({
        grossMonthlyRentCents: base.grossMonthlyRentCents,
        loanAmountCents: base.purchasePriceCents - base.downPaymentCents,
        annualRateBasisPoints: base.annualRateBasisPoints,
        termMonths: base.termMonths,
        annualPropertyTaxCents: base.annualPropertyTaxCents,
        annualInsuranceCents: base.annualInsuranceCents,
        monthlyHoaCents: 0
      })
    );
    expect(snapshot.grossRentMultiplier).toBe(8.33);
    expect(snapshot.rentToPriceBasisPoints).toBe(100);
    expect(snapshot.calculationVersion).toBe(snapshot.cashFlow.calculationVersion);
  });

  it("never lets the loan amount go negative when the down payment exceeds the price", () => {
    const snapshot = investorSnapshot({ ...base, downPaymentCents: base.purchasePriceCents + 1 });
    expect(snapshot.coverage.principalAndInterestCents).toBe(0);
    expect(snapshot.cashFlow.debtServiceCents).toBe(0);
  });
});
