import { describe, expect, it } from "vitest";
import { color, contrastRatio } from "./index";

describe("colour contrast", () => {
  it("meets WCAG AA for every shipped body-text pairing", () => {
    const pairings: [string, string, string][] = [
      ["ink on surface", color.ink, color.surface],
      ["ink on canvas", color.ink, color.canvas],
      ["muted on surface", color.muted, color.surface],
      ["muted on canvas", color.muted, color.canvas],
      ["surface on purple700", color.surface, color.purple700],
      ["surface on purple800", color.surface, color.purple800],
      ["ink on purple50", color.ink, color.purple50],
      ["ink on purple100", color.ink, color.purple100]
    ];
    for (const [label, foreground, background] of pairings) {
      expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("meets AA for status colours used as text on a white surface", () => {
    for (const [label, value] of [
      ["success", color.success],
      ["warning", color.warning],
      ["danger", color.danger]
    ] as const) {
      expect(contrastRatio(value, color.surface), label).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("computes a known ratio correctly", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  });
});
