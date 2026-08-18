import {
  LISTING_SORTS,
  PROPERTY_TYPE_OPTIONS,
  PUBLIC_STATUS_OPTIONS,
  type ListingSort,
  type PropertyTypeOption
} from "@tract/integrations";
import { dollarsToCents, formatUsd } from "@tract/mortgage-math";
import { parseCriteria, type PropertySearchCriteria } from "./criteria";

/**
 * Natural language → search criteria.
 *
 * Two producers share this module. The deterministic parser below is the
 * baseline: it works with AI_MODE=disabled, it is the fallback when a provider
 * errors or times out, and it is what the fixture AI provider answers with, so
 * every mode of the feature agrees on what a phrase means. The extraction tool
 * schema is what the real provider is constrained to — its enums are the same
 * closed sets the URL schema enforces, so a model cannot invent a property type
 * or a status that the rest of the pipeline would have to trust.
 *
 * Everything funnels through `PropertySearchQuerySchema` (via `parseCriteria`)
 * before it reaches a provider or a URL. Neither the model output nor this
 * parser is an authority on validity; the existing schema is.
 */

/** Cities present in the fixture catalogue, in display casing. */
export const KNOWN_CITIES = [
  "St. Petersburg",
  "Tampa",
  "Orlando",
  "Jacksonville",
  "Miami",
  "Sarasota"
] as const;

type KnownStatus = (typeof PUBLIC_STATUS_OPTIONS)[number];

export type InterpretedQuery = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  type?: PropertyTypeOption[];
  status?: KnownStatus[];
  sort?: ListingSort;
};

/* ---------------------------------------------------------------- *
 * Deterministic parser
 * ---------------------------------------------------------------- */

const CITY_PATTERNS: readonly [RegExp, (typeof KNOWN_CITIES)[number]][] = [
  [/\b(?:st\.?|saint)\s*pete(?:rsburg)?\b/, "St. Petersburg"],
  [/\btampa\b/, "Tampa"],
  [/\borlando\b/, "Orlando"],
  [/\bjacksonville\b/, "Jacksonville"],
  [/\bmiami\b/, "Miami"],
  [/\bsarasota\b/, "Sarasota"]
];

const TYPE_PATTERNS: readonly [RegExp, PropertyTypeOption][] = [
  [/\bcondo(?:minium)?s?\b/, "Condominium"],
  [/\btown\s?(?:house|home)s?\b/, "Townhouse"],
  [/\bduplex(?:es)?\b/, "Duplex"],
  [/\b(?:single[\s-]?family|houses?)\b/, "Single Family Residence"],
  [/\b(?:residential\s+)?lots?\b/, "Residential Lot"],
  [/\b(?:land|acreage|parcels?)\b/, "Land"]
];

const WORD_NUMBERS: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10"
};

/** A money amount: "$450,000", "500k", "1.2m", "half a million" is out of scope. */
const MONEY_SOURCE = String.raw`\$?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|m|mm|million|thousand|grand)?`;

const MAX_PRICE_DOLLARS = 50_000_000;

function toDollars(digits: string, suffix: string | undefined): number | undefined {
  const base = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(base)) return undefined;
  const unit = (suffix ?? "").toLowerCase();
  const value =
    unit === "k" || unit === "thousand" || unit === "grand"
      ? base * 1_000
      : unit === "m" || unit === "mm" || unit === "million"
        ? base * 1_000_000
        : base;
  const rounded = Math.round(value);
  if (rounded <= 0 || rounded > MAX_PRICE_DOLLARS) return undefined;
  return rounded;
}

/**
 * A bare number only counts as money when it is unambiguous about being money:
 * a $ sign, a magnitude suffix, or at least five digits that are not shaped
 * like a Florida ZIP code. "3" in "3 bed" must never become a price.
 */
function bareMoney(match: RegExpMatchArray): number | undefined {
  const [whole, digits, suffix] = match;
  const hasSign = whole.includes("$");
  const hasSuffix = suffix !== undefined && suffix !== "";
  const plain = (digits ?? "").replace(/,/g, "");
  if (!hasSign && !hasSuffix) {
    if (plain.length < 5) return undefined;
    if (/^3[234]\d{3}$/.test(plain)) return undefined; // a Florida ZIP, not a price
  }
  return toDollars(digits ?? "", suffix);
}

const clampInt = (value: number, max: number) => Math.min(Math.max(Math.round(value), 0), max);

/**
 * Free text → criteria. Pure, deterministic, and total: garbage in produces an
 * empty object, never a throw. Concepts the search cannot filter by — pool,
 * waterfront, garage — are ignored rather than guessed at.
 */
