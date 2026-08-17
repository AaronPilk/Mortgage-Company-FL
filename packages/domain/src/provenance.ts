/**
 * Provenance wrapper for every third-party fact.
 *
 * A value without provenance cannot appear in a report. Reports must be
 * reconstructable from the exact facts and assumptions used at generation time,
 * which means the source, its date, and its limitations travel with the number.
 */

export type LicenseClass = "public" | "display" | "internal" | "restricted";

export type Provenance = {
  provider: string;
  sourceReference?: string;
  observedAt?: string;
  effectiveAt?: string;
  expiresAt?: string;
  confidence?: number;
  licenseClass: LicenseClass;
  limitations: string[];
};

export type SourcedValue<T> = {
  value: T;
  provenance: Provenance;
};

export function sourced<T>(value: T, provenance: Provenance): SourcedValue<T> {
  if (provenance.limitations.length === 0) {
    throw new Error(
      `provider "${provenance.provider}" supplied no limitations; every sourced value must state what it does not establish`
    );
  }
  return { value, provenance };
}

export function isStale(provenance: Provenance, now: Date): boolean {
  if (provenance.expiresAt === undefined) return false;
  return new Date(provenance.expiresAt).getTime() < now.getTime();
}

/** Where a number in a Vision report came from. Model output is never merged into facts. */
export type AssumptionSourceKind = "user" | "provider" | "company_default" | "model_inference";

export type Assumption = {
  key: string;
  value: number | string | boolean;
  unit?: string;
  sourceKind: AssumptionSourceKind;
  sourceReference?: string;
  confidence?: number;
  confirmedByUser: boolean;
};

/**
 * A model inference may never be presented as a confirmed input. It must be
 * surfaced to the user for confirmation before it drives a financial figure.
 */
export function requiresUserConfirmation(assumption: Assumption): boolean {
  return assumption.sourceKind === "model_inference" && !assumption.confirmedByUser;
}
