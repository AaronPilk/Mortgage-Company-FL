/**
 * Which source files render a public route.
 *
 * Two jobs share this map, which is why it lives in one place:
 *   - the sitemap's lastmod (scripts/seo-lastmod.ts) dates each URL by the last
 *     commit that touched the files that render it;
 *   - IndexNow's --since mode (scripts/indexnow-submit.mjs) turns a list of
 *     changed files back into the URLs worth re-submitting.
 *
 * "Renders" means the page module plus the content modules it reads copy from:
 * anything under apps/web/content/ and the data modules under apps/web/lib/.
 * Shared components are deliberately left out. A button restyle is not a change
 * to what a page says, and counting it would re-date every URL on every deploy,
 * which is exactly what lastmod must not do.
 *
 * Plain Node with no dependencies, so the IndexNow script runs without a build.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const APP_DIR = "apps/web/app";

/**
 * Public paths served by a different file than the path implies, because the
 * middleware rewrites them (apps/web/lib/host-routing.ts, ADR-011).
 */
export const REWRITTEN_ROUTES = {
  "/": `${APP_DIR}/wml/page.tsx`
};

const PAGE_FILES = ["page.tsx", "page.ts", "route.ts"];

/** A data module whose contents are page copy, by import specifier. */
const CONTENT_IMPORT =
  /from\s+["']@\/((?:content\/[^"']+)|(?:lib\/(?:[\w-]+-data|dpa-programs)))["']/g;

function isDirectory(root, relative) {
  try {
    return readdirSync(join(root, relative)) !== null;
  } catch {
    return false;
  }
}

/** The page module that renders a path, or null when no file does. */
export function pageFileForRoute(root, path) {
  if (Object.hasOwn(REWRITTEN_ROUTES, path)) return REWRITTEN_ROUTES[path];
  const segments = path.split("/").filter((segment) => segment !== "");
  let directory = APP_DIR;
  for (const segment of segments) {
    if (isDirectory(root, `${directory}/${segment}`)) {
      directory = `${directory}/${segment}`;
      continue;
    }
    // One dynamic segment per level ([slug], [term], [county]); catch-alls are
    // not used by any public route.
    const dynamic = readdirSync(join(root, directory), { withFileTypes: true }).find(
      (entry) => entry.isDirectory() && /^\[[^.\]]+\]$/.test(entry.name)
    );
    if (dynamic === undefined) return null;
    directory = `${directory}/${dynamic.name}`;
  }
  const file = PAGE_FILES.find((name) => existsSync(join(root, directory, name)));
  return file === undefined ? null : `${directory}/${file}`;
}

function resolveModule(root, specifier) {
  const base = `apps/web/${specifier}`;
  for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (existsSync(join(root, candidate))) return candidate;
  }
  return null;
}

/** The article category file that holds a /resources/<slug> article. */
export function articleFileForSlug(root, slug) {
  const directory = "apps/web/content/articles";
  for (const name of readdirSync(join(root, directory)).sort()) {
    if (!name.endsWith(".ts") || name === "index.ts" || name === "types.ts") continue;
    const source = readFileSync(join(root, directory, name), "utf8");
    if (source.includes(`slug: "${slug}"`)) return `${directory}/${name}`;
  }
  return null;
}

/** Every file whose change changes what this path says, sorted. */
export function sourceFilesForRoute(root, path) {
  const page = pageFileForRoute(root, path);
  if (page === null) return [];
  const files = new Set([page]);
  const source = readFileSync(join(root, page), "utf8");
  for (const match of source.matchAll(CONTENT_IMPORT)) {
    const specifier = match[1] ?? "";
    // The registry decides indexation, not copy; type modules carry no copy.
    if (specifier === "content/routes" || specifier.endsWith("/types")) continue;
    const file = resolveModule(root, specifier);
    if (file !== null) files.add(file);
  }
  const article = /^\/resources\/([^/]+)$/.exec(path);
  if (article !== null) {
    const file = articleFileForSlug(root, article[1] ?? "");
    if (file !== null) files.add(file);
  }
  return [...files].sort();
}

/** The paths, out of `paths`, that any of `changedFiles` renders. */
export function routesForChangedFiles(root, paths, changedFiles) {
  const changed = new Set(changedFiles);
  return paths.filter((path) => sourceFilesForRoute(root, path).some((file) => changed.has(file)));
}
