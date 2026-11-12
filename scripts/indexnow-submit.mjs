#!/usr/bin/env node
/**
 * IndexNow submitter for wsmlending.com (ADR-013).
 *
 * IndexNow tells Bing, Yandex, Seznam, Naver and the other participating engines
 * that URLs changed, so they recrawl in minutes rather than whenever they next
 * get round to it. Google does not participate; it reads the sitemap.
 *
 *   pnpm seo:indexnow --all                 every URL in the live sitemap
 *   pnpm seo:indexnow --since <commit>      only pages whose source changed
 *   add --dry-run to print the payload without sending it
 *
 * Guarantees, in order:
 *   1. The key comes from the one key file in apps/web/public, and that file
 *      must hold exactly its own name.
 *   2. Before anything is sent, the live https://wsmlending.com/<key>.txt must
 *      answer 200 (no redirect) with exactly the key. An engine that cannot
 *      verify the key ignores the submission and may distrust the host.
 *   3. URLs come only from the live sitemap, which lists only indexable pages,
 *      and anything not on https://wsmlending.com is dropped before sending.
 *
 * It sends public URLs and nothing else: no credentials, no personal data. It is
 * an operator tool, not part of the app, so nothing in the Worker calls it.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { routesForChangedFiles } from "./seo/route-sources.mjs";

export const SITE_HOST = "wsmlending.com";
export const SITE_ORIGIN = `https://${SITE_HOST}`;
export const ENDPOINT = "https://api.indexnow.org/indexnow";
/** The protocol's per-request ceiling. */
export const MAX_URLS_PER_REQUEST = 10_000;

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC_DIR = "apps/web/public";
const KEY_FILE = /^([0-9a-f]{32})\.txt$/;
const USER_AGENT = "wsmlending-indexnow/1.0";

/** The key, read from the single <key>.txt in apps/web/public. */
export function findKey(root) {
  const names = readdirSync(join(root, PUBLIC_DIR)).filter((name) => KEY_FILE.test(name));
  if (names.length !== 1) {
    throw new Error(
      `expected exactly one IndexNow key file in ${PUBLIC_DIR}, found ${names.length}`
    );
  }
  const [name] = names;
  const key = name.slice(0, 32);
  const body = readFileSync(join(root, PUBLIC_DIR, name), "utf8").trim();
  if (body !== key) throw new Error(`${PUBLIC_DIR}/${name} must contain exactly ${key}`);
  return key;
}

export function keyLocation(key) {
  return `${SITE_ORIGIN}/${key}.txt`;
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Every <loc> in a sitemap document, in order. */
export function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => decodeXml(match[1]));
}

/**
 * Split URLs into the ones this script may send (https, exactly wsmlending.com,
 * no credentials, no fragment) and the ones it must not. Deduplicated.
 */
export function canonicalOnly(urls) {
  const kept = [];
  const dropped = [];
  const seen = new Set();
  for (const raw of urls) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      dropped.push(raw);
      continue;
    }
    const ok =
      url.protocol === "https:" &&
      url.host === SITE_HOST &&
      url.username === "" &&
      url.password === "" &&
      url.hash === "";
    if (!ok) {
      dropped.push(raw);
      continue;
    }
    const value = url.toString();
    if (!seen.has(value)) {
      seen.add(value);
      kept.push(value);
    }
  }
  return { kept, dropped };
}

export function chunk(list, size) {
  const out = [];
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size));
  return out;
}

export function buildPayload(key, urls) {
  const { kept, dropped } = canonicalOnly(urls);
  if (dropped.length > 0) throw new Error(`refusing non-${SITE_HOST} URLs: ${dropped.join(", ")}`);
  return { host: SITE_HOST, key, keyLocation: keyLocation(key), urlList: kept };
}

export function parseArgs(argv) {
  const args = { all: false, since: null, dryRun: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") args.all = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--since") {
      const ref = argv[index + 1];
      if (ref === undefined || ref.startsWith("--")) throw new Error("--since needs a commit");
      args.since = ref;
      index += 1;
    } else throw new Error(`unknown argument: ${arg}`);
  }
  if (!args.help && args.all === (args.since !== null)) {
    throw new Error("choose exactly one of --all or --since <commit>");
  }
  return args;
}

