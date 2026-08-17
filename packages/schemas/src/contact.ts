/**
 * Contact normalization. Deterministic so that deduplication, suppression, and
 * consent lookups agree across the application, the CRM projection, and tests.
 */

export type NormalizedContact = {
  emailNormalized: string;
  phoneE164: string;
};

export class ContactNormalizationError extends Error {}

/**
 * Lowercase and trim. Deliberately does NOT strip gmail dots or plus-tags:
 * treating two addresses the consumer considers distinct as one identity causes
 * real suppression and consent errors.
 */
export function normalizeEmail(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ContactNormalizationError("email is not a valid address");
  }
  return value;
}

/**
 * North American Numbering Plan normalization to E.164. Non-NANP numbers must be
 * supplied already in +country format; guessing a country code is worse than
 * rejecting, because a wrong country code sends an SMS to a stranger.
 */
export function normalizePhoneE164(raw: string, defaultCountry: "US" = "US"): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      throw new ContactNormalizationError("phone number length is out of range");
    }
    return `+${digits}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (defaultCountry === "US") {
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (digits.length === 10) {
      const areaCode = digits.slice(0, 3);
      const exchange = digits.slice(3, 6);
      if (areaCode.startsWith("0") || areaCode.startsWith("1")) {
        throw new ContactNormalizationError("area code is not valid");
      }
      if (exchange.startsWith("0") || exchange.startsWith("1")) {
        throw new ContactNormalizationError("exchange code is not valid");
      }
      return `+1${digits}`;
    }
  }
  throw new ContactNormalizationError("phone number is not a recognized format");
}

export function normalizeContact(email: string, phone: string): NormalizedContact {
  return { emailNormalized: normalizeEmail(email), phoneE164: normalizePhoneE164(phone) };
}

/** Display helper. Never used for storage, matching, or transmission. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const head = local.slice(0, 1);
  return `${head}${"•".repeat(Math.max(1, local.length - 1))}@${domain}`;
}

export function maskPhone(phoneE164: string): string {
  return `${"•".repeat(Math.max(0, phoneE164.length - 4))}${phoneE164.slice(-4)}`;
}
