import { sourced } from "@tract/domain";
import type { SourcedValue } from "@tract/domain";
import {
  type Address,
  type FloodFacts,
  type FloodPort,
  type PropertyFacts,
  type PropertyFactsPort,
  makeProvenance
} from "./ports";

/**
 * Property-facts adapters.
 *
 * `Disabled` is the default: no provider, no guess, `null`. `Attom` is the real
 * one, against ATTOM's licensed property API. There is no "paste a Zillow link
 * and scrape it" path anywhere — the address is the key, and a licensed record
 * provider answers it. Scraping a listing site would break its terms and its
 * bot defences; this does not touch one.
 */

export class DisabledPropertyFactsPort implements PropertyFactsPort {
  readonly key = "disabled";
  async lookup(): Promise<SourcedValue<PropertyFacts> | null> {
    return null;
  }
}

export type AttomConfig = {
  apiKey: string;
  /** Defaults to the public ATTOM base. Overridable for a sandbox or a proxy. */
  baseUrl?: string;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/** The 4xx/5xx surface. The route maps this to a generic outage — the caller never sees a provider body. */
export class AttomApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "AttomApiError";
  }
}

export class AttomTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttomTimeoutError";
  }
}

/*
 * Minimal views of the two ATTOM responses we read. Every field is optional:
 * coverage varies by county and property, and a missing field is a gap to
 * report, never a value to invent. Field paths follow
 * api.developer.attomdata.com; verify against a live response when the key is
 * provisioned (the shape is asserted only by the fixture until then).
 */
type AttomNumber = number | string | undefined;
type AttomPropertyRecord = {
  address?: { line1?: string; locality?: string; countrySubd?: string; postal1?: string };
  location?: { latitude?: AttomNumber; longitude?: AttomNumber };
  summary?: { proptype?: string; yearbuilt?: AttomNumber };
  lot?: { lotsize2?: AttomNumber };
  building?: {
    rooms?: { beds?: AttomNumber; bathstotal?: AttomNumber };
    size?: { livingsize?: AttomNumber; universalsize?: AttomNumber };
  };
  assessment?: {
    assessed?: { assdttlvalue?: AttomNumber };
    tax?: { taxamt?: AttomNumber };
  };
  sale?: { amount?: { saleamt?: AttomNumber }; saleTransDate?: string; salesearchdate?: string };
  avm?: { amount?: { value?: AttomNumber; high?: AttomNumber; low?: AttomNumber } };
};
type AttomResponse = { property?: AttomPropertyRecord[] };

function toNumber(value: AttomNumber): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Units boundary, not financial math: a provider dollar figure becomes integer
 * cents so it can live alongside the rest of the system's money. No payment,
 * rate, or affordability arithmetic happens here (invariant 1).
 */
function dollarsToCents(value: AttomNumber): number | undefined {
  const n = toNumber(value);
  return n === undefined ? undefined : Math.round(n * 100);
}

const ATTOM_LIMITS = [
  "Public-record and automated-valuation data via ATTOM; coverage and recency vary by county.",
  "An automated value estimate is not an appraisal and does not establish what a lender will lend.",
  "Not a list price — the price a home is offered at comes from the seller's listing."
];

