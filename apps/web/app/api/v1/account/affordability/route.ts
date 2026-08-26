import { type NextRequest, NextResponse } from "next/server";
import { AffordabilityProfileSchema } from "@tract/schemas";
import { dollarsToCents } from "@tract/mortgage-math";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";

export const dynamic = "force-dynamic";

/**
 * Saved affordability profile — PUT upserts the signed-in visitor's row.
 *
 * Reads happen server-side in the account page (a same-origin GET does not carry
 * an Origin header, so the mutation gate would reject it); this route is the
 * write. RLS scopes the upsert to auth.uid(); the same-origin + auth gate in
 * beginAccountMutation is the application check that pairs with it (invariant 4).
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, AffordabilityProfileSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  const { error } = await context.supabase.from("affordability_profiles").upsert(
    {
      owner_user_id: context.userId,
      annual_income_cents: dollarsToCents(body.annualIncome),
      down_payment_cents: dollarsToCents(body.downPayment),
      monthly_debts_cents: dollarsToCents(body.monthlyDebts),
      credit_band: body.creditBand,
      updated_at: new Date().toISOString()
    },
    { onConflict: "owner_user_id" }
  );
  if (error !== null) return accountFailure("INTERNAL_ERROR", context.requestId);
  return accountSuccess({ saved: true }, context.requestId);
}
