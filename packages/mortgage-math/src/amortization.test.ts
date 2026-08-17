import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  amortizationSummary,
  formatCalendarMonth,
  formatMonthSpan,
  summarizeAmortizationByYear
} from "./amortization";
import { amortizationSchedule } from "./payment";
import { MoneyError, dollarsToCents } from "./money";
import { disclosureFor } from "./disclosure";

const LOAN = {
  principalCents: dollarsToCents(300_000),
  annualRateBasisPoints: 650,
  termMonths: 360
};

describe("addCalendarMonths", () => {
  it("rolls forward across a year boundary", () => {
    expect(addCalendarMonths({ year: 2026, month: 11 }, 3)).toEqual({ year: 2027, month: 2 });
  });

  it("rolls backward across a year boundary", () => {
    expect(addCalendarMonths({ year: 2026, month: 2 }, -3)).toEqual({ year: 2025, month: 11 });
  });

  it("is identity for a zero offset", () => {
    expect(addCalendarMonths({ year: 2026, month: 6 }, 0)).toEqual({ year: 2026, month: 6 });
  });

  it("rejects a month outside 1 through 12 and a fractional offset", () => {
    expect(() => addCalendarMonths({ year: 2026, month: 0 }, 1)).toThrow(RangeError);
    expect(() => addCalendarMonths({ year: 2026, month: 13 }, 1)).toThrow(RangeError);
    expect(() => addCalendarMonths({ year: 2026, month: 6 }, 1.5)).toThrow(RangeError);
  });
});

describe("summarizeAmortizationByYear", () => {
  it("groups twelve months into each payment year and preserves every row", () => {
    const schedule = amortizationSchedule(LOAN);
    const years = summarizeAmortizationByYear(schedule.rows);

    expect(years).toHaveLength(30);
    expect(years[0]?.firstMonthIndex).toBe(1);
    expect(years[0]?.lastMonthIndex).toBe(12);
    expect(years[0]?.rows).toHaveLength(12);
    expect(years[29]?.lastMonthIndex).toBe(360);
    expect(years.reduce((sum, year) => sum + year.rows.length, 0)).toBe(schedule.rows.length);
  });

  it("reconciles yearly totals against the monthly rows exactly", () => {
    const schedule = amortizationSchedule(LOAN);
    const years = summarizeAmortizationByYear(schedule.rows);
    const totalInterest = years.reduce((sum, year) => sum + year.interestCents, 0);
    const totalPrincipal = years.reduce(
      (sum, year) => sum + year.principalCents + year.extraPrincipalCents,
      0
    );

    expect(totalInterest).toBe(schedule.totalInterestCents);
    expect(totalPrincipal).toBe(LOAN.principalCents);
    expect(years[years.length - 1]?.endingBalanceCents).toBe(0);
  });

  it("returns an empty list for an empty schedule", () => {
    expect(summarizeAmortizationByYear([])).toEqual([]);
  });

  it("handles a partial final year", () => {
    const schedule = amortizationSchedule({ ...LOAN, termMonths: 18 });
    const years = summarizeAmortizationByYear(schedule.rows);
    expect(years).toHaveLength(2);
    expect(years[1]?.rows).toHaveLength(6);
  });
});

describe("amortizationSummary", () => {
  it("reports no saving and no baseline gap without extra principal", () => {
    const summary = amortizationSummary(LOAN);
    expect(summary.monthsToPayoff).toBe(360);
    expect(summary.extraMonthlyPrincipalCents).toBe(0);
    expect(summary.interestSavedCents).toBe(0);
    expect(summary.monthsSaved).toBe(0);
    expect(summary.baselineTotalInterestCents).toBe(summary.totalInterestCents);
    expect(summary.totalMonthlyOutlayCents).toBe(summary.scheduledPaymentCents);
  });

  it("shortens the payoff and saves interest with extra principal", () => {
    const baseline = amortizationSummary(LOAN);
    const withExtra = amortizationSummary({
      ...LOAN,
      extraMonthlyPrincipalCents: dollarsToCents(300)
    });

    expect(withExtra.monthsToPayoff).toBeLessThan(baseline.monthsToPayoff);
    expect(withExtra.monthsSaved).toBe(baseline.monthsToPayoff - withExtra.monthsToPayoff);
    expect(withExtra.interestSavedCents).toBeGreaterThan(0);
    expect(withExtra.interestSavedCents).toBe(
      baseline.totalInterestCents - withExtra.totalInterestCents
    );
    expect(withExtra.totalMonthlyOutlayCents).toBe(
      withExtra.scheduledPaymentCents + dollarsToCents(300)
    );
  });

  it("resolves a payoff month from the first payment month", () => {
    const summary = amortizationSummary({
      ...LOAN,
      termMonths: 12,
      firstPaymentMonth: { year: 2026, month: 10 }
    });
    expect(summary.payoffMonth).toEqual({ year: 2027, month: 9 });
    expect(formatCalendarMonth({ year: 2027, month: 9 })).toBe("September 2027");
  });

  it("leaves the payoff month unresolved when no start month is supplied", () => {
    expect(amortizationSummary(LOAN).payoffMonth).toBeNull();
  });

  it("handles a zero rate", () => {
    const summary = amortizationSummary({
      principalCents: dollarsToCents(120_000),
      annualRateBasisPoints: 0,
      termMonths: 120
    });
    expect(summary.totalInterestCents).toBe(0);
    expect(summary.totalPaidCents).toBe(dollarsToCents(120_000));
    expect(summary.monthsToPayoff).toBe(120);
  });

  it("handles a single-month term", () => {
    const summary = amortizationSummary({
      principalCents: dollarsToCents(10_000),
      annualRateBasisPoints: 600,
      termMonths: 1
    });
    expect(summary.monthsToPayoff).toBe(1);
    expect(summary.years).toHaveLength(1);
    expect(summary.rows[0]?.balanceCents).toBe(0);
    expect(summary.totalPaidCents).toBe(dollarsToCents(10_000) + summary.totalInterestCents);
  });

  it("handles a zero principal", () => {
    const summary = amortizationSummary({
      principalCents: 0,
      annualRateBasisPoints: 650,
      termMonths: 360
    });
    expect(summary.monthsToPayoff).toBe(0);
    expect(summary.totalInterestCents).toBe(0);
    expect(summary.years).toEqual([]);
    expect(summary.payoffMonth).toBeNull();
  });

  it("rejects negative extra principal", () => {
    expect(() => amortizationSummary({ ...LOAN, extraMonthlyPrincipalCents: -1 })).toThrow(
      MoneyError
    );
  });

  it("carries an approved disclosure", () => {
    const disclosure = disclosureFor("amortization");
    expect(disclosure.body).toContain("commitment to lend");
    expect(disclosure.version).toMatch(/^calc-disclosure@/);
  });
});

describe("formatMonthSpan", () => {
  it("renders years and months, singular and plural", () => {
    expect(formatMonthSpan(0)).toBe("0 months");
    expect(formatMonthSpan(1)).toBe("1 month");
    expect(formatMonthSpan(12)).toBe("1 year");
    expect(formatMonthSpan(13)).toBe("1 year 1 month");
    expect(formatMonthSpan(295)).toBe("24 years 7 months");
  });

  it("rejects a negative or fractional month count", () => {
    expect(() => formatMonthSpan(-1)).toThrow(RangeError);
    expect(() => formatMonthSpan(1.5)).toThrow(RangeError);
  });
});
