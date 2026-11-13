import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentPublic } from "@tract/schemas";

/**
 * The referral resolver is the trust boundary of the agent referral engine: a
 * slug from a shared URL is only ever an attribution *claim* until this
 * function confirms it against the public directory. These tests pin the three
 * things that make it safe — shape validation before any lookup, the
 * consenting-partner gate (an imported public record never credits a
 * referral), and the rule that every failure resolves to "no referral" rather
 * than throwing into a lead submission.
 */

const fetchAgentBySlug = vi.fn<(slug: string) => Promise<AgentPublic | null>>();
vi.mock("@/lib/agents", () => ({ fetchAgentBySlug: (slug: string) => fetchAgentBySlug(slug) }));

const { resolveReferralAgent } = await import("@/lib/referral");

function agent(overrides: Partial<AgentPublic> = {}): AgentPublic {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "jane-broker",
    firstName: "Jane",
    lastName: "Broker",
    brokerage: "Coast Realty",
    cities: "Tampa, St. Petersburg",
    bio: null,
    licenseNumber: "SL1234567",
    licenseVerified: true,
    unclaimed: false,
    county: null,
    ...overrides
  };
}

describe("resolveReferralAgent", () => {
  beforeEach(() => {
    fetchAgentBySlug.mockReset();
  });

  it("returns null for an undefined code without touching the directory", async () => {
    expect(await resolveReferralAgent(undefined)).toBeNull();
    expect(fetchAgentBySlug).not.toHaveBeenCalled();
  });

  it("rejects malformed slugs before any lookup", async () => {
    // "UPPER" is intentionally absent: case is normalized before validation, so
    // it becomes the valid slug "upper" — that path is covered below.
    for (const bad of ["Jane Broker", "jane_broker", "../etc", "a".repeat(81), "", "has space"]) {
      expect(await resolveReferralAgent(bad)).toBeNull();
    }
    expect(fetchAgentBySlug).not.toHaveBeenCalled();
  });

  it("normalizes case and whitespace before lookup", async () => {
    fetchAgentBySlug.mockResolvedValue(agent());
    await resolveReferralAgent("  Jane-Broker  ");
    expect(fetchAgentBySlug).toHaveBeenCalledWith("jane-broker");
  });

  it("resolves a claimed, consenting partner", async () => {
    const partner = agent({ unclaimed: false });
    fetchAgentBySlug.mockResolvedValue(partner);
    expect(await resolveReferralAgent("jane-broker")).toEqual(partner);
  });

  it("refuses an unclaimed public-record row", async () => {
    fetchAgentBySlug.mockResolvedValue(agent({ unclaimed: true }));
    expect(await resolveReferralAgent("jane-broker")).toBeNull();
  });

  it("returns null when the slug is not found", async () => {
    fetchAgentBySlug.mockResolvedValue(null);
    expect(await resolveReferralAgent("ghost-agent")).toBeNull();
  });

  it("swallows a directory error into no-referral", async () => {
    fetchAgentBySlug.mockRejectedValue(new Error("supabase down"));
    expect(await resolveReferralAgent("jane-broker")).toBeNull();
  });
});
