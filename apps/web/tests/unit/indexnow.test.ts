import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ENDPOINT,
  MAX_URLS_PER_REQUEST,
  buildPayload,
  canonicalOnly,
  chunk,
  findKey,
  keyLocation,
  liveSitemapUrls,
  parseArgs,
  parseSitemapLocs,
  submit,
  verifyLiveKey
} from "../../../../scripts/indexnow-submit.mjs";
import {
  routesForChangedFiles,
  sourceFilesForRoute
} from "../../../../scripts/seo/route-sources.mjs";

/**
 * The IndexNow submitter's guarantees: one key from one file, a live key check
 * before anything is sent, and nothing but wsmlending.com URLs in a payload.
 */

const ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const PUBLIC = fileURLToPath(new URL("../../public/", import.meta.url));

function respond(status: number, body: string, location?: string): Response {
  return new Response(body, {
    status,
    headers: location === undefined ? {} : { location }
  });
}

describe("the key file", () => {
  it("is the single 32-hex file in public/ and holds exactly its own name", () => {
    const files = readdirSync(PUBLIC).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
    expect(files).toHaveLength(1);
    const key = findKey(ROOT);
    expect(files[0]).toBe(`${key}.txt`);
    expect(readFileSync(`${PUBLIC}${key}.txt`, "utf8").trim()).toBe(key);
    expect(keyLocation(key)).toBe(`https://wsmlending.com/${key}.txt`);
  });
});

