#!/usr/bin/env node
/**
 * Florida DBPR licensee extract → unclaimed agent-directory rows, as SQL.
 *
 * Usage:
 *   node scripts/import-dbpr-agents.mjs <extract.csv> "Pinellas,Hillsborough" > /tmp/agents-import.sql
 *
 * Emits batched INSERT statements to stdout and a per-county summary to
 * stderr. The script deliberately produces SQL rather than talking to the
 * database: the operator reads what will run before it runs, and a rerun is
 * harmless because every statement carries ON CONFLICT (license_number)
 * DO NOTHING — the license number is the identity the state assigned, so a
 * collision means the row (imported or joined) already exists.
 *
 * PRIVACY POSTURE, load-bearing: the extract's street-address columns (4–6)
 * are never read. An imported row carries city, county, and the public license
 * facts only; email, phone, and bio stay NULL. license_verified stays false —
 * we copied a record, no human re-verified it (invariant 6).
 *
 * No dependencies beyond the Node standard library, so the orchestrator can
 * run it anywhere psql runs.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Extract column positions (21 columns, no header). Addresses 4–6 are absent on purpose. */
const COL = {
  licenseeName: 1,
  rank: 3,
  city: 7,
  county: 10,
  licenseNumber: 11,
  primaryStatus: 12,
  secondaryStatus: 13,
  alternateLicenseNumber: 17,
  employerName: 19
};

const RANK_PREFIX = new Map([
  ["SL SALES ASSOCIATE", "SL"],
  ["BK BROKER", "BK"],
  ["BL BROKER SALES", "BL"]
]);

const LICENSE_NUMBER_REGEX = /^[A-Za-z0-9-]{4,20}$/;
export const BATCH_SIZE = 1000;

/**
 * Minimal RFC-4180 reader: quoted fields, doubled quotes, embedded commas and
 * newlines, CRLF or LF. Hand-rolled because the stdlib has no CSV parser and
 * the whole point of this script is zero dependencies.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      // A blank line is not a record.
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

/**
 * "MC DONALD" → "Mc Donald", "O'BRIEN-SMITH" → "O'Brien-Smith". Capitalizes
 * after start, space, hyphen, and apostrophe; everything else lowercased. This
 * is presentation, not identity — the license number is the identity.
 */
export function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-z])/g, (_, boundary, letter) => boundary + letter.toUpperCase());
}

/**
 * "LAST, FIRST MIDDLE" → { firstName, lastName }, both title-cased. The last
 * name is everything before the first comma, so multi-word last names and
 * suffixes ("DE LA CRUZ JR, MARIA") survive intact. A name with no comma is
 * not a person-shaped licensee record and is rejected (null).
 */
export function parseLicenseeName(raw) {
  const commaAt = raw.indexOf(",");
  if (commaAt <= 0) return null;
  const lastName = titleCase(raw.slice(0, commaAt).trim()).slice(0, 80).trim();
  const firstName = titleCase(raw.slice(commaAt + 1).trim())
    .slice(0, 80)
    .trim();
  if (firstName === "" || lastName === "") return null;
  return { firstName, lastName };
}

/**
 * The stored license number is the alternate number (e.g. 'BK468849') because
 * it carries the rank prefix the public lookup uses; the fallback rebuilds the
 * same shape from the rank prefix and the bare digits.
 */
export function buildLicenseNumber(alternate, rank, bareNumber) {
  const alt = alternate.trim();
  if (LICENSE_NUMBER_REGEX.test(alt)) return alt;
  const prefix = RANK_PREFIX.get(rank.trim().toUpperCase());
  const digits = bareNumber.trim();
  if (prefix === undefined || !/^[0-9]+$/.test(digits)) return null;
  const candidate = `${prefix}${digits}`;
  return LICENSE_NUMBER_REGEX.test(candidate) ? candidate : null;
}

