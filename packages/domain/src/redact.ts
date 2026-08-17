/**
 * Log and error redaction.
 *
 * Borrower contact details, tokens, prompts, and signed URLs must never reach a
 * log line, an error tracker, a screenshot, or an audit snapshot in the clear.
 */

const SENSITIVE_KEY_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|api[-_]?key|token|access[-_]?token|refresh[-_]?token|secret|password|passwd|ssn|social|dob|date[-_]?of[-_]?birth|account[-_]?number|routing|card|cvv|email|phone|phone_e164|first_name|last_name|full[-_]?name|address|street|prompt|signed[-_]?url|turnstile[-_]?token|service[-_]?role)/i;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/g;
const BEARER_PATTERN = /\b(bearer\s+)[A-Za-z0-9._~+/-]+=*/gi;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;

export const REDACTED = "[redacted]";

export function redactString(input: string): string {
  return input
    .replace(BEARER_PATTERN, `$1${REDACTED}`)
    .replace(SSN_PATTERN, REDACTED)
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(PHONE_PATTERN, REDACTED);
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return REDACTED;
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(inner, depth + 1);
    }
    return out;
  }
  return REDACTED;
}

/** Coarse user-agent family. Enough to debug, not enough to fingerprint. */
export function userAgentFamily(userAgent: string | null): string {
  if (userAgent === null || userAgent === "") return "unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) return "bot";
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome") && !ua.includes("chromium")) return "chrome";
  if (ua.includes("safari") && !ua.includes("chrome")) return "safari";
  if (ua.includes("firefox")) return "firefox";
  return "other";
}
