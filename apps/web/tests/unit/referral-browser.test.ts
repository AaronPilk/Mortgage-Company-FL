import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readReferralSlug, storeReferral } from "@/lib/referral-browser";

/**
 * The client referral store is deliberately forgiving: it must never throw into
 * a form submission, it validates the slug shape the same way the server does,
 * it keeps the *first* referral within the window so the agent who actually
 * introduced the visitor keeps the credit, and it forgets a link older than 90
 * days. The test env is Node, so a minimal localStorage stand-in stands in for
 * the browser.
 */

class MemoryStorage {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const KEY = "tract.referral";

function seed(record: unknown): void {
  (window.localStorage as unknown as MemoryStorage).setItem(KEY, JSON.stringify(record));
}

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: new MemoryStorage() },
    configurable: true,
    writable: true
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("storeReferral / readReferralSlug", () => {
  it("round-trips a valid slug", () => {
    storeReferral("jane-broker");
    expect(readReferralSlug()).toBe("jane-broker");
  });

  it("normalizes case and surrounding whitespace on write", () => {
    storeReferral("  Jane-Broker  ");
    expect(readReferralSlug()).toBe("jane-broker");
  });

  it("ignores a malformed slug", () => {
    storeReferral("jane broker!");
    expect(readReferralSlug()).toBeUndefined();
  });

  it("keeps the first referral within the retention window", () => {
    storeReferral("agent-a");
    storeReferral("agent-b");
    expect(readReferralSlug()).toBe("agent-a");
  });

  it("returns undefined when nothing is stored", () => {
    expect(readReferralSlug()).toBeUndefined();
  });

  it("expires a referral older than 90 days", () => {
    const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
    seed({ slug: "old-agent", storedAt: ninetyOneDaysAgo });
    expect(readReferralSlug()).toBeUndefined();
  });

  it("honors a referral just inside the window", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    seed({ slug: "fresh-agent", storedAt: yesterday });
    expect(readReferralSlug()).toBe("fresh-agent");
  });

  it("treats malformed stored JSON as no referral", () => {
    (window.localStorage as unknown as MemoryStorage).setItem(KEY, "{not json");
    expect(readReferralSlug()).toBeUndefined();
  });

  it("treats a record missing fields as no referral", () => {
    seed({ slug: "half-agent" });
    expect(readReferralSlug()).toBeUndefined();
  });

  it("does not throw when storage is unavailable", () => {
    Reflect.deleteProperty(globalThis, "window");
    expect(() => storeReferral("jane-broker")).not.toThrow();
    expect(readReferralSlug()).toBeUndefined();
  });
});
