import { describe, expect, it } from "vitest";
import { MAX_COMPARED_RATES, formatSignedUsd, rateImpact } from "./rate-impact";
import { MoneyError, dollarsToCents, formatUsd } from "./money";
import { amortizationSchedule, monthlyPrincipalAndInterest } from "./payment";
import { disclosureFor } from "./disclosure";

const LOAN = { principalCents: dollarsToCents(400_000), termMonths: 360 };

describe("rateImpact", () => {
  it("prices every supplied rate against the standard payment formula", () => {
    const result = rateImpact({ ...LOAN, annualRatesBasisPoints: [600, 650, 700, 750] });

    expect(result.rows).toHaveLength(4);
    for (const row of result.rows) {
      expect(row.monthlyPaymentCents).toBe(
        monthlyPrincipalAndInterest({
          principalCents: LOAN.principalCents,
          annualRateBasisPoints: row.annualRateBasisPoints,
          termMonths: LOAN.termMonths
        })
      );
      expect(row.totalInterestCents).toBe(
        amortizationSchedule({
          principalCents: LOAN.principalCents,
          annualRateBasisPoints: row.annualRateBasisPoints,
          termMonths: LOAN.termMonths
        }).totalInterestCents
      );
    }
  });

  it("measures every delta against the base rate, which is the first by default", () => {
    const result = rateImpact({ ...LOAN, annualRatesBasisPoints: [600, 700] });
    const [base, higher] = result.rows;

    expect(result.baseIndex).toBe(0);
    expect(result.baseAnnualRateBasisPoints).toBe(600);
    expect(base?.isBase).toBe(true);
    expect(base?.monthlyPaymentDeltaCents).toBe(0);
    expect(base?.totalInterestDeltaCents).toBe(0);
    expect(higher?.isBase).toBe(false);
    expect(higher?.monthlyPaymentDeltaCents).toBeGreaterThan(0);
    expect(higher?.totalInterestDeltaCents).toBeGreaterThan(0);
    expect(higher?.monthlyPaymentDeltaCents).toBe(
      (higher?.monthlyPaymentCents ?? 0) - (base?.monthlyPaymentCents ?? 0)
    );
  });

  it("supports choosing a different base and reports negative deltas below it", () => {
    const result = rateImpact({ ...LOAN, annualRatesBasisPoints: [600, 700], baseIndex: 1 });
    expect(result.baseAnnualRateBasisPoints).toBe(700);
    expect(result.rows[0]?.monthlyPaymentDeltaCents).toBeLessThan(0);
    expect(result.rows[1]?.monthlyPaymentDeltaCents).toBe(0);
  });

  it("accepts a single rate", () => {
    const result = rateImpact({ ...LOAN, annualRatesBasisPoints: [650] });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.isBase).toBe(true);
  });

  it("handles a zero rate, where there is no interest to compare", () => {
    const result = rateImpact({ ...LOAN, annualRatesBasisPoints: [0, 650] });
    expect(result.rows[0]?.totalInterestCents).toBe(0);
    expect(result.rows[0]?.monthlyPaymentCents).toBe(
      Math.round(LOAN.principalCents / LOAN.termMonths)
    );
    expect(result.rows[1]?.totalInterestDeltaCents).toBeGreaterThan(0);
  });

  it("handles a single-month term", () => {
    const result = rateImpact({
      principalCents: dollarsToCents(10_000),
      termMonths: 1,
      annualRatesBasisPoints: [500, 900]
    });
    expect(result.rows[0]?.totalPaidCents).toBeGreaterThan(dollarsToCents(10_000));
    expect(result.rows[1]?.monthlyPaymentDeltaCents).toBeGreaterThan(0);
  });

  it("rejects an empty rate list, too many rates, and an out-of-range base", () => {
    expect(() => rateImpact({ ...LOAN, annualRatesBasisPoints: [] })).toThrow(RangeError);
    expect(() =>
      rateImpact({
        ...LOAN,
        annualRatesBasisPoints: Array.from({ length: MAX_COMPARED_RATES + 1 }, () => 650)
      })
    ).toThrow(RangeError);
    expect(() => rateImpact({ ...LOAN, annualRatesBasisPoints: [600, 700], baseIndex: 2 })).toThrow(
      RangeError
    );
  });

  it("rejects a negative or fractional basis-point rate", () => {
    expect(() => rateImpact({ ...LOAN, annualRatesBasisPoints: [-1] })).toThrow(MoneyError);
    expect(() => rateImpact({ ...LOAN, annualRatesBasisPoints: [650.5] })).toThrow(MoneyError);
  });

  it("carries an approved disclosure that does not present a rate as available", () => {
    const disclosure = disclosureFor("rate_impact");
    expect(disclosure.body).toContain("commitment to lend");
    expect(disclosure.body).toContain("No rate here is quoted or available");
  });
});

describe("formatSignedUsd", () => {
  it("signs a delta and shows a dash at zero", () => {
    expect(formatSignedUsd(dollarsToCents(142), formatUsd)).toBe("+$142");
    expect(formatSignedUsd(dollarsToCents(-142), formatUsd)).toBe("-$142");
    expect(formatSignedUsd(0, formatUsd)).toBe("—");
  });
});
