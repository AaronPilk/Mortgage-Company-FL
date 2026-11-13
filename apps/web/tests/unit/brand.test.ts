import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ALL_ARTICLES } from "../../content/articles";
import { CAMPAIGNS } from "../../content/campaigns";
import { PROGRAMS } from "../../content/programs";
import { HOME_COUNTY_GUIDES, HOME_EXPLORE, HOME_TOOLS } from "../../content/home-hub";
import { GLOSSARY_TERMS } from "../../lib/glossary-data";
import { COUNTIES } from "../../lib/county-data";
import { CITIES } from "../../lib/city-data";
import { DPA_PROGRAMS } from "../../lib/dpa-programs";
import manifest from "../../app/manifest";

/**
 * One visible brand (ADR-014). Wholesale Mortgage Lending is the licensed
 * brokerage; a name that is not registered with OFR and listed in NMLS must not
 * be presented to the public as the business (Florida Rule 69V-40.021). The old
 * product name survives only as internal code names (@tract/* packages, the
 * x-tract-brand header, comments), which no visitor, crawler or structured-data
 * reader sees.
 */

const RETIRED_BRAND = /\bTRACT\b/;
const WEB_ROOT = fileURLToPath(new URL("../../", import.meta.url));

function strings(value: unknown, path = "$"): { path: string; text: string }[] {
  if (typeof value === "string") return [{ path, text: value }];
  if (Array.isArray(value))
    return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => strings(item, `${path}.${key}`));
  }
  return [];
}

function offenders(value: unknown): string[] {
  return strings(value)
    .filter(({ text }) => RETIRED_BRAND.test(text))
    .map(({ path, text }) => `${path}: ${text.slice(0, 120)}`);
}

/** Remove comments so internal notes ("the TRACT chrome") are not counted. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

function sourceFiles(directory: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe("content carries no retired brand", () => {
  it.each([
    ["articles", ALL_ARTICLES],
    ["programs", PROGRAMS],
    ["campaigns", CAMPAIGNS],
    ["glossary", GLOSSARY_TERMS],
    ["counties", COUNTIES],
    ["cities", CITIES],
    ["down payment programs", DPA_PROGRAMS],
    ["homepage hub links", [HOME_TOOLS, HOME_EXPLORE, HOME_COUNTY_GUIDES]]
  ])("%s", (_name, data) => {
    expect(offenders(data)).toEqual([]);
  });

  it("keeps the old name out of every page and component outside comments", () => {
    const hits: string[] = [];
    for (const directory of ["app", "components", "content", "lib"]) {
      for (const file of sourceFiles(join(WEB_ROOT, directory))) {
        const lines = stripComments(readFileSync(file, "utf8")).split("\n");
        lines.forEach((line, index) => {
          if (RETIRED_BRAND.test(line)) {
            hits.push(`${relative(WEB_ROOT, file)}:${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
    expect(hits).toEqual([]);
  });

  it("installs under the company name", () => {
    const value = manifest();
    expect(value.name).toBe("Wholesale Mortgage Lending");
    expect(value.short_name).toBe("WML Lending");
    // Launchers truncate past about 12 characters.
    expect((value.short_name ?? "").length).toBeLessThanOrEqual(12);
    expect(offenders(value)).toEqual([]);
  });
});

describe("structured data names one organization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function envFileValue(key: string): string | undefined {
    const line = readFileSync(join(WEB_ROOT, ".env.production"), "utf8")
      .split("\n")
      .find((candidate) => candidate.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim();
  }

  it("builds production with the brand name equal to the company name", () => {
    expect(envFileValue("NEXT_PUBLIC_BRAND_NAME")).toBe("Wholesale Mortgage Lending");
    const wrangler = readFileSync(join(WEB_ROOT, "wrangler.jsonc"), "utf8");
    expect(wrangler).toMatch(/"NEXT_PUBLIC_BRAND_NAME":\s*"Wholesale Mortgage Lending"/);
  });

  it("emits no alternateName with the production values", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://wsmlending.com");
    vi.stubEnv("NEXT_PUBLIC_BRAND_NAME", envFileValue("NEXT_PUBLIC_BRAND_NAME") ?? "");
    const { businessIdentity } = await import("../../lib/site");
    const { organizationNode, webSiteNode } = await import("@tract/seo");
    expect(businessIdentity.brandName).toBe(businessIdentity.name);
    const organization = organizationNode(businessIdentity);
    expect(organization).not.toHaveProperty("alternateName");
    expect(organization["name"]).toBe("Wholesale Mortgage Lending");
    expect(offenders([organization, webSiteNode(businessIdentity)])).toEqual([]);
  });

  it("keeps llms.txt free of a platform name", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://wsmlending.com");
    const { GET } = await import("../../app/llms.txt/route");
    const text = await GET().text();
    expect(text).not.toMatch(RETIRED_BRAND);
    expect(text).not.toMatch(/is our platform/i);
  });
});

describe("consent texts are versioned with their wording", () => {
  /*
   * A consent receipt stores the version and a SHA-256 of the text. If the text
   * changes under the same version, two receipts with one version would point
   * at different wording. Pin each version to its hash: changing the words
   * fails here until the version moves too.
   */
  const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

  it("pins every versioned disclosure to the hash of its text", async () => {
    const site = await import("../../lib/site");
    const pinned: Record<string, string> = {
      "lead-disclosure@2026-08-17":
        "d6b6dad0a8ecee9b8035eaeb79afbccf3fed93c3f6fcfa48a02d9c7cea7c6e58",
      "vision-report-request@1.1.0":
        "9892a1ebdfff3c1299f628cabfe871e457bfe6c06bcf265d32bc16ddbc2356df"
    };
    expect(pinned[site.LEAD_DISCLOSURE_VERSION]).toBe(sha256(site.LEAD_DISCLOSURE_TEXT));
    expect(pinned[site.VISION_REPORT_DISCLOSURE_VERSION]).toBe(
      sha256(site.VISION_REPORT_DISCLOSURE_TEXT)
    );
  });

  it("asks the licensed brokerage, by name, to retain a Vision request", async () => {
    const site = await import("../../lib/site");
    expect(site.VISION_REPORT_DISCLOSURE_TEXT).toContain("asking Wholesale Mortgage Lending");
    for (const text of [
      site.LEAD_DISCLOSURE_TEXT,
      site.SMS_CONSENT_TEXT,
      site.EMAIL_CONSENT_TEXT,
      site.VISION_REPORT_DISCLOSURE_TEXT
    ]) {
      expect(text).not.toMatch(RETIRED_BRAND);
    }
  });
});
