import { describe, expect, it } from "vitest";
import {
  buildLicenseNumber,
  buildSlug,
  parseCsv,
  parseLicenseeName,
  rowToRecord,
  sqlString,
  titleCase,
  toSqlStatements,
  type DbprRecord
} from "../../../../scripts/import-dbpr-agents.mjs";

/**
 * The DBPR import script turns the state's public licensee extract into
 * unclaimed directory rows. Two properties are worth pinning hard: the privacy
 * posture (street addresses never reach the SQL; no contact columns exist in
 * the output at all) and rerun safety (ON CONFLICT on the license number).
 */

/** A 21-column extract row with recognizable street-address canaries. */
function extractRow(overrides: Partial<Record<number, string>> = {}): string[] {
  const row = [
    "2501 Real Estate Broker or Sales", // 0 license code
    "FIXTURE, TEST A", // 1 licensee name
    "", // 2 dba
    "SL Sales Associate", // 3 rank
    "9999 CANARY STREET ADDR", // 4 address line 1 — must never appear in SQL
    "UNIT 42 CANARY", // 5 address line 2 — must never appear in SQL
    "CANARY LINE THREE", // 6 address line 3 — must never appear in SQL
    "SAINT PETERSBURG", // 7 city
    "FL", // 8 state
    "33701", // 9 zip
    "PINELLAS", // 10 county
    "3514027", // 11 license number (digits)
    "Current", // 12 primary status
    "Active", // 13 secondary status
    "01/01/2010", // 14 original license date
    "01/01/2020", // 15 status effective date
    "03/31/2028", // 16 expiration
    "SL3514027", // 17 alternate license number
    "", // 18 self proprietor
    "COASTAL HOMES REALTY LLC", // 19 employer
    "CQ1000001" // 20 employer license
  ];
  for (const [index, value] of Object.entries(overrides)) {
    if (value !== undefined) row[Number(index)] = value;
  }
  return row;
}

const PINELLAS = new Set(["PINELLAS"]);

describe("licensee name parsing", () => {
  it("splits LAST, FIRST MIDDLE and title-cases both sides", () => {
    expect(parseLicenseeName("RIVERA, JORDAN LEE")).toEqual({
      firstName: "Jordan Lee",
      lastName: "Rivera"
    });
  });

  it("keeps multi-word last names and suffixes intact before the comma", () => {
    expect(parseLicenseeName("DE LA CRUZ JR, MARIA ELENA")).toEqual({
      firstName: "Maria Elena",
      lastName: "De La Cruz Jr"
    });
    expect(parseLicenseeName("VAN DER BERG III, HANS")).toEqual({
      firstName: "Hans",
      lastName: "Van Der Berg Iii"
    });
  });

  it("handles apostrophes and hyphens", () => {
    expect(parseLicenseeName("O'BRIEN-SMITH, PATRICK")).toEqual({
      firstName: "Patrick",
      lastName: "O'Brien-Smith"
    });
  });

  it("rejects records that are not person-shaped (no comma)", () => {
    expect(parseLicenseeName("EXAMPLE REALTY HOLDINGS LLC")).toBeNull();
    expect(parseLicenseeName("")).toBeNull();
  });

  it("title-cases without inventing casing rules beyond boundaries", () => {
    expect(titleCase("MC DONALD")).toBe("Mc Donald");
    expect(titleCase("SAINT PETERSBURG")).toBe("Saint Petersburg");
  });
});

describe("license number and slug", () => {
  it("prefers the alternate number because it carries the rank prefix", () => {
    expect(buildLicenseNumber("BK468849", "BK Broker", "468849")).toBe("BK468849");
  });

  it("falls back to rank prefix plus the bare digits", () => {
    expect(buildLicenseNumber("", "SL Sales Associate", "3514027")).toBe("SL3514027");
    expect(buildLicenseNumber("", "BL Broker Sales", "12345")).toBe("BL12345");
  });

  it("returns null when neither path yields a valid identifier", () => {
    expect(buildLicenseNumber("", "SL Sales Associate", "")).toBeNull();
    expect(buildLicenseNumber("###", "Unknown Rank", "999")).toBeNull();
  });

  it("builds a kebab slug of name plus license, valid for the slug column", () => {
    const slug = buildSlug("Maria Elena", "De La Cruz Jr", "SL3514027");
    expect(slug).toBe("maria-elena-de-la-cruz-jr-sl3514027");
    expect(slug).toMatch(/^[a-z0-9-]{1,80}$/);
  });

  it("folds accents so latin-1 names produce ascii slugs", () => {
    expect(buildSlug("José", "Núñez", "SL1")).toBe("jose-nunez-sl1");
  });
});

