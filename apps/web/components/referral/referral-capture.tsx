"use client";

import { useEffect } from "react";
import { storeReferral } from "@/lib/referral-browser";

/**
 * Records the referring agent slug in browser storage on mount, then renders
 * nothing. The page has already resolved the slug against the public directory
 * server-side, so this only runs for a real consenting partner — it persists
 * that fact past this page view so a lead submitted later still carries it.
 *
 * A component rather than an inline effect because the landing page is a server
 * component; this is the one small piece that needs the browser. It has no UI
 * and no props beyond the slug, and it is deliberately idempotent — the store
 * keeps the first referral it sees within the retention window.
 */
export function ReferralCapture({ slug }: { slug: string }) {
  useEffect(() => {
    storeReferral(slug);
  }, [slug]);
  return null;
}
