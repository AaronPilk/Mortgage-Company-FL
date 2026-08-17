import type { AnalyticsEvent } from "./events";
import { ALLOWED_EVENT_NAMES } from "./events";

/**
 * A hard guard between the product and every analytics destination.
 *
 * Nothing here is advisory. If a prohibited key or a value that looks like
 * personal data reaches this function, it throws in development and test and
 * drops the event in production. A dropped metric is recoverable; borrower data
 * sent to an ad platform is not.
 */

export const PROHIBITED_PARAM_KEYS = [
  "email",
  "email_address",
  "phone",
  "phone_number",
  "first_name",
  "last_name",
  "name",
  "full_name",
  "address",
  "street",
  "street_address",
  "ssn",
  "social_security_number",
  "dob",
  "date_of_birth",
  "income",
  "annual_income",
  "monthly_income",
  "credit_score",
  "credit_band",
  "debt",
  "loan_amount_actual",
  "account_number",
  "bank",
  "denial_reason",
  "adverse_action",
  "race",
  "ethnicity",
  "gender",
  "religion",
  "marital_status",
  "familial_status",
  "disability",
  "national_origin",
  "prompt",
  "report_narrative",
  "token",
  "access_token",
  "api_key",
  "user_id",
  "lead_id",
  "contact_id"
] as const;

const VALUE_LOOKS_LIKE_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const VALUE_LOOKS_LIKE_PHONE = /\+?\d[\d\s().-]{8,}\d/;
const VALUE_LOOKS_LIKE_SSN = /\b\d{3}-?\d{2}-?\d{4}\b/;

export class AnalyticsPolicyError extends Error {}

export type GuardResult = { ok: true } | { ok: false; reason: string };

export function inspectEvent(event: AnalyticsEvent): GuardResult {
  if (!ALLOWED_EVENT_NAMES.includes(event.name)) {
    return { ok: false, reason: `event "${String(event.name)}" is not in the approved vocabulary` };
  }

  for (const [key, value] of Object.entries(event)) {
    if (key === "name") continue;

    const normalizedKey = key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    if ((PROHIBITED_PARAM_KEYS as readonly string[]).includes(normalizedKey)) {
      return { ok: false, reason: `parameter "${key}" is prohibited in analytics payloads` };
    }

    if (typeof value === "string") {
      if (VALUE_LOOKS_LIKE_EMAIL.test(value)) {
        return {
          ok: false,
          reason: `parameter "${key}" contains what looks like an email address`
        };
      }
      if (VALUE_LOOKS_LIKE_PHONE.test(value)) {
        return { ok: false, reason: `parameter "${key}" contains what looks like a phone number` };
      }
      if (VALUE_LOOKS_LIKE_SSN.test(value)) {
        return { ok: false, reason: `parameter "${key}" contains what looks like a government id` };
      }
      if (value.length > 200) {
        return { ok: false, reason: `parameter "${key}" exceeds the 200 character limit` };
      }
    }
  }

  return { ok: true };
}

/**
 * `leadReceiptId` is intentionally permitted: it is a server-issued, opaque
 * receipt used for conversion deduplication. It is not a database primary key
 * and cannot be used to look up a person from outside the application.
 */
export function assertSendable(event: AnalyticsEvent, mode: "throw" | "drop"): boolean {
  const result = inspectEvent(event);
  if (result.ok) return true;
  if (mode === "throw") throw new AnalyticsPolicyError(result.reason);
  return false;
}
