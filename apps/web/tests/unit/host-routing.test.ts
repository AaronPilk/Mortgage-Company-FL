import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextResponse } from "next/server";
import { getRedirectUrl, getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { routeRequest, type RoutingDecision } from "../../lib/host-routing";

/**
 * One domain (ADR-011). wsmlending.com serves the landing at "/" and every app
 * route directly; any other host is a permanent, noindex redirect to the same
 * path and query on wsmlending.com.
 */

const CANONICAL = new URL("https://wsmlending.com");

function route(host: string, pathname: string, search = ""): RoutingDecision {
  return routeRequest({ host, pathname, search }, CANONICAL);
}

describe("routeRequest on the canonical host", () => {
  it("serves the Wholesale Mortgage Lending landing at the root with WML chrome", () => {
    expect(route("wsmlending.com", "/")).toEqual({
      kind: "rewrite",
      brand: "wml",
      pathname: "/wml"
    });
  });

  it("treats www as the apex rather than as a stray deployment", () => {
    expect(route("www.wsmlending.com", "/")).toEqual(route("wsmlending.com", "/"));
    expect(route("WWW.WSMLENDING.COM", "/mortgage/fha")).toEqual({ kind: "next", brand: "tract" });
  });

  it("serves every public app route directly instead of redirecting away", () => {
    for (const path of [
      "/mortgage",
      "/mortgage/fha",
      "/calculators/mortgage-payment",
      "/resources",
      "/resources/fha-mip-explained",
      "/properties",
      "/agents",
      "/talk",
      "/contact",
      "/privacy",
      "/licenses",
      "/account",
      "/loan",
      "/admin",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt"
    ]) {
      expect(route("wsmlending.com", path), path).toEqual({ kind: "next", brand: "tract" });
    }
  });

  it("passes the API through same-origin and always stamps the brand itself", () => {
    expect(route("wsmlending.com", "/api/v1/leads")).toEqual({ kind: "next", brand: "tract" });
  });

  it("308s the retired /tract product home to the root, query intact (ADR-014)", () => {
    expect(route("wsmlending.com", "/tract")).toEqual({
      kind: "redirect",
      location: "https://wsmlending.com/",
      status: 308,
      noindex: false
    });
    expect(route("www.wsmlending.com", "/tract", "?utm_source=old-link")).toEqual({
      kind: "redirect",
      location: "https://wsmlending.com/?utm_source=old-link",
      status: 308,
      noindex: false
    });
  });

  it("leaves paths that merely start with /tract alone", () => {
    expect(route("wsmlending.com", "/tract/anything")).toEqual({ kind: "next", brand: "tract" });
  });

  it("sends the landing's implementation path back to the root, query intact", () => {
    expect(route("wsmlending.com", "/wml", "?utm_source=google")).toEqual({
      kind: "redirect",
      location: "https://wsmlending.com/?utm_source=google",
      status: 308,
      noindex: false
    });
  });
});

describe("routeRequest on every other host", () => {
  it("308s tractrealestate.com to the same path and query on wsmlending.com, noindex", () => {
    expect(route("tractrealestate.com", "/mortgage/fha", "?q=1")).toEqual({
      kind: "redirect",
      location: "https://wsmlending.com/mortgage/fha?q=1",
      status: 308,
      noindex: true
    });
    expect(route("www.tractrealestate.com", "/")).toEqual({
      kind: "redirect",
      location: "https://wsmlending.com/",
      status: 308,
      noindex: true
    });
  });

  it("redirects the old host's robots, sitemap and API too, so nothing is served twice", () => {
    for (const path of ["/robots.txt", "/sitemap.xml", "/api/v1/health", "/tract", "/wml"]) {
      const decision = route("tractrealestate.com", path);
      expect(decision.kind, path).toBe("redirect");
      if (decision.kind === "redirect") {
        expect(decision.location).toBe(`https://wsmlending.com${path}`);
      }
    }
  });

  it("turns workers.dev and Vercel strays into the same noindex redirect", () => {
    for (const host of [
      "mortgage-company-fl.aaron-9c3.workers.dev",
      "mortgage-company-fl-web.vercel.app",
      "random-preview-abc123.vercel.app"
    ]) {
      expect(route(host, "/calculators", "?a=b"), host).toEqual({
        kind: "redirect",
        location: "https://wsmlending.com/calculators?a=b",
        status: 308,
        noindex: true
      });
    }
  });

  it("does not mistake a crafted lookalike for a local host", () => {
    expect(route("localhost.attacker.example", "/").kind).toBe("redirect");
    expect(route("wsmlending.com.attacker.example", "/").kind).toBe("redirect");
  });
});

describe("routeRequest locally", () => {
  it("keeps the app's own layout so the browser suite needs no hosts file", () => {
    expect(route("127.0.0.1:3100", "/")).toEqual({ kind: "next", brand: "tract" });
    expect(route("localhost:3000", "/wml")).toEqual({ kind: "next", brand: "wml" });
    expect(route("localhost:3000", "/tract")).toEqual({
      kind: "rewrite",
      brand: "tract",
      pathname: "/"
    });
  });
});

describe("middleware with the production build values", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://wsmlending.com");
    vi.stubEnv("NEXT_PUBLIC_COMPANY_URL", "https://wsmlending.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function run(url: string): Promise<NextResponse> {
    const { middleware } = await import("../../middleware");
    const parsed = new URL(url);
    return middleware(new NextRequest(url, { headers: { host: parsed.host } }));
  }

  it("rewrites the wsmlending.com root to the landing, keeping the query", async () => {
    const response = await run("https://wsmlending.com/?utm_source=google");
    expect(isRewrite(response)).toBe(true);
    expect(getRewrittenUrl(response)).toBe("https://wsmlending.com/wml?utm_source=google");
  });

  it("serves robots.txt and sitemap.xml on wsmlending.com without a redirect", async () => {
    for (const path of ["/robots.txt", "/sitemap.xml"]) {
      const response = await run(`https://wsmlending.com${path}`);
      expect(getRedirectUrl(response), path).toBeNull();
      expect(isRewrite(response), path).toBe(false);
      expect(response.status, path).toBe(200);
    }
  });

  it("308s tractrealestate.com to wsmlending.com with path, query and noindex", async () => {
    const response = await run("https://tractrealestate.com/calculators/affordability?q=1");
    expect(response.status).toBe(308);
    expect(getRedirectUrl(response)).toBe("https://wsmlending.com/calculators/affordability?q=1");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("308s the retired /tract URL to the homepage on wsmlending.com", async () => {
    const response = await run("https://wsmlending.com/tract?utm_source=old-link");
    expect(response.status).toBe(308);
    expect(getRedirectUrl(response)).toBe("https://wsmlending.com/?utm_source=old-link");
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });

  it("308s a stray Vercel alias the same way", async () => {
    const response = await run("https://mortgage-company-fl-web.vercel.app/plan");
    expect(response.status).toBe(308);
    expect(getRedirectUrl(response)).toBe("https://wsmlending.com/plan");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});

describe("production configuration", () => {
  const read = (relative: string): string =>
    readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

  function envFileValue(key: string): string | undefined {
    const line = read("../../.env.production")
      .split("\n")
      .find((candidate) => candidate.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim();
  }

  it("builds with wsmlending.com as the one canonical origin", () => {
    expect(envFileValue("NEXT_PUBLIC_SITE_URL")).toBe("https://wsmlending.com");
    expect(envFileValue("NEXT_PUBLIC_COMPANY_URL")).toBe("https://wsmlending.com");
  });

  it("gives the Worker's cron the same origin the build used", () => {
    const wrangler = read("../../wrangler.jsonc");
    for (const key of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_COMPANY_URL"]) {
      const match = wrangler.match(new RegExp(`"${key}":\\s*"([^"]+)"`));
      expect(match?.[1], key).toBe(envFileValue(key));
    }
  });

  it("keeps both domains in the Turnstile hostname list", () => {
    const hostnames =
      read("../../wrangler.jsonc").match(/"TURNSTILE_HOSTNAMES":\s*"([^"]+)"/)?.[1] ?? "";
    expect(hostnames.split(",")).toEqual(
      expect.arrayContaining(["wsmlending.com", "tractrealestate.com"])
    );
  });
});
