import { describe, expect, it } from "vitest";
import {
  ContactNormalizationError,
  maskEmail,
  maskPhone,
  normalizeEmail,
  normalizePhoneE164
} from "./contact";
import { CreateLeadSchema } from "./lead";
import { EnvironmentError, assertProductionReady, parseServerEnv } from "./env";
import { apiFailure, apiSuccess, fieldErrors } from "./api";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Aaron@Example.COM ")).toBe("aaron@example.com");
  });

  it("keeps plus tags and dots as distinct identities", () => {
    expect(normalizeEmail("a.b+tract@gmail.com")).toBe("a.b+tract@gmail.com");
  });

  it("rejects malformed addresses", () => {
    for (const bad of ["", "no-at-sign", "a@b", "a b@c.com", "@example.com"]) {
      expect(() => normalizeEmail(bad)).toThrow(ContactNormalizationError);
    }
  });
});

describe("normalizePhoneE164", () => {
  it("normalizes common US formats to the same value", () => {
    for (const input of [
      "(813) 555-0147",
      "813-555-0147",
      "813.555.0147",
      "8135550147",
      "1 813 555 0147",
      "+1 (813) 555-0147"
    ]) {
      expect(normalizePhoneE164(input)).toBe("+18135550147");
    }
  });

  it("preserves an explicit international number", () => {
    expect(normalizePhoneE164("+442071838750")).toBe("+442071838750");
  });

  it("rejects impossible NANP numbers rather than guessing", () => {
    for (const bad of ["555", "0135550147", "1135550147", "813055014", "abcdefghij"]) {
      expect(() => normalizePhoneE164(bad)).toThrow(ContactNormalizationError);
    }
  });
});

describe("masking", () => {
  it("keeps only what an operator needs to recognize a record", () => {
    expect(maskEmail("aaron@example.com")).toBe("a••••@example.com");
    expect(maskPhone("+18135550147")).toBe("••••••••0147");
  });
});

describe("CreateLeadSchema", () => {
  const valid = {
    intent: "purchase",
    firstName: "Dana",
    lastName: "Reyes",
    email: "Dana@Example.com",
    phone: "(813) 555-0147",
    consent: {
      privacyAccepted: true,
      contactRequested: true,
      smsMarketing: false,
      emailMarketing: true,
      disclosureVersion: "lead-disclosure@2026-08-17"
    },
    attribution: { landingPath: "/mortgage/purchase" },
    turnstileToken: "test-token"
  };

  it("accepts a well-formed marketing lead and normalizes casing", () => {
    const parsed = CreateLeadSchema.parse(valid);
    expect(parsed.email).toBe("dana@example.com");
    expect(parsed.stateCode).toBe("FL");
    expect(parsed.consent.smsMarketing).toBe(false);
  });

  it("requires an affirmative privacy acceptance, not merely a boolean", () => {
    const result = CreateLeadSchema.safeParse({
      ...valid,
      consent: { ...valid.consent, privacyAccepted: false }
    });
    expect(result.success).toBe(false);
  });

  it("rejects a populated honeypot", () => {
    const result = CreateLeadSchema.safeParse({ ...valid, honeypot: "http://spam.example" });
    expect(result.success).toBe(false);
  });

  it("strips unknown keys so an attacker cannot smuggle fields into storage", () => {
    const parsed = CreateLeadSchema.parse({
      ...valid,
      ssn: "123-45-6789",
      status: "approved",
      assignedUserId: "someone-else"
    });
    expect(parsed).not.toHaveProperty("ssn");
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("assignedUserId");
  });

  it("bounds free text so a form cannot become a document channel", () => {
    const result = CreateLeadSchema.safeParse({ ...valid, message: "x".repeat(5000) });
    expect(result.success).toBe(false);
  });
});

describe("parseServerEnv", () => {
  it("boots with everything disabled and no secrets present", () => {
    const env = parseServerEnv({});
    expect(env.GHL_MODE).toBe("disabled");
    expect(env.AI_MODE).toBe("disabled");
    expect(env.MLS_PROVIDER).toBe("disabled");
    expect(env.FEATURE_VISION).toBe(false);
  });

  it("requires a token once GoHighLevel is switched to production", () => {
    expect(() => parseServerEnv({ GHL_MODE: "production" })).toThrow(EnvironmentError);
    expect(() =>
      parseServerEnv({
        GHL_MODE: "production",
        GHL_PRIVATE_INTEGRATION_TOKEN: "token",
        GHL_LOCATION_ID: "loc"
      })
    ).not.toThrow();
  });

  it("parses a build-time environment without demanding production secrets", () => {
    // A build legitimately parses the environment without being a deployment.
    // Coupling the two turns a missing secret into a confusing prerender error.
    expect(() => parseServerEnv({ NODE_ENV: "production" })).not.toThrow();
  });
});

describe("assertProductionReady", () => {
  it("refuses the development pepper", () => {
    const problems = assertProductionReady(parseServerEnv({}));
    expect(problems.map((problem) => problem.key)).toContain("HASH_PEPPER");
  });

  it("refuses to serve fixture listing data", () => {
    const problems = assertProductionReady(parseServerEnv({ MLS_PROVIDER: "fixture" }));
    expect(problems.map((problem) => problem.key)).toContain("MLS_PROVIDER");
  });

  it("requires a database and a real bot challenge", () => {
    const keys = assertProductionReady(parseServerEnv({})).map((problem) => problem.key);
    expect(keys).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(keys).toContain("TURNSTILE_MODE");
  });

  it("passes a fully configured deployment", () => {
    const problems = assertProductionReady(
      parseServerEnv({
        HASH_PEPPER: "a-real-production-pepper-value",
        MLS_PROVIDER: "disabled",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
        TURNSTILE_MODE: "production",
        TURNSTILE_SECRET_KEY: "turnstile-secret"
      })
    );
    expect(problems).toEqual([]);
  });

  it("never reports a secret value in a problem message", () => {
    const problems = assertProductionReady(
      parseServerEnv({ SUPABASE_SERVICE_ROLE_KEY: "super-secret-value" })
    );
    expect(JSON.stringify(problems)).not.toContain("super-secret-value");
  });
});

describe("api envelope", () => {
  it("wraps success with a request id", () => {
    expect(apiSuccess({ receiptId: "abc" }, "req-1")).toEqual({
      ok: true,
      data: { receiptId: "abc" },
      requestId: "req-1"
    });
  });

  it("never returns an internal message by default", () => {
    const failure = apiFailure("INTERNAL_ERROR", "req-2");
    expect(failure.error.message).not.toMatch(/stack|sql|token|supabase/i);
  });

  it("flattens zod issues to per-field messages", () => {
    const result = CreateLeadSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = fieldErrors(result.error);
      expect(Object.keys(fields)).toContain("email");
    }
  });
});
