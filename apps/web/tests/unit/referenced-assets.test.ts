import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

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
 * literals pointing at /brand/ or /og/ and asserts each one resolves.
 */

const WEB_ROOT = resolve(__dirname, "..", "..");
const PUBLIC_DIR = join(WEB_ROOT, "public");
const SCAN_DIRS = ["app", "lib", "components", "content"];
const ASSET_REFERENCE = /["'`](\/(?:brand|og)\/[A-Za-z0-9._/-]+)["'`]/g;

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

  it("serves every /brand and /og asset referenced in source", () => {
    const missing = referencedAssets()
      .filter(({ path }) => !existsSync(join(PUBLIC_DIR, path.replace(/^\//, ""))))
      .map(({ path, from }) => `${path} (referenced by ${from})`);
    expect(missing).toEqual([]);
  });

  it("serves a favicon and an Apple touch icon", () => {
    expect(existsSync(join(WEB_ROOT, "app", "icon.png"))).toBe(true);
    expect(existsSync(join(WEB_ROOT, "app", "apple-icon.png"))).toBe(true);
  });
});
