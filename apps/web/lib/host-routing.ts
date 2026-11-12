/**
 * Host routing, as a pure decision so it can be tested without a Next runtime.
 *
 * One domain (ADR-011): wsmlending.com is the only public origin. It serves the
 * Wholesale Mortgage Lending landing at "/" and every other app route directly.
 * The old product domain (tractrealestate.com), the workers.dev origin and any
 * stray Vercel alias are all "some other host", and every other host gets a
 * permanent redirect to the same path and query on the canonical origin, marked
 * noindex so a crawler drops the old URL instead of indexing the redirect.
 *
 * Two app files trade places on the canonical host, which is why this is a
 * rewrite table rather than a plain pass-through:
 *   - "/"      renders app/wml/page.tsx, the WML landing (the company homepage);
 *   - "/tract" renders app/page.tsx, the TRACT product home, kept reachable at a
 *              non-root path and noindex so it never competes with the landing;
 *   - "/wml"   is the landing's implementation path, so it redirects to "/"
 *              rather than serving a second copy of the homepage.
 */

export type Brand = "wml" | "tract";

export type RoutingDecision =
  | { kind: "next"; brand: Brand }
  | { kind: "rewrite"; brand: Brand; pathname: string }
  | { kind: "redirect"; location: string; status: 308; noindex: boolean };

export type RoutingRequest = {
  /** The raw Host header. */
  host: string;
  pathname: string;
  /** The query string including its leading "?", or "". */
  search: string;
};

/** Where the landing and the product home are implemented inside the app. */
export const LANDING_IMPLEMENTATION_PATH = "/wml";
export const PRODUCT_HOME_PATH = "/tract";

/**
 * Local development and test harnesses are never redirected. Anchored end to end
 * (port optional) so a crafted host like `localhost.attacker.com` is not misread
 * as local and served un-redirected.
 */
const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1)(:\d+)?$/i;

/**
 * Match on the bare host so a `www.` visitor is routed like the apex rather than
 * mistaken for a stray deployment. Canonicals all name the apex, so www needs no
 * separate redirect here (the DNS-side www record is a dashboard concern).
 */
export function normalizeHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

export function isLocalHost(host: string): boolean {
  return LOCAL_HOSTS.test(normalizeHost(host));
}

export function routeRequest(request: RoutingRequest, canonical: URL): RoutingDecision {
  const host = normalizeHost(request.host);
  const { pathname, search } = request;

  if (isLocalHost(host)) {
    // Local keeps the app's own file layout so the browser suite can exercise
    // the TRACT home at "/" and the landing at "/wml" without a hosts file.
    if (pathname === LANDING_IMPLEMENTATION_PATH) return { kind: "next", brand: "wml" };
    if (pathname === PRODUCT_HOME_PATH) return { kind: "rewrite", brand: "tract", pathname: "/" };
    return { kind: "next", brand: "tract" };
  }

  if (host === canonical.host) {
    if (pathname === "/") {
      return { kind: "rewrite", brand: "wml", pathname: LANDING_IMPLEMENTATION_PATH };
    }
    if (pathname === LANDING_IMPLEMENTATION_PATH) {
      return {
        kind: "redirect",
        location: new URL(`/${search}`, canonical).toString(),
        status: 308,
        noindex: false
      };
    }
    if (pathname === PRODUCT_HOME_PATH) {
      return { kind: "rewrite", brand: "tract", pathname: "/" };
    }
    // Everything else, /api included, is served as-is with TRACT chrome. The
    // brand is always stamped here so a client-supplied x-tract-brand header
    // can never reach a page or an API route.
    return { kind: "next", brand: "tract" };
  }

  // tractrealestate.com, the workers.dev origin, a Vercel alias, anything else:
  // same path and query on the canonical origin, and never indexed.
  return {
    kind: "redirect",
    location: new URL(pathname + search, canonical).toString(),
    status: 308,
    noindex: true
  };
}
