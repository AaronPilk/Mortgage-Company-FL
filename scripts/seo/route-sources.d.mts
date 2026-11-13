/**
 * Types for route-sources.mjs, so the TypeScript generator and tests can use the
 * same plain-Node module the IndexNow script runs.
 */
export declare const REWRITTEN_ROUTES: Record<string, string>;
export declare function pageFileForRoute(root: string, path: string): string | null;
export declare function articleFileForSlug(root: string, slug: string): string | null;
export declare function sourceFilesForRoute(root: string, path: string): string[];
export declare function routesForChangedFiles(
  root: string,
  paths: string[],
  changedFiles: string[]
): string[];
