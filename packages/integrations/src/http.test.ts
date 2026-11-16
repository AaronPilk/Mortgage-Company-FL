import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultFetch } from "./http";

/** A fetch with the Workers runtime's rule: it must be called as a free function. */
function strictFetch(this: unknown): Promise<Response> {
  if (this !== undefined && this !== globalThis) {
    return Promise.reject(new TypeError("Illegal invocation"));
  }
  return Promise.resolve(new Response("ok"));
}

describe("defaultFetch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls the global fetch as a free function even when stored as a method", async () => {
    vi.stubGlobal("fetch", strictFetch);
    const adapter = { fetchImpl: defaultFetch(undefined) };
    await expect(adapter.fetchImpl("https://example.com")).resolves.toBeInstanceOf(Response);
  });

  it("returns an injected implementation untouched", () => {
    const injected = (async () => new Response("")) as typeof fetch;
    expect(defaultFetch(injected)).toBe(injected);
  });

  it("reproduces the failure the wrapper exists for", async () => {
    vi.stubGlobal("fetch", strictFetch);
    const broken = { fetchImpl: globalThis.fetch };
    await expect(broken.fetchImpl("https://example.com")).rejects.toThrow("Illegal invocation");
  });
});
