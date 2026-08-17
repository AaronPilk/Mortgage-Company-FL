import { describe, expect, it } from "vitest";
import {
  amortizationSchedule,
  monthlyHousingCost,
  monthlyPrincipalAndInterest,
  remainingBalance
} from "./payment";
import { MoneyError, dollarsToCents, formatUsd, roundCents } from "./money";

describe("monthlyPrincipalAndInterest", () => {
  it("matches the standard amortization formula on a known case", () => {
    // $300,000 at 6.500% for 360 months. Textbook value is $1,896.20.
    const payment = monthlyPrincipalAndInterest({
      principalCents: dollarsToCents(300_000),
      annualRateBasisPoints: 650,
      termMonths: 360
    });
    expect(payment).toBe(189_620);
    expect(formatUsd(payment, { cents: true })).toBe("$1,896.20");
  });

  it("matches a second known case at a different rate and term", () => {
    // $250,000 at 5.000% for 180 months = $1,976.98.
    const payment = monthlyPrincipalAndInterest({
      principalCents: dollarsToCents(250_000),
      annualRateBasisPoints: 500,
      termMonths: 180
    });
    expect(payment).toBe(197_698);
  });

  it("degrades to straight-line principal at a zero rate", () => {
    const payment = monthlyPrincipalAndInterest({
      principalCents: dollarsToCents(120_000),
      annualRateBasisPoints: 0,
      termMonths: 120
    });
    expect(payment).toBe(dollarsToCents(1_000));
  });

  it("returns zero for a zero principal", () => {
    expect(
      monthlyPrincipalAndInterest({
        principalCents: 0,
        annualRateBasisPoints: 700,
        termMonths: 360
      })
    ).toBe(0);
  });

  it("rejects non-integer cents, negative principal, and a non-positive term", () => {
    expect(() =>
      monthlyPrincipalAndInterest({
        principalCents: 100.5,
        annualRateBasisPoints: 650,
        termMonths: 360
      })
    ).toThrow(MoneyError);
    expect(() =>
      monthlyPrincipalAndInterest({
        principalCents: -1,
        annualRateBasisPoints: 650,
        termMonths: 360
      })
    ).toThrow(MoneyError);
    expect(() =>
      monthlyPrincipalAndInterest({
        principalCents: 1000,
        annualRateBasisPoints: 650,
        termMonths: 0
      })
    ).toThrow(MoneyError);
  });

  it("increases monotonically with rate and decreases with term", () => {
    const base = { principalCents: dollarsToCents(400_000), termMonths: 360 };
    let previous = 0;
    for (let bp = 300; bp <= 900; bp += 25) {
      const payment = monthlyPrincipalAndInterest({ ...base, annualRateBasisPoints: bp });
      expect(payment).toBeGreaterThan(previous);
      previous = payment;
    }
    const short = monthlyPrincipalAndInterest({
      principalCents: dollarsToCents(400_000),
      annualRateBasisPoints: 650,
      termMonths: 180
    });
    const long = monthlyPrincipalAndInterest({
      principalCents: dollarsToCents(400_000),
      annualRateBasisPoints: 650,
      termMonths: 360
    });
    expect(short).toBeGreaterThan(long);
  });
});

