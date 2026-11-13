import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Saved affordability profile — the server read. The write goes through
 * /api/v1/account/affordability; this reads the signed-in visitor's own row for
 * server-rendered pages (the account page, and later the home lookup and search
 * seeding). RLS scopes the query to auth.uid().
 */

export type CreditBand = "excellent" | "good" | "fair" | "building";

export type AffordabilityProfile = {
  annualIncomeCents: number;
  downPaymentCents: number;
  monthlyDebtsCents: number;
  creditBand: CreditBand;
};

export async function readAffordabilityProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<AffordabilityProfile | null> {
  const { data, error } = await supabase
    .from("affordability_profiles")
    .select("annual_income_cents, down_payment_cents, monthly_debts_cents, credit_band")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (error !== null || data === null) return null;
  return {
    annualIncomeCents: Number(data.annual_income_cents),
    downPaymentCents: Number(data.down_payment_cents),
    monthlyDebtsCents: Number(data.monthly_debts_cents),
    creditBand: data.credit_band as CreditBand
  };
}
