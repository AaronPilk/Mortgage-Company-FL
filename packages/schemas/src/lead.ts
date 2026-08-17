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
  planningSnapshot: PlanningSnapshotSchema.optional(),
  consent: ConsentSchema,
  firstTouch: LeadAttributionTouchSchema,
  lastTouch: LeadAttributionTouchSchema,
  conversionTouch: LeadAttributionTouchSchema,
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
