import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  readReferralSummary,
  readReferralTimeline,
  resolveApprovedAgent
} from "../../lib/agent-referrals";

/**
 * Unit coverage for the agent referral dashboard's data access.
 *
 * The two RPC readers and the eligibility resolver are exercised against tiny
 * hand-rolled Supabase doubles. The contract these lock down — the RPC names,
 * the `p_limit` argument, the row → view mapping, and the fail-closed defaults
 * (zeros / empty, never someone else's data) — is exactly what the integrator's
 * migration must satisfy.
 */

// A live-enough env for the flag reader; accounts default on, so the dashboard
// flag alone decides. Set before any code reads the cached server env.
process.env.FEATURE_AGENT_DASHBOARD = "true";
process.env.FEATURE_ACCOUNTS = "true";

const USER = "00000000-0000-4000-8000-000000000042";

/** A client whose single `rpc` call resolves to a fixed result. */
function rpcClient(result: { data: unknown; error: unknown }): SupabaseClient {
  return { rpc: async () => result } as unknown as SupabaseClient;
}

/** A client that records the rpc name + args, then returns a fixed result. */
function recordingRpcClient(
  result: { data: unknown; error: unknown },
  sink: { fn?: string; args?: unknown }
): SupabaseClient {
  return {
    rpc: async (fn: string, args?: unknown) => {
      sink.fn = fn;
      sink.args = args;
      return result;
    }
  } as unknown as SupabaseClient;
}

/** A client whose `from(...).select().eq().eq().order().limit().maybeSingle()` chain resolves fixed. */
function agentClient(result: { data: unknown; error: unknown }): SupabaseClient {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => result
  };
  return { from: () => chain } as unknown as SupabaseClient;
}

describe("readReferralSummary", () => {
  it("maps a single-row array from the RPC", async () => {
    const view = await readReferralSummary(
      rpcClient({
        data: [
          {
            total_count: 7,
            new_count: 3,
            working_count: 2,
            closed_count: 2,
            last_referral_at: "2026-08-24T10:00:00Z"
          }
        ],
        error: null
      })
    );
    expect(view).toEqual({
      total: 7,
      new: 3,
      working: 2,
      closed: 2,
      lastReferralAt: "2026-08-24T10:00:00Z"
    });
  });

  it("maps a bare object row (not wrapped in an array)", async () => {
    const view = await readReferralSummary(
      rpcClient({
        data: {
          total_count: 1,
          new_count: 1,
          working_count: 0,
          closed_count: 0,
          last_referral_at: null
        },
        error: null
      })
    );
    expect(view).toEqual({ total: 1, new: 1, working: 0, closed: 0, lastReferralAt: null });
  });

  it("coerces bigint counts delivered as strings", async () => {
    const view = await readReferralSummary(
      rpcClient({
        data: [
          {
            total_count: "5",
            new_count: "5",
            working_count: "0",
            closed_count: "0",
            last_referral_at: null
          }
        ],
        error: null
      })
    );
    expect(view).toEqual({ total: 5, new: 5, working: 0, closed: 0, lastReferralAt: null });
  });

  it("defaults to zeros on an RPC error", async () => {
    const view = await readReferralSummary(rpcClient({ data: null, error: { message: "boom" } }));
    expect(view).toEqual({ total: 0, new: 0, working: 0, closed: 0, lastReferralAt: null });
  });

  it("defaults to zeros on null data", async () => {
    const view = await readReferralSummary(rpcClient({ data: null, error: null }));
    expect(view).toEqual({ total: 0, new: 0, working: 0, closed: 0, lastReferralAt: null });
  });

  it("defaults to zeros on an empty array", async () => {
    const view = await readReferralSummary(rpcClient({ data: [], error: null }));
    expect(view).toEqual({ total: 0, new: 0, working: 0, closed: 0, lastReferralAt: null });
  });

  it("calls the agent_referral_summary RPC by name", async () => {
    const sink: { fn?: string; args?: unknown } = {};
    await readReferralSummary(recordingRpcClient({ data: null, error: null }, sink));
    expect(sink.fn).toBe("agent_referral_summary");
    expect(sink.args).toBeUndefined();
  });
});

