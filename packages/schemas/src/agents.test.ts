import { describe, expect, it } from "vitest";
import {
  AGENT_COVERAGE_MAX_ZIPS,
  AGENT_LICENSE_NUMBER_REGEX,
  AgentCoverageSchema,
  AgentJoinRequestSchema,
  AgentPublicSchema
} from "./agents";

const valid = {
  firstName: "Pat",
  lastName: "Fixture",
  email: "  Pat.Fixture@Example.COM ",
  phone: "(813) 555-0101",
  licenseNumber: "SL-3512901",
  brokerage: "Sample Realty",
  cities: "Tampa, St. Petersburg",
  bio: "Synthetic fixture bio.",
  displayConsent: true,
  turnstileToken: "token",
  submissionId: "00000000-0000-4000-8000-000000000001"
};

describe("AgentJoinRequestSchema", () => {
  it("accepts a complete request and normalizes the email casing", () => {
    const parsed = AgentJoinRequestSchema.parse(valid);
    expect(parsed.email).toBe("pat.fixture@example.com");
    expect(parsed.licenseNumber).toBe("SL-3512901");
    expect(parsed.displayConsent).toBe(true);
  });

  it("accepts the minimal request: brokerage, bio, and honeypot are optional", () => {
    const { brokerage: _b, bio: _bio, ...minimal } = valid;
    const parsed = AgentJoinRequestSchema.parse(minimal);
    expect(parsed.brokerage).toBeUndefined();
    expect(parsed.bio).toBeUndefined();
  });

  it("strips unknown keys instead of storing them", () => {
    const parsed = AgentJoinRequestSchema.parse({ ...valid, ssn: "000-00-0000" });
    expect("ssn" in parsed).toBe(false);
  });

  it("enforces the license number charset and bounds", () => {
    for (const good of ["ABCD", "sl-1234567", "A1B2-C3D4", "a".repeat(20)]) {
      expect(AGENT_LICENSE_NUMBER_REGEX.test(good)).toBe(true);
      expect(AgentJoinRequestSchema.safeParse({ ...valid, licenseNumber: good }).success).toBe(
        true
      );
    }
    for (const bad of [
      "",
      "ABC",
      "a".repeat(21),
      "SL 123456",
      "SL_123456",
      "SL#12345",
      "éclair1"
    ]) {
      expect(AgentJoinRequestSchema.safeParse({ ...valid, licenseNumber: bad }).success).toBe(
        false
      );
    }
  });

  it("bounds the name fields at 1–80 characters", () => {
    expect(AgentJoinRequestSchema.safeParse({ ...valid, firstName: "" }).success).toBe(false);
    expect(AgentJoinRequestSchema.safeParse({ ...valid, firstName: "   " }).success).toBe(false);
    expect(AgentJoinRequestSchema.safeParse({ ...valid, lastName: "x".repeat(80) }).success).toBe(
      true
    );
    expect(AgentJoinRequestSchema.safeParse({ ...valid, lastName: "x".repeat(81) }).success).toBe(
      false
    );
  });

  it("requires cities and bounds it at 400 characters", () => {
    expect(AgentJoinRequestSchema.safeParse({ ...valid, cities: "" }).success).toBe(false);
    expect(AgentJoinRequestSchema.safeParse({ ...valid, cities: "x".repeat(400) }).success).toBe(
      true
    );
    expect(AgentJoinRequestSchema.safeParse({ ...valid, cities: "x".repeat(401) }).success).toBe(
      false
    );
  });

  it("bounds the optional prose fields", () => {
    expect(AgentJoinRequestSchema.safeParse({ ...valid, brokerage: "x".repeat(121) }).success).toBe(
      false
    );
    expect(AgentJoinRequestSchema.safeParse({ ...valid, bio: "x".repeat(1000) }).success).toBe(
      true
    );
    expect(AgentJoinRequestSchema.safeParse({ ...valid, bio: "x".repeat(1001) }).success).toBe(
      false
    );
  });

  it("requires a phone number, same as the lead form", () => {
    const { phone: _p, ...withoutPhone } = valid;
    expect(AgentJoinRequestSchema.safeParse(withoutPhone).success).toBe(false);
    expect(AgentJoinRequestSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });

  it("treats a populated honeypot as invalid", () => {
    expect(AgentJoinRequestSchema.safeParse({ ...valid, honeypot: "" }).success).toBe(true);
    expect(AgentJoinRequestSchema.safeParse({ ...valid, honeypot: "gotcha" }).success).toBe(false);
  });

  it("requires an explicit boolean display consent", () => {
    expect(AgentJoinRequestSchema.safeParse({ ...valid, displayConsent: "true" }).success).toBe(
      false
    );
    const withheld = AgentJoinRequestSchema.parse({ ...valid, displayConsent: false });
    expect(withheld.displayConsent).toBe(false);
  });

  it("requires a uuid submission id", () => {
    expect(AgentJoinRequestSchema.safeParse({ ...valid, submissionId: "not-a-uuid" }).success).toBe(
      false
    );
  });
});

describe("AgentCoverageSchema", () => {
  it("accepts a set of five-digit ZIPs", () => {
    const parsed = AgentCoverageSchema.parse({ zips: ["33602", "33701", "34600"] });
    expect(parsed.zips).toEqual(["33602", "33701", "34600"]);
  });

  it("accepts an empty set — clearing coverage is a valid replace-set", () => {
    expect(AgentCoverageSchema.parse({ zips: [] }).zips).toEqual([]);
  });

  it("dedupes repeated ZIPs rather than rejecting them", () => {
    const parsed = AgentCoverageSchema.parse({ zips: ["33602", "33602", " 33602 "] });
    expect(parsed.zips).toEqual(["33602"]);
  });

  it("rejects anything that is not exactly five digits", () => {
    for (const bad of ["3360", "336022", "abcde", "3360a", ""]) {
      expect(AgentCoverageSchema.safeParse({ zips: [bad] }).success).toBe(false);
    }
  });

  it("enforces the per-request ZIP ceiling", () => {
    const atLimit = Array.from({ length: AGENT_COVERAGE_MAX_ZIPS }, (_, index) =>
      String(30000 + index)
    );
    expect(AgentCoverageSchema.safeParse({ zips: atLimit }).success).toBe(true);
    expect(AgentCoverageSchema.safeParse({ zips: [...atLimit, "39999"] }).success).toBe(false);
  });
});

describe("AgentPublicSchema", () => {
  it("models the unverified license as a pending fact, not an absent field", () => {
    const parsed = AgentPublicSchema.parse({
      id: "00000000-0000-4000-8000-000000000240",
      slug: "pat-fixture",
      firstName: "Pat",
      lastName: "Fixture",
      brokerage: null,
      cities: "Tampa",
      bio: null,
      licenseNumber: "SL-3512901",
      licenseVerified: false,
      unclaimed: false,
      county: null
    });
    expect(parsed.licenseVerified).toBe(false);
  });

  it("models an unclaimed public-record profile", () => {
    const parsed = AgentPublicSchema.parse({
      id: "00000000-0000-4000-8000-000000000243",
      slug: "devon-unclaimed-sl0000004",
      firstName: "Devon",
      lastName: "Unclaimed",
      brokerage: "Public Records Realty",
      cities: "Clearwater",
      bio: null,
      licenseNumber: "SL0000004",
      licenseVerified: false,
      unclaimed: true,
      county: "Pinellas"
    });
    expect(parsed.unclaimed).toBe(true);
    expect(parsed.county).toBe("Pinellas");
  });
});
