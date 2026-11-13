import { describe, expect, it } from "vitest";
import { matchPrograms } from "../../lib/dpa-programs";

/**
 * The finder's matcher reflects the stable structural rules only (first-time
 * status, Florida full-time employment, the military exemption). It never
 * encodes the annual income/price limits — those stay a licensed officer's call.
 */

describe("matchPrograms", () => {
  it("surfaces all three statewide programs for a first-time, full-time Florida worker", () => {
    const { matched } = matchPrograms({
      ownedRecently: false,
      floridaFullTime: true,
      military: false
    });
    expect(matched.map((p) => p.id).sort()).toEqual(["fl-assist", "fl-hlp", "hometown-heroes"]);
  });

  it("drops Hometown Heroes when the buyer is not a full-time Florida employee", () => {
    const { matched } = matchPrograms({
      ownedRecently: false,
      floridaFullTime: false,
      military: false
    });
    const ids = matched.map((p) => p.id);
    expect(ids).toContain("fl-assist");
    expect(ids).toContain("fl-hlp");
    expect(ids).not.toContain("hometown-heroes");
  });

  it("matches nothing for a recent owner who is not military", () => {
    const { matched, other } = matchPrograms({
      ownedRecently: true,
      floridaFullTime: true,
      military: false
    });
    expect(matched).toHaveLength(0);
    expect(other).toHaveLength(3);
  });

  it("waives the first-time rule for military, so a recent-owner veteran still matches", () => {
    const { matched } = matchPrograms({
      ownedRecently: true,
      floridaFullTime: true,
      military: true
    });
    expect(matched.map((p) => p.id).sort()).toEqual(["fl-assist", "fl-hlp", "hometown-heroes"]);
  });
});
