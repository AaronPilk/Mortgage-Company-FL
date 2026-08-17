import { z } from "zod";
import { ConsentSchema, PreferredContactSchema, TimelineSchema } from "./lead";

const bounded = (max: number) => z.string().trim().max(max);
const integerMoney = z.number().int().min(0).max(250_000_000_00);

export const VisionGoalSchema = z.enum([
  "renovate",
  "expand",
  "build",
  "flip",
  "long_term_rental",
  "explore"
]);

export const VisionAttributionTouchSchema = z.object({
  landingPath: bounded(512),
  referrerHost: bounded(255).optional(),
  occurredAt: z.string().datetime({ offset: true }),
  utmSource: bounded(200).optional(),
  utmMedium: bounded(200).optional(),
  utmCampaign: bounded(200).optional(),
  utmContent: bounded(200).optional(),
  utmTerm: bounded(200).optional(),
  gclid: bounded(512).optional(),
  gbraid: bounded(512).optional(),
  wbraid: bounded(512).optional(),
  msclkid: bounded(512).optional(),
  fbclid: bounded(512).optional()
});
export type VisionAttributionTouch = z.infer<typeof VisionAttributionTouchSchema>;

export const VisionPlanningAssumptionsSchema = z
  .object({
    purchasePriceCents: integerMoney,
    downPaymentCents: integerMoney,
    annualRateBasisPoints: z.number().int().min(0).max(5_000),
    termMonths: z.number().int().min(12).max(600),
    annualPropertyTaxCents: integerMoney,
    annualInsuranceCents: integerMoney,
    monthlyHoaCents: integerMoney,
    acquisitionCostsCents: integerMoney,
    improvementBudgetCents: integerMoney,
    contingencyRateBasisPoints: z.number().int().min(0).max(10_000),
    expectedAfterImprovementValueCents: integerMoney,
    costRangeBasisPoints: z.number().int().min(0).max(10_000),
    valueRangeBasisPoints: z.number().int().min(0).max(10_000)
  })
  .superRefine((value, context) => {
    if (value.downPaymentCents > value.purchasePriceCents) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["downPaymentCents"],
        message: "Down payment cannot exceed the purchase price."
      });
    }
  });
export type VisionPlanningAssumptions = z.infer<typeof VisionPlanningAssumptionsSchema>;

export const VisionReportRequestSchema = z.object({
  submissionId: z.string().uuid(),
  listingKey: z
    .string()
    .trim()
    .regex(/^FX-[A-Z0-9-]{3,40}$/),
  propertyTitle: z.string().trim().min(1).max(180),
  propertyAddress: z.object({
    line1: bounded(160),
    city: bounded(100),
    state: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
    postalCode: z.string().trim().min(5).max(10)
  }),
  goal: VisionGoalSchema,
  assumptions: VisionPlanningAssumptionsSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(7).max(32),
  preferredContact: PreferredContactSchema.optional(),
  timeline: TimelineSchema.optional(),
  consent: ConsentSchema,
  firstTouch: VisionAttributionTouchSchema,
  lastTouch: VisionAttributionTouchSchema,
  conversionTouch: VisionAttributionTouchSchema,
  turnstileToken: z.string().min(1).max(4096),
  honeypot: z.string().max(0).optional()
});
export type VisionReportRequestInput = z.input<typeof VisionReportRequestSchema>;
export type VisionReportRequestParsed = z.output<typeof VisionReportRequestSchema>;
