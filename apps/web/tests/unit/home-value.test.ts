import { afterEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FixturePropertyFactsPort } from "@tract/integrations";
import { dollarsToCents } from "@tract/mortgage-math";
import { captureHomeValue, readHomeDashboard } from "../../lib/home-value";
import { __setPropertyFactsForTesting } from "../../lib/property";

/**
 * The valuation provider is always injected, so no test touches the network. The
 * Supabase client is a small in-memory fake supporting exactly the calls the lib
 * makes: upsert / update on home_profiles, upsert on home_value_snapshots, and
 * the two owner-scoped reads. RLS itself is proven separately in rls-tests.sql.
 */

const USER = "00000000-0000-4000-8000-000000000002";

type Row = Record<string, unknown>;

function makeFakeSupabase() {
  const profiles = new Map<string, Row>();
  const snapshots: Row[] = [];
  const client = {
    from(table: string) {
      if (table === "home_profiles") {
        return {
          upsert: async (row: Row) => {
            profiles.set(row.owner_user_id as string, { ...row });
            return { error: null };
          },
          update: (patch: Row) => ({
            eq: async (_column: string, owner: string) => {
              const existing = profiles.get(owner);
              if (existing !== undefined) profiles.set(owner, { ...existing, ...patch });
              return { error: null };
            }
          }),
          select: (_columns: string) => ({
            eq: (_column: string, owner: string) => ({
              maybeSingle: async () => ({ data: profiles.get(owner) ?? null, error: null })
            })
          })
        };
      }
      return {
        upsert: async (row: Row) => {
          const index = snapshots.findIndex(
            (existing) =>
              existing.owner_user_id === row.owner_user_id &&
              existing.captured_on === row.captured_on
          );
          if (index >= 0) snapshots[index] = { ...row };
          else snapshots.push({ ...row });
          return { error: null };
        },
        select: (_columns: string) => ({
          eq: (_column: string, owner: string) => ({
            order: (_orderColumn: string, _options: unknown) => ({
              limit: async (_count: number) => ({
                data: snapshots
                  .filter((row) => row.owner_user_id === owner)
                  .sort((a, b) => (a.captured_on as string).localeCompare(b.captured_on as string)),
                error: null
              })
            })
          })
        })
      };
    },
    _profiles: profiles,
    _snapshots: snapshots
  };
  return client;
}

afterEach(() => {
  __setPropertyFactsForTesting(undefined);
});

describe("captureHomeValue", () => {
  it("saves a snapshot and returns a labelled dashboard with clamped equity", async () => {
    __setPropertyFactsForTesting(new FixturePropertyFactsPort());
    const supabase = makeFakeSupabase();
    const outcome = await captureHomeValue({
      supabase: supabase as unknown as SupabaseClient,
      userId: USER,
      address: { line1: "742 Evergreen Ter", city: "Sarasota", state: "FL", postalCode: "34236" },
      estimatedBalanceCents: dollarsToCents(200_000)
    });

    expect(outcome.status).toBe("saved");
    if (outcome.status !== "saved") return;
    const value = outcome.dashboard.current.estimatedValueCents;
    expect(value).toBeGreaterThan(0);
    expect(outcome.dashboard.equityCents).toBe(Math.max(0, value - dollarsToCents(200_000)));
    // Fixture data must announce itself as sample data.
    expect(outcome.dashboard.sampleData).toBe(true);
    expect(outcome.dashboard.history.length).toBe(1);
    expect(supabase._profiles.size).toBe(1);
  });

  it("reports not_found when the provider has no record", async () => {
    __setPropertyFactsForTesting({ key: "disabled", lookup: async () => null });
    const supabase = makeFakeSupabase();
    const outcome = await captureHomeValue({
      supabase: supabase as unknown as SupabaseClient,
      userId: USER,
      address: { line1: "1 Nowhere", city: "Nowhere", state: "FL", postalCode: "00000" },
      estimatedBalanceCents: 0
    });
    expect(outcome.status).toBe("not_found");
    expect(supabase._snapshots.length).toBe(0);
  });
});

describe("readHomeDashboard", () => {
  it("summarises value history into a change-since-first and current equity", async () => {
    const supabase = makeFakeSupabase();
    supabase._profiles.set(USER, {
      owner_user_id: USER,
      address_line1: "1 A St",
      address_city: "Tampa",
      address_state: "FL",
      address_postal_code: "33602",
      estimated_balance_cents: dollarsToCents(300_000),
      current_rate_bp: 725
    });
    supabase._snapshots.push(
      {
        owner_user_id: USER,
        captured_on: "2026-06-01",
        estimated_value_cents: dollarsToCents(420_000),
        value_low_cents: null,
        value_high_cents: null,
        source: "attom"
      },
      {
        owner_user_id: USER,
        captured_on: "2026-08-01",
        estimated_value_cents: dollarsToCents(435_000),
        value_low_cents: null,
        value_high_cents: null,
        source: "attom"
      }
    );

    const dashboard = await readHomeDashboard(supabase as unknown as SupabaseClient, USER);
    expect(dashboard).not.toBeNull();
    expect(dashboard!.current.estimatedValueCents).toBe(dollarsToCents(435_000));
    expect(dashboard!.changeSinceFirstCents).toBe(dollarsToCents(15_000));
    expect(dashboard!.equityCents).toBe(dollarsToCents(135_000));
    expect(dashboard!.currentRateBp).toBe(725);
    expect(dashboard!.sampleData).toBe(false);
    expect(dashboard!.history.length).toBe(2);
  });

  it("returns null when the owner has no home profile", async () => {
    const supabase = makeFakeSupabase();
    expect(await readHomeDashboard(supabase as unknown as SupabaseClient, USER)).toBeNull();
  });
});
