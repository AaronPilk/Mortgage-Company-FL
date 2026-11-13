/**
 * Types for the IndexNow submitter, so its pure parts are unit-tested from the
 * TypeScript suite while the script itself stays dependency-free plain Node.
 */
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export declare const SITE_HOST: string;
export declare const SITE_ORIGIN: string;
export declare const ENDPOINT: string;
export declare const MAX_URLS_PER_REQUEST: number;
export declare function findKey(root: string): string;
export declare function keyLocation(key: string): string;
export declare function parseSitemapLocs(xml: string): string[];
export declare function canonicalOnly(urls: string[]): { kept: string[]; dropped: string[] };
export declare function chunk<T>(list: T[], size: number): T[][];
export declare function buildPayload(key: string, urls: string[]): IndexNowPayload;
export declare function parseArgs(argv: string[]): {
  all: boolean;
  since: string | null;
  dryRun: boolean;
  help: boolean;
};
export declare function verifyLiveKey(
  key: string,
  fetchImpl?: FetchLike
): Promise<{ ok: boolean; reason: string }>;
export declare function liveSitemapUrls(fetchImpl?: FetchLike): Promise<string[]>;
export declare function changedFilesSince(root: string, ref: string): string[];
export declare function urlsChangedSince(
  root: string,
  ref: string,
  sitemapUrls: string[]
): string[];
export declare function submit(
  payload: IndexNowPayload,
  fetchImpl?: FetchLike
): Promise<{ status: number; body: string }>;
