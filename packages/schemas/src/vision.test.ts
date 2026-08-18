import { describe, expect, it } from "vitest";
import { VisionReportRequestSchema } from "./vision";

const valid = {
  submissionId: "00000000-0000-4000-8000-000000000100",
  scenario: {
    analysisType: "existing_home_renovation",
    ownership: "purchasing",
    propertyLabel: "The corner house",
    purchasePriceCents: 389_000_00,
    downPaymentCents: 77_800_00,
    annualRateBasisPoints: 650,
    termMonths: 360,
    annualPropertyTaxCents: 5_200_00,
    annualInsuranceCents: 4_800_00,
    monthlyHoaCents: 0,
    improvementBudgetCents: 72_000_00,
    expectedAfterValueCents: 485_000_00,
    overrides: {
      contingencyRateBasisPoints: 1_000,
      valueUpliftShareOfSpendBasisPoints: 7_000
    }
  },
  firstName: "Dana",
  lastName: "Reyes",
  email: "dana@example.com",
  phone: "813-555-0147",
  note: "Please talk through the permit questions.",
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
    landingPath: "/vision/start",
    occurredAt: "2026-08-17T12:05:00.000Z"
  },
  conversionTouch: {
    landingPath: "/vision/start",
    occurredAt: "2026-08-17T12:10:00.000Z"
  },
  turnstileToken: "no-challenge-configured",
  honeypot: ""
} as const;

describe("Vision report request schema", () => {
  it("accepts a complete marketing-safe deterministic scenario request", () => {
    expect(VisionReportRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a down payment above the purchase price", () => {
    const parsed = VisionReportRequestSchema.safeParse({
      ...valid,
      scenario: {
        ...valid.scenario,
        downPaymentCents: valid.scenario.purchasePriceCents + 1
      }
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects model output supplied by the browser", () => {
    expect(
      VisionReportRequestSchema.safeParse({
        ...valid,
        scenario: { ...valid.scenario, figures: [{ label: "Invented value", cents: 1 }] }
      }).success
    ).toBe(false);
  });

  it("rejects internal assumption keys the public wizard does not expose", () => {
    expect(
      VisionReportRequestSchema.safeParse({
        ...valid,
        scenario: {
          ...valid.scenario,
          overrides: { monthlyUtilitiesCents: 0 }
        }
      }).success
    ).toBe(false);
  });
});
