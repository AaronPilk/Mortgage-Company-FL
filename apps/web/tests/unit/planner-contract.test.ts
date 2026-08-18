import { describe, expect, it } from "vitest";
import {
  CreateLeadSchema,
  CreditBandSchema,
  LeadPlannerSchema,
  PlannerEmploymentSchema,
  PlannerGoalSchema,
  PlannerIncomeBandSchema,
  PlannerMonthlyDebtBandSchema,
  PlannerMortgageRateBandSchema,
  PlannerPriceBandSchema,
  PlannerPropertyStageSchema,
  PlannerPropertyTypeSchema,
  PlannerTimingSchema
} from "@tract/schemas";
import { assertCrmPayloadSafe } from "@tract/integrations";
import { inspectEvent } from "@tract/analytics";
import {
  CREDIT_BAND_OPTIONS,
  EMPLOYMENT_OPTIONS,
  GOAL_OPTIONS,
  INCOME_BAND_OPTIONS,
  MONTHLY_DEBT_BAND_OPTIONS,
  MORTGAGE_RATE_BAND_OPTIONS,
  PROPERTY_STAGE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  downPaymentBandFor,
  mortgageBalanceBandFor,
  priceBandFor
} from "../../components/planner/options";

const contactFormPayload = {
  intent: "general",
  firstName: "Dana",
  lastName: "Reyes",
  email: "dana@example.com",
  phone: "(813) 555-0147",
  consent: {
    privacyAccepted: true,
    contactRequested: true,
    smsMarketing: false,
    emailMarketing: true,
    disclosureVersion: "lead-disclosure@2026-08-17"
  },
  attribution: { landingPath: "/contact" },
  turnstileToken: "test-token"
};

const planner = {
  goal: "purchase",
  propertyState: "fl",
  propertyLocation: "Tampa",
  propertyType: "single_family",
  propertyStage: "actively_looking",
  priceBand: "350k_500k",
  downPaymentBand: "10_20",
  creditBand: "720_759",
  employment: "w2",
  incomeBand: "8k_12k",
  monthlyDebtBand: "under_500",
  timing: "within_30_days"
};

describe("the planner extends the lead schema without forking it", () => {
  it("still accepts the contact form payload, unchanged, with no planner", () => {
    const parsed = CreateLeadSchema.parse(contactFormPayload);
    expect(parsed.planner).toBeUndefined();
  });

  it("accepts a planner payload and normalizes the state code", () => {
    const parsed = CreateLeadSchema.parse({ ...contactFormPayload, planner });
    expect(parsed.planner?.propertyState).toBe("FL");
    expect(parsed.planner?.incomeBand).toBe("8k_12k");
  });

  it("keeps current-mortgage answers to a refinance", () => {
    const onAPurchase = LeadPlannerSchema.safeParse({
      ...planner,
      currentMortgageBalanceBand: "250k_500k"
    });
    expect(onAPurchase.success).toBe(false);

    const onARefinance = LeadPlannerSchema.safeParse({
      ...planner,
      goal: "refinance",
      currentMortgageBalanceBand: "250k_500k",
      currentMortgageRateBand: "6_7"
    });
    expect(onARefinance.success).toBe(true);
  });
});

describe("the planner is a marketing form, not an application", () => {
  it("strips anything that belongs in a secure application", () => {
    const parsed = LeadPlannerSchema.parse({
      ...planner,
      ssn: "123-45-6789",
      dateOfBirth: "1980-01-01",
      accountNumber: "000123456",
      monthlyIncome: 9_400,
      creditScore: 742,
      documentUrl: "https://example.com/paystub.pdf"
    });
    for (const forbidden of [
      "ssn",
      "dateOfBirth",
      "accountNumber",
      "monthlyIncome",
      "creditScore",
      "documentUrl"
    ]) {
      expect(parsed).not.toHaveProperty(forbidden);
    }
  });

  it("takes income and debt as ranges, and credit as a self-reported band", () => {
    // Every option is an enumerated band. There is no shape here that could
    // carry an exact figure or a score.
    for (const band of PlannerIncomeBandSchema.options) expect(typeof band).toBe("string");
    for (const band of PlannerMonthlyDebtBandSchema.options) expect(typeof band).toBe("string");
    expect(LeadPlannerSchema.safeParse({ ...planner, incomeBand: 9_400 }).success).toBe(false);
    expect(LeadPlannerSchema.safeParse({ ...planner, creditBand: 742 }).success).toBe(false);
    expect(LeadPlannerSchema.safeParse({ ...planner, monthlyDebtBand: 640 }).success).toBe(false);
  });

  it("bounds the location field so it cannot become an address paragraph", () => {
    expect(
      LeadPlannerSchema.safeParse({ ...planner, propertyLocation: "x".repeat(200) }).success
    ).toBe(false);
  });
});

