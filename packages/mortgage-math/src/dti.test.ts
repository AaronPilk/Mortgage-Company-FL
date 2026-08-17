import { describe, expect, it } from "vitest";
import {
  REFERENCE_BACK_END_RATIO_BP,
  REFERENCE_FRONT_END_RATIO_BP,
  debtToIncome,
  formatRatioPercent
} from "./dti";
import { MoneyError, dollarsToCents } from "./money";
import { disclosureFor } from "./disclosure";

const income = [dollarsToCents(8_000)];

describe("debtToIncome", () => {
  it("computes both ratios from summed inputs", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: [dollarsToCents(6_000), dollarsToCents(2_000)],
      housingPaymentComponentsCents: [dollarsToCents(1_800), dollarsToCents(400)],
      monthlyDebtPaymentsCents: [dollarsToCents(450), dollarsToCents(150)]
    });

    expect(result.grossMonthlyIncomeCents).toBe(dollarsToCents(8_000));
    expect(result.housingPaymentCents).toBe(dollarsToCents(2_200));
    expect(result.otherDebtPaymentsCents).toBe(dollarsToCents(600));
    expect(result.totalObligationsCents).toBe(dollarsToCents(2_800));
    // 2,200 / 8,000 = 27.50%, 2,800 / 8,000 = 35.00%.
    expect(result.frontEndRatioBasisPoints).toBe(2_750);
    expect(result.backEndRatioBasisPoints).toBe(3_500);
  });

  it("uses the 28 and 43 reference points by default", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: income,
      housingPaymentComponentsCents: [dollarsToCents(2_000)],
      monthlyDebtPaymentsCents: []
    });
    expect(result.frontEndReferenceBasisPoints).toBe(REFERENCE_FRONT_END_RATIO_BP);
    expect(result.backEndReferenceBasisPoints).toBe(REFERENCE_BACK_END_RATIO_BP);
    expect(result.frontEndReferenceHousingCents).toBe(dollarsToCents(2_240));
    expect(result.backEndReferenceHousingCents).toBe(dollarsToCents(3_440));
  });

  it("treats an empty debt list as zero debts", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: income,
      housingPaymentComponentsCents: [dollarsToCents(2_000)],
      monthlyDebtPaymentsCents: []
    });
    expect(result.otherDebtPaymentsCents).toBe(0);
    expect(result.backEndRatioBasisPoints).toBe(result.frontEndRatioBasisPoints);
    // With no other debts the back-end reference leaves the most room, so the
    // housing reference is the tighter of the two.
    expect(result.bindingRatio).toBe("front_end");
  });

  it("makes the back-end reference binding once debts are heavy", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: income,
      housingPaymentComponentsCents: [dollarsToCents(2_000)],
      monthlyDebtPaymentsCents: [dollarsToCents(1_500)]
    });
    expect(result.bindingRatio).toBe("back_end");
    expect(result.backEndHeadroomCents).toBeLessThan(result.frontEndHeadroomCents);
  });

  it("reports headroom and whether each ratio sits inside its reference", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: income,
      housingPaymentComponentsCents: [dollarsToCents(2_500)],
      monthlyDebtPaymentsCents: [dollarsToCents(900)]
    });
    // 28% of 8,000 is 2,240, so a 2,500 housing payment is 260 over.
    expect(result.frontEndHeadroomCents).toBe(dollarsToCents(-260));
    expect(result.withinFrontEndReference).toBe(false);
    // 43% of 8,000 is 3,440, less 900 of debts leaves 2,540 for housing.
    expect(result.backEndHeadroomCents).toBe(dollarsToCents(40));
    expect(result.withinBackEndReference).toBe(true);
  });

  it("never reports negative room under the back-end reference", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: income,
      housingPaymentComponentsCents: [0],
      monthlyDebtPaymentsCents: [dollarsToCents(6_000)]
    });
    expect(result.backEndReferenceHousingCents).toBe(0);
  });

  it("returns null ratios instead of dividing by zero income", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: [],
      housingPaymentComponentsCents: [dollarsToCents(2_000)],
      monthlyDebtPaymentsCents: [dollarsToCents(500)]
    });
    expect(result.frontEndRatioBasisPoints).toBeNull();
    expect(result.backEndRatioBasisPoints).toBeNull();
    expect(result.bindingRatio).toBe("none");
  });

  it("honours custom reference points", () => {
    const result = debtToIncome({
      monthlyIncomeSourcesCents: income,
      housingPaymentComponentsCents: [dollarsToCents(2_000)],
      monthlyDebtPaymentsCents: [],
      frontEndReferenceBasisPoints: 3_100,
      backEndReferenceBasisPoints: 5_000
    });
    expect(result.frontEndReferenceHousingCents).toBe(dollarsToCents(2_480));
    expect(result.backEndReferenceHousingCents).toBe(dollarsToCents(4_000));
  });

  it("rejects negative and non-integer cents", () => {
    expect(() =>
      debtToIncome({
        monthlyIncomeSourcesCents: [-1],
        housingPaymentComponentsCents: [],
        monthlyDebtPaymentsCents: []
      })
    ).toThrow(MoneyError);
    expect(() =>
      debtToIncome({
        monthlyIncomeSourcesCents: income,
        housingPaymentComponentsCents: [100.5],
        monthlyDebtPaymentsCents: []
      })
    ).toThrow(MoneyError);
  });

  it("carries an approved disclosure", () => {
    const disclosure = disclosureFor("debt_to_income");
    expect(disclosure.body).toContain("commitment to lend");
    expect(disclosure.body).toContain("reference points");
  });
});

describe("formatRatioPercent", () => {
  it("renders one decimal place and a dash for an undefined ratio", () => {
    expect(formatRatioPercent(2_750)).toBe("27.5%");
    expect(formatRatioPercent(0)).toBe("0.0%");
    expect(formatRatioPercent(null)).toBe("—");
  });
});
