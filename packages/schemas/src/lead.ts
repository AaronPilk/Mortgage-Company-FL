import { z } from "zod";

/**
 * MARKETING LEAD schema.
 *
 * This is deliberately NOT a mortgage application. It does not collect, and must
 * never be extended to collect, the combination of elements that constitutes an
 * application under TRID. Sensitive borrower information belongs in the approved
 * secure POS/LOS, not in a marketing form.
 *
 * Prohibited here, permanently: Social Security number, date of birth, bank or
 * card numbers, credit report data, income documentation, or file uploads.
 */

export const FORM_CLASSIFICATION = "MARKETING_LEAD" as const;

export const LeadIntentSchema = z.enum([
  "purchase",
  "refinance",
  "investment",
  "first_time_buyer",
  "self_employed",
  "agent_partner",
  "vision_report",
  /**
   * A homeowner who wants to sell. TRACT is a mortgage brokerage, not a listing
   * brokerage — this intent exists so the owner's real-estate network can pick
   * the conversation up. Copy around it is connection/handoff framing only.
   */
  "sell_home",
  /**
   * Home equity line of credit interest. Educational conversations only — this
   * intent never carries or implies a rate, a limit, or an approval.
   */
  "heloc",
  /**
   * A consumer asking to be introduced to a real-estate agent from the
   * directory. Connection framing only — TRACT brokers mortgages, not homes.
   */
  "agent_introduction",
  "general"
]);
export type LeadIntent = z.infer<typeof LeadIntentSchema>;

export const TimelineSchema = z.enum(["now", "0_3_months", "3_6_months", "6_plus", "researching"]);

/** Self-reported band only. This is never a credit pull and must never be labeled as one. */
export const CreditBandSchema = z.enum([
  "below_580",
  "580_619",
  "620_679",
  "680_719",
  "720_759",
  "760_plus",
  "unknown"
]);

export const PreferredContactSchema = z.enum(["phone", "sms", "email"]);

const bounded = (max: number) => z.string().trim().max(max);

export const LeadSourceContextSchema = z.object({
  landingPath: bounded(512),
  referrerHost: bounded(255).optional(),
  firstTouchId: z.string().uuid().optional(),
  lastTouchId: z.string().uuid().optional(),
  gclid: bounded(512).optional(),
  gbraid: bounded(512).optional(),
  wbraid: bounded(512).optional(),
  msclkid: bounded(512).optional(),
  fbclid: bounded(512).optional(),
  utmSource: bounded(200).optional(),
  utmMedium: bounded(200).optional(),
  utmCampaign: bounded(200).optional(),
  utmContent: bounded(200).optional(),
  utmTerm: bounded(200).optional()
});
export type LeadSourceContext = z.infer<typeof LeadSourceContextSchema>;

export const LeadAttributionTouchSchema = LeadSourceContextSchema.omit({
  firstTouchId: true,
  lastTouchId: true
}).extend({
  occurredAt: z.string().datetime({ offset: true })
});
export type LeadAttributionTouch = z.infer<typeof LeadAttributionTouchSchema>;

const snapshotValue = z.union([z.string().max(300), z.number().finite(), z.boolean(), z.null()]);
const snapshotRecord = z
  .record(z.string().min(1).max(80), snapshotValue)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 40) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Snapshot has too many fields." });
    }
    const prohibited = [
      "ssn",
      "socialsecurity",
      "dateofbirth",
      "dob",
      "bankaccount",
      "routingnumber",
      "cardnumber",
      "passport",
      "driverslicense",
      "document",
      "fileupload"
    ];
    for (const key of Object.keys(value)) {
      const normalized = key.replace(/[_-]/g, "").toLowerCase();
      if (prohibited.some((entry) => normalized.includes(entry))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "This field does not belong in a marketing planning snapshot."
        });
      }
    }
  });

/**
 * A bounded, first-party planning snapshot. It deliberately allows only scalar
 * values: no documents, free-form narratives, provider payloads, or nested loan
 * application data can cross this marketing endpoint.
 */
