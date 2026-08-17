import { describe, expect, it } from "vitest";
import {
  DSCR_REFERENCE_BANDS,
  debtServiceCoverage,
  dscrReferenceBand,
  formatCoverageRatio
} from "./dscr";
import { MoneyError, dollarsToCents } from "./money";
import { monthlyPrincipalAndInterest } from "./payment";
import { disclosureFor } from "./disclosure";

const LOAN = {
  loanAmountCents: dollarsToCents(300_000),
  annualRateBasisPoints: 700,
  termMonths: 360
};

describe("debtServiceCoverage", () => {
  it("builds PITIA from principal, interest, taxes, insurance, and dues", () => {
    const result = debtServiceCoverage({
      ...LOAN,
      grossMonthlyRentCents: dollarsToCents(3_200),
      annualPropertyTaxCents: dollarsToCents(4_800),
      annualInsuranceCents: dollarsToCents(3_600),
      monthlyHoaCents: dollarsToCents(150)
    });

    const pi = monthlyPrincipalAndInterest({
      principalCents: LOAN.loanAmountCents,
      annualRateBasisPoints: LOAN.annualRateBasisPoints,
      termMonths: LOAN.termMonths
    });
    expect(result.principalAndInterestCents).toBe(pi);
    expect(result.propertyTaxCents).toBe(dollarsToCents(400));
    expect(result.insuranceCents).toBe(dollarsToCents(300));
    expect(result.hoaCents).toBe(dollarsToCents(150));
    expect(result.pitiaCents).toBe(pi + dollarsToCents(850));
    expect(result.monthlyCoverageCents).toBe(dollarsToCents(3_200) - result.pitiaCents);
    expect(result.breakEvenRentCents).toBe(result.pitiaCents);
  });

  it("reports a ratio of exactly 1.00x when rent equals PITIA", () => {
    const first = debtServiceCoverage({ ...LOAN, grossMonthlyRentCents: dollarsToCents(1) });
    const level = debtServiceCoverage({ ...LOAN, grossMonthlyRentCents: first.pitiaCents });
    expect(level.ratioBasisPoints).toBe(10_000);
    expect(level.monthlyCoverageCents).toBe(0);
    expect(formatCoverageRatio(level.ratioBasisPoints)).toBe("1.00x");
  });

  it("goes below 1.00x when the payment exceeds the rent", () => {
    const result = debtServiceCoverage({
      ...LOAN,
      grossMonthlyRentCents: dollarsToCents(1_200),
      annualPropertyTaxCents: dollarsToCents(6_000)
    });
    expect(result.ratioBasisPoints).not.toBeNull();
    expect(result.ratioBasisPoints ?? 0).toBeLessThan(10_000);
    expect(result.monthlyCoverageCents).toBeLessThan(0);
  });

  it("treats omitted taxes, insurance, dues, and mortgage insurance as zero", () => {
    const result = debtServiceCoverage({ ...LOAN, grossMonthlyRentCents: dollarsToCents(3_000) });
    expect(result.propertyTaxCents).toBe(0);
    expect(result.insuranceCents).toBe(0);
    expect(result.hoaCents).toBe(0);
    expect(result.mortgageInsuranceCents).toBe(0);
    expect(result.pitiaCents).toBe(result.principalAndInterestCents);
  });

  it("handles a zero rate", () => {
    const result = debtServiceCoverage({
      loanAmountCents: dollarsToCents(120_000),
      annualRateBasisPoints: 0,
      termMonths: 120,
      grossMonthlyRentCents: dollarsToCents(2_000)
    });
    expect(result.principalAndInterestCents).toBe(dollarsToCents(1_000));
    expect(result.ratioBasisPoints).toBe(20_000);
  });

  it("handles a single-month term", () => {
    const result = debtServiceCoverage({
      loanAmountCents: dollarsToCents(12_000),
      annualRateBasisPoints: 600,
      termMonths: 1,
      grossMonthlyRentCents: dollarsToCents(2_000)
    });
    expect(result.pitiaCents).toBeGreaterThan(dollarsToCents(12_000));
    expect(result.ratioBasisPoints ?? 0).toBeLessThan(10_000);
  });

  it("returns a null ratio rather than dividing by a zero payment", () => {
    const result = debtServiceCoverage({
      loanAmountCents: 0,
      annualRateBasisPoints: 700,
      termMonths: 360,
      grossMonthlyRentCents: dollarsToCents(2_000)
    });
    expect(result.pitiaCents).toBe(0);
    expect(result.ratioBasisPoints).toBeNull();
    expect(formatCoverageRatio(result.ratioBasisPoints)).toBe("—");
  });

  it("rejects negative rent and negative dues", () => {
    expect(() =>
      debtServiceCoverage({ ...LOAN, grossMonthlyRentCents: dollarsToCents(-100) })
    ).toThrow(MoneyError);
    expect(() =>
      debtServiceCoverage({
        ...LOAN,
        grossMonthlyRentCents: dollarsToCents(2_000),
        monthlyHoaCents: -1
      })
    ).toThrow(MoneyError);
  });
});

describe("dscrReferenceBand", () => {
  it("places a ratio in the band it belongs to", () => {
    expect(dscrReferenceBand(13_000)?.label).toBe("1.25x and above");
    expect(dscrReferenceBand(12_500)?.label).toBe("1.25x and above");
    expect(dscrReferenceBand(12_400)?.label).toBe("1.20x to 1.24x");
    expect(dscrReferenceBand(10_000)?.label).toBe("1.00x to 1.19x");
    expect(dscrReferenceBand(9_999)?.label).toBe("Below 1.00x");
    expect(dscrReferenceBand(0)?.label).toBe("Below 1.00x");
  });

  it("returns nothing when there is no ratio to place", () => {
    expect(dscrReferenceBand(null)).toBeNull();
  });

  it("keeps the bands ordered from highest to lowest", () => {
    const bounds = DSCR_REFERENCE_BANDS.map((band) => band.minRatioBasisPoints);
    expect([...bounds].sort((a, b) => b - a)).toEqual(bounds);
  });

  it("carries an approved disclosure that names the bands as general reference", () => {
    const disclosure = disclosureFor("dscr");
    expect(disclosure.body).toContain("general reference");
    expect(disclosure.body).toContain("not TRACT underwriting");
  });
});
