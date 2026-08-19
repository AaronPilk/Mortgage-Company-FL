/**
 * Types for the DBPR import script, so its parsing logic is unit-tested from
 * the TypeScript test suite while the script itself stays dependency-free
 * plain Node for the operator running it against the live extract.
 */

export type DbprRecord = {
  firstName: string;
  lastName: string;
  brokerage: string | null;
  licenseNumber: string;
  licenseRank: string | null;
  cities: string;
  county: string;
  slug: string;
};

export type DbprRowResult =
  | { record: DbprRecord; reason: null }
  | { record: null; reason: "short_row" | "county" | "status" | "name" | "license" };

export declare const BATCH_SIZE: number;
export declare function parseCsv(text: string): string[][];
export declare function titleCase(value: string): string;
export declare function parseLicenseeName(
  raw: string
): { firstName: string; lastName: string } | null;
export declare function buildLicenseNumber(
  alternate: string,
  rank: string,
  bareNumber: string
): string | null;
export declare function buildSlug(
  firstName: string,
  lastName: string,
  licenseNumber: string
): string;
export declare function sqlString(value: string): string;
export declare function rowToRecord(columns: string[], countySet: Set<string>): DbprRowResult;
export declare function toSqlStatements(records: DbprRecord[], batchSize?: number): string[];
