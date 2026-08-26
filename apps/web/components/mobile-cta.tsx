"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Routes where the bar does more harm than good: pages that ARE the funnel it
 * points at (a "Start my plan" button on /plan is circular), pages with their
 * own form whose submit button the bar would shadow, and utility surfaces.
 */
const SUPPRESSED_PREFIXES = [
  "/plan",
  "/talk",
  "/contact",
  "/get-started",
  "/vision",
  "/rendprop/demo",
  "/apply",
  "/auth",
  "/account",
  "/loan",
  "/admin",
  "/agents/join"
];

/**
 * Sticky mobile action bar.
 *
 * On a phone the header scrolls away and the next call to action can be a
 * screen and a half further down. This keeps the two things a visitor is most
 * likely to want within thumb reach without occupying space on desktop, where
 * the header is already sticky and doing the same job.
 *
 * The spacer div carries the clearance the fixed bar needs, so routes that
 * suppress the bar reclaim that space automatically.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iOS home indicator.
 */
export function MobileCta() {
  const pathname = usePathname();
  if (SUPPRESSED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return (
    <>
      <div aria-hidden="true" className="h-[4.75rem] lg:hidden" />
      <div
        className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{
          /*
            Nearly opaque rather than the site's glass treatment. A translucent bar
            sits over running text at the bottom of the viewport and the two
            compete; the labels stop being readable at exactly the moment they
            matter most.
          */
          background: "color-mix(in srgb, var(--bg) 97%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -8px 30px rgb(0 0 0 / 0.12)"
        }}
      >
        <div className="flex gap-2.5 px-4 py-3">
          <Link
            href="/plan"
            data-cta="mobile-bar-plan"
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--purple)", boxShadow: "0 4px 14px var(--purple-glow)" }}
          >
            Start my plan
          </Link>
          {/* Mirrors the header CTA: /talk routes each audience to its own funnel. */}
          <Link
            href="/talk"
            data-cta="mobile-bar-contact"
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Talk to us
          </Link>
        </div>
      </div>
    </>
  );
}