async function get(url, fetchImpl) {
  const response = await fetchImpl(url, {
    redirect: "manual",
    headers: { "User-Agent": USER_AGENT, "Cache-Control": "no-cache" }
  });
  return {
    status: response.status,
    location: response.headers.get("location"),
    body: await response.text()
  };
}

/** The live key file must answer 200, not a redirect, with exactly the key. */
export async function verifyLiveKey(key, fetchImpl = fetch) {
  const location = keyLocation(key);
  let result;
  try {
    result = await get(location, fetchImpl);
  } catch (error) {
    return { ok: false, reason: `${location} could not be fetched: ${error.message}` };
  }
  if (result.status !== 200) {
    const where = result.location === null ? "" : ` -> ${result.location}`;
    return { ok: false, reason: `${location} answered ${result.status}${where}` };
  }
  if (result.body.trim() !== key) {
    return { ok: false, reason: `${location} does not contain the key` };
  }
  return { ok: true, reason: `${location} serves the key` };
}

/** The URLs in the live sitemap, already filtered to wsmlending.com. */
export async function liveSitemapUrls(fetchImpl = fetch) {
  const location = `${SITE_ORIGIN}/sitemap.xml`;
  const result = await get(location, fetchImpl);
  if (result.status !== 200) {
    const where = result.location === null ? "" : ` -> ${result.location}`;
    throw new Error(`${location} answered ${result.status}${where}; deploy first`);
  }
  const { kept, dropped } = canonicalOnly(parseSitemapLocs(result.body));
  if (dropped.length > 0) {
    console.warn(`dropping ${dropped.length} sitemap URL(s) not on ${SITE_HOST}`);
  }
  return kept;
}

export function changedFilesSince(root, ref) {
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  const output = git(["diff", "--name-only", ref, "HEAD"]);
  return output === "" ? [] : output.split("\n");
}

/** The sitemap URLs whose rendering files changed between `ref` and HEAD. */
export function urlsChangedSince(root, ref, sitemapUrls) {
  const files = changedFilesSince(root, ref);
  const byPath = new Map(sitemapUrls.map((url) => [new URL(url).pathname, url]));
  const changed = routesForChangedFiles(root, [...byPath.keys()], files);
  return changed.map((path) => byPath.get(path));
}

export async function submit(payload, fetchImpl = fetch) {
  const response = await fetchImpl(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", "User-Agent": USER_AGENT },
    body: JSON.stringify(payload)
  });
  return { status: response.status, body: await response.text() };
}

const HELP = `Usage: pnpm seo:indexnow (--all | --since <commit>) [--dry-run]

  --all             submit every URL in https://${SITE_HOST}/sitemap.xml
  --since <commit>  submit only sitemap URLs whose page or content changed
  --dry-run         verify and print the payload; send nothing`;

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${HELP}`);
    process.exit(2);
  }
  if (args.help) {
    console.log(HELP);
    return;
  }

  const key = findKey(ROOT);
  const verification = await verifyLiveKey(key);
  if (!verification.ok) {
    if (!args.dryRun) {
      console.error(`indexnow: key check failed, nothing sent. ${verification.reason}`);
      process.exit(1);
    }
    console.warn(`indexnow: key check failed (dry run continues): ${verification.reason}`);
  } else {
    console.log(`indexnow: ${verification.reason}`);
  }

  const sitemapUrls = await liveSitemapUrls();
  const urls = args.all ? sitemapUrls : urlsChangedSince(ROOT, args.since, sitemapUrls);
  if (urls.length === 0) {
    console.log("indexnow: nothing to submit");
    return;
  }
  console.log(
    `indexnow: ${urls.length} URL(s) ${args.all ? "from the sitemap" : `changed since ${args.since}`}`
  );

  let failed = false;
  for (const batch of chunk(urls, MAX_URLS_PER_REQUEST)) {
    const payload = buildPayload(key, batch);
    if (args.dryRun) {
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }
    const result = await submit(payload);
    // 200 accepted; 202 accepted with key validation still pending.
    if (result.status === 200 || result.status === 202) {
      console.log(`indexnow: ${result.status} for ${batch.length} URL(s)`);
    } else {
      failed = true;
      console.error(`indexnow: ${result.status} ${result.body.slice(0, 300)}`);
    }
  }
  if (args.dryRun) console.log("indexnow: dry run, nothing sent");
  if (failed) process.exit(1);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`indexnow: ${error.message}`);
    process.exit(1);
  });
}
