/**
 * Attribution capture.
 *
 * Only known parameters are accepted and every value is length-bounded. An
 * unbounded pass-through of the query string is a storage and injection problem.
 */

export const ACCEPTED_ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "fbclid"
] as const;

export type AttributionParam = (typeof ACCEPTED_ATTRIBUTION_PARAMS)[number];

export type AttributionTouch = {
  landingPath: string;
  referrerHost?: string;
  occurredAt: string;
  params: Partial<Record<AttributionParam, string>>;
};

const MAX_VALUE_LENGTH = 512;
const MAX_UTM_LENGTH = 200;

function limitFor(param: AttributionParam): number {
  return param.startsWith("utm_") ? MAX_UTM_LENGTH : MAX_VALUE_LENGTH;
}

export function parseAttributionParams(
  search: URLSearchParams
): Partial<Record<AttributionParam, string>> {
  const out: Partial<Record<AttributionParam, string>> = {};
  for (const param of ACCEPTED_ATTRIBUTION_PARAMS) {
    const raw = search.get(param);
    if (raw === null) continue;
    const value = raw.trim().slice(0, limitFor(param));
    if (value.length > 0) out[param] = value;
  }
  return out;
}

/** Only the host is retained from a referrer. A full referrer URL can carry personal data. */
export function referrerHost(referrer: string | null | undefined): string | undefined {
  if (referrer === null || referrer === undefined || referrer === "") return undefined;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.host.slice(0, 255);
  } catch {
    return undefined;
  }
}

/** Path only. Query strings can contain anything a third party appended. */
export function safeLandingPath(pathname: string): string {
  const cleaned = pathname.split("?")[0]?.split("#")[0] ?? "/";
  return cleaned.startsWith("/") ? cleaned.slice(0, 512) : "/";
}

export function buildTouch(input: {
  url: URL;
  referrer?: string | null;
  occurredAt: string;
}): AttributionTouch {
  const host = referrerHost(input.referrer);
  return {
    landingPath: safeLandingPath(input.url.pathname),
    ...(host === undefined ? {} : { referrerHost: host }),
    occurredAt: input.occurredAt,
    params: parseAttributionParams(input.url.searchParams)
  };
}

export const FIRST_TOUCH_STORAGE_KEY = "tract.attribution.first";
export const LAST_TOUCH_STORAGE_KEY = "tract.attribution.last";
/** Attribution retention window. Documented in docs/security/data-classification.md. */
export const ATTRIBUTION_RETENTION_DAYS = 90;
