import { NextResponse, type NextRequest } from "next/server";

/**
 * Host canonicalization.
 *
 * This application has one production home. But its repository is connected to
 * more than one deployment surface — the Vercel Git integration builds every
 * push to main into a publicly reachable production alias, and the hosting
 * plan there cannot gate production URLs. A second live copy of a mortgage
 * site is a compliance problem (it serves with whatever half-configured
 * environment it happens to have) and an SEO problem (a full duplicate of
 * every page).
 *
 * Rather than chase each surface with platform settings, the application
 * refuses to serve from a host it does not recognise: any request whose host
 * is neither the canonical origin nor a local/loopback host is permanently
 * redirected to the canonical origin, path and query intact. A stray deploy
 * anywhere becomes a redirect to the real site instead of a duplicate.
 *
 * NEXT_PUBLIC_SITE_URL is inlined at build time from the committed
 * .env.production, so the canonical host survives every runtime environment,
 * including one with no variables configured at all — which is exactly the
 * environment a stray deployment has.
 */
const CANONICAL = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
})();

/** Local development and test harnesses are never redirected. */
const LOCAL_HOSTS = /^(localhost|127\.|0\.0\.0\.0|\[?::1)/i;

export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get("host") ?? "";

  if (host === CANONICAL.host || LOCAL_HOSTS.test(host)) {
    return NextResponse.next();
  }

  const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL);
  const response = NextResponse.redirect(destination, 308);
  // Belt and braces: even the redirect response tells crawlers not to index.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  /*
   * Static assets are excluded: a hotlinked image continuing to serve is
   * harmless, and excluding them keeps the middleware off the hot path for
   * the majority of requests on the canonical host.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|images/|og/).*)"]
};
