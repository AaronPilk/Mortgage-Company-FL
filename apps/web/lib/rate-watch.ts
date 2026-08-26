import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateTerm, RateWatchView } from "./market-rates-types";

/**
 * Saved rate watch — the server read. The write goes through
 * /api/v1/account/rate-watch; this reads the signed-in visitor's own row for the
 * account page. RLS scopes the query to auth.uid(). The stored target is basis
 * points; the view converts to a percentage for the form.
 */
export async function readRateWatch(
  supabase: SupabaseClient,
  userId: string
): Promise<RateWatchView | null> {
  const { data, error } = await supabase
    .from("rate_watches")
    .select("term, target_rate_bp, notify_email")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (error !== null || data === null) return null;
  return {
    term: data.term as RateTerm,
    targetRatePercent: data.target_rate_bp === null ? null : Number(data.target_rate_bp) / 100,
    notifyEmail: Boolean(data.notify_email)
  };
}
