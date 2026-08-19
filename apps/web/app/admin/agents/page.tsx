import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { createRequestClient } from "@/lib/supabase";

function maskEmail(value: string): string {
  const [local = "", domain = ""] = value.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}

type AgentRow = {
  id: string;
  first_name: string;
  last_name: string;
  brokerage: string | null;
  license_number: string;
  license_verified: boolean;
  email_normalized: string;
  cities: string;
  display_consent: boolean;
  created_at: string;
};

/**
 * Agent directory review. Read-only on purpose: approving an agent and marking
 * a license verified are deliberate operational acts performed in Supabase for
 * now, so this page cannot flip a row by accident — it only shows the queue.
 */
export default async function Page() {
  const session = await requireStaff();
  // Directory rows carry the same class of contact detail as leads, so the
  // same staff audience reviews them.
  if (!authorize(session, "lead", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="mt-4 text-[var(--text-muted)]">
          Your role does not include access to this view.
        </p>
      </div>
    );
  }

  const supabase = await createRequestClient();
  if (supabase === null) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Agents</h1>
        <Card className="mt-6">
          <p className="text-[var(--text-muted)]">
            The database is not configured in this environment, so there is no agent list to show.
          </p>
        </Card>
      </div>
    );
  }

  const [pendingResult, approvedCountResult] = await Promise.all([
    supabase
      .from("agents")
      .select(
        "id,first_name,last_name,brokerage,license_number,license_verified,email_normalized,cities,display_consent,created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("agents").select("id", { count: "exact", head: true }).eq("status", "approved")
  ]);

  if (pendingResult.error !== null) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Agents</h1>
        <Card className="mt-6 border-danger/40">
          <p className="text-danger">
            Agent records could not be loaded. No broader access was attempted.
          </p>
        </Card>
      </div>
    );
  }

  const pending = (pendingResult.data ?? []) as AgentRow[];
  const approvedCount = approvedCountResult.count ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Directory join requests awaiting review. Approval and license verification are performed
            directly in Supabase for now; this page is read-only.
          </p>
        </div>
        <Badge tone="neutral">{approvedCount} approved in the directory</Badge>
      </div>

      {pending.length === 0 ? (
        <Card className="mt-6">
          <p className="text-[var(--text-muted)]">No pending agent join requests.</p>
        </Card>
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">License</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Cities</th>
                <th className="py-2">Received</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((agent) => (
                <tr key={agent.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-3 pr-4">
                    <span className="font-semibold">
                      {agent.first_name} {agent.last_name}
                    </span>
                    {agent.brokerage !== null && (
                      <span className="block text-xs text-[var(--text-muted)]">
                        {agent.brokerage}
                      </span>
                    )}
                    {!agent.display_consent && (
                      <span className="mt-1 block">
                        <Badge tone="warning">no display consent</Badge>
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs">{agent.license_number}</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {agent.license_verified ? "verified" : "verification pending"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{maskEmail(agent.email_normalized)}</td>
                  <td className="max-w-[16rem] truncate py-3 pr-4">{agent.cities}</td>
                  <td className="py-3 text-xs text-[var(--text-muted)]">
                    {new Date(agent.created_at).toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