describe("planner options and the schema cannot drift apart", () => {
  const cases: [string, readonly string[], readonly { value: string }[]][] = [
    ["goal", PlannerGoalSchema.options, GOAL_OPTIONS],
    ["property type", PlannerPropertyTypeSchema.options, PROPERTY_TYPE_OPTIONS],
    ["property stage", PlannerPropertyStageSchema.options, PROPERTY_STAGE_OPTIONS],
    ["credit band", CreditBandSchema.options, CREDIT_BAND_OPTIONS],
    ["employment", PlannerEmploymentSchema.options, EMPLOYMENT_OPTIONS],
    ["income band", PlannerIncomeBandSchema.options, INCOME_BAND_OPTIONS],
    ["monthly debt band", PlannerMonthlyDebtBandSchema.options, MONTHLY_DEBT_BAND_OPTIONS],
    ["current rate band", PlannerMortgageRateBandSchema.options, MORTGAGE_RATE_BAND_OPTIONS],
    ["timing", PlannerTimingSchema.options, TIMING_OPTIONS]
  ];

  for (const [label, schemaValues, options] of cases) {
    it(`offers exactly the ${label} values the schema accepts`, () => {
      expect([...options.map((option) => option.value)].sort()).toEqual([...schemaValues].sort());
    });
  }

  it("derives a band the schema accepts from every figure the visitor can type", () => {
    for (const price of [0, 9_999, 199_999, 200_000, 499_999, 900_000, 4_000_000]) {
      expect(PlannerPriceBandSchema.safeParse(priceBandFor(price)).success).toBe(true);
      expect(
        LeadPlannerSchema.safeParse({
          ...planner,
          priceBand: priceBandFor(price),
          downPaymentBand: downPaymentBandFor(price * 0.07, price)
        }).success
      ).toBe(true);
    }
    for (const balance of [0, 50_000, 240_000, 800_000]) {
      expect(
        LeadPlannerSchema.safeParse({
          ...planner,
          goal: "refinance",
          currentMortgageBalanceBand: mortgageBalanceBandFor(balance),
          currentMortgageRateBand: "not_sure"
        }).success
      ).toBe(true);
    }
  });
});

describe("planner context crossing into the CRM", () => {
  it("permits the planner projection the lead route builds", () => {
    expect(() =>
      assertCrmPayloadSafe({
        externalId: "receipt",
        firstName: "Dana",
        lastName: "Reyes",
        email: "dana@example.com",
        phoneE164: "+18135550147",
        intent: "purchase",
        timeline: "0_3_months",
        sourcePath: "/plan",
        tags: ["web-lead", "intent:purchase", "planner", "goal:purchase"],
        planner: {
          goal: "purchase",
          propertyState: "FL",
          propertyLocation: "Tampa",
          propertyType: "single_family",
          propertyStage: "actively_looking",
          priceBand: "350k_500k",
          downPaymentBand: "10_20",
          currentMortgageBalanceBand: null,
          currentMortgageRateBand: null,
          creditBand: "720_759",
          employment: "w2",
          incomeBand: "8k_12k",
          monthlyDebtBand: "under_500",
          timing: "within_30_days",
          plannerVersion: "lead-planner@1.0.0"
        },
        consent: {
          smsMarketing: false,
          emailMarketing: true,
          disclosureVersion: "v1",
          receivedAtIso: "2026-08-17T00:00:00.000Z"
        },
        attribution: { utmSource: "google", utmMedium: "cpc", utmCampaign: "brand", gclid: "abc" }
      })
    ).not.toThrow();
  });

  it("still refuses an exact figure smuggled in beside the bands", () => {
    expect(() =>
      assertCrmPayloadSafe({ planner: { incomeBand: "8k_12k", monthlyIncome: 9_400 } })
    ).toThrow();
    expect(() =>
      assertCrmPayloadSafe({ planner: { creditBand: "720_759", creditScore: 742 } })
    ).toThrow();
  });
});

describe("planner analytics carry no personal data", () => {
  it("passes the guard for every event the planner emits", () => {
    expect(inspectEvent({ name: "form_start", formId: "planner", intent: "refinance" }).ok).toBe(
      true
    );
    expect(inspectEvent({ name: "calculator_complete", calculator: "planner:refinance" }).ok).toBe(
      true
    );
    expect(
      inspectEvent({
        name: "generate_lead",
        formId: "planner",
        intent: "refinance",
        leadReceiptId: "abcdefabcdef"
      }).ok
    ).toBe(true);
  });

  it("refuses an event carrying a figure or a contact detail", () => {
    // The guard is the gate. These are the shapes a careless addition would take.
    expect(inspectEvent({ name: "form_start", formId: "planner", intent: "a@b.com" }).ok).toBe(
      false
    );
    expect(
      inspectEvent({
        name: "calculator_complete",
        calculator: "planner",
        scenarioId: "+1 813 555 0147"
      }).ok
    ).toBe(false);
  });
});
