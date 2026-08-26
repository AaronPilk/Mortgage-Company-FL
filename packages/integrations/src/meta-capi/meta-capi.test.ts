import { describe, expect, it } from "vitest";

import { assertCrmPayloadSafe } from "../crm/port";
import {
  DisabledMetaCapiAdapter,
  FixtureMetaCapiAdapter,
  RealMetaCapiAdapter,
  buildFbc,
  dispatchLeadConversion,
  hasMarketingConsent,
  hashEmail,
  hashPhone,
  mapLeadToConversion,
  parseMetaLeadSource,
  sha256Hex,
  type MetaConversionEvent,
  type MetaLeadSource
} from "./index";

/**
 * The lead payload as it lands in the outbox row. gclid is null on purpose (the
 * real payload nulls absent attribution), so the defensive parser is exercised.
 */
const basePayload = {
  externalId: "receipt-1",
  firstName: "Dana",
  lastName: "Reyes",
  email: "Borrower@Example.com",
  phoneE164: "+18135550147",
  intent: "purchase",
  sourcePath: "/mortgage/purchase",
  consent: {
    smsMarketing: false,
    emailMarketing: true,
    receivedAtIso: "2026-08-17T12:00:00.000Z"
  },
  attribution: {
    utmSource: "facebook",
    utmMedium: "paid_social",
    utmCampaign: "fl-purchase",
    gclid: null,
    fbclid: "IwAR-click-xyz"
  }
};

const anyEvent: MetaConversionEvent = {
  event_name: "Lead",
  event_time: 1,
  event_id: "e",
  action_source: "website",
  user_data: { em: "x" }
};

describe("hashing", () => {
  it("is idempotent and normalizes case and whitespace before hashing", () => {
    expect(hashEmail("Borrower@Example.com")).toBe(hashEmail("Borrower@Example.com"));
    expect(hashEmail("  Borrower@Example.com  ")).toBe(hashEmail("borrower@example.com"));
    expect(hashEmail("Borrower@Example.com")).toBe(sha256Hex("borrower@example.com"));

    expect(hashPhone("+1 (813) 555-0147")).toBe(hashPhone("18135550147"));
    expect(hashPhone("+1 (813) 555-0147")).toBe(sha256Hex("18135550147"));
  });

  it("never hashes an empty identifier — an absent value stays absent", () => {
    expect(hashEmail("")).toBeUndefined();
    expect(hashEmail("   ")).toBeUndefined();
    expect(hashEmail(undefined)).toBeUndefined();
    expect(hashEmail(null)).toBeUndefined();
    expect(hashPhone("")).toBeUndefined();
    expect(hashPhone("+")).toBeUndefined();
    expect(hashPhone(undefined)).toBeUndefined();
    // The SHA-256 of "" must never be emitted as an identifier.
    expect(hashEmail("")).not.toBe(sha256Hex(""));
  });

  it("builds fbc in Meta's fixed format and omits it when there is no click id", () => {
    expect(buildFbc("abc123", 1_000)).toBe("fb.1.1000.abc123");
    expect(buildFbc("abc123", 1_000, 2)).toBe("fb.2.1000.abc123");
    expect(buildFbc(undefined, 1_000)).toBeUndefined();
    expect(buildFbc("", 1_000)).toBeUndefined();
  });
});

describe("consent predicate", () => {
  it("counts only an explicit email or SMS marketing opt-in", () => {
    expect(hasMarketingConsent({ emailMarketing: true, smsMarketing: false })).toBe(true);
    expect(hasMarketingConsent({ emailMarketing: false, smsMarketing: true })).toBe(true);
    expect(hasMarketingConsent({ emailMarketing: false, smsMarketing: false })).toBe(false);
    expect(hasMarketingConsent({})).toBe(false);
    expect(hasMarketingConsent(undefined)).toBe(false);
  });
});

