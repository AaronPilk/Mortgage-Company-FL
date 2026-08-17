/**
 * Content linter.
 *
 * Mechanical checks only. It verifies that structure, sources, dates, and links
 * are present and consistent — it cannot and does not certify that a claim is
 * true. That remains a human review, and this script exits with a reminder to
 * that effect so nobody mistakes a green run for editorial approval.
 *
 * Run with: pnpm content:lint
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

type Finding = { file: string; rule: string; message: string };

const findings: Finding[] = [];
const notes: string[] = [];

function report(file: string, rule: string, message: string): void {
  findings.push({ file, rule, message });
}

/**
 * Strip comments before pattern scanning. Without this, a rule fires on the
 * comment that explains the rule — which is noise, and worse, it discourages
 * writing the explanation down.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Surfaces that are noindex by design inherit metadata from their layout. */
const INHERITS_LAYOUT_METADATA = ["/admin", "/account"];

function inheritsLayoutMetadata(path: string): boolean {
  return INHERITS_LAYOUT_METADATA.some(
    (prefix) => path !== prefix && path.startsWith(`${prefix}/`)
  );
}

function walk(directory: string, extensions: string[]): string[] {
  const out: string[] = [];
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".next" || entry === ".turbo") continue;
      const full = join(current, entry);
      if (statSync(full).isDirectory()) stack.push(full);
      else if (extensions.some((extension) => entry.endsWith(extension))) out.push(full);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 1. Route registry and page files agree
 * ------------------------------------------------------------------ */

const routesSource = readFileSync(join(ROOT, "apps/web/content/routes.ts"), "utf8");
const registeredPaths = [...routesSource.matchAll(/path:\s*"([^"]+)"/g)].map(
  (match) => match[1] ?? ""
);

const appDirectory = join(ROOT, "apps/web/app");
const pageFiles = walk(appDirectory, ["page.tsx"]);

const filePaths = pageFiles.map((file) => {
  const relativePath = relative(appDirectory, file).replace(/\/page\.tsx$/, "");
  const cleaned = relativePath
    .split("/")
    .filter((segment) => !segment.startsWith("(") && segment !== "page.tsx")
    .join("/");
  return cleaned === "" ? "/" : `/${cleaned}`;
});

for (const path of filePaths) {
  if (path.includes("[")) continue; // dynamic segments are registered by their parent
  if (inheritsLayoutMetadata(path)) continue; // never public, registered at the prefix
  if (!registeredPaths.includes(path)) {
    report(
      "apps/web/content/routes.ts",
      "unregistered-route",
      `${path} has a page file but is not in the route registry, so it will never enter the sitemap`
    );
  }
}

/* ------------------------------------------------------------------ *
 * 2. Every page declares metadata
 * ------------------------------------------------------------------ */

for (const file of pageFiles) {
  const source = readFileSync(file, "utf8");
  const relativeFile = relative(ROOT, file);
  const isDynamicChild = file.includes("[");
  const routePath = filePaths[pageFiles.indexOf(file)] ?? "";

  if (inheritsLayoutMetadata(routePath) || routePath.startsWith("/admin")) continue;

  if (!source.includes("pageMetadata") && !source.includes("generateMetadata")) {
    report(
      relativeFile,
      "missing-metadata",
      "page declares no metadata, so it inherits a generic title"
    );
  }
  if (!isDynamicChild && source.includes("export const metadata")) {
    const titleMatch = source.match(/title:\s*"([^"]+)"/);
    const descriptionMatch = source.match(/description:\s*\n?\s*"([^"]+)"/);
    if (titleMatch !== null && (titleMatch[1] ?? "").length > 60) {
      report(
        relativeFile,
        "long-title",
        `title is ${titleMatch[1]?.length} characters; aim for 60 or fewer`
      );
    }
    if (descriptionMatch !== null && (descriptionMatch[1] ?? "").length > 165) {
      report(
        relativeFile,
        "long-description",
        `description is ${descriptionMatch[1]?.length} characters; aim for 165 or fewer`
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Titles and descriptions are unique
 * ------------------------------------------------------------------ */

const seenTitles = new Map<string, string>();
const seenDescriptions = new Map<string, string>();

for (const file of pageFiles) {
  const source = readFileSync(file, "utf8");
  const relativeFile = relative(ROOT, file);
  const title = source.match(/title:\s*"([^"]+)"/)?.[1];
  const description = source.match(/description:\s*\n?\s*"([^"]+)"/)?.[1];

  if (title !== undefined) {
    const previous = seenTitles.get(title);
    if (previous !== undefined) {
      report(relativeFile, "duplicate-title", `title duplicates ${previous}`);
    }
    seenTitles.set(title, relativeFile);
  }
  if (description !== undefined) {
    const previous = seenDescriptions.get(description);
    if (previous !== undefined) {
      report(relativeFile, "duplicate-description", `description duplicates ${previous}`);
    }
    seenDescriptions.set(description, relativeFile);
  }
}