describe("row filtering", () => {
  it("accepts a current, active licensee in a requested county", () => {
    const { record } = rowToRecord(extractRow(), PINELLAS);
    expect(record).not.toBeNull();
    expect(record?.county).toBe("Pinellas");
    expect(record?.cities).toBe("Saint Petersburg");
    expect(record?.brokerage).toBe("Coastal Homes Realty Llc");
    expect(record?.licenseRank).toBe("SL Sales Associate");
  });

  it("drops other counties, lapsed licenses, and inactive status", () => {
    expect(rowToRecord(extractRow({ 10: "BROWARD" }), PINELLAS).reason).toBe("county");
    expect(rowToRecord(extractRow({ 12: "Null and Void" }), PINELLAS).reason).toBe("status");
    expect(rowToRecord(extractRow({ 13: "Involuntary Inactive" }), PINELLAS).reason).toBe("status");
  });

  it("matches the county filter case-insensitively", () => {
    const set = new Set(["PINELLAS", "HILLSBOROUGH"]);
    expect(rowToRecord(extractRow({ 10: "Pinellas" }), set).record).not.toBeNull();
  });
});

describe("SQL generation", () => {
  const record = (over: Partial<DbprRecord> = {}): DbprRecord => ({
    firstName: "Test",
    lastName: "Fixture",
    brokerage: null,
    licenseNumber: "SL0000001",
    licenseRank: "SL Sales Associate",
    cities: "Tampa",
    county: "Hillsborough",
    slug: "test-fixture-sl0000001",
    ...over
  });

  it("escapes single quotes by doubling", () => {
    expect(sqlString("O'Brien")).toBe("'O''Brien'");
    expect(sqlString("a''b")).toBe("'a''''b'");
  });

  it("emits ON CONFLICT on the license number so reruns and joined agents are safe", () => {
    const [statement] = toSqlStatements([record()]);
    expect(statement).toContain("on conflict (license_number) do nothing");
  });

  it("writes only unclaimed, unconsented, unverified public-record rows", () => {
    const [statement] = toSqlStatements([record()]);
    expect(statement).toContain("'unclaimed', 'dbpr_import', now(), false, false");
    // No contact columns exist in the statement at all — the privacy posture
    // is structural, not a value choice.
    expect(statement).not.toContain("email");
    expect(statement).not.toContain("phone");
    expect(statement).not.toContain("bio");
  });

  it("batches at the requested size", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      record({ licenseNumber: `SL000000${i}`, slug: `test-fixture-sl000000${i}` })
    );
    expect(toSqlStatements(records, 2)).toHaveLength(3);
  });
});

describe("end to end over an inline extract", () => {
  it("never lets a street address reach the SQL output", () => {
    const rows = [
      extractRow(),
      extractRow({
        1: "O'BRIEN, PATRICK",
        3: "BK Broker",
        11: "468849",
        17: "BK468849"
      })
    ];
    const records = rows
      .map((row) => rowToRecord(row, PINELLAS).record)
      .filter((r): r is DbprRecord => r !== null);
    const sql = toSqlStatements(records).join("\n");
    expect(records).toHaveLength(2);
    expect(sql).not.toContain("CANARY");
    expect(sql).not.toContain("Canary");
    expect(sql).toContain("'O''Brien'");
    expect(sql).toContain("'BK468849'");
  });

  it("parses quoted latin-style CSV including embedded commas and doubled quotes", () => {
    const csv = '"a","b ""quoted""","c,with,commas"\r\n"d","e","f"\n';
    expect(parseCsv(csv)).toEqual([
      ["a", 'b "quoted"', "c,with,commas"],
      ["d", "e", "f"]
    ]);
  });
});
