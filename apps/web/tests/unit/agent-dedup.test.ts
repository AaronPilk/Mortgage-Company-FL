import { describe, expect, it } from "vitest";
import { agentSlugBase, decideAgentUpsert, resolveAgentSlug } from "../../lib/agent-dedup";

describe("agent join dedup decision", () => {
  const rowA = { id: "00000000-0000-4000-8000-00000000000a" };
  const rowB = { id: "00000000-0000-4000-8000-00000000000b" };

  it("inserts when neither email nor license matches", () => {
    expect(decideAgentUpsert(null, null)).toEqual({ action: "insert" });
  });

  it("updates the email-matched row when only the email matches", () => {
    expect(decideAgentUpsert(rowA, null)).toEqual({ action: "update", targetId: rowA.id });
  });

  it("updates the license-matched row when only the license matches", () => {
    expect(decideAgentUpsert(null, rowB)).toEqual({ action: "update", targetId: rowB.id });
  });

  it("updates the single row when both lookups agree", () => {
    expect(decideAgentUpsert(rowA, { id: rowA.id })).toEqual({
      action: "update",
      targetId: rowA.id
    });
  });

  it("prefers the license row and merges nothing when the lookups disagree", () => {
    expect(decideAgentUpsert(rowA, rowB)).toEqual({
      action: "conflict",
      targetId: rowB.id,
      emailRowId: rowA.id,
      licenseRowId: rowB.id
    });
  });
});

describe("agent slug generation", () => {
  it("kebab-cases a plain name", () => {
    expect(agentSlugBase("Pat", "Fixture")).toBe("pat-fixture");
  });

  it("folds accents and drops punctuation", () => {
    expect(agentSlugBase("José", "Núñez")).toBe("jose-nunez");
    expect(agentSlugBase("Mary-Kate", "O'Brien, Jr.")).toBe("mary-kate-o-brien-jr");
  });

  it("never produces leading, trailing, or doubled hyphens", () => {
    const slug = agentSlugBase("  --Ann  ", "Lee--  ");
    expect(slug).toBe("ann-lee");
    expect(slug).not.toMatch(/--|^-|-$/);
  });

  it("falls back to a valid slug when the name has no usable characters", () => {
    expect(agentSlugBase("!!!", "???")).toBe("agent");
  });

  it("leaves room for a collision suffix inside the 80-character column bound", () => {
    const slug = agentSlugBase("x".repeat(100), "y".repeat(100));
    expect(slug.length).toBeLessThanOrEqual(76);
    expect(slug).not.toMatch(/-$/);
    expect(`${slug}-99`.length).toBeLessThanOrEqual(80);
  });

  it("uses the base itself when it is free", () => {
    expect(resolveAgentSlug("pat-fixture", new Set())).toBe("pat-fixture");
    expect(resolveAgentSlug("pat-fixture", new Set(["other-agent"]))).toBe("pat-fixture");
  });

  it("suffixes -2, then -3, on collisions", () => {
    expect(resolveAgentSlug("pat-fixture", new Set(["pat-fixture"]))).toBe("pat-fixture-2");
    expect(resolveAgentSlug("pat-fixture", new Set(["pat-fixture", "pat-fixture-2"]))).toBe(
      "pat-fixture-3"
    );
  });

  it("fills the first gap deterministically", () => {
    expect(resolveAgentSlug("pat-fixture", new Set(["pat-fixture", "pat-fixture-3"]))).toBe(
      "pat-fixture-2"
    );
  });
});
