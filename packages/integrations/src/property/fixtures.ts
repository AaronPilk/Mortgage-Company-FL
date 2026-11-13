import { sourced } from "@tract/domain";
import type { SourcedValue } from "@tract/domain";
import {
  type Address,
  type ConstructionCostPort,
  type ConstructionCostRange,
  type FloodFacts,
  type FloodPort,
  type ParcelFacts,
  type ParcelPort,
  type PermitEvent,
  type PermitPort,
  type PropertyFacts,
  type PropertyFactsPort,
  type SaleComparable,
  type SaleComparablePort,
  type ZoningFacts,
  type ZoningPort,
  makeProvenance
} from "./ports";

/**
 * Synthetic property data for development and tests.
 *
 * Every value carries a limitation that says, in plain language, that it is not
 * real. That is deliberate: a fixture that looks authoritative is how synthetic
 * data ends up in front of a consumer.
 */

const FIXTURE_LIMITS = ["Synthetic development data. Not sourced from any authoritative record."];

export class FixtureParcelPort implements ParcelPort {
  readonly key = "fixture";
  async lookup(address: Address): Promise<SourcedValue<ParcelFacts> | null> {
    return sourced<ParcelFacts>(
      {
        parcelIdentifier: `FIXTURE-${address.postalCode}-0001`,
        lotAreaSqft: 8_400,
        countyName: "Example County"
      },
      makeProvenance({
        provider: "fixture",
        licenseClass: "internal",
        limitations: FIXTURE_LIMITS,
        observedAt: "2026-08-01T00:00:00.000Z"
      })
    );
  }
}

export class FixturePermitPort implements PermitPort {
  readonly key = "fixture";
  async history(parcelIdentifier: string): Promise<SourcedValue<PermitEvent[]>> {
    return sourced<PermitEvent[]>(
      [
        {
          permitNumber: `${parcelIdentifier}-P1`,
          status: "finaled",
          workDescription: "Roof replacement",
          issuedDate: "2023-04-11",
          finaledDate: "2023-06-02",
          valuationCents: 22_500_00
        }
      ],
      makeProvenance({
        provider: "fixture",
        licenseClass: "internal",
        limitations: [
          ...FIXTURE_LIMITS,
          "Permit coverage varies by jurisdiction; absence of a permit is not proof no work occurred."
        ]
      })
    );
  }
}

export class FixtureFloodPort implements FloodPort {
  readonly key = "fixture";
  async lookup(): Promise<SourcedValue<FloodFacts> | null> {
    return sourced<FloodFacts>(
      { floodZone: "X", mapEffectiveDate: "2021-09-27", inSpecialFloodHazardArea: false },
      makeProvenance({
        provider: "fixture",
        licenseClass: "internal",
        limitations: [
          ...FIXTURE_LIMITS,
          "This is not a flood determination. Only a lender-ordered determination or FEMA's current map governs."
        ]
      })
    );
  }
}

export class FixtureZoningPort implements ZoningPort {
  readonly key = "fixture";
  async lookup(_parcelIdentifier: string): Promise<SourcedValue<ZoningFacts> | null> {
    return sourced<ZoningFacts>(
      {
        jurisdiction: "Example County",
        zoningCode: "RSF-4",
        overlays: [],
        officialRecordUrl: "https://example.invalid/zoning",
        lastUpdated: "2026-01-15"
      },
      makeProvenance({
        provider: "fixture",
        licenseClass: "internal",
        limitations: [
          ...FIXTURE_LIMITS,
          "Zoning must be confirmed with the jurisdiction. This is never a zoning opinion."
        ]
      })
    );
  }
}

export class FixtureSaleComparablePort implements SaleComparablePort {
  readonly key = "fixture";
  async nearby(): Promise<SourcedValue<SaleComparable[]>> {
    return sourced<SaleComparable[]>(
      [
        {
          address: {
            line1: "1210 Example Bay Dr",
            city: "Tampa",
            state: "FL",
            postalCode: "33602"
          },
          closePriceCents: 441_000_00,
          closeDate: "2026-06-14",
          livingAreaSqft: 1_910,
          bedrooms: 3,
          bathrooms: 2,
          distanceMiles: 0.2
        },
        {
          address: {
            line1: "1145 Example Bay Dr",
            city: "Tampa",
            state: "FL",
            postalCode: "33602"
          },
          closePriceCents: 418_500_00,
          closeDate: "2026-05-02",
          livingAreaSqft: 1_780,
          bedrooms: 3,
          bathrooms: 2,
          distanceMiles: 0.3
        }
      ],
      makeProvenance({
        provider: "fixture",
        licenseClass: "internal",
        limitations: [
          ...FIXTURE_LIMITS,
          "A comparable range is not an appraisal and does not establish value."
        ],
        confidence: 0.4
      })
    );
  }
}

export class FixtureConstructionCostPort implements ConstructionCostPort {
  readonly key = "fixture";
  async estimate(): Promise<SourcedValue<ConstructionCostRange> | null> {
    return sourced<ConstructionCostRange>(
      {
        lowCentsPerSqft: 185_00,
        expectedCentsPerSqft: 245_00,
        highCentsPerSqft: 330_00,
        locationFactor: 1.02,
        exclusions: [
          "Design and engineering fees",
          "Permit and impact fees",
          "Site work and utility connections",
          "Furniture and appliances"
        ],
        costDataDate: "2026-07-01"
      },
      makeProvenance({
        provider: "fixture",
        licenseClass: "internal",
        limitations: [
          ...FIXTURE_LIMITS,
          "Not a contractor bid. Actual cost depends on scope, schedule, and market conditions."
        ]
      })
    );
  }
}

export class FixturePropertyFactsPort implements PropertyFactsPort {
  readonly key = "fixture";
  async lookup(address: Address): Promise<SourcedValue<PropertyFacts> | null> {
    return sourced<PropertyFacts>(
      {
        normalizedAddress: {
          line1: address.line1.trim() === "" ? "123 Example Bay Dr" : address.line1,
          city: address.city.trim() === "" ? "Tampa" : address.city,
          state: address.state.trim() === "" ? "FL" : address.state,
          postalCode: address.postalCode.trim() === "" ? "33602" : address.postalCode
        },
        coordinates: { latitude: 27.9506, longitude: -82.4572 },
        propertyType: "Single Family Residence",
        bedrooms: 3,
        bathrooms: 2,
        livingAreaSqft: 1_860,
        lotAreaSqft: 6_500,
        yearBuilt: 2004,
        assessedValueCents: 312_000_00,
        marketValueCents: 438_000_00,
        marketValueLowCents: 415_000_00,
        marketValueHighCents: 461_000_00,
        lastSalePriceCents: 356_000_00,
        lastSaleDate: "2019-05-17",
        annualTaxAmountCents: 5_240_00
      },
      makeProvenance({
        provider: "fixture",
        licenseClass: "internal",
        limitations: [
          ...FIXTURE_LIMITS,
          "An automated value estimate is not an appraisal and does not establish what a lender will lend.",
          "Not a list price — the price a home is offered at comes from the seller's listing."
        ],
        observedAt: "2026-08-01T00:00:00.000Z",
        confidence: 0.4
      })
    );
  }
}