/* ------------------------------------------------------------------ *
 * 4. Internal links resolve to a registered route
 * ------------------------------------------------------------------ */

const componentFiles = walk(join(ROOT, "apps/web"), [".tsx"]);
const knownPrefixes = registeredPaths.filter((path) => path !== "/");

for (const file of componentFiles) {
  const source = readFileSync(file, "utf8");
  const relativeFile = relative(ROOT, file);
  for (const match of source.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = match[1] ?? "";
    if (href === "/" || href.startsWith("/api/")) continue;
    const registered =
      registeredPaths.includes(href) ||
      knownPrefixes.some((prefix) => href.startsWith(`${prefix}/`));
    if (!registered) {
      report(relativeFile, "broken-internal-link", `${href} is not a registered route`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 5. Legal drafts are labelled as drafts
 * ------------------------------------------------------------------ */

const LEGAL_PAGES = [
  "privacy",
  "terms",
  "accessibility",
  "licenses",
  "disclosures",
  "sms-terms",
  "do-not-sell-or-share",
  "security"
];

for (const slug of LEGAL_PAGES) {
  const file = join(appDirectory, slug, "page.tsx");
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    report(
      `apps/web/app/${slug}/page.tsx`,
      "missing-legal-page",
      "required legal page does not exist"
    );
    continue;
  }
  if (
    !source.includes("REQUIRES QUALIFIED REVIEW") &&
    !source.includes("requires review by qualified counsel")
  ) {
    report(
      `apps/web/app/${slug}/page.tsx`,
      "unlabelled-legal-draft",
      "legal page is not marked as a draft awaiting counsel review"
    );
  }
  if (!/Last updated/i.test(source)) {
    report(
      `apps/web/app/${slug}/page.tsx`,
      "missing-review-date",
      "legal page carries no last-updated date"
    );
  }
}

/* ------------------------------------------------------------------ *
 * 6. No fabricated trust signals anywhere in the app
 * ------------------------------------------------------------------ */

const FABRICATION_PATTERNS: { pattern: RegExp; rule: string }[] = [
  {
    pattern: /\b\d+(?:,\d{3})*\+? (?:happy )?(?:clients|customers|families) served\b/i,
    rule: "unsubstantiated-volume"
  },
  { pattern: /\b\d+(?:\.\d+)? stars?\b/i, rule: "unsubstantiated-rating" },
  { pattern: /\baward[- ]winning\b/i, rule: "unsubstantiated-award" },
  { pattern: /\b#1 (?:broker|lender|mortgage)\b/i, rule: "unsubstantiated-ranking" },
  { pattern: /\b\d+ years in (?:business|florida)\b/i, rule: "unsubstantiated-tenure" },
  { pattern: /\bequal housing lender\b/i, rule: "misstates-company-type" },
  { pattern: /\bNMLS #\d/i, rule: "hardcoded-license-number" }
];

for (const file of [...componentFiles, ...walk(join(ROOT, "apps/web/content"), [".ts"])]) {
  const relativeFile = relative(ROOT, file);
  // The linter's own rule table would otherwise match itself.
  if (relativeFile.includes("scripts/")) continue;
  const source = stripComments(readFileSync(file, "utf8"));
  for (const { pattern, rule } of FABRICATION_PATTERNS) {
    const match = source.match(pattern);
    if (match !== null) {
      report(relativeFile, rule, `found "${match[0]}" — must be substantiated or removed`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Output
 * ------------------------------------------------------------------ */

notes.push(
  `Checked ${pageFiles.length} pages and ${registeredPaths.length} registered routes.`,
  "This linter checks structure, not truth. Source accuracy, claim substantiation, and",
  "compliance approval remain human review and are tracked in docs/compliance/."
);

if (findings.length === 0) {
  console.log("content lint: no structural problems found");
  for (const note of notes) console.log(`  ${note}`);
  process.exit(0);
}

console.error(`content lint: ${findings.length} problem(s)\n`);
const byFile = new Map<string, Finding[]>();
for (const finding of findings) {
  const list = byFile.get(finding.file) ?? [];
  list.push(finding);
  byFile.set(finding.file, list);
}
for (const [file, list] of byFile) {
  console.error(`  ${file}`);
  for (const finding of list) console.error(`    [${finding.rule}] ${finding.message}`);
}
console.error("");
for (const note of notes) console.error(`  ${note}`);
process.exit(1);