export const PlanningSnapshotSchema = z.object({
  source: z.enum([
    "mortgage_planner",
    "mortgage_payment",
    "affordability",
    "refinance_break_even",
    "rent_vs_buy",
    "closing_cost"
  ]),
  version: z.string().min(1).max(64),
  calculationVersion: z.string().min(1).max(64),
  inputSnapshot: snapshotRecord,
  resultSnapshot: snapshotRecord,
  summary: z.string().trim().min(1).max(500)
});
export type PlanningSnapshot = z.infer<typeof PlanningSnapshotSchema>;

/**
 * Consent is modeled as two independent things: a request to be contacted about
 * this inquiry, and separate opt-ins for marketing channels. Bundling them would
 * make the marketing consent unreliable.
 */
export const ConsentSchema = z.object({
  privacyAccepted: z.literal(true),
  contactRequested: z.literal(true),
  smsMarketing: z.boolean().default(false),
  emailMarketing: z.boolean().default(false),
  disclosureVersion: z.string().min(1).max(64)
});
export type ConsentInput = z.infer<typeof ConsentSchema>;

/**
 * PROGRESSIVE PLANNER answers.
 *
 * The planner asks qualifying questions before it asks who the person is. Every
 * financial answer is a BAND, never a figure: income and debt are ranges, credit
 * is a self-reported band and never a score, and no answer here is or becomes an
 * application. The prohibitions at the top of this file apply in full — a
 * government identifier, an account number, a document, or an upload must never
 * appear in this object.
 *
 * Each band is an enum rather than free text because the database stores them as
 * checked columns that operations filters on, and a free-text column cannot be
 * filtered without first being cleaned.
 */

export const PlannerGoalSchema = z.enum([
  "purchase",
  "refinance",
  "investment",
  "land",
  "construction_renovation"
]);
export type PlannerGoal = z.infer<typeof PlannerGoalSchema>;

export const PlannerPropertyTypeSchema = z.enum([
  "single_family",
  "condo",
  "townhome",
  "multi_family_2_4",
  "manufactured",
  "land",
  "other"
]);

/** Where the consumer is in finding the property. Not a status of any kind. */
export const PlannerPropertyStageSchema = z.enum([
  "under_contract",
  "identified",
  "actively_looking",
  "early_research",
  "own_it"
]);

export const PlannerPriceBandSchema = z.enum([
  "under_200k",
  "200k_350k",
  "350k_500k",
  "500k_750k",
  "750k_1m",
  "1m_plus"
]);

/** Down payment as a share of price. A band, so no exact savings figure is collected. */
export const PlannerDownPaymentBandSchema = z.enum([
  "under_3",
  "3_5",
  "5_10",
  "10_20",
  "20_plus",
  "not_sure"
]);

export const PlannerMortgageBalanceBandSchema = z.enum([
  "under_100k",
  "100k_250k",
  "250k_500k",
  "500k_750k",
  "750k_plus",
  "not_sure"
]);

export const PlannerMortgageRateBandSchema = z.enum([
  "under_4",
  "4_5",
  "5_6",
  "6_7",
  "7_plus",
  "not_sure"
]);

export const PlannerEmploymentSchema = z.enum([
  "w2",
  "self_employed",
  "business_owner",
  "contract_1099",
  "retired",
  "other"
]);

/** Gross monthly household income, as a range. An exact figure is never collected. */
export const PlannerIncomeBandSchema = z.enum([
  "under_4k",
  "4k_6k",
  "6k_8k",
  "8k_12k",
  "12k_20k",
  "20k_plus",
  "prefer_not_to_say"
]);

/** Recurring monthly obligations, as a range. */
export const PlannerMonthlyDebtBandSchema = z.enum([
  "none",
  "under_500",
  "500_1000",
  "1000_2000",
  "2000_plus",
  "prefer_not_to_say"
]);

export const PlannerTimingSchema = z.enum([
  "immediately",
  "within_30_days",
  "60_to_90_days",
  "researching"
]);
export type PlannerTiming = z.infer<typeof PlannerTimingSchema>;