export class AttomPropertyFactsPort implements PropertyFactsPort {
  readonly key = "attom";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: AttomConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.gateway.attomdata.com/propertyapi/v1.0.0";
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 12_000;
  }

  async lookup(address: Address): Promise<SourcedValue<PropertyFacts> | null> {
    const address1 = address.line1.trim();
    const address2 = `${address.city}, ${address.state} ${address.postalCode}`.trim();
    if (address1 === "" || address.city.trim() === "") return null;

    const detail = await this.get("/property/detail", { address1, address2 });
    const record = detail?.property?.[0];
    if (record === undefined) return null;

    const facts: PropertyFacts = {
      normalizedAddress: {
        line1: record.address?.line1 ?? address.line1,
        city: record.address?.locality ?? address.city,
        state: record.address?.countrySubd ?? address.state,
        postalCode: record.address?.postal1 ?? address.postalCode
      }
    };

    const lat = toNumber(record.location?.latitude);
    const lng = toNumber(record.location?.longitude);
    if (lat !== undefined && lng !== undefined)
      facts.coordinates = { latitude: lat, longitude: lng };

    assign(facts, "propertyType", record.summary?.proptype);
    assign(facts, "yearBuilt", toNumber(record.summary?.yearbuilt));
    assign(facts, "bedrooms", toNumber(record.building?.rooms?.beds));
    assign(facts, "bathrooms", toNumber(record.building?.rooms?.bathstotal));
    assign(facts, "livingAreaSqft", toNumber(record.building?.size?.livingsize));
    assign(facts, "lotAreaSqft", toNumber(record.lot?.lotsize2));
    assign(facts, "assessedValueCents", dollarsToCents(record.assessment?.assessed?.assdttlvalue));
    assign(facts, "annualTaxAmountCents", dollarsToCents(record.assessment?.tax?.taxamt));
    assign(facts, "lastSalePriceCents", dollarsToCents(record.sale?.amount?.saleamt));
    assign(facts, "lastSaleDate", record.sale?.saleTransDate ?? record.sale?.salesearchdate);

    // Value is a second, best-effort call: a home with no automated valuation
    // still has usable characteristics and tax, so an AVM miss must not sink the
    // whole lookup.
    try {
      const avm = await this.get("/attomavm/detail", { address1, address2 });
      const amount = avm?.property?.[0]?.avm?.amount;
      assign(facts, "marketValueCents", dollarsToCents(amount?.value));
      assign(facts, "marketValueLowCents", dollarsToCents(amount?.low));
      assign(facts, "marketValueHighCents", dollarsToCents(amount?.high));
    } catch {
      // Leave value fields absent; the caller renders their absence, not a guess.
    }

    return sourced<PropertyFacts>(
      facts,
      makeProvenance({
        provider: "attom",
        licenseClass: "internal",
        limitations: ATTOM_LIMITS,
        confidence: 0.5
      })
    );
  }

  private async get(path: string, params: Record<string, string>): Promise<AttomResponse | null> {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method: "GET",
        headers: { apikey: this.apiKey, accept: "application/json" },
        signal: controller.signal
      });
    } catch (error) {
      throw new AttomTimeoutError(
        `ATTOM request did not complete: ${error instanceof Error ? error.name : "unknown"}`
      );
    } finally {
      clearTimeout(timer);
    }

    // A 400/404 for an unmatched address is a normal "no record", not an outage.
    if (response.status === 400 || response.status === 404) return null;
    if (!response.ok)
      throw new AttomApiError(response.status, `ATTOM responded ${response.status}`);
    return (await response.json()) as AttomResponse;
  }
}

/** Assign only when defined — keeps exactOptionalPropertyTypes happy and never writes an `undefined` field. */
function assign<K extends keyof PropertyFacts>(
  facts: PropertyFacts,
  key: K,
  value: PropertyFacts[K] | undefined
): void {
  if (value !== undefined) facts[key] = value;
}

export type FemaFloodConfig = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

const FEMA_FLOOD_LIMITS = [
  "FEMA National Flood Hazard Layer, current effective map. This is not a flood determination — only a lender-ordered determination or FEMA's current panel governs.",
  "A home outside a mapped high-risk zone can still flood; the absence of a zone is not a guarantee."
];

type FemaFeature = {
  attributes?: { FLD_ZONE?: string; ZONE_SUBTY?: string; SFHA_TF?: string };
};
type FemaResponse = { features?: FemaFeature[] };

/**
 * Flood zone from FEMA's public NFHL ArcGIS service (no key required). Layer 28
 * is the flood-hazard-area layer; a point query returns the zone (AE, VE, X, …)
 * and the special-flood-hazard-area flag. Any doubt returns null, so the caller
 * renders nothing rather than a wrong zone — a wrong flood answer is worse than
 * no answer.
 */
export class FemaFloodPort implements FloodPort {
  readonly key = "fema";
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: FemaFloodConfig = {}) {
    this.baseUrl =
      config.baseUrl ?? "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 8_000;
  }

  async lookup(input: {
    latitude: number;
    longitude: number;
  }): Promise<SourcedValue<FloodFacts> | null> {
    const url = new URL(`${this.baseUrl}/28/query`);
    url.searchParams.set("geometry", `${input.longitude},${input.latitude}`);
    url.searchParams.set("geometryType", "esriGeometryPoint");
    url.searchParams.set("inSR", "4326");
    url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    url.searchParams.set("outFields", "FLD_ZONE,ZONE_SUBTY,SFHA_TF");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("f", "json");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let data: FemaResponse;
    try {
      const response = await this.fetchImpl(url.toString(), {
        method: "GET",
        headers: { accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) return null;
      data = (await response.json()) as FemaResponse;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }

    const attributes = data.features?.[0]?.attributes;
    const zone = attributes?.FLD_ZONE;
    if (typeof zone !== "string" || zone.trim() === "") return null;

    const subtype = attributes?.ZONE_SUBTY;
    // SFHA_TF is authoritative; fall back to the zone letter (A*/V* are high-risk).
    const inSpecialFloodHazardArea =
      attributes?.SFHA_TF === "T" || /^(A|AE|AH|AO|AR|A99|V|VE)$/i.test(zone.trim());

    return sourced<FloodFacts>(
      {
        floodZone: subtype !== undefined && subtype.trim() !== "" ? `${zone} (${subtype})` : zone,
        mapEffectiveDate: "current effective NFHL",
        inSpecialFloodHazardArea
      },
      makeProvenance({
        provider: "fema",
        licenseClass: "public",
        limitations: FEMA_FLOOD_LIMITS
      })
    );
  }
}
