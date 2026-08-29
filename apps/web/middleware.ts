import { NextResponse, type NextRequest } from "next/server";

/**
 * Two brand domains, one Worker.
 *
 * This app is one codebase serving two hosts:
 *   - the TRACT product domain (NEXT_PUBLIC_SITE_URL, e.g. tractrealestate.com)
 *   - the Wholesale Mortgage Lending marketing domain (NEXT_PUBLIC_COMPANY_URL,
 *     e.g. wsmlending.com)
 *
 * The WML host serves the landing (`/wml`, a real page with its own WML chrome)
 * at its apex, plus `/api/*` so the landing's lead form posts to THIS Worker
 * same-origin instead of being redirected cross-origin (which the lead endpoint
 * would reject). Its own product links already point at the TRACT domain, so any
 * other path that reaches that host — a crawler, a typed URL — is sent to the
 * product. The TRACT host serves the full app.
 *
 * Which chrome renders is decided by the `x-tract-brand` request header set here
 * and read by the root layout: `wml` on the landing, TRACT everywhere else. The
 * header is set on the rewritten request, so a visitor never sees it.
 *
 * The original job survives underneath: any host that is NEITHER of the two known
 * origins nor local is a stray deployment (the Vercel Git integration builds every
 * push to main into a public alias) and is permanently redirected to the canonical
 * product origin, noindex, path + query intact — a stray deploy becomes a redirect,
 * never a duplicate.
 *
 * NEXT_PUBLIC_* are inlined at build time, so both origins survive a runtime with
 * no variables configured at all — exactly the environment a stray deploy has.
 */
function urlOrNull(value: string | undefined): URL | null {
  if (value === undefined || value === "") return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const CANONICAL = urlOrNull(process.env.NEXT_PUBLIC_SITE_URL) ?? new URL("http://localhost:3000");
const WML = urlOrNull(process.env.NEXT_PUBLIC_COMPANY_URL);

/**
 * Local development and test harnesses are never redirected or rewritten.
 * Anchored end-to-end (port optional) so a crafted host like
 * `localhost.attacker.com` is not misread as local and served un-redirected.
 */
const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1)(:\d+)?$/i;

/**
 * Serve a request with the brand marker the root layout reads to pick chrome.
 * The header rides on the (optionally rewritten) request, so it never reaches
 * the browser. `rewriteTo` swaps the landing in without changing the URL.
 */
function brandedResponse(
  request: NextRequest,
  brand: "wml" | "tract",
  rewriteTo?: string
): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-tract-brand", brand);
  const init = { request: { headers } };
  return rewriteTo === undefined
    ? NextResponse.next(init)
    : NextResponse.rewrite(new URL(rewriteTo, request.url), init);
}

export function middleware(request: NextRequest): NextResponse {
  // Match on the bare host so a `www.` visitor to either brand domain is routed
  // like the apex rather than mistaken for a stray deployment. The env origins
  // are apex, and each landing/page canonical points at the apex, so this needs
  // no separate www redirect.
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/^www\./, "");
  const { pathname, search } = request.nextUrl;

  if (LOCAL_HOSTS.test(host)) {
    // Local dev serves the landing at /wml directly; brand it so its chrome is
    // right, and leave every other path on the default TRACT chrome.
    return pathname === "/wml"
      ? brandedResponse(request, "wml")
      : brandedResponse(request, "tract");
  }

  // The Wholesale Mortgage Lending marketing host: serve the landing at the root
  // with WML chrome, pass /api through same-origin so the lead form works, and
  // send every other path to the product to avoid duplicate content.
  if (WML !== null && host === WML.host && WML.host !== CANONICAL.host) {
    if (pathname === "/") {
      return brandedResponse(request, "wml", "/wml");
    }
    if (pathname === "/wml") {
      return brandedResponse(request, "wml");
    }
    if (pathname.startsWith("/api/")) {
      // Pass through same-origin, but still stamp the brand ourselves so a
      // client-supplied x-tract-brand never reaches an API route.
      return brandedResponse(request, "tract");
    }
    return NextResponse.redirect(new URL(pathname + search, CANONICAL), 308);
  }

  // The TRACT product host: serve the app as-is. The WML landing is also
  // reachable here at /wml (its canonical still points at the WML apex); render
  // it with WML chrome so the brand never mixes.
  if (host === CANONICAL.host) {
    return pathname === "/wml"
      ? brandedResponse(request, "wml")
      : brandedResponse(request, "tract");
  }

  // Any other host is a stray deployment: redirect to the canonical product
  // origin, path + query intact, and tell crawlers not to index the redirect.
  const destination = new URL(pathname + search, CANONICAL);
  const response = NextResponse.redirect(destination, 308);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  /*
   * Static assets are excluded so the middleware stays off the hot path and, on
   * the WML host, the landing's own images (/brand/...) are served rather than
   * redirected to the product domain.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|images/|og/).*)"]
};