/** Kebab of "first last license", bounded to the slug column's 80 characters. */
export function buildSlug(firstName, lastName, licenseNumber) {
  return `${firstName} ${lastName} ${licenseNumber}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Standard SQL string literal escaping: double every single quote. */
export function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * One extract row → one importable record, or null with a reason. Only
 * currently active licensees in the requested counties come through, and only
 * the public-record columns are ever touched.
 */
export function rowToRecord(columns, countySet) {
  if (columns.length < 21) return { record: null, reason: "short_row" };
  const county = columns[COL.county].trim();
  if (!countySet.has(county.toUpperCase())) return { record: null, reason: "county" };
  if (columns[COL.primaryStatus].trim().toUpperCase() !== "CURRENT") {
    return { record: null, reason: "status" };
  }
  if (columns[COL.secondaryStatus].trim().toUpperCase() !== "ACTIVE") {
    return { record: null, reason: "status" };
  }
  const name = parseLicenseeName(columns[COL.licenseeName].trim());
  if (name === null) return { record: null, reason: "name" };
  const licenseNumber = buildLicenseNumber(
    columns[COL.alternateLicenseNumber],
    columns[COL.rank],
    columns[COL.licenseNumber]
  );
  if (licenseNumber === null) return { record: null, reason: "license" };
  const city = titleCase(columns[COL.city].trim()).slice(0, 400).trim();
  const rank = columns[COL.rank].trim();
  const employer = titleCase(columns[COL.employerName].trim()).slice(0, 120).trim();
  return {
    record: {
      firstName: name.firstName,
      lastName: name.lastName,
      brokerage: employer === "" ? null : employer,
      licenseNumber,
      licenseRank: rank === "" || rank.length > 40 ? null : rank,
      cities: city,
      county: titleCase(county).slice(0, 80),
      slug: buildSlug(name.firstName, name.lastName, licenseNumber)
    },
    reason: null
  };
}

/**
 * Records → batched INSERT statements. Everything the import asserts is fixed
 * here: status 'unclaimed', source 'dbpr_import', no consent claimed, no
 * verification claimed, no contact columns at all.
 */
export function toSqlStatements(records, batchSize = BATCH_SIZE) {
  const statements = [];
  for (let start = 0; start < records.length; start += batchSize) {
    const batch = records.slice(start, start + batchSize);
    const values = batch
      .map((r) =>
        [
          sqlString(r.firstName),
          sqlString(r.lastName),
          r.brokerage === null ? "null" : sqlString(r.brokerage),
          sqlString(r.licenseNumber),
          r.licenseRank === null ? "null" : sqlString(r.licenseRank),
          sqlString(r.cities),
          sqlString(r.county),
          sqlString(r.slug)
        ].join(", ")
      )
      .map((tuple) => `  (${tuple}, 'unclaimed', 'dbpr_import', now(), false, false)`)
      .join(",\n");
    statements.push(
      "insert into public.agents\n" +
        "  (first_name, last_name, brokerage, license_number, license_rank, cities, county, slug,\n" +
        "   status, source, imported_at, display_consent, license_verified)\n" +
        "values\n" +
        `${values}\n` +
        "on conflict (license_number) do nothing;"
    );
  }
  return statements;
}

function main() {
  const [csvPath, countyArg] = process.argv.slice(2);
  if (csvPath === undefined || countyArg === undefined || countyArg.trim() === "") {
    process.stderr.write(
      'usage: node scripts/import-dbpr-agents.mjs <extract.csv> "County1,County2" > out.sql\n'
    );
    process.exit(2);
  }
  const countySet = new Set(
    countyArg
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c !== "")
  );

  // The extract is latin-1; Node's latin1 decoder maps every byte to the same
  // Unicode code point, so accented names arrive intact as UTF-8 output.
  const text = readFileSync(csvPath, "latin1");
  const rows = parseCsv(text);

  const records = [];
  const perCounty = new Map();
  const skipped = { county: 0, status: 0, name: 0, license: 0, short_row: 0 };
  const seenLicenses = new Set();
  for (const columns of rows) {
    const { record, reason } = rowToRecord(columns, countySet);
    if (record === null) {
      skipped[reason] += 1;
      continue;
    }
    // The extract can list a licensee more than once; ON CONFLICT would also
    // absorb it, but a multi-row INSERT may not touch the same key twice.
    if (seenLicenses.has(record.licenseNumber)) continue;
    seenLicenses.add(record.licenseNumber);
    records.push(record);
    perCounty.set(record.county, (perCounty.get(record.county) ?? 0) + 1);
  }

  for (const statement of toSqlStatements(records)) {
    process.stdout.write(`${statement}\n\n`);
  }

  process.stderr.write(`rows read: ${rows.length}\n`);
  for (const [county, count] of [...perCounty.entries()].sort()) {
    process.stderr.write(`  ${county}: ${count}\n`);
  }
  process.stderr.write(
    `emitting ${records.length} agents in ${Math.ceil(records.length / BATCH_SIZE)} batch(es); ` +
      `skipped — other county: ${skipped.county}, not current/active: ${skipped.status}, ` +
      `unparseable name: ${skipped.name}, unusable license: ${skipped.license}, ` +
      `malformed row: ${skipped.short_row}\n`
  );
}

// Import-safe: unit tests load the parsing functions without emitting SQL.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
