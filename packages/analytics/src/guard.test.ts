import { describe, expect, it } from "vitest";
import type { AnalyticsEvent } from "./events";
import { AnalyticsPolicyError, assertSendable, inspectEvent } from "./guard";
import { buildTouch, parseAttributionParams, referrerHost, safeLandingPath } from "./attribution";

describe("analytics guard", () => {
  it("passes an approved event with safe parameters", () => {
    const event: AnalyticsEvent = {
      name: "generate_lead",
      formId: "consultation",
      intent: "purchase",
      leadReceiptId: "3f0c2b6a-0d4b-4e2f-9e4d-9d2f5b6a1c33"
    };
    expect(inspectEvent(event).ok).toBe(true);
  });

  it("blocks an email address hiding in an allowed parameter", () => {
    const event = {
      name: "cta_click",
      ctaId: "hero",
      placement: "home",
      destination: "dana@example.com"
    } as unknown as AnalyticsEvent;
    const result = inspectEvent(event);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/email/);
  });

  it("blocks a phone number and a government id in any string value", () => {
    for (const value of ["+1 813 555 0147", "123-45-6789"]) {
      const event = {
        name: "cta_click",
        ctaId: "hero",
        placement: "home",
        destination: value
      } as unknown as AnalyticsEvent;
      expect(inspectEvent(event).ok).toBe(false);
    }
  });

  it("blocks prohibited parameter names in both snake and camel case", () => {
    for (const key of ["credit_score", "creditBand", "annualIncome", "user_id", "prompt"]) {
      const event = {
        name: "calculator_complete",
        calculator: "payment",
        [key]: "anything"
      } as unknown as AnalyticsEvent;
      const result = inspectEvent(event);
      expect(result.ok, `${key} should be blocked`).toBe(false);
    }
  });

  it("blocks an event name outside the approved vocabulary", () => {
    const event = { name: "borrower_income_captured" } as unknown as AnalyticsEvent;
    expect(inspectEvent(event).ok).toBe(false);
  });

  it("blocks an oversized free-text value", () => {
    const event = {
      name: "cta_click",
      ctaId: "x".repeat(400),
      placement: "home",
      destination: "/apply"
    } as unknown as AnalyticsEvent;
    expect(inspectEvent(event).ok).toBe(false);
  });

  it("throws in strict mode and drops silently otherwise", () => {
    const bad = {
      name: "cta_click",
      ctaId: "a",
      placement: "b",
      ssn: "1"
    } as unknown as AnalyticsEvent;
    expect(() => assertSendable(bad, "throw")).toThrow(AnalyticsPolicyError);
    expect(assertSendable(bad, "drop")).toBe(false);
  });
});

describe("attribution parsing", () => {
  it("accepts only known parameters", () => {
    const params = parseAttributionParams(
      new URLSearchParams(
        "utm_source=google&utm_medium=cpc&gclid=abc123&session_token=secret&email=a@b.com"
      )
    );
    expect(params).toEqual({ utm_source: "google", utm_medium: "cpc", gclid: "abc123" });
    expect(params).not.toHaveProperty("session_token");
    expect(params).not.toHaveProperty("email");
  });

  it("bounds utm values more tightly than click identifiers", () => {
    const params = parseAttributionParams(
      new URLSearchParams(`utm_campaign=${"a".repeat(400)}&gclid=${"b".repeat(900)}`)
    );
    expect(params.utm_campaign).toHaveLength(200);
    expect(params.gclid).toHaveLength(512);
  });

  it("keeps only the referrer host", () => {
    expect(referrerHost("https://www.google.com/search?q=mortgage+broker+tampa")).toBe(
      "www.google.com"
    );
    expect(referrerHost("javascript:alert(1)")).toBeUndefined();
    expect(referrerHost("not a url")).toBeUndefined();
    expect(referrerHost(null)).toBeUndefined();
  });

  it("strips query and fragment from the landing path", () => {
    expect(safeLandingPath("/mortgage/fha?utm_source=x#top")).toBe("/mortgage/fha");
  });

  it("builds a touch without carrying the query string forward", () => {
    const touch = buildTouch({
      url: new URL("https://tract.example/mortgage/va?utm_source=meta&email=a@b.com"),
      referrer: "https://facebook.com/",
      occurredAt: "2026-08-17T12:00:00.000Z"
    });
    expect(touch.landingPath).toBe("/mortgage/va");
    expect(touch.referrerHost).toBe("facebook.com");
    expect(touch.params).toEqual({ utm_source: "meta" });
    expect(JSON.stringify(touch)).not.toContain("a@b.com");
  });
});
