import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The routing lookup is the foundation of lead routing: given a property ZIP it
 * names a covering agent, and the lead pipeline will later use it to attribute a
 * seller/buyer lead. These tests pin the three things that keep it safe to wire
 * in — shape validation before any database call, the fail-open contract (a bad
 * ZIP, missing database, RPC error, or empty result is "no agent", never a
 * throw into a lead), and that it reads the first row of the approved-only set
 * the SECURITY DEFINER function returns.
 */

type RpcResult = { data: unknown; error: unknown };

const rpc = vi.fn<(name: string, params: Record<string, unknown>) => Promise<RpcResult>>();
const createServiceClient = vi.fn<() => { rpc: typeof rpc } | null>();

vi.mock("@/lib/supabase", () => ({
  createServiceClient: () => createServiceClient()
}));

const { coveringAgentForZip } = await import("@/lib/lead-routing");

describe("coveringAgentForZip", () => {
  beforeEach(() => {
    rpc.mockReset();
    createServiceClient.mockReset();
    createServiceClient.mockReturnValue({ rpc });
  });

  it("rejects a non-five-digit ZIP before touching the database", async () => {
    for (const bad of ["3360", "336022", "abcde", "", "3360a"]) {
      expect(await coveringAgentForZip(bad)).toBeNull();
    }
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("returns the first covering agent for a ZIP", async () => {
    rpc.mockResolvedValue({
      data: [
        { agent_id: "00000000-0000-4000-8000-000000000242", agent_slug: "robin-private" },
        { agent_id: "00000000-0000-4000-8000-000000000240", agent_slug: "pat-fixture" }
      ],
      error: null
    });
    expect(await coveringAgentForZip("33701")).toEqual({
      agentId: "00000000-0000-4000-8000-000000000242",
      slug: "robin-private"
    });
    expect(rpc).toHaveBeenCalledWith("agent_coverage_for_zip", { p_zip5: "33701" });
  });

  it("returns null when no agent covers the ZIP", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await coveringAgentForZip("33999")).toBeNull();
  });

  it("returns null when the database is not configured", async () => {
    createServiceClient.mockReturnValue(null);
    expect(await coveringAgentForZip("33602")).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails open on an RPC error rather than throwing into a lead", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await coveringAgentForZip("33602")).toBeNull();
  });

  it("fails open when the RPC rejects", async () => {
    rpc.mockRejectedValue(new Error("supabase down"));
    expect(await coveringAgentForZip("33602")).toBeNull();
  });

  it("ignores a malformed row shape", async () => {
    rpc.mockResolvedValue({ data: [{ agent_id: 42, agent_slug: null }], error: null });
    expect(await coveringAgentForZip("33602")).toBeNull();
  });
});
