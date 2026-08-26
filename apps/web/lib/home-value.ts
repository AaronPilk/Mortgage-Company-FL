import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { homeEquity } from "@tract/mortgage-math";
import { propertyFacts } from "./property";
import type { HomeLookupAddress } from "./home-lookup-types";
import type { HomeValueDashboard, HomeValueSnapshot } from "./home-value-types";

/**
 * Homeowner value dashboard — orchestration.
 *
 * The homeowner's own address drives an automated valuation (ATTOM AVM); the
 * balance they typed is only used to show estimated equity. Every write goes
 * through the caller's RLS-subject client, so a row is only ever the signed-in
 * owner's. The valuation is an estimate, never an appraisal or an offer, and
 * equity arithmetic lives in `@tract/mortgage-math` (invariant 1).
 *
 * v1 is user-initiated: the owner asks for an estimate and each ask writes at
 * most one snapshot per day. The automated daily re-snapshot (spend reserved
 * before the provider is called, per invariant 8) is a separate, later pass.
 */

export const HOME_VALUE_SAMPLE_NOTICE =
  "This is illustrative sample data, not a real valuation. The figures are invented and must not be presented as facts about an actual home.";

export type { HomeValueDashboard, HomeValueSnapshot } from "./home-value-types";

export type CaptureHomeValueOutcome =
  | { status: "saved"; dashboard: HomeValueDashboard }
  | { status: "not_found" }
  | { status: "unavailable" };

type SnapshotRow = {
  captured_on: string;
  estimated_value_cents: number | string;
  value_low_cents: number | string | null;
  value_high_cents: number | string | null;
  source: string;
};

function toSnapshot(row: SnapshotRow): HomeValueSnapshot {
  return {
    capturedOn: row.captured_on,
    estimatedValueCents: Number(row.estimated_value_cents),
    valueLowCents: row.value_low_cents === null ? null : Number(row.value_low_cents),
    valueHighCents: row.value_high_cents === null ? null : Number(row.value_high_cents)
  };
}

/**
 * Look up the home's automated value and persist it: one home profile per owner,
 * one value snapshot per day (a same-day repeat overwrites). Returns the fresh
 * dashboard, a clean miss, or a generic unavailability — no provider detail ever
 * reaches the caller.
 */
export async function captureHomeValue(params: {
  supabase: SupabaseClient;
  userId: string;
  address: HomeLookupAddress;
  estimatedBalanceCents: number;
}): Promise<CaptureHomeValueOutcome> {
  const sourced = await propertyFacts().lookup(params.address);
  if (sourced === null) return { status: "not_found" };

  const facts = sourced.value;
  const estimatedValueCents =
    facts.marketValueCents ?? facts.assessedValueCents ?? facts.lastSalePriceCents;
  if (estimatedValueCents === undefined) return { status: "not_found" };

  const source = sourced.provenance.provider === "fixture" ? "fixture" : "attom";
  const normalized = facts.normalizedAddress;

  const profileWrite = await params.supabase.from("home_profiles").upsert(
    {
      owner_user_id: params.userId,
      address_line1: normalized.line1,
      address_city: normalized.city,
      address_state: normalized.state,
      address_postal_code: normalized.postalCode,
      latitude: facts.coordinates?.latitude ?? null,
      longitude: facts.coordinates?.longitude ?? null,
      estimated_balance_cents: params.estimatedBalanceCents,
      updated_at: new Date().toISOString()
    },
    { onConflict: "owner_user_id" }
  );
  if (profileWrite.error !== null) return { status: "unavailable" };

  const capturedOn = new Date().toISOString().slice(0, 10);
  const snapshotWrite = await params.supabase.from("home_value_snapshots").upsert(
    {
      owner_user_id: params.userId,
      captured_on: capturedOn,
      estimated_value_cents: estimatedValueCents,
      value_low_cents: facts.marketValueLowCents ?? null,
      value_high_cents: facts.marketValueHighCents ?? null,
      source
    },
    { onConflict: "owner_user_id,captured_on" }
  );
  if (snapshotWrite.error !== null) return { status: "unavailable" };

  const dashboard = await readHomeDashboard(params.supabase, params.userId);
  if (dashboard === null) return { status: "unavailable" };
  return { status: "saved", dashboard };
}

/**
 * Read the signed-in owner's dashboard: their home profile and its value history
 * (RLS scopes both to auth.uid()). Returns null when they have no home yet or no
 * snapshot has landed — the account page then shows the "get an estimate" prompt.
 */
export async function readHomeDashboard(
  supabase: SupabaseClient,
  userId: string
): Promise<HomeValueDashboard | null> {
  const profileResult = await supabase
    .from("home_profiles")
    .select(
      "address_line1, address_city, address_state, address_postal_code, estimated_balance_cents, current_rate_bp"
    )
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (profileResult.error !== null || profileResult.data === null) return null;

  const snapshotResult = await supabase
    .from("home_value_snapshots")
    .select("captured_on, estimated_value_cents, value_low_cents, value_high_cents, source")
    .eq("owner_user_id", userId)
    .order("captured_on", { ascending: true })
    .limit(24);
  const rows = (snapshotResult.data ?? []) as SnapshotRow[];
  if (snapshotResult.error !== null || rows.length === 0) return null;

  const history = rows.map(toSnapshot);
  const current = history[history.length - 1];
  const first = history[0];
  // rows.length >= 1 was just checked, so both are present; the guard also
  // narrows the types for strict indexed access.
  if (current === undefined || first === undefined) return null;
  const estimatedBalanceCents = Number(profileResult.data.estimated_balance_cents);
  const equity = homeEquity(current.estimatedValueCents, estimatedBalanceCents);

  return {
    address: {
      line1: profileResult.data.address_line1 as string,
      city: profileResult.data.address_city as string,
      state: profileResult.data.address_state as string,
      postalCode: profileResult.data.address_postal_code as string
    },
    estimatedBalanceCents,
    currentRateBp:
      profileResult.data.current_rate_bp == null
        ? null
        : Number(profileResult.data.current_rate_bp),
    current,
    equityCents: equity.equityCents,
    equityShareBasisPoints: equity.equityShareBasisPoints,
    loanToValueBasisPoints: equity.loanToValueBasisPoints,
    history,
    changeSinceFirstCents:
      history.length > 1 ? current.estimatedValueCents - first.estimatedValueCents : null,
    sampleData: rows[rows.length - 1]?.source === "fixture"
  };
}