/** Version of the planner question set. Stored with the row so answers stay interpretable. */
export const PLANNER_VERSION = "lead-planner@1.0.0" as const;

export const LeadPlannerSchema = z
  .object({
    goal: PlannerGoalSchema,
    propertyState: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
    /** City or postal code. Never a street address — a property is not a person. */
    propertyLocation: bounded(80).optional(),
    propertyType: PlannerPropertyTypeSchema,
    propertyStage: PlannerPropertyStageSchema,
    priceBand: PlannerPriceBandSchema,
    downPaymentBand: PlannerDownPaymentBandSchema,
    currentMortgageBalanceBand: PlannerMortgageBalanceBandSchema.optional(),
    currentMortgageRateBand: PlannerMortgageRateBandSchema.optional(),
    creditBand: CreditBandSchema,
    employment: PlannerEmploymentSchema,
    incomeBand: PlannerIncomeBandSchema,
    monthlyDebtBand: PlannerMonthlyDebtBandSchema,
    timing: PlannerTimingSchema
  })
  .refine(
    (value) =>
      value.goal === "refinance" ||
      (value.currentMortgageBalanceBand === undefined &&
        value.currentMortgageRateBand === undefined),
    {
      // The database carries the same rule as a check constraint. Validating it
      // here too means a crafted payload gets a field error rather than a 500.
      message: "Current mortgage details apply to a refinance only.",
      path: ["currentMortgageBalanceBand"]
    }
  );
export type LeadPlannerInput = z.input<typeof LeadPlannerSchema>;
export type LeadPlannerParsed = z.output<typeof LeadPlannerSchema>;

export const CreateLeadSchema = z.object({
  submissionId: z.string().uuid(),
  intent: LeadIntentSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(7).max(32),
  preferredContact: PreferredContactSchema.optional(),
  stateCode: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .default("FL"),
  timeline: TimelineSchema.optional(),
  estimatedCreditBand: CreditBandSchema.optional(),
  /** Free-text context from the consumer. Length-bounded and never parsed as instructions. */
  message: bounded(1500).optional(),
  /**
   * Slug of the real-estate agent who referred this visitor, from a shared
   * referral link. Validated to the agent-slug shape here; the server re-checks
   * it against the public directory before it is trusted, so a bogus code can
   * never fabricate an attribution.
   */
  referringAgentSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{1,80}$/)
    .optional(),
  planningSnapshot: PlanningSnapshotSchema.optional(),
  consent: ConsentSchema,
  firstTouch: LeadAttributionTouchSchema,
  lastTouch: LeadAttributionTouchSchema,
  conversionTouch: LeadAttributionTouchSchema,
  /**
   * Progressive planner answers. Optional, so the single-page contact form
   * submits exactly the payload it always has and keeps validating unchanged.
   */
  planner: LeadPlannerSchema.optional(),
  turnstileToken: z.string().min(1).max(4096),
  /** Must arrive empty. A populated value is a bot signal. */
  honeypot: z.string().max(0).optional()
});
export type CreateLeadInput = z.input<typeof CreateLeadSchema>;
export type CreateLeadParsed = z.output<typeof CreateLeadSchema>;

export const LeadReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  receivedAt: z.string(),
  intent: LeadIntentSchema,
  /** What the consumer should expect next. Never a status that implies credit approval. */
  nextStep: z.enum(["human_follow_up", "secure_application", "report_queued"])
});
export type LeadReceipt = z.infer<typeof LeadReceiptSchema>;

/**
 * Status values a marketing system is allowed to set. Anything implying a credit
 * decision — preapproved, approved, locked, clear to close, denied, funded —
 * originates only in the approved POS/LOS and is intentionally absent here.
 */
export const MarketingLeadStatusSchema = z.enum([
  "new",
  "queued",
  "synced",
  "contacted",
  "qualified",
  "application_invited",
  "suppressed",
  "closed",
  "error"
]);
export type MarketingLeadStatus = z.infer<typeof MarketingLeadStatusSchema>;
