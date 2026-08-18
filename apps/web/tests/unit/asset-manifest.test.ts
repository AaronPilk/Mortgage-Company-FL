import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type AssetEntry = {
  key: string;
  path: string;
  kind: string;
  rights: string;
  label: string;
  alt: string;
  width: number;
  height: number;
  source: string;
  generator: string;
  promptVersion: string;
  transformations: string[];
  reviewed: boolean;
};

const publicRoot = path.resolve(process.cwd(), "apps/web/public");
const manifest = JSON.parse(
  readFileSync(path.join(publicRoot, "images/asset-manifest.json"), "utf8")
) as { assetDateDefault: string; assets: AssetEntry[] };

describe("canonical asset manifest", () => {
  it("tracks every required asset with local provenance and rights", () => {
    expect(manifest.assetDateDefault).toBe("2026-08-17");
    expect(manifest.assets).toHaveLength(32);
    expect(new Set(manifest.assets.map((asset) => asset.key)).size).toBe(manifest.assets.length);

    for (const asset of manifest.assets) {
      expect(asset.path).toMatch(/^\/images\//);
      expect(asset.path).not.toMatch(/^https?:/);
      expect(existsSync(path.join(publicRoot, asset.path))).toBe(true);
      expect(asset.kind.length).toBeGreaterThan(0);
      expect(asset.rights).toBe("company_generated_fixture");
      expect(asset.label.length).toBeGreaterThan(0);
      expect(asset.alt.length).toBeGreaterThan(0);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.source.length).toBeGreaterThan(0);
      expect(asset.generator.length).toBeGreaterThan(0);
      expect(asset.promptVersion).toMatch(/@\d+|@\d+\.\d+\.\d+/);
      expect(asset.transformations.length).toBeGreaterThan(0);
      expect(asset.reviewed).toBe(false);
    }
  });

  it("covers every required product family and social preview", () => {
    const keys = manifest.assets.map((asset) => asset.key);
    for (const prefix of ["home.", "properties.", "vision.", "rendprop.", "agents.", "og."]) {
      expect(keys.some((key) => key.startsWith(prefix))).toBe(true);
    }
  });
});