export function parseNaturalQuery(text: string): InterpretedQuery {
  if (typeof text !== "string") return {};
  const out: InterpretedQuery = {};

  let t = ` ${text.slice(0, 300).toLowerCase()} `
    .replace(/[^\p{L}\p{N}$.,+\-']/gu, " ")
    .replace(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g,
      (w) => WORD_NUMBERS[w] ?? w
    );

  const consume = (match: RegExpMatchArray): void => {
    if (match.index !== undefined) {
      t = `${t.slice(0, match.index)} ${" ".repeat(match[0].length)} ${t.slice(match.index + match[0].length)}`;
    }
  };

  // Price range first, because "between 300 and 400k" contains two numbers the
  // simpler patterns would misread. A suffix on only the second number is
  // spoken shorthand for both ("between 300 and 400k" means 300k–400k).
  const between = t.match(
    new RegExp(String.raw`(?:between|from)\s+${MONEY_SOURCE}\s+(?:and|to|[-–])\s+${MONEY_SOURCE}`)
  );
  if (between !== null) {
    const [, minDigits, minSuffixRaw, maxDigits, maxSuffix] = between;
    const minSuffix =
      (minSuffixRaw === undefined || minSuffixRaw === "") &&
      Number((minDigits ?? "").replace(/,/g, "")) < 10_000
        ? maxSuffix
        : minSuffixRaw;
    const min = toDollars(minDigits ?? "", minSuffix);
    const max = toDollars(maxDigits ?? "", maxSuffix);
    if (min !== undefined) out.minPrice = min;
    if (max !== undefined) out.maxPrice = max;
    consume(between);
  }

  const under = t.match(
    new RegExp(
      String.raw`(?:under|below|less\s+than|at\s+most|up\s+to|max(?:imum)?(?:\s+of)?|no\s+more\s+than)\s+${MONEY_SOURCE}`
    )
  );
  if (under !== null && out.maxPrice === undefined) {
    const value = toDollars(under[1] ?? "", under[2]);
    if (value !== undefined) {
      out.maxPrice = value;
      consume(under);
    }
  }

  const over = t.match(
    new RegExp(
      String.raw`(?:over|above|more\s+than|at\s+least|min(?:imum)?(?:\s+of)?|starting\s+at|upwards\s+of)\s+${MONEY_SOURCE}`
    )
  );
  if (over !== null && out.minPrice === undefined) {
    const value = toDollars(over[1] ?? "", over[2]);
    if (value !== undefined) {
      out.minPrice = value;
      consume(over);
    }
  }

  // Bed and bath counts before bare money, so their digits are spoken for.
  const beds = t.match(/(\d+)\s*\+?\s*(?:bed(?:room)?s?|br|bd)\b/);
  if (beds !== null) {
    out.beds = clampInt(Number(beds[1]), 6);
    consume(beds);
  }
  const baths = t.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:bath(?:room)?s?|ba)\b/);
  if (baths !== null) {
    const value = Number(baths[1]);
    if (Number.isFinite(value)) {
      out.baths = Math.min(Math.max(value, 0), 6);
      consume(baths);
    }
  }

  // Whatever money-shaped values remain: one is a ceiling ("3 beds, 500k"),
  // two are a range.
  if (out.minPrice === undefined || out.maxPrice === undefined) {
    const amounts: number[] = [];
    for (const match of t.matchAll(new RegExp(MONEY_SOURCE, "g"))) {
      const value = bareMoney(match);
      if (value !== undefined) amounts.push(value);
    }
    const [first, second] = amounts;
    if (out.minPrice === undefined && out.maxPrice === undefined && first !== undefined) {
      if (second === undefined) {
        out.maxPrice = first;
      } else {
        out.minPrice = Math.min(first, second);
        out.maxPrice = Math.max(first, second);
      }
    }
  }
  if (out.minPrice !== undefined && out.maxPrice !== undefined && out.minPrice > out.maxPrice) {
    [out.minPrice, out.maxPrice] = [out.maxPrice, out.minPrice];
  }

  // Place: a known city wins; otherwise a Florida-shaped ZIP that survived the
  // money passes.
  for (const [pattern, city] of CITY_PATTERNS) {
    if (pattern.test(t)) {
      out.q = city;
      break;
    }
  }
  if (out.q === undefined) {
    const zip = t.match(/\b(3[234]\d{3})\b/);
    if (zip !== null) out.q = zip[1] as string;
  }

  const types = TYPE_PATTERNS.filter(([pattern]) => pattern.test(t)).map(([, option]) => option);
  if (types.length > 0) {
    out.type = [...new Set(types)];
  }

  const statuses: KnownStatus[] = [];
  if (/\bcoming\s+soon\b/.test(t)) statuses.push("coming_soon");
  if (/\bpending\b/.test(t)) statuses.push("pending");
  if (/\bactive\b/.test(t)) statuses.push("active");
  if (statuses.length > 0) out.status = statuses;

  if (/\b(?:cheapest|lowest\s+price|least\s+expensive)\b/.test(t)) out.sort = "price_asc";
  else if (/\b(?:most\s+expensive|highest\s+price)\b/.test(t)) out.sort = "price_desc";
  else if (/\b(?:biggest|largest|most\s+space)\b/.test(t)) out.sort = "sqft_desc";

  return out;
}

