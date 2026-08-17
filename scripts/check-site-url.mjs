/**
 * Deploy-build guard.
 *
 * NEXT_PUBLIC_SITE_URL is read at BUILD time: canonical tags, og:url, the
 * JSON-LD @id graph, robots.txt, and sitemap.xml are all baked during
 * `next build`. Getting it wrong produces a deployment that looks completely
 * healthy while telling every crawler the canonical version of each page lives
 * somewhere that does not exist.
 *
 * The value lives in apps/web/.env.production, which is committed, so a
 * Git-connected build needs no dashboard configuration. An environment variable
 * overrides it for one-off builds against a different origin.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ENV_FILE = fileURLToPath(new URL("../apps/web/.env.production", import.meta.url));

function fail(reason, hint) {
  console.error(`\ncf:build refused: ${reason}\n`);
  if (hint !== undefined) console.error(`${hint}\n`);
  process.exit(1);
}

function readEnvFile() {
  let contents;
  try {
    contents = readFileSync(ENV_FILE, "utf8");
  } catch {
    return {};
  }
  const values = {};
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!key.startsWith("NEXT_PUBLIC_")) {
      fail(
        `apps/web/.env.production contains a non-public key: ${key}`,
        "That file is committed to git and its values reach the browser.\n" +
          "Only NEXT_PUBLIC_* values belong there. Use `wrangler secret put` for secrets."
      );
    }
    values[key] = value;
  }
  return values;
}

const fileValues = readEnvFile();
const fromEnvironment = process.env.NEXT_PUBLIC_SITE_URL;
const raw = (fromEnvironment ?? fileValues.NEXT_PUBLIC_SITE_URL ?? "").trim();
const source = fromEnvironment === undefined ? "apps/web/.env.production" : "environment";

if (raw === "") {
  fail(
    "NEXT_PUBLIC_SITE_URL is not set",
    "Set it in apps/web/.env.production, or pass it for a one-off build:\n" +
      "  NEXT_PUBLIC_SITE_URL=https://your-domain.example pnpm cf:build"
  );
}

let url;
try {
  url = new URL(raw);
} catch {
  fail(
    `NEXT_PUBLIC_SITE_URL is not a valid URL (from ${source}): ${raw}`,
    "It must be exactly an origin and nothing else, e.g. https://example.com"
  );
}

if (url.protocol !== "https:") {
  fail(`NEXT_PUBLIC_SITE_URL must be https (from ${source}): ${raw}`);
}
if (/^(localhost|127\.|0\.0\.0\.0|\[?::1)/i.test(url.hostname)) {
  fail(`NEXT_PUBLIC_SITE_URL points at a local host (from ${source}): ${raw}`);
}

process.env.NEXT_PUBLIC_SITE_URL = url.origin;
console.log(`cf:build: canonical origin is ${url.origin} (from ${source})`);
