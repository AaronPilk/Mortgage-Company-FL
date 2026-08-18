import { z } from "zod";
import {
  ConsentSchema,
  LeadAttributionTouchSchema,
  PreferredContactSchema,
  TimelineSchema
} from "./lead";

const integerMoney = z.number().int().min(0).max(250_000_000_00);
const squareFeet = z.number().int().min(0).max(1_000_000);

export const VisionAnalysisTypeSchema = z.enum([
  "existing_home_renovation",
  "addition",
  "interior_upgrade",
  "land_new_construction",
  "long_term_rental",
  "short_term_rental",
  "fix_and_flip",
  "buy_and_hold"
]);

export const VisionGoalSchema = z.enum([
  "renovate",
  "expand",
  "build",
  "flip",
  "long_term_rental",
  "short_term_rental",
  "buy_and_hold",
  "explore"
]);

export const VisionAttributionTouchSchema = LeadAttributionTouchSchema;
export type VisionAttributionTouch = z.infer<typeof VisionAttributionTouchSchema>;

/**
 * Only the assumptions the public wizard exposes are accepted here. The model
 * owns a larger internal catalogue, but a caller cannot use this marketing
 * endpoint to smuggle arbitrary model configuration into a stored report.
 */
export const VisionAssumptionOverridesSchema = z
  .object({
    contingencyRateBasisPoints: z.number().int().min(0).max(5_000).optional(),
    valueUpliftShareOfSpendBasisPoints: z.number().int().min(0).max(15_000).optional(),
    softCostRateBasisPoints: z.number().int().min(0).max(6_000).optional(),
    completedValueToCostRatioBasisPoints: z.number().int().min(5_000).max(20_000).optional(),
    longTermVacancyRateBasisPoints: z.number().int().min(0).max(5_000).optional(),
    longTermManagementRateBasisPoints: z.number().int().min(0).max(4_000).optional(),
    shortTermVacancyRateBasisPoints: z.number().int().min(0).max(9_000).optional(),
    shortTermManagementRateBasisPoints: z.number().int().min(0).max(5_000).optional(),
    sellingCostRateBasisPoints: z.number().int().min(0).max(1_500).optional(),
    annualAppreciationBasisPoints: z.number().int().min(-2_000).max(2_000).optional()
  })
  .strict();

/**
 * The browser sends model inputs, never calculated output. The server validates
 * this bounded shape and re-runs the deterministic model before persistence so
 * a client cannot author financial figures or provenance labels.
 */
export const VisionScenarioInputSchema = z
  .object({
    analysisType: VisionAnalysisTypeSchema,
    ownership: z.enum(["purchasing", "already_owned"]),
    propertyLabel: z.string().trim().max(180).optional(),
    purchasePriceCents: integerMoney.min(1),
    squareFeet: squareFeet.optional(),
    addedSquareFeet: squareFeet.optional(),
    buildSquareFeet: squareFeet.optional(),
    improvementBudgetCents: integerMoney.optional(),
    expectedAfterValueCents: integerMoney.optional(),
    holdMonths: z.number().int().min(1).max(1_200).optional(),
    downPaymentCents: integerMoney.optional(),
    annualRateBasisPoints: z.number().int().min(0).max(5_000).optional(),
    termMonths: z.number().int().min(12).max(600).optional(),
    grossMonthlyRentCents: integerMoney.optional(),
    nightlyRateCents: integerMoney.optional(),
    annualPropertyTaxCents: integerMoney.optional(),
    annualInsuranceCents: integerMoney.optional(),
    monthlyHoaCents: integerMoney.optional(),
    overrides: VisionAssumptionOverridesSchema.optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.downPaymentCents !== undefined && value.downPaymentCents > value.purchasePriceCents) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["downPaymentCents"],
        message: "Down payment cannot exceed the purchase price."
      });
    }
  });

export const VisionReportRequestSchema = z
  .object({
    submissionId: z.string().uuid(),
    scenario: VisionScenarioInputSchema,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().toLowerCase().email().max(320),
    phone: z.string().trim().min(7).max(32),
    preferredContact: PreferredContactSchema.optional(),
    timeline: TimelineSchema.optional(),
    note: z.string().trim().max(600).optional(),
    consent: ConsentSchema,
    firstTouch: VisionAttributionTouchSchema,
    lastTouch: VisionAttributionTouchSchema,
    conversionTouch: VisionAttributionTouchSchema,
    turnstileToken: z.string().min(1).max(4096),
    honeypot: z.string().max(0).optional()
  })
  .strict();

export type VisionScenarioInput = z.infer<typeof VisionScenarioInputSchema>;
export type VisionReportRequestInput = z.input<typeof VisionReportRequestSchema>;
export type VisionReportRequestParsed = z.output<typeof VisionReportRequestSchema>;