/* ---------------------------------------------------------------- *
 * Shared validation boundary
 * ---------------------------------------------------------------- */

/**
 * Interpreted values → the raw record `PropertySearchQuerySchema` accepts. One
 * boundary for both producers, so the model output and the rule parser face the
 * same validator the URL faces.
 */
export function interpretedToRaw(interpreted: InterpretedQuery): Record<string, string | string[]> {
  const raw: Record<string, string | string[]> = {};
  if (interpreted.q !== undefined) raw.q = interpreted.q;
  if (interpreted.minPrice !== undefined) raw.minPrice = String(interpreted.minPrice);
  if (interpreted.maxPrice !== undefined) raw.maxPrice = String(interpreted.maxPrice);
  if (interpreted.beds !== undefined) raw.beds = String(interpreted.beds);
  if (interpreted.baths !== undefined) raw.baths = String(interpreted.baths);
  if (interpreted.type !== undefined && interpreted.type.length > 0) raw.type = interpreted.type;
  if (interpreted.status !== undefined && interpreted.status.length > 0) {
    raw.status = interpreted.status;
  }
  if (interpreted.sort !== undefined) raw.sort = interpreted.sort;
  return raw;
}

export function interpretedToCriteria(interpreted: InterpretedQuery): PropertySearchCriteria {
  return parseCriteria(interpretedToRaw(interpreted)).criteria;
}

/* ---------------------------------------------------------------- *
 * Extraction tool contract for the AI provider
 * ---------------------------------------------------------------- */

export const EXTRACTION_TOOL = {
  name: "property_search_criteria",
  description:
    "Record the structured property-search criteria a home shopper expressed. " +
    "Omit any field the shopper did not state. Never guess.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      city: { type: "string", enum: [...KNOWN_CITIES] },
      postalCode: { type: "string", pattern: "^3[234][0-9]{3}$" },
      minPriceDollars: { type: "integer", minimum: 0, maximum: MAX_PRICE_DOLLARS },
      maxPriceDollars: { type: "integer", minimum: 0, maximum: MAX_PRICE_DOLLARS },
      minBeds: { type: "integer", minimum: 0, maximum: 6 },
      minBaths: { type: "number", minimum: 0, maximum: 6 },
      propertyTypes: {
        type: "array",
        maxItems: 6,
        items: { type: "string", enum: [...PROPERTY_TYPE_OPTIONS] }
      },
      statuses: {
        type: "array",
        maxItems: 3,
        items: { type: "string", enum: [...PUBLIC_STATUS_OPTIONS] }
      },
      sort: { type: "string", enum: [...LISTING_SORTS] }
    }
  } as Record<string, unknown>
} as const;

export const EXTRACTION_SYSTEM_PROMPT =
  "You convert a home shopper's free-text description into structured search criteria " +
  "for a small Florida property catalogue. Use only what the shopper actually said. " +
  "Ignore concepts the schema cannot express (pools, waterfront, school districts) " +
  "rather than approximating them. Prices are US dollars; interpret shorthand like " +
  '"500k" or "1.2m". "St. Pete" means St. Petersburg. If nothing usable was said, ' +
  "return an empty object.";

/**
 * Model output → interpreted values. Untrusted input: anything malformed is
 * dropped field by field, and `null` (the adapter's "no tool call came back")
 * yields nothing rather than a throw.
 */
