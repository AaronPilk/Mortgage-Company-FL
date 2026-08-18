import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { createRequestClient } from "@/lib/supabase";

type AuditEvent = {
  id: string;
  actor_kind: string;
  action: string;
  target_type: string;
  target_id: string | null;
  request_id: string | null;
  user_agent_family: string | null;
  reason: string | null;
  occurred_at: string;
};

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "audit_event", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Audit</h1>
        <p className="mt-4 text-[var(--text-muted)]">
          Your role does not include access to this view.
        </p>
      </div>
    );
  }
  const supabase = await createRequestClient();
  if (supabase === null)
    return <Unavailable message="The database is not configured in this environment." />;
  const { data, error } = await supabase
    .from("audit_events")
    .select(
      "id,actor_kind,action,target_type,target_id,request_id,user_agent_family,reason,occurred_at"
    )
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (error !== null)
    return <Unavailable message="Audit records could not be loaded under this role." />;
  const events = (data ?? []) as AuditEvent[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Audit</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Newest 100 append-only privileged events. IP hashes and before/after snapshots are not
            rendered.
          </p>
        </div>
        <Badge tone="neutral">{events.length} visible under your RLS policy</Badge>
      </div>
      {events.length === 0 ? (
        <Card className="mt-6">
          <p className="text-[var(--text-muted)]">No audit events are visible.</p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {events.map((event) => (
            <Card as="li" key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{event.action}</h2>
                    <Badge tone="neutral">{event.actor_kind}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {event.target_type}
                    {event.target_id === null ? "" : ` · ${event.target_id.slice(0, 24)}`}
                  </p>
                </div>
                <time className="text-xs text-[var(--text-muted)]">
                  {new Date(event.occurred_at).toLocaleString("en-US")}
                </time>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[var(--text-muted)]">Reason</dt>
                  <dd className="mt-1 font-semibold">{event.reason ?? "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Request</dt>
                  <dd className="mt-1 font-mono text-xs">
                    {event.request_id?.slice(0, 8) ?? "none"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">User agent family</dt>
                  <dd className="mt-1 font-semibold">
                    {event.user_agent_family ?? "not recorded"}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">Audit</h1>
      <Card className="mt-6">
        <p className="text-[var(--text-muted)]">{message}</p>
      </Card>
    </div>
  );
}
