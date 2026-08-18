import { describe, expect, it } from "vitest";
import { safeAccountNextPath } from "../../lib/account-auth";

describe("account Auth callback redirect", () => {
  it("allows only private account destinations", () => {
    expect(safeAccountNextPath("/account")).toBe("/account");
    expect(safeAccountNextPath("/account/preferences")).toBe("/account/preferences");
  });

  it("rejects open redirects and unrelated local paths", () => {
    expect(safeAccountNextPath("https://evil.example")).toBe("/account");
    expect(safeAccountNextPath("//evil.example/account")).toBe("/account");
    expect(safeAccountNextPath("/admin")).toBe("/account");
    expect(safeAccountNextPath(null)).toBe("/account");
  });
});
