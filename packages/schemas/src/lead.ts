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
  consent: ConsentSchema,
  attribution: LeadSourceContextSchema,
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
