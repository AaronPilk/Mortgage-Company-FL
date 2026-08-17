import { describe, expect, it } from "vitest";
import { contrastRatio, dark, light, status } from "./index";

/**
 * The design language leans on glow, gradient, and low-contrast decoration.
 * None of that is allowed to reach the text layer, so every pairing that
 * actually carries words is asserted here in both themes.
 */

const AA_BODY = 4.5;
const AA_LARGE = 3;

describe("light theme contrast", () => {
  it("meets AA for every body-text pairing", () => {
    const pairings: [string, string, string][] = [
      ["text on bg", light.text, light.bg],
      ["text on surface", light.text, light.surface],
      ["text on surface2", light.text, light.surface2],
      ["muted on bg", light.textMuted, light.bg],
      ["muted on surface", light.textMuted, light.surface],
      ["purple link on bg", light.purple, light.bg],
      ["purple link on surface", light.purple, light.surface],
      ["white on purple button", "#ffffff", light.purple],
      ["white on purple-dark", "#ffffff", light.purpleDark]
    ];
    for (const [label, foreground, background] of pairings) {
      expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(AA_BODY);
    }
  });
});

describe("dark theme contrast", () => {
  it("meets AA for every body-text pairing", () => {
    const pairings: [string, string, string][] = [
      ["text on bg", dark.text, dark.bg],
      ["text on surface", dark.text, dark.surface],
      ["text on surface2", dark.text, dark.surface2],
      ["muted on bg", dark.textMuted, dark.bg],
      ["muted on surface", dark.textMuted, dark.surface],
      ["muted on surface2", dark.textMuted, dark.surface2],
      ["purple link on bg", dark.purple, dark.bg],
      ["purple link on surface", dark.purple, dark.surface],
      ["purple-light on surface", dark.purpleLight, dark.surface]
    ];
    for (const [label, foreground, background] of pairings) {
      expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(AA_BODY);
    }
  });
});

describe("status colours", () => {
  it("meets AA as text on a light surface", () => {
    for (const [label, value] of Object.entries(status)) {
      expect(contrastRatio(value, light.bg), label).toBeGreaterThanOrEqual(AA_BODY);
      expect(contrastRatio(value, light.surface), label).toBeGreaterThanOrEqual(AA_BODY);
    }
  });
});

describe("gradient text", () => {
  it("keeps both gradient stops legible, since the middle is interpolated", () => {
    // A gradient headline is large text, so AA large applies — but the lighter
    // stop is the one that fails first and is worth pinning.
    expect(contrastRatio(light.purpleLight, light.bg)).toBeGreaterThanOrEqual(AA_LARGE);
    expect(contrastRatio(dark.purpleLight, dark.bg)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});

describe("sanity", () => {
  it("computes a known ratio correctly", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  });
});
