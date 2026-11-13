import { NextResponse, type NextRequest } from "next/server";
import { routeRequest, type Brand } from "./lib/host-routing";

/**
 * One domain, one Worker (ADR-011).
 *
 * wsmlending.com (NEXT_PUBLIC_SITE_URL) is the only public origin. The routing
 * table lives in lib/host-routing.ts as a pure function so it is unit-tested;
 * this file only turns its decision into a NextResponse.
 *
 * Which chrome renders is decided by the `x-tract-brand` request header set here
 * and read by the root layout: `wml` (the landing's lighter chrome) on the
 * landing, `tract` (the internal name for the full site chrome) everywhere else.
 * The header rides on the (possibly rewritten) request, so a visitor never sees
 * it.
 *
 * Any other host (tractrealestate.com, workers.dev, a Vercel alias) is
 * permanently redirected to the canonical origin, noindex, path and query
 * intact. NEXT_PUBLIC_* values are inlined at build time, so this holds even in
 * a runtime with no variables configured, which is exactly what a stray deploy
 * has.
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

function withBrand(request: NextRequest, brand: Brand): { request: { headers: Headers } } {
  const headers = new Headers(request.headers);
  headers.set("x-tract-brand", brand);
  return { request: { headers } };
}

export function middleware(request: NextRequest): NextResponse {
  const decision = routeRequest(
    {
      host: request.headers.get("host") ?? "",
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search
    },
    CANONICAL
  );

  switch (decision.kind) {
    case "next":
      return NextResponse.next(withBrand(request, decision.brand));
    case "rewrite": {
      // Clone rather than resolve a relative path, so the query string survives
      // the rewrite for any server component that reads searchParams.
      const destination = request.nextUrl.clone();
      destination.pathname = decision.pathname;
      return NextResponse.rewrite(destination, withBrand(request, decision.brand));
    }
    case "redirect": {
      const response = NextResponse.redirect(decision.location, decision.status);
      if (decision.noindex) response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
  }
}

export const config = {
  /*
   * Static assets are excluded so the middleware stays off the hot path. On
   * Cloudflare, files under public/ (the IndexNow key, /brand, /images) are
   * served by the assets layer before the Worker runs at all.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|images/|og/).*)"]
};
