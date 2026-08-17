import type { Provenance, SourcedValue } from "@tract/domain";

/**
 * Property-data ports.
 *
 * These are separate interfaces on purpose. Parcel, permit, flood, zoning,
 * school, comparable, rental, and cost data have different rights, refresh
 * cadences, geographies, and — most importantly — different limits on what they
 * establish. Collapsing them into one "property API" hides exactly the caveats
 * that keep the product honest.
 */

export type Address = {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
};

export type ParcelFacts = {
  parcelIdentifier: string;
  lotAreaSqft?: number;
  countyName?: string;
  legalDescription?: string;
};

export interface ParcelPort {
  readonly key: string;
  lookup(address: Address): Promise<SourcedValue<ParcelFacts> | null>;
}

export type PermitEvent = {
  permitNumber: string;
  status: string;
  workDescription: string;
  issuedDate?: string;
  finaledDate?: string;
  valuationCents?: number;
};

export interface PermitPort {
  readonly key: string;
  history(parcelIdentifier: string): Promise<SourcedValue<PermitEvent[]>>;
}

export type FloodFacts = {
  floodZone: string;
  /** The date of the map itself. A flood answer without this is not an answer. */
  mapEffectiveDate: string;
  inSpecialFloodHazardArea: boolean;
};

export interface FloodPort {
  readonly key: string;
  lookup(input: { latitude: number; longitude: number }): Promise<SourcedValue<FloodFacts> | null>;
}

export type ZoningFacts = {
  jurisdiction: string;
  zoningCode: string;
  overlays: string[];
  officialRecordUrl: string;
  lastUpdated?: string;
};

export interface ZoningPort {
  readonly key: string;
  lookup(parcelIdentifier: string): Promise<SourcedValue<ZoningFacts> | null>;
}

export type SaleComparable = {
  address: Address;
  closePriceCents: number;
  closeDate: string;
  livingAreaSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  distanceMiles?: number;
};

export interface SaleComparablePort {
  readonly key: string;
  nearby(input: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
    monthsBack: number;
  }): Promise<SourcedValue<SaleComparable[]>>;
}

export type RentalEstimate = {
  lowCents: number;
  expectedCents: number;
  highCents: number;
  sampleSize?: number;
};

export interface RentalComparablePort {
  readonly key: string;
  estimate(input: {
    address: Address;
    bedrooms: number;
  }): Promise<SourcedValue<RentalEstimate> | null>;
}

export type ShortTermRentalEstimate = {
  averageDailyRateCents: number;
  occupancyBasisPoints: number;
  annualRevenueCents: number;
  seasonalityNote: string;
  regulatoryWarning: string;
};

export interface ShortTermRentalPort {
  readonly key: string;
  estimate(input: {
    address: Address;
    bedrooms: number;
  }): Promise<SourcedValue<ShortTermRentalEstimate> | null>;
}

export type ConstructionCostRange = {
  lowCentsPerSqft: number;
  expectedCentsPerSqft: number;
  highCentsPerSqft: number;
  locationFactor: number;
  exclusions: string[];
  costDataDate: string;
};

export interface ConstructionCostPort {
  readonly key: string;
  estimate(input: {
    postalCode: string;
    scopeKey: string;
  }): Promise<SourcedValue<ConstructionCostRange> | null>;
}

/**
 * Every port has an unconfigured implementation that returns null. A missing
 * provider produces an explicit gap in the report, never a plausible guess.
 */
export function unconfigured<T>(providerKey: string, limitation: string): SourcedValue<T> | null {
  void providerKey;
  void limitation;
  return null;
}

export function makeProvenance(input: {
  provider: string;
  licenseClass: Provenance["licenseClass"];
  limitations: string[];
  observedAt?: string;
  sourceReference?: string;
  confidence?: number;
}): Provenance {
  return {
    provider: input.provider,
    licenseClass: input.licenseClass,
    limitations: input.limitations,
    ...(input.observedAt === undefined ? {} : { observedAt: input.observedAt }),
    ...(input.sourceReference === undefined ? {} : { sourceReference: input.sourceReference }),
    ...(input.confidence === undefined ? {} : { confidence: input.confidence })
  };
}
