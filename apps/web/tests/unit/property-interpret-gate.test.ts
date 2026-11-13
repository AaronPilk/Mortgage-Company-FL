import { describe, expect, it } from "vitest";

// AI_MODE is fixture (a live-ish provider) on purpose, so these prove the aiSearch
// flag — not the disabled-provider check — is what disables the paid AI path.
// FEATURE_AI_SEARCH is deleted so the derived aiSearch flag defaults off
// (z.coerce.boolean() treats the string "false" as truthy, so off means absent).
process.env.AI_MODE = "fixture";
delete process.env.FEATURE_AI_SEARCH;

import { publicFeatures } from "../../lib/env";
import { runAreaNarrative, buildAreaTemplate } from "../../lib/area-report";
import { countyBySlug } from "../../lib/county-data";
import { interpretedToCriteria, parseNaturalQuery } from "../../components/properties/nl-parser";

const county = countyBySlug("hillsborough-county");
if (county === undefined) throw new Error("fixture county missing");

/**
 * The aiSearch gate is one derived flag read by two Wave-2 surfaces the same way:
 * `interpretWithAi` (Part 1) and `runAreaNarrative` (Part 2) each short-circuit on
 * `!publicFeatures().aiSearch`. This proves the shared gate is off when the flag
 * is unset, that a paid path (runAreaNarrative, exercised directly here) refuses
 * to call the provider because of it, and that the deterministic fallback the
 * interpret route drops to is unaffected.
 */
describe("aiSearch gate (flag off)", () => {
  it("derives aiSearch=false when the flag is unset, even with AI live", () => {
    expect(publicFeatures().aiSearch).toBe(false);
  });

  it("short-circuits the paid AI path to the deterministic template", async () => {
    const result = await runAreaNarrative(county, {
      requestId: "req-gate",
      subjectKey: "ip:test"
    });
    expect(result.source).toBe("template");
    expect(result.sections).toEqual(buildAreaTemplate(county));
  });

  it("leaves the deterministic interpret fallback unaffected with AI off", () => {
    const criteria = interpretedToCriteria(parseNaturalQuery("3 beds in Tampa under 500k"));
    expect(criteria.q).toBe("Tampa");
    expect(criteria.beds).toBe(3);
    expect(criteria.maxPrice).toBe(500_000);
  });
});
