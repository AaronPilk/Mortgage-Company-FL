import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { features } from "@/lib/env";
import { createRequestClient, databaseConfigured } from "@/lib/supabase";
import { isPreLaunch } from "@/lib/site";

type CountResult = { count: number | null; error: unknown };

async function countRows(
  supabase: NonNullable<Awaited<ReturnType<typeof createRequestClient>>>,
  table: string
): Promise<CountResult> {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  return { count, error };
}

export default async function AdminHome() {
  const state = features();
  const session = await requireStaff();
  const supabase = await createRequestClient();
  const visibleCounts: { label: string; value: string; note: string }[] = [];

  if (session.authorized && supabase !== null) {
    const requested: { label: string; table: string; allowed: boolean; note: string }[] = [
      {
        label: "Leads",
        table: "leads",
        allowed: authorize(session, "lead", "read"),
        note: "marketing lead records"
      },
      {
        label: "AI jobs",
        table: "ai_jobs",
        allowed: authorize(session, "ai_job", "read"),
        note: "job lifecycle records"
      },
      {
        label: "Usage entries",
        table: "usage_ledger",
        allowed: authorize(session, "usage_ledger", "read"),
        note: "spend ledger entries"
      },
      {
        label: "Content items",
        table: "content_items",
        allowed: authorize(session, "content_item", "read"),
        note: "editorial records"
      },
      {
        label: "Audit events",
        table: "audit_events",
        allowed: authorize(session, "audit_event", "read"),
        note: "append-only events"
      },
      {
        label: "Privacy requests",
        table: "privacy_requests",
        allowed: authorize(session, "privacy_request", "read"),
        note: "received request records"
      }
    ];
    const countResults = await Promise.all(
      requested.map(async (item) => ({
        item,
        result: item.allowed ? await countRows(supabase, item.table) : null
      }))
    );
    for (const { item, result } of countResults) {
      visibleCounts.push({
        label: item.label,
        value:
          result === null
            ? "Role restricted"
            : result.error === null
              ? String(result.count ?? 0)
              : "Query unavailable",
        note: item.note
      });
    }
  }

  const modes = [
    { label: "Database", value: databaseConfigured() ? "Connected" : "Not configured" },
    { label: "CRM sync", value: state.ghl },
    { label: "AI providers", value: state.ai },
    { label: "Listing data", value: state.mls },
    { label: "Bot challenge", value: state.turnstile },
    { label: "Email", value: state.email },
    {
      label: "Secure application",
      value: state.secureApplicationConfigured ? "Configured" : "Not configured"
    },
    { label: "Launch state", value: isPreLaunch() ? "Pre-launch" : "Live" }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Runtime modes plus role-scoped counts from first-party tables. No credential, endpoint,
            contact value, or account identifier is rendered.
          </p>
        </div>
        {session.authorized && (
          <Badge tone="neutral">{session.roles.join(", ").replaceAll("_", " ")}</Badge>
        )}
      </div>

      <h2 className="mt-8 text-xl font-bold">Configuration state</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((tile) => (
          <Card as="li" key={tile.label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {tile.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">{tile.value}</p>
          </Card>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-bold">Database visibility</h2>
      {supabase === null ? (
        <Card className="mt-4">
          <p className="text-[var(--text-muted)]">
            The database is not configured in this environment, so no first-party counts are
            available.
          </p>
        </Card>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCounts.map((tile) => (
            <Card as="li" key={tile.label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {tile.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{tile.value}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{tile.note}</p>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
