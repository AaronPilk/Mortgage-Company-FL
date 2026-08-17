import { NextResponse } from "next/server";
import { apiSuccess } from "@tract/schemas";
import { randomUUID } from "node:crypto";
import { features } from "@/lib/env";
import { databaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness probe.
 *
 * Reports which integrations are configured, never how. No token, endpoint,
 * account identifier, or provider error text appears in this response.
 */
export async function GET(): Promise<NextResponse> {
  const state = features();
  return NextResponse.json(
    apiSuccess(
      {
        status: "ok",
        database: databaseConfigured() ? "configured" : "unconfigured",
        integrations: {
          crm: state.ghl,
          ai: state.ai,
          listings: state.mls,
          botChallenge: state.turnstile,
          email: state.email
        },
        featureFlags: {
          vision: state.vision,
          rendProp: state.rendProp,
          propertySearch: state.propertySearch,
          accounts: state.accounts,
          secureApplication: state.secureApplicationConfigured
        }
      },
      randomUUID()
    ),
    { headers: { "Cache-Control": "no-store" } }
  );
}
