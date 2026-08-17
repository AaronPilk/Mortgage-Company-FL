import { describe, expect, it } from "vitest";
import { VisionReportRequestSchema } from "./vision";

const valid = {
  submissionId: "00000000-0000-4000-8000-000000000100",
  listingKey: "FX-STP-0001",
  propertyTitle: "St. Petersburg bungalow planning demo",
  propertyAddress: {
    line1: "1200 Example Banyan Ave",
    city: "St. Petersburg",
    state: "FL",
    postalCode: "33701"
  },
  goal: "renovate",
  assumptions: {
    purchasePriceCents: 389_000_00,
    downPaymentCents: 77_800_00,
    annualRateBasisPoints: 650,
    termMonths: 360,
    annualPropertyTaxCents: 5_200_00,
    annualInsuranceCents: 4_800_00,
    monthlyHoaCents: 0,
    acquisitionCostsCents: 12_000_00,
    improvementBudgetCents: 72_000_00,
    contingencyRateBasisPoints: 1_000,
    expectedAfterImprovementValueCents: 485_000_00,
    costRangeBasisPoints: 1_500,
    valueRangeBasisPoints: 500
  },
  firstName: "Dana",
  lastName: "Reyes",
  email: "dana@example.com",
  phone: "813-555-0147",
  consent: {
    privacyAccepted: true,
    contactRequested: true,
    smsMarketing: false,
    emailMarketing: false,
    disclosureVersion: "vision-report-request@1.0.0"
  },
  firstTouch: {
    landingPath: "/properties",
    occurredAt: "2026-08-17T12:00:00.000Z",
    utmSource: "search"
  },
  lastTouch: {
    landingPath: "/vision",
    occurredAt: "2026-08-17T12:05:00.000Z"
  },
  conversionTouch: {
    landingPath: "/vision",
    occurredAt: "2026-08-17T12:10:00.000Z"
  },
  turnstileToken: "no-challenge-configured",
  honeypot: ""
} as const;

describe("Vision report request schema", () => {
  it("accepts a complete marketing-safe report request", () => {
    expect(VisionReportRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a down payment above the purchase price", () => {
    const parsed = VisionReportRequestSchema.safeParse({
      ...valid,
      assumptions: {
        ...valid.assumptions,
        downPaymentCents: valid.assumptions.purchasePriceCents + 1
      }
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-fixture key at the demo boundary", () => {
    expect(VisionReportRequestSchema.safeParse({ ...valid, listingKey: "MLS-123" }).success).toBe(
      false
    );
  });
});
