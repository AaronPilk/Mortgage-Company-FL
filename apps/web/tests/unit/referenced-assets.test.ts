import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { FLORIDA_FIXTURES } from "@tract/integrations";

/**
 * Assets the site promises exist.
 *
 * A missing icon or Open Graph image is invisible in every other check — the
 * build succeeds, no page throws, nothing logs. It surfaces as a blank card
 * when someone shares a link, or a broken install prompt on a phone.
 *
 * This shipped to production once: /og/default.png, /brand/wordmark.svg and all
 * three PWA icons were referenced in source and all returned 404.
 *
 * Rather than list the paths (which would drift), this scans the source for
 * literals pointing at /brand/, /og/ or /images/ and asserts each one resolves.
 *
 * /images/ is in scope because photography is now referenced from page bodies
 * rather than only from metadata: a broken one is a hole in a layout that a type
 * checker, a linter, and a build all pass straight over.
 */

const WEB_ROOT = resolve(__dirname, "..", "..");
const PUBLIC_DIR = join(WEB_ROOT, "public");
const SCAN_DIRS = ["app", "lib", "components", "content"];
const ASSET_REFERENCE = /["'`](\/(?:brand|og|images)\/[A-Za-z0-9._/-]+)["'`]/g;

function sourceFiles(dir: string): string[] {
  const root = join(WEB_ROOT, dir);
  if (!existsSync(root)) return [];
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry) && !full.includes("tests")) found.push(full);
    }
  };
  walk(root);
  return found;
}

function referencedAssets(): { path: string; from: string }[] {
  const references: { path: string; from: string }[] = [];
  for (const dir of SCAN_DIRS) {
    for (const file of sourceFiles(dir)) {
      const contents = readFileSync(file, "utf8");
      for (const match of contents.matchAll(ASSET_REFERENCE)) {
        const assetPath = match[1];
        if (assetPath !== undefined) {
          references.push({ path: assetPath, from: file.slice(WEB_ROOT.length + 1) });
        }
      }
    }
  }
  return references;
}

describe("referenced assets", () => {
  it("finds asset references to check, so a passing result means something", () => {
    expect(referencedAssets().length).toBeGreaterThan(0);
  });

  it("serves every /brand, /og and /images asset referenced in source", () => {
    const missing = referencedAssets()
      .filter(({ path }) => !existsSync(join(PUBLIC_DIR, path.replace(/^\//, ""))))
      .map(({ path, from }) => `${path} (referenced by ${from})`);
    expect(missing).toEqual([]);
  });

  /*
   * The fixture listing images live in @tract/integrations, outside the scanned
   * directories, and resolve against this app's public directory at runtime. A
   * package that cannot see the web app's `public` folder cannot check that for
   * itself, so the check belongs here.
   */
  it("serves every image referenced by the listing fixtures", () => {
    const missing = FLORIDA_FIXTURES.flatMap((listing) =>
      listing.primaryImage === undefined ? [] : [listing.primaryImage.url]
    ).filter((path) => !existsSync(join(PUBLIC_DIR, path.replace(/^\//, ""))));
    expect(missing).toEqual([]);
  });

  it("serves every path the asset manifest claims", () => {
    const manifest = JSON.parse(
      readFileSync(join(PUBLIC_DIR, "images", "asset-manifest.json"), "utf8")
    ) as { assets: { path: string }[] };
    expect(manifest.assets.length).toBeGreaterThan(0);
    const missing = manifest.assets
      .map((asset) => asset.path)
      .filter((path) => !existsSync(join(PUBLIC_DIR, path.replace(/^\//, ""))));
    expect(missing).toEqual([]);
  });

  it("lists every shipped image in the asset manifest", () => {
    const manifest = JSON.parse(
      readFileSync(join(PUBLIC_DIR, "images", "asset-manifest.json"), "utf8")
    ) as { assets: { path: string }[] };
    const declared = new Set(manifest.assets.map((asset) => asset.path));

    const onDisk: string[] = [];
    const walk = (current: string): void => {
      for (const entry of readdirSync(current)) {
        const full = join(current, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(webp|png|jpg|jpeg|avif|svg)$/i.test(entry)) {
          onDisk.push(
            `/${full
              .slice(PUBLIC_DIR.length + 1)
              .split(sep)
              .join("/")}`
          );
        }
      }
    };
    walk(join(PUBLIC_DIR, "images"));

    expect(onDisk.filter((path) => !declared.has(path))).toEqual([]);
  });

  it("serves a favicon and an Apple touch icon", () => {
    expect(existsSync(join(WEB_ROOT, "app", "icon.png"))).toBe(true);
    expect(existsSync(join(WEB_ROOT, "app", "apple-icon.png"))).toBe(true);
  });
});
