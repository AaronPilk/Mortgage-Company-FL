import { describe, expect, it } from "vitest";
import { MINIMUM_PASSWORD_LENGTH, passwordProblem } from "../../lib/password";

describe("passwordProblem", () => {
  it("rejects anything under the minimum length, including empty", () => {
    expect(passwordProblem("")).not.toBeNull();
    expect(passwordProblem("a".repeat(MINIMUM_PASSWORD_LENGTH - 1))).not.toBeNull();
  });

  it("names the minimum in the message so the person knows what to fix", () => {
    expect(passwordProblem("short")).toContain(String(MINIMUM_PASSWORD_LENGTH));
  });

  it("accepts the minimum length exactly, and anything longer", () => {
    expect(passwordProblem("a".repeat(MINIMUM_PASSWORD_LENGTH))).toBeNull();
    expect(passwordProblem("a much longer passphrase with spaces")).toBeNull();
  });

  it("counts characters, not trimmed characters — spaces are legal password content", () => {
    expect(passwordProblem("      ab")).toBeNull();
  });
});
