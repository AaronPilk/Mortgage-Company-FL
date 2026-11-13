/**
 * CRM port.
 *
 * GoHighLevel is the marketing lifecycle layer. It is a projection of application
 * truth, never the system of record. The payload shape below is the complete set
 * of fields permitted to leave the application for the CRM — anything not listed
 * here does not go, including calculator detail, report narrative, property media,
 * government identifiers, financial account data, and loan documents.
 */

export type CrmLead = {
  /** Our receipt id. Lets us reconcile without exposing a database primary key. */
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  intent: string;
  timeline?: string;
  sourcePath: string;
  tags: string[];
  /** Slug of the consenting partner agent who referred the lead, resolved server-side. Marketing attribution only. */
  referringAgentSlug?: string;
  /** Approved concise context only; never raw income, debt, credit, or report narrative. */
  planningSummary?: string;
  /**
   * Planner qualifying answers, present only on planner and deep-funnel leads.
   * Bands only — a self-reported credit band, income and debt ranges, a price
   * band — never an exact figure and never a credit score. The payload screen
   * (assertCrmPayloadSafe) still runs over this, so a prohibited key here throws
   * rather than ships.
   */
  planner?: {
    goal?: string;
    propertyType?: string;
    propertyStage?: string;
    propertyLocation?: string | null;
    priceBand?: string;
    downPaymentBand?: string;
    creditBand?: string;
    employment?: string;
    incomeBand?: string;
    monthlyDebtBand?: string;
    currentMortgageBalanceBand?: string | null;
    currentMortgageRateBand?: string | null;
    timing?: string;
  };
  consent: {
    smsMarketing: boolean;
    emailMarketing: boolean;
    disclosureVersion: string;
    receivedAtIso: string;
  };
  attribution: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    gclid?: string;
    gbraid?: string;
    wbraid?: string;
  };
};

export type CrmSyncResult = {
  provider: "ghl" | "fixture" | "disabled";
  contactId: string;
  created: boolean;
  requestId?: string;
};

export type CrmHealth = {
  ok: boolean;
  mode: string;
  detail: string;
  checkedAt: string;
};

export interface CrmPort {
  readonly key: string;
  upsertLead(input: CrmLead, idempotencyKey: string): Promise<CrmSyncResult>;
  addOpportunity(
    input: {
      contactId: string;
      pipelineKey: string;
      stageKey: string;
      monetaryValueCents?: number;
    },
    idempotencyKey: string
  ): Promise<{ opportunityId: string }>;
  recordNote(input: { contactId: string; body: string }, idempotencyKey: string): Promise<void>;
  health(): Promise<CrmHealth>;
}

/**
 * Fields that must never be written to a CRM custom field. Enforced by
 * `assertCrmPayloadSafe` and covered by a unit test.
 */
export const CRM_PROHIBITED_KEYS = [
  "ssn",
  "socialSecurityNumber",
  "taxId",
  "dateOfBirth",
  "dob",
  "creditScore",
  "creditReport",
  "bankAccount",
  "routingNumber",
  "cardNumber",
  "income",
  "monthlyIncome",
  "annualIncome",
  "assets",
  "payStub",
  "w2",
  "taxReturn",
  "bankStatement",
  "ausFindings",
  "appraisal",
  "underwritingConditions",
  "loanDocuments",
  "password",
  "portalCredentials",
  "prompt",
  "reportNarrative"
] as const;

export class CrmPayloadError extends Error {}

export function assertCrmPayloadSafe(payload: Record<string, unknown>): void {
  const walk = (value: unknown, path: string[], depth: number): void => {
    if (depth > 6 || value === null || typeof value !== "object") return;
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      const normalized = key.replace(/[_-]/g, "").toLowerCase();
      const violation = CRM_PROHIBITED_KEYS.find(
        (prohibited) => prohibited.replace(/[_-]/g, "").toLowerCase() === normalized
      );
      if (violation !== undefined) {
        throw new CrmPayloadError(
          `field "${[...path, key].join(".")}" may not be sent to the marketing CRM`
        );
      }
      walk(inner, [...path, key], depth + 1);
    }
  };
  walk(payload, [], 0);
}

/** Retry classification. Only these outcomes are retried; a 4xx is terminal. */
export type FailureClass = "retryable" | "terminal" | "rate_limited";

export function classifyHttpFailure(status: number): FailureClass {
  if (status === 429) return "rate_limited";
  if (status >= 500) return "retryable";
  if (status === 408 || status === 425) return "retryable";
  return "terminal";
}

/** Bounded exponential backoff with full jitter. Deterministic when a rng is supplied. */
export function backoffMs(attempt: number, rng: () => number = Math.random): number {
  const base = Math.min(2 ** attempt * 1000, 5 * 60 * 1000);
  return Math.floor(base / 2 + rng() * (base / 2));
}
