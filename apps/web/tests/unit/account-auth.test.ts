import { describe, expect, it } from "vitest";
import {
  resolveAuthenticatedUserId,
  safeAccountNextPath,
  type UserResolvingClient
} from "../../lib/account-auth";

describe("account Auth callback redirect", () => {
  it("allows only private account destinations", () => {
    expect(safeAccountNextPath("/account")).toBe("/account");
    expect(safeAccountNextPath("/account/preferences")).toBe("/account/preferences");
  });

  it("allows the password-reset completion page, exactly", () => {
    expect(safeAccountNextPath("/auth/update-password")).toBe("/auth/update-password");
    expect(safeAccountNextPath("/auth/update-password/extra")).toBe("/account");
    expect(safeAccountNextPath("/auth/anything-else")).toBe("/account");
  });

  it("rejects open redirects and unrelated local paths", () => {
    expect(safeAccountNextPath("https://evil.example")).toBe("/account");
    expect(safeAccountNextPath("//evil.example/account")).toBe("/account");
    expect(safeAccountNextPath("/admin")).toBe("/account");
    expect(safeAccountNextPath(null)).toBe("/account");
  });
});

/**
 * The interpret route uses this to decide between the AI path and the free
 * deterministic parser. Every non-session outcome must resolve to null —
 * anonymous — because the fallback for "not signed in" is a working rules
 * answer, never an error and never a spend.
 */
describe("resolveAuthenticatedUserId", () => {
  const client = (
    result: { data: { user: { id: string } | null }; error: unknown } | Error
  ): UserResolvingClient => ({
    auth: {
      getUser: () => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result))
    }
  });

  it("returns the user id for a live session", async () => {
    await expect(
      resolveAuthenticatedUserId(client({ data: { user: { id: "user-1" } }, error: null }))
    ).resolves.toBe("user-1");
  });

  it("treats an unconfigured client as anonymous", async () => {
    await expect(resolveAuthenticatedUserId(null)).resolves.toBeNull();
  });

  it("treats a missing session as anonymous", async () => {
    await expect(
      resolveAuthenticatedUserId(client({ data: { user: null }, error: null }))
    ).resolves.toBeNull();
  });

  it("treats an auth error as anonymous, even when a user object is present", async () => {
    await expect(
      resolveAuthenticatedUserId(
        client({ data: { user: { id: "user-1" } }, error: new Error("expired") })
      )
    ).resolves.toBeNull();
  });

  it("treats a throwing client as anonymous rather than failing the request", async () => {
    await expect(resolveAuthenticatedUserId(client(new Error("network down")))).resolves.toBeNull();
  });
});