describe("mapper", () => {
  it("emits only hashed identifiers — never the raw email, phone, or name", () => {
    const event = mapLeadToConversion(parseMetaLeadSource(basePayload), {
      siteBaseUrl: "https://tract.example"
    });
    expect(event).not.toBeNull();

    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("Borrower@Example.com");
    expect(serialized).not.toContain("borrower@example.com");
    expect(serialized).not.toContain("+18135550147");
    expect(serialized).not.toContain("Dana");
    expect(serialized).not.toContain("Reyes");

    expect(event?.user_data.em).toBe(sha256Hex("borrower@example.com"));
    expect(event?.user_data.ph).toBe(sha256Hex("18135550147"));
    expect(event?.user_data.fbc).toBe(
      `fb.1.${Date.parse("2026-08-17T12:00:00.000Z")}.IwAR-click-xyz`
    );
    expect(event?.custom_data).toEqual({ lead_intent: "purchase" });
    expect(event?.event_id).toBe("receipt-1");
    expect(event?.event_name).toBe("Lead");
    expect(event?.action_source).toBe("website");
    expect(event?.event_time).toBe(Math.floor(Date.parse("2026-08-17T12:00:00.000Z") / 1000));
    expect(event?.event_source_url).toBe("https://tract.example/mortgage/purchase");
  });

  it("returns null when there is no hashable email or phone", () => {
    expect(mapLeadToConversion({ externalId: "r", consent: { emailMarketing: true } })).toBeNull();
    expect(mapLeadToConversion({ externalId: "r", email: "   ", phoneE164: "+" })).toBeNull();
  });

  it("whitelists fields, so a contaminated source cannot leak and the screen passes", () => {
    // Prohibited fields are injected directly into the source. The mapper reads
    // only its whitelist, so none of them can reach the event.
    const contaminated = {
      ...basePayload,
      income: "INCOME-90000-LEAK",
      creditScore: "CREDIT-780-LEAK",
      ssn: "SSN-123-45-6789-LEAK"
    } as unknown as MetaLeadSource;

    const event = mapLeadToConversion(contaminated);
    expect(event).not.toBeNull();

    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("INCOME-90000-LEAK");
    expect(serialized).not.toContain("CREDIT-780-LEAK");
    expect(serialized).not.toContain("SSN-123-45-6789-LEAK");

    // The second barrier over the whitelist agrees: nothing prohibited rode along.
    expect(() => assertCrmPayloadSafe(event as unknown as Record<string, unknown>)).not.toThrow();
  });
});

describe("dispatch", () => {
  it("skips as disabled and touches nothing when the adapter is disabled", async () => {
    const result = await dispatchLeadConversion(new DisabledMetaCapiAdapter(), basePayload);
    expect(result).toEqual({ status: "skipped", reason: "disabled" });
  });

  it("skips without a marketing opt-in and makes no network call", async () => {
    let fetchCalls = 0;
    const adapter = new RealMetaCapiAdapter({
      pixelId: "PIXEL_123",
      accessToken: "SECRET_TOKEN",
      fetchImpl: (async () => {
        fetchCalls += 1;
        return new Response("{}", { status: 200 });
      }) as unknown as typeof fetch
    });

    const result = await dispatchLeadConversion(adapter, {
      ...basePayload,
      consent: {
        smsMarketing: false,
        emailMarketing: false,
        receivedAtIso: "2026-08-17T12:00:00.000Z"
      }
    });

    expect(result).toEqual({ status: "skipped", reason: "no_consent" });
    expect(fetchCalls).toBe(0);
  });

  it("skips as insufficient_identifiers when consent exists but no email or phone does", async () => {
    const adapter = new FixtureMetaCapiAdapter();
    const result = await dispatchLeadConversion(adapter, {
      externalId: "r",
      consent: {
        emailMarketing: true,
        smsMarketing: false,
        receivedAtIso: "2026-08-17T12:00:00.000Z"
      }
    });
    expect(result).toEqual({ status: "skipped", reason: "insufficient_identifiers" });
    expect(adapter.events).toHaveLength(0);
  });

  it("skips an unsupported event type when the caller asks it to enforce one", async () => {
    const adapter = new FixtureMetaCapiAdapter();
    const result = await dispatchLeadConversion(adapter, basePayload, {
      eventType: "plan.email_requested"
    });
    expect(result).toEqual({ status: "skipped", reason: "unsupported_event" });
    expect(adapter.events).toHaveLength(0);
  });

  it("retries a transient fixture failure and records exactly one event", async () => {
    const adapter = new FixtureMetaCapiAdapter();
    adapter.failNext(1);
    const result = await dispatchLeadConversion(adapter, basePayload, { sleep: async () => {} });
    expect(result.status).toBe("sent");
    expect(result.status === "sent" && result.eventsReceived).toBe(1);
    expect(adapter.events).toHaveLength(1);
  });
});

