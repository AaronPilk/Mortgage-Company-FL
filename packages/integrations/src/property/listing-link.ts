/**
 * Address extraction from a pasted listing link.
 *
 * A listing URL carries its address in the path — `zillow.com/homedetails/
 * 123-Main-St-Tampa-FL-33607/...`. Reading that address is parsing a string the
 * visitor handed us; it never fetches the page, so it does not scrape the site
 * or trip its bot defences. The address is only ever a prefill: the visitor
 * confirms it before any lookup runs, which also absorbs the imperfect
 * street/city split below.
 *
 * Pure and dependency-free on purpose — it is the unit-tested spec for what a
 * given link yields.
 */

export type ParsedListingAddress = {
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

export type ListingLinkHost = "zillow" | "redfin" | "realtor" | "trulia" | "homes" | "other";

export type ListingLinkResult = {
  host: ListingLinkHost;
  address: ParsedListingAddress;
};

/** Street-type tokens, lowercased and de-punctuated. The first one marks where a street ends and a city begins. */
const STREET_SUFFIXES = new Set([
  "st",
  "street",
  "ave",
  "avenue",
  "blvd",
  "boulevard",
  "dr",
  "drive",
  "rd",
  "road",
  "ln",
  "lane",
  "ct",
  "court",
  "way",
  "pl",
  "place",
  "ter",
  "terrace",
  "cir",
  "circle",
  "trl",
  "trail",
  "pkwy",
  "parkway",
  "hwy",
  "highway",
  "sq",
  "square",
  "loop",
  "run",
  "pass",
  "path",
  "row",
  "walk",
  "cove",
  "cv",
  "bnd",
  "bend",
  "pt",
  "point",
  "xing",
  "crossing",
  "pike",
  "plaza",
  "aly",
  "alley",
  "expy"
]);

/** A directional immediately after the street suffix belongs to the street ("4th Ave N"), not the city. */
const DIRECTIONALS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);

const US_STATES = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC"
]);

function titleCase(token: string): string {
  if (token.length === 0) return token;
  // Preserve all-caps directionals/ordinals as written where short; otherwise Title Case.
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function humanize(tokens: string[]): string {
  return tokens.map(titleCase).join(" ").trim();
}

/**
 * Split dash-joined `[street..., city..., ST, ZIP]` into fields. The street and
 * city have no delimiter between them, so the FIRST street-suffix token (past
 * position 0) is taken as the street's end — which keeps "St Petersburg"-style
 * cities intact, since the real street suffix precedes the city.
 */
function parseDashSlug(slug: string): ParsedListingAddress {
  const tokens = slug.split("-").filter((t) => t.length > 0);
  if (tokens.length === 0) return {};

  const address: ParsedListingAddress = {};
  let end = tokens.length;

  const last = tokens[end - 1];
  if (last !== undefined && /^\d{5}$/.test(last)) {
    address.postalCode = last;
    end -= 1;
  }
  const maybeState = tokens[end - 1];
  if (maybeState !== undefined && US_STATES.has(maybeState.toUpperCase())) {
    address.state = maybeState.toUpperCase();
    end -= 1;
  }

  const rest = tokens.slice(0, end);
  if (rest.length === 0) return address;

  let suffixIndex = -1;
  for (let i = 1; i < rest.length; i += 1) {
    const token = rest[i];
    if (token !== undefined && STREET_SUFFIXES.has(token.toLowerCase())) {
      suffixIndex = i;
      break;
    }
  }

  if (suffixIndex === -1 || suffixIndex === rest.length - 1) {
    address.line1 = humanize(rest);
  } else {
    let streetEnd = suffixIndex;
    const afterSuffix = rest[suffixIndex + 1];
    // Absorb a directional right after the suffix into the street, but only when
    // a city token still remains after it.
    if (
      afterSuffix !== undefined &&
      DIRECTIONALS.has(afterSuffix.toLowerCase()) &&
      suffixIndex + 1 < rest.length - 1
    ) {
      streetEnd = suffixIndex + 1;
    }
    address.line1 = humanize(rest.slice(0, streetEnd + 1));
    address.city = humanize(rest.slice(streetEnd + 1));
  }
  return address;
}

function classifyHost(hostname: string): ListingLinkHost {
  const h = hostname.replace(/^www\./, "").toLowerCase();
  if (h.includes("zillow.")) return "zillow";
  if (h.includes("redfin.")) return "redfin";
  if (h.includes("realtor.")) return "realtor";
  if (h.includes("trulia.")) return "trulia";
  if (h.includes("homes.")) return "homes";
  return "other";
}

export function looksLikeUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw.trim());
}

export function parseListingLink(raw: string): ListingLinkResult | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = classifyHost(url.hostname);
  const segments = url.pathname.split("/").filter((s) => s.length > 0);

  // Realtor encodes fields with underscores: `123-Main-St_Tampa_FL_33607_M...`.
  if (host === "realtor") {
    const detail = segments.find((s) => s.includes("_") && /\d{5}/.test(s));
    if (detail !== undefined) {
      const parts = detail.split("_");
      const address: ParsedListingAddress = {};
      const [street, city, state, zip] = parts;
      if (street !== undefined) address.line1 = humanize(street.split("-"));
      if (city !== undefined && !/^\d/.test(city)) address.city = humanize(city.split("-"));
      if (state !== undefined && US_STATES.has(state.toUpperCase()))
        address.state = state.toUpperCase();
      if (zip !== undefined && /^\d{5}$/.test(zip)) address.postalCode = zip;
      return { host, address };
    }
  }

  // Redfin puts state and city in their own path segments: `/FL/Tampa/123-Main-St-33607/home/ID`.
  if (host === "redfin" && segments.length >= 3) {
    const [state, city, streetZip] = segments;
    const address: ParsedListingAddress = {};
    if (state !== undefined && US_STATES.has(state.toUpperCase()))
      address.state = state.toUpperCase();
    if (city !== undefined) address.city = humanize(city.split("-"));
    if (streetZip !== undefined) {
      const t = streetZip.split("-").filter((x) => x.length > 0);
      const tail = t[t.length - 1];
      if (tail !== undefined && /^\d{5}$/.test(tail)) {
        address.postalCode = tail;
        address.line1 = humanize(t.slice(0, -1));
      } else {
        address.line1 = humanize(t);
      }
    }
    return { host, address };
  }

  // Zillow, homes.com, and most others carry a single dash-joined slug.
  const slug =
    segments.find((s) => /-[a-z]{2}-\d{5}$/i.test(s)) ??
    segments.find((s) => /\d{5}/.test(s) && s.includes("-"));
  if (slug !== undefined) return { host, address: parseDashSlug(slug) };

  return { host, address: {} };
}
