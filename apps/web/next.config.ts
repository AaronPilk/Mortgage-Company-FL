import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * The CSP is intentionally strict and enumerates every third-party origin. New
 * origins are added here deliberately, which forces a conversation about what
 * the tag does before it can load. `unsafe-inline` for styles is a known,
 * documented exception for Next.js style injection; scripts do not get it.
 */
const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires 'unsafe-eval' in development for React Refresh only.
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://www.google-analytics.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Camera stays off everywhere. The RendProp capture route re-enables it
    // explicitly when that feature ships behind its flag.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : [])
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    "@tract/analytics",
    "@tract/database",
    "@tract/domain",
    "@tract/integrations",
    "@tract/mortgage-math",
    "@tract/schemas",
    "@tract/seo",
    "@tract/tokens"
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    // Remote MLS imagery is added here only once a display agreement permits it.
    remotePatterns: []
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Nothing under the API is cacheable and none of it is indexable.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" }
        ]
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" }
        ]
      },
      {
        source: "/account/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" }
        ]
      }
    ];
  }
};

export default nextConfig;