describe("readReferralTimeline", () => {
  it("maps rows to (bucket, referredOn), newest first as returned", async () => {
    const rows = await readReferralTimeline(
      rpcClient({
        data: [
          { status_bucket: "new", referred_on: "2026-08-24" },
          { status_bucket: "working", referred_on: "2026-08-20" },
          { status_bucket: "closed", referred_on: "2026-08-01" }
        ],
        error: null
      })
    );
    expect(rows).toEqual([
      { bucket: "new", referredOn: "2026-08-24" },
      { bucket: "working", referredOn: "2026-08-20" },
      { bucket: "closed", referredOn: "2026-08-01" }
    ]);
  });

  it("drops a row whose bucket is not one of the three (a raw status leaked past SQL)", async () => {
    const rows = await readReferralTimeline(
      rpcClient({
        data: [
          { status_bucket: "queued", referred_on: "2026-08-24" },
          { status_bucket: "new", referred_on: "2026-08-23" }
        ],
        error: null
      })
    );
    expect(rows).toEqual([{ bucket: "new", referredOn: "2026-08-23" }]);
  });

  it("returns [] on an RPC error", async () => {
    const rows = await readReferralTimeline(
      rpcClient({
        data: [{ status_bucket: "new", referred_on: "2026-08-24" }],
        error: { message: "boom" }
      })
    );
    expect(rows).toEqual([]);
  });

  it("returns [] on null data", async () => {
    expect(await readReferralTimeline(rpcClient({ data: null, error: null }))).toEqual([]);
  });

  it("returns [] on a non-array result", async () => {
    expect(await readReferralTimeline(rpcClient({ data: { nope: true }, error: null }))).toEqual(
      []
    );
  });

  it("requests the timeline with p_limit 50", async () => {
    const sink: { fn?: string; args?: unknown } = {};
    await readReferralTimeline(recordingRpcClient({ data: [], error: null }, sink));
    expect(sink.fn).toBe("agent_referral_timeline");
    expect(sink.args).toEqual({ p_limit: 50 });
  });
});

describe("resolveApprovedAgent", () => {
  it("returns the reduced row for an approved partner", async () => {
    const agent = await resolveApprovedAgent(
      agentClient({
        data: { id: "a1", first_name: "Dana", slug: "dana-lee", status: "approved" },
        error: null
      }),
      USER
    );
    expect(agent).toEqual({ id: "a1", firstName: "Dana", slug: "dana-lee" });
  });

  it("returns null for a pending applicant or plain consumer (no approved row matches)", async () => {
    // The status='approved' filter (paired with owner-scoped RLS) yields no row.
    const agent = await resolveApprovedAgent(agentClient({ data: null, error: null }), USER);
    expect(agent).toBeNull();
  });

  it("returns null on a maybeSingle error", async () => {
    const agent = await resolveApprovedAgent(
      agentClient({ data: null, error: { message: "too many rows" } }),
      USER
    );
    expect(agent).toBeNull();
  });
});

describe("agentDashboardAvailable", () => {
  it("is true when the flag and accounts are on", async () => {
    vi.resetModules();
    process.env.FEATURE_AGENT_DASHBOARD = "true";
    process.env.FEATURE_ACCOUNTS = "true";
    const mod = await import("../../lib/agent-referrals");
    expect(mod.agentDashboardAvailable()).toBe(true);
  });

  it("is false when the flag is unset (dark by default)", async () => {
    // The env schema coerces with Boolean(), so the flag is turned off by being
    // absent (its default(false)) — the literal string "false" would coerce true.
    vi.resetModules();
    delete process.env.FEATURE_AGENT_DASHBOARD;
    process.env.FEATURE_ACCOUNTS = "true";
    const mod = await import("../../lib/agent-referrals");
    expect(mod.agentDashboardAvailable()).toBe(false);
  });
});
