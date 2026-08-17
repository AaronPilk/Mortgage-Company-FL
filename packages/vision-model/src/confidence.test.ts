import { describe, expect, it } from "vitest";
import { resolveAssumptions } from "./assumptions";
import { assessConfidence, confidenceLabel } from "./confidence";
import { buildUnverified } from "./unverified";
import type { VisionInput } from "./types";

function assess(input: VisionInput) {
  const assumptions = resolveAssumptions(input.overrides);
  return assessConfidence(input, assumptions, buildUnverified(input, assumptions));
}

const sparse: VisionInput = {
  analysisType: "long_term_rental",
  ownership: "purchasing",
  purchasePriceCents: 0
};

const complete: VisionInput = {
  analysisType: "long_term_rental",
  ownership: "purchasing",
  purchasePriceCents: 38_000_000,
  squareFeet: 1_500,
  downPaymentCents: 9_500_000,
  annualRateBasisPoints: 700,
  termMonths: 360,
  holdMonths: 60,
  grossMonthlyRentCents: 310_000,
  annualPropertyTaxCents: 620_000,
  annualInsuranceCents: 480_000
};

describe("confidence", () => {
  it("scores a scenario with real inputs above one with none", () => {
    expect(assess(complete).score).toBeGreaterThan(assess(sparse).score);
  });

  it("never reaches high, whatever the user supplies", () => {
    const best = assess({ ...complete, expectedAfterValueCents: 60_000_000 });
    expect(best.ceiling).toBe("moderate");
    expect(best.level).not.toBe("high" as unknown as typeof best.level);
    expect(best.score).toBeLessThanOrEqual(85);
  });

  it("explains the ceiling in terms of missing data, not user effort", () => {
    expect(assess(complete).ceilingReason).toContain("comparable sales");
  });

  it("lands at very low when nothing was entered", () => {
    expect(assess(sparse).level).toBe("very_low");
  });

  it("records a driver for every judgement it makes", () => {
    const result = assess(complete);
    expect(result.drivers.length).toBeGreaterThan(4);
    for (const driver of result.drivers) {
      expect(["raises", "lowers"]).toContain(driver.direction);
      expect(driver.detail.length).toBeGreaterThan(15);
    }
  });

  it("penalises a modelled rent more than a modelled hold period", () => {
    const noRent = { ...complete };
    delete (noRent as { grossMonthlyRentCents?: number }).grossMonthlyRentCents;
    const noHold = { ...complete };
    delete (noHold as { holdMonths?: number }).holdMonths;
    expect(assess(noRent).score).toBeLessThan(assess(noHold).score);
  });

  it("rewards replacing the insurance placeholder, which is the weakest one in Florida", () => {
    const withoutInsurance = { ...complete };
    delete (withoutInsurance as { annualInsuranceCents?: number }).annualInsuranceCents;
    expect(assess(complete).score).toBeGreaterThan(assess(withoutInsurance).score);
  });

  it("stays inside zero and the ceiling for every combination it is given", () => {
    for (const input of [sparse, complete, { ...complete, purchasePriceCents: 0 }]) {
      const result = assess(input);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(85);
    }
  });

  it("labels each level in words a reader understands", () => {
    expect(confidenceLabel("moderate")).toBe("Moderate");
    expect(confidenceLabel("low")).toBe("Low");
    expect(confidenceLabel("very_low")).toBe("Very low");
  });
});
