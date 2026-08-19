import { describe, expect, it } from "vitest";
import {
  SAMPLE_AGENTS,
  SAMPLE_BROKERAGE,
  SAMPLE_LICENSE_PATTERN,
  SAMPLE_NAME_PREFIX,
  cityList,
  sampleAgentBySlug,
  sampleAgentsForCity,
  sampleDisplayName
} from "../../components/agents/sample-agents";

/**
 * The sample-agent fixture contract (invariant 6): every fixture must be
 * obviously an invention to a reader AND to this test, and no fixture may
 * carry a claim that would need verification to be honest.
 */

const DIRECTORY_CITIES = [
  "St. Petersburg",
  "Tampa",
  "Orlando",
  "Sarasota",
  "Miami",
  "Jacksonville"
];

describe("sample agent fixtures", () => {
  it("ships a small, deliberate set", () => {
    expect(SAMPLE_AGENTS.length).toBeGreaterThanOrEqual(8);
    expect(SAMPLE_AGENTS.length).toBeLessThanOrEqual(10);
  });

  it("marks every fixture as a sample in every machine-readable way", () => {
    for (const agent of SAMPLE_AGENTS) {
      expect(agent.isSample).toBe(true);
      expect(agent.id.startsWith("sample-agent-")).toBe(true);
      expect(agent.slug.startsWith("sample-")).toBe(true);
    }
  });

  it("never claims a verified license and only uses the reserved fake shape", () => {
    for (const agent of SAMPLE_AGENTS) {
      expect(agent.licenseVerified).toBe(false);
      expect(agent.licenseNumber).toMatch(SAMPLE_LICENSE_PATTERN);
    }
  });

  it("is obviously sample to a reader: name prefix, example brokerage, illustrative bio", () => {
    for (const agent of SAMPLE_AGENTS) {
      expect(sampleDisplayName(agent).startsWith(SAMPLE_NAME_PREFIX)).toBe(true);
      expect(agent.brokerage).toBe(SAMPLE_BROKERAGE);
      expect(agent.bio).toMatch(/^Illustrative sample bio\./);
    }
  });

  it("carries no contact details, because no agent surface may display them", () => {
    for (const agent of SAMPLE_AGENTS) {
      const record = agent as Record<string, unknown>;
      expect(record).not.toHaveProperty("email");
      expect(record).not.toHaveProperty("phone");
      const values = JSON.stringify(agent);
      expect(values).not.toMatch(/@/);
      expect(values).not.toMatch(/\(\d{3}\)|\d{3}-\d{3}-\d{4}/);
    }
  });

  it("uses unique ids and slugs and stays inside the directory's launch cities", () => {
    expect(new Set(SAMPLE_AGENTS.map((agent) => agent.id)).size).toBe(SAMPLE_AGENTS.length);
    expect(new Set(SAMPLE_AGENTS.map((agent) => agent.slug)).size).toBe(SAMPLE_AGENTS.length);
    for (const agent of SAMPLE_AGENTS) {
      const cities = cityList(agent.cities);
      expect(cities.length).toBeGreaterThan(0);
      for (const city of cities) {
        expect(DIRECTORY_CITIES).toContain(city);
      }
    }
    // Every launch city has at least one profile, so the filter is exercisable.
    for (const city of DIRECTORY_CITIES) {
      expect(sampleAgentsForCity(city).length).toBeGreaterThan(0);
    }
  });

  it("filters by city case-insensitively and looks up by slug", () => {
    expect(sampleAgentsForCity("")).toHaveLength(SAMPLE_AGENTS.length);
    expect(
      sampleAgentsForCity("tampa").every((agent) => cityList(agent.cities).includes("Tampa"))
    ).toBe(true);
    expect(sampleAgentBySlug("sample-jordan-rivera")?.firstName).toBe("Jordan");
    expect(sampleAgentBySlug("no-such-agent")).toBeUndefined();
  });
});