describe("real adapter transport", () => {
  it("posts to the pixel events endpoint with the token in the body, not the url", async () => {
    let capturedUrl = "";
    let capturedBody: Record<string, unknown> = {};
    const adapter = new RealMetaCapiAdapter({
      pixelId: "PIXEL_123",
      accessToken: "SECRET_TOKEN",
      fetchImpl: (async (url: string, init: RequestInit) => {
        capturedUrl = String(url);
        capturedBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return new Response(
          JSON.stringify({ events_received: 1, messages: [], fbtrace_id: "trace-1" }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }) as unknown as typeof fetch
    });

    const result = await dispatchLeadConversion(adapter, basePayload, { sleep: async () => {} });

    expect(capturedUrl).toContain("PIXEL_123");
    expect(capturedUrl).toContain("v21.0");
    expect(capturedUrl).toContain("/events");
    // The token is never in the URL.
    expect(capturedUrl).not.toContain("SECRET_TOKEN");
    expect(capturedUrl).not.toContain("access_token");

    expect(Array.isArray(capturedBody.data)).toBe(true);
    expect(capturedBody.access_token).toBe("SECRET_TOKEN");

    expect(result.status).toBe("sent");
    expect(result.status === "sent" && result.eventsReceived).toBe(1);
    expect(result.status === "sent" && result.fbtraceId).toBe("trace-1");
  });

  it("treats a 400 as terminal and does not retry", async () => {
    let calls = 0;
    const adapter = new RealMetaCapiAdapter({
      pixelId: "PIXEL_123",
      accessToken: "SECRET_TOKEN",
      fetchImpl: (async () => {
        calls += 1;
        return new Response(JSON.stringify({ error: { message: "bad", fbtrace_id: "trace-4" } }), {
          status: 400
        });
      }) as unknown as typeof fetch
    });

    const result = await dispatchLeadConversion(adapter, basePayload, { sleep: async () => {} });
    expect(result).toEqual({
      status: "failed",
      failureClass: "terminal",
      code: "terminal:400",
      attempts: 1
    });
    expect(calls).toBe(1);
  });

  it("retries a 503 up to the ceiling and then fails as retryable", async () => {
    let calls = 0;
    const adapter = new RealMetaCapiAdapter({
      pixelId: "PIXEL_123",
      accessToken: "SECRET_TOKEN",
      fetchImpl: (async () => {
        calls += 1;
        return new Response("{}", { status: 503 });
      }) as unknown as typeof fetch
    });

    const result = await dispatchLeadConversion(adapter, basePayload, {
      sleep: async () => {},
      rng: () => 0
    });
    expect(result.status).toBe("failed");
    expect(result.status === "failed" && result.failureClass).toBe("retryable");
    expect(result.status === "failed" && result.attempts).toBe(3);
    expect(calls).toBe(3);
  });

  it("classifies an abort/network error (no HTTP status) as retryable", async () => {
    let calls = 0;
    const adapter = new RealMetaCapiAdapter({
      pixelId: "PIXEL_123",
      accessToken: "SECRET_TOKEN",
      timeoutMs: 5,
      fetchImpl: (async () => {
        calls += 1;
        throw Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
      }) as unknown as typeof fetch
    });

    const result = await dispatchLeadConversion(adapter, basePayload, {
      sleep: async () => {},
      maxAttempts: 2
    });
    expect(result.status).toBe("failed");
    expect(result.status === "failed" && result.failureClass).toBe("retryable");
    expect(calls).toBe(2);
  });

  it("surfaces a generic error that leaks neither the token nor the provider body", async () => {
    const adapter = new RealMetaCapiAdapter({
      pixelId: "PIXEL_123",
      accessToken: "SECRET_TOKEN",
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            error: { message: "Invalid OAuth access token SECRET_TOKEN", fbtrace_id: "trace-x" }
          }),
          { status: 401 }
        )) as unknown as typeof fetch
    });

    await expect(adapter.send(anyEvent)).rejects.toMatchObject({
      status: 401,
      failureClass: "terminal",
      fbtraceId: "trace-x"
    });
    await expect(adapter.send(anyEvent)).rejects.toThrow(/status 401/);
    await expect(adapter.send(anyEvent)).rejects.not.toThrow(/SECRET_TOKEN/);
  });

  it("makes no network call from the disabled adapter", async () => {
    // The disabled adapter has no transport at all; its send is a pure no-op.
    const result = await new DisabledMetaCapiAdapter().send(anyEvent);
    expect(result).toEqual({ provider: "disabled", eventsReceived: 0 });
  });
});
