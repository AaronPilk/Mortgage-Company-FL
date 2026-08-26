import { describe, expect, it } from "vitest";
import { dollarsToCents } from "./money";
import {
  DEFAULT_CLOSING_COST_RATE_BP,
  estimateAnnualFloodInsuranceCents,
  estimateAnnualHomeInsuranceCents,
  estimateClosingCostsCents,
  homeEquity,
  propertyTaxRateBasisPoints
} from "./scenarios";

describe("estimateClosingCostsCents", () => {
  it("applies the default rate as a fraction of the price, in whole cents", () => {
    // 2.5% of $400,000 = $10,000.
    expect(DEFAULT_CLOSING_COST_RATE_BP).toBe(250);
    const result = estimateClosingCostsCents(dollarsToCents(400_000));
    expect(result).toBe(dollarsToCents(10_000));
    expect(Number.isInteger(result)).toBe(true);
  });

  it("honours an explicit rate override", () => {
    // 3% of $500,000 = $15,000.
    expect(estimateClosingCostsCents(dollarsToCents(500_000), 300)).toBe(dollarsToCents(15_000));
  });
});

describe("propertyTaxRateBasisPoints", () => {
  it("converts an annual tax amount and price into a basis-point rate", () => {
    // $5,000 on $400,000 = 1.25% = 125 bp.
    expect(propertyTaxRateBasisPoints(dollarsToCents(5_000), dollarsToCents(400_000))).toBe(125);
  });

  it("returns zero rather than dividing by a zero price", () => {
    expect(propertyTaxRateBasisPoints(dollarsToCents(5_000), 0)).toBe(0);
  });
});

describe("Florida ownership cost estimates", () => {
  it("scales homeowners insurance with home value", () => {
    // 1% of $400,000 = $4,000/yr.
    expect(estimateAnnualHomeInsuranceCents(dollarsToCents(400_000))).toBe(dollarsToCents(4_000));
    expect(Number.isInteger(estimateAnnualHomeInsuranceCents(dollarsToCents(438_000)))).toBe(true);
  });

  it("adds a flood premium only inside a Special Flood Hazard Area", () => {
    expect(estimateAnnualFloodInsuranceCents(false)).toBe(0);
    expect(estimateAnnualFloodInsuranceCents(true)).toBeGreaterThan(0);
  });
});

describe("homeEquity", () => {
  it("computes equity and complementary share/LTV when the balance is below value", () => {
    const result = homeEquity(dollarsToCents(438_000), dollarsToCents(200_000));
    expect(result.equityCents).toBe(dollarsToCents(238_000));
    // Share and loan-to-value are complementary and sum to the whole.
    expect(result.equityShareBasisPoints + result.loanToValueBasisPoints).toBe(10_000);
    expect(result.equityShareBasisPoints).toBe(5_434);
  });

  it("clamps equity at zero and reads 100% LTV when the balance exceeds value", () => {
    const result = homeEquity(dollarsToCents(100_000), dollarsToCents(150_000));
    expect(result.equityCents).toBe(0);
    expect(result.equityShareBasisPoints).toBe(0);
    expect(result.loanToValueBasisPoints).toBe(10_000);
  });

  it("never divides by a zero value", () => {
    const result = homeEquity(0, 0);
    expect(result.equityCents).toBe(0);
    expect(result.equityShareBasisPoints).toBe(0);
    expect(result.loanToValueBasisPoints).toBe(0);
  });
});