describe("amortizationSchedule", () => {
  it("terminates at exactly zero and never goes negative", () => {
    const schedule = amortizationSchedule({
      principalCents: dollarsToCents(300_000),
      annualRateBasisPoints: 650,
      termMonths: 360
    });
    expect(schedule.rows).toHaveLength(360);
    expect(schedule.rows.at(-1)?.balanceCents).toBe(0);
    for (const row of schedule.rows) {
      expect(row.balanceCents).toBeGreaterThanOrEqual(0);
      expect(row.interestCents).toBeGreaterThanOrEqual(0);
      expect(row.principalCents).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps the balance monotonically non-increasing across many scenarios", () => {
    const cases = [
      { principal: 85_000, bp: 375, term: 120 },
      { principal: 512_400, bp: 725, term: 360 },
      { principal: 1_250_000, bp: 588, term: 240 },
      { principal: 42_000, bp: 1_050, term: 60 }
    ];
    for (const testCase of cases) {
      const schedule = amortizationSchedule({
        principalCents: dollarsToCents(testCase.principal),
        annualRateBasisPoints: testCase.bp,
        termMonths: testCase.term
      });
      let previous = Number.POSITIVE_INFINITY;
      for (const row of schedule.rows) {
        expect(row.balanceCents).toBeLessThanOrEqual(previous);
        previous = row.balanceCents;
      }
      expect(schedule.rows.at(-1)?.balanceCents).toBe(0);
    }
  });

  it("reconciles principal paid against the original balance", () => {
    const principalCents = dollarsToCents(275_000);
    const schedule = amortizationSchedule({
      principalCents,
      annualRateBasisPoints: 599,
      termMonths: 360
    });
    const principalPaid = schedule.rows.reduce(
      (sum, row) => sum + row.principalCents + row.extraPrincipalCents,
      0
    );
    expect(principalPaid).toBe(principalCents);
    expect(schedule.totalPaidCents).toBe(principalCents + schedule.totalInterestCents);
  });

  it("shortens the payoff and reduces interest when extra principal is applied", () => {
    const base = {
      principalCents: dollarsToCents(300_000),
      annualRateBasisPoints: 650,
      termMonths: 360
    };
    const plain = amortizationSchedule(base);
    const accelerated = amortizationSchedule({
      ...base,
      extraMonthlyPrincipalCents: dollarsToCents(250)
    });
    expect(accelerated.monthsToPayoff).toBeLessThan(plain.monthsToPayoff);
    expect(accelerated.totalInterestCents).toBeLessThan(plain.totalInterestCents);
    expect(accelerated.rows.at(-1)?.balanceCents).toBe(0);
  });

  it("reports a remaining balance that falls between the endpoints", () => {
    const input = {
      principalCents: dollarsToCents(300_000),
      annualRateBasisPoints: 650,
      termMonths: 360
    };
    const balance = remainingBalance({ ...input, afterMonths: 60 });
    expect(balance).toBeLessThan(input.principalCents);
    expect(balance).toBeGreaterThan(0);
    expect(remainingBalance({ ...input, afterMonths: 360 })).toBe(0);
  });
});

describe("monthlyHousingCost", () => {
  it("sums every component and reports the calculation version", () => {
    const result = monthlyHousingCost({
      loanAmountCents: dollarsToCents(300_000),
      annualRateBasisPoints: 650,
      termMonths: 360,
      annualPropertyTaxCents: dollarsToCents(4_800),
      annualHomeownersInsuranceCents: dollarsToCents(3_600),
      monthlyHoaCents: dollarsToCents(120),
      mortgageInsuranceAnnualRateBasisPoints: 55
    });

    expect(result.principalAndInterestCents).toBe(189_620);
    expect(result.propertyTaxCents).toBe(dollarsToCents(400));
    expect(result.homeownersInsuranceCents).toBe(dollarsToCents(300));
    expect(result.hoaCents).toBe(dollarsToCents(120));
    expect(result.mortgageInsuranceCents).toBe(roundCents((300_000_00 * 55) / 10_000 / 12));

    const parts =
      result.principalAndInterestCents +
      result.propertyTaxCents +
      result.homeownersInsuranceCents +
      result.floodInsuranceCents +
      result.hoaCents +
      result.mortgageInsuranceCents +
      result.otherCents;
    expect(result.totalMonthlyCents).toBe(parts);
    expect(result.calculationVersion).toMatch(/^mortgage-math@/);
  });

  it("omits mortgage insurance when no rate is supplied", () => {
    const result = monthlyHousingCost({
      loanAmountCents: dollarsToCents(200_000),
      annualRateBasisPoints: 600,
      termMonths: 360
    });
    expect(result.mortgageInsuranceCents).toBe(0);
    expect(result.totalMonthlyCents).toBe(result.principalAndInterestCents);
  });
});