export function extractionToInterpreted(output: unknown): InterpretedQuery {
  if (typeof output !== "object" || output === null) return {};
  const record = output as Record<string, unknown>;
  const out: InterpretedQuery = {};

  const str = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  const num = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

  const city = str(record.city);
  const postal = str(record.postalCode);
  if (city !== undefined && (KNOWN_CITIES as readonly string[]).includes(city)) out.q = city;
  else if (postal !== undefined && /^3[234]\d{3}$/.test(postal)) out.q = postal;

  const min = num(record.minPriceDollars);
  const max = num(record.maxPriceDollars);
  if (min !== undefined && min > 0 && min <= MAX_PRICE_DOLLARS) out.minPrice = Math.round(min);
  if (max !== undefined && max > 0 && max <= MAX_PRICE_DOLLARS) out.maxPrice = Math.round(max);
  if (out.minPrice !== undefined && out.maxPrice !== undefined && out.minPrice > out.maxPrice) {
    [out.minPrice, out.maxPrice] = [out.maxPrice, out.minPrice];
  }

  const beds = num(record.minBeds);
  if (beds !== undefined) out.beds = clampInt(beds, 6);
  const baths = num(record.minBaths);
  if (baths !== undefined) out.baths = Math.min(baths, 6);

  if (Array.isArray(record.propertyTypes)) {
    const types = record.propertyTypes.filter((value): value is PropertyTypeOption =>
      (PROPERTY_TYPE_OPTIONS as readonly string[]).includes(value as string)
    );
    if (types.length > 0) out.type = [...new Set(types)];
  }
  if (Array.isArray(record.statuses)) {
    const statuses = record.statuses.filter((value): value is KnownStatus =>
      (PUBLIC_STATUS_OPTIONS as readonly string[]).includes(value as string)
    );
    if (statuses.length > 0) out.status = [...new Set(statuses)];
  }
  const sort = str(record.sort);
  if (sort !== undefined && (LISTING_SORTS as readonly string[]).includes(sort)) {
    out.sort = sort as ListingSort;
  }
  return out;
}

/** The fixture provider's deterministic answer, shaped like the real tool output. */
export function interpretedToExtraction(interpreted: InterpretedQuery): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (interpreted.q !== undefined) {
    if ((KNOWN_CITIES as readonly string[]).includes(interpreted.q)) out.city = interpreted.q;
    else out.postalCode = interpreted.q;
  }
  if (interpreted.minPrice !== undefined) out.minPriceDollars = interpreted.minPrice;
  if (interpreted.maxPrice !== undefined) out.maxPriceDollars = interpreted.maxPrice;
  if (interpreted.beds !== undefined) out.minBeds = interpreted.beds;
  if (interpreted.baths !== undefined) out.minBaths = interpreted.baths;
  if (interpreted.type !== undefined) out.propertyTypes = interpreted.type;
  if (interpreted.status !== undefined) out.statuses = interpreted.status;
  if (interpreted.sort !== undefined) out.sort = interpreted.sort;
  return out;
}

/* ---------------------------------------------------------------- *
 * Human-readable restatement
 * ---------------------------------------------------------------- */

const STATUS_ECHO: Record<KnownStatus, string> = {
  active: "active",
  coming_soon: "coming soon",
  pending: "pending"
};

const TYPE_ECHO: Record<PropertyTypeOption, string> = {
  "Single Family Residence": "houses",
  Condominium: "condos",
  Townhouse: "townhouses",
  Duplex: "duplexes",
  "Residential Lot": "lots",
  Land: "land"
};

const echoDollars = (dollars: number): string => formatUsd(dollarsToCents(dollars));

/**
 * Restates validated criteria — never the raw query — as one line: "3+ beds,
 * 2+ baths condos in St. Petersburg under $500,000".
 */
export function describeCriteria(criteria: PropertySearchCriteria): string {
  const parts: string[] = [];
  if (criteria.beds !== undefined) parts.push(`${criteria.beds}+ beds`);
  if (criteria.baths !== undefined) parts.push(`${criteria.baths}+ baths`);

  const types = criteria.type.map((option) => TYPE_ECHO[option]).join(" or ");
  const subject = types !== "" ? types : "listings";
  const lead = parts.length > 0 ? `${parts.join(", ")} ${subject}` : subject;

  const clauses: string[] = [lead];
  if (criteria.q !== undefined) clauses.push(`in ${criteria.q}`);
  if (criteria.minPrice !== undefined && criteria.maxPrice !== undefined) {
    clauses.push(`${echoDollars(criteria.minPrice)}–${echoDollars(criteria.maxPrice)}`);
  } else if (criteria.maxPrice !== undefined) {
    clauses.push(`under ${echoDollars(criteria.maxPrice)}`);
  } else if (criteria.minPrice !== undefined) {
    clauses.push(`over ${echoDollars(criteria.minPrice)}`);
  }
  if (criteria.status.length > 0) {
    clauses.push(`(${criteria.status.map((status) => STATUS_ECHO[status]).join(", ")})`);
  }

  const sentence = clauses.join(" ");
  if (sentence === "listings") return "All sample listings";
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