describe("URL filtering", () => {
  it("keeps only https wsmlending.com URLs, deduplicated", () => {
    const { kept, dropped } = canonicalOnly([
      "https://wsmlending.com/",
      "https://wsmlending.com/mortgage/fha",
      "https://wsmlending.com/mortgage/fha",
      "https://tractrealestate.com/mortgage/fha",
      "http://wsmlending.com/plan",
      "https://www.wsmlending.com/plan",
      "https://wsmlending.com.evil.example/plan",
      "https://user:pass@wsmlending.com/plan",
      "https://wsmlending.com/plan#top",
      "not a url"
    ]);
    expect(kept).toEqual(["https://wsmlending.com/", "https://wsmlending.com/mortgage/fha"]);
    expect(dropped).toHaveLength(7);
  });

  it("refuses to build a payload that would carry another host", () => {
    expect(() =>
      buildPayload("3ebfb1c079568642ad474586bff48aca", ["https://tractrealestate.com/"])
    ).toThrow(/refusing/);
    expect(buildPayload("3ebfb1c079568642ad474586bff48aca", ["https://wsmlending.com/"])).toEqual({
      host: "wsmlending.com",
      key: "3ebfb1c079568642ad474586bff48aca",
      keyLocation: "https://wsmlending.com/3ebfb1c079568642ad474586bff48aca.txt",
      urlList: ["https://wsmlending.com/"]
    });
  });

  it("reads <loc> values out of a sitemap, decoding entities", () => {
    const xml = `<?xml version="1.0"?><urlset><url><loc>https://wsmlending.com/</loc></url>
      <url><loc> https://wsmlending.com/a?b=1&amp;c=2 </loc></url></urlset>`;
    expect(parseSitemapLocs(xml)).toEqual([
      "https://wsmlending.com/",
      "https://wsmlending.com/a?b=1&c=2"
    ]);
  });

  it("batches at the protocol ceiling", () => {
    expect(MAX_URLS_PER_REQUEST).toBe(10_000);
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe("arguments", () => {
  it("requires exactly one mode", () => {
    expect(parseArgs(["--all"])).toMatchObject({ all: true, since: null, dryRun: false });
    expect(parseArgs(["--since", "abc123", "--dry-run"])).toMatchObject({
      all: false,
      since: "abc123",
      dryRun: true
    });
    expect(() => parseArgs([])).toThrow();
    expect(() => parseArgs(["--all", "--since", "abc"])).toThrow();
    expect(() => parseArgs(["--since"])).toThrow();
    expect(() => parseArgs(["--bogus"])).toThrow();
  });
});

describe("live checks", () => {
  const key = "3ebfb1c079568642ad474586bff48aca";

  it("accepts the key only from a 200 with the exact body", async () => {
    expect((await verifyLiveKey(key, async () => respond(200, `${key}\n`))).ok).toBe(true);
    expect((await verifyLiveKey(key, async () => respond(200, "something else"))).ok).toBe(false);
    const redirected = await verifyLiveKey(key, async () =>
      respond(308, "", "https://example.com/")
    );
    expect(redirected.ok).toBe(false);
    expect(redirected.reason).toContain("308");
    expect(
      (
        await verifyLiveKey(key, async () => {
          throw new Error("offline");
        })
      ).ok
    ).toBe(false);
  });

  it("does not follow a redirect when checking the key or reading the sitemap", async () => {
    const seen: RequestInit[] = [];
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      seen.push(init ?? {});
      return respond(200, `<urlset><url><loc>https://wsmlending.com/</loc></url></urlset>`);
    };
    await verifyLiveKey(key, fetchImpl);
    await liveSitemapUrls(fetchImpl);
    expect(seen.map((init) => init.redirect)).toEqual(["manual", "manual"]);
  });

  it("refuses a sitemap that redirects, and drops foreign URLs from one that does not", async () => {
    await expect(
      liveSitemapUrls(async () => respond(308, "", "https://tractrealestate.com/sitemap.xml"))
    ).rejects.toThrow(/308/);
    const urls = await liveSitemapUrls(async () =>
      respond(
        200,
        `<urlset><url><loc>https://wsmlending.com/</loc></url>
         <url><loc>https://tractrealestate.com/plan</loc></url></urlset>`
      )
    );
    expect(urls).toEqual(["https://wsmlending.com/"]);
  });

  it("posts JSON to the IndexNow endpoint", async () => {
    let captured: { url: string; init: RequestInit | undefined } | null = null;
    const result = await submit(
      buildPayload(key, ["https://wsmlending.com/"]),
      async (url, init) => {
        captured = { url, init };
        return respond(202, "");
      }
    );
    expect(result.status).toBe(202);
    expect(captured).not.toBeNull();
    const { url, init } = captured as unknown as { url: string; init: RequestInit };
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      host: "wsmlending.com",
      urlList: ["https://wsmlending.com/"]
    });
  });
});

describe("changed files to URLs", () => {
  const paths = [
    "/",
    "/mortgage/fha",
    "/mortgage/va",
    "/resources/fha-mip-explained",
    "/calculators/affordability",
    "/licenses"
  ];

  it("maps the landing file to the homepage, not to /wml", () => {
    expect(sourceFilesForRoute(ROOT, "/")).toEqual(["apps/web/app/wml/page.tsx"]);
    expect(routesForChangedFiles(ROOT, paths, ["apps/web/app/wml/page.tsx"])).toEqual(["/"]);
  });

  it("maps a content module to every page that renders it", () => {
    expect(routesForChangedFiles(ROOT, paths, ["apps/web/content/programs.ts"])).toEqual([
      "/mortgage/fha",
      "/mortgage/va"
    ]);
  });

  it("maps an article category file to its own articles only", () => {
    const file = sourceFilesForRoute(ROOT, "/resources/fha-mip-explained").find((candidate) =>
      /content\/articles\/(?!index|types)/.test(candidate)
    );
    expect(file).toBeDefined();
    expect(routesForChangedFiles(ROOT, paths, [file ?? ""])).toEqual([
      "/resources/fha-mip-explained"
    ]);
  });

  it("ignores shared components, which do not change what a page says", () => {
    expect(routesForChangedFiles(ROOT, paths, ["apps/web/components/ui.tsx"])).toEqual([]);
  });
});
