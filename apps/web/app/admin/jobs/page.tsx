import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { createRequestClient } from "@/lib/supabase";

type Job = {
  id: string;
  job_type: string;
  feature: string;
  provider: string | null;
  model_key: string | null;
  status: string;
  estimated_cost_cents: number;
  reserved_cost_cents: number;
  actual_cost_cents: number | null;
  attempt_count: number;
  max_attempts: number;
  requires_reconciliation: boolean;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
};

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "ai_job", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="mt-4 text-[var(--text-muted)]">
          Your role does not include access to this view.
        </p>
      </div>
    );
  }
  const supabase = await createRequestClient();
  if (supabase === null) {
    return (
      <Unavailable title="Jobs" message="The database is not configured in this environment." />
    );
  }
  const { data, error } = await supabase
    .from("ai_jobs")
    .select(
      "id,job_type,feature,provider,model_key,status,estimated_cost_cents,reserved_cost_cents,actual_cost_cents,attempt_count,max_attempts,requires_reconciliation,error_code,created_at,completed_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error !== null) {
    return <Unavailable title="Jobs" message="Job records could not be loaded under this role." />;
  }
  const jobs = (data ?? []) as Job[];
  const statusCounts = new Map<string, number>();
  for (const job of jobs) statusCounts.set(job.status, (statusCounts.get(job.status) ?? 0) + 1);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Newest 100 first-party job records. Provider payloads and request identifiers are not
            displayed.
          </p>
        </div>
        <Badge tone="neutral">{jobs.length} visible under your RLS policy</Badge>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {["created", "queued", "processing", "succeeded", "failed", "cancelled"].map((status) => (
          <Card key={status}>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{status}</p>
            <p className="mt-1 text-2xl font-bold">{statusCounts.get(status) ?? 0}</p>
          </Card>
        ))}
      </div>
      {jobs.length === 0 ? (
        <Card className="mt-6">
          <p className="text-[var(--text-muted)]">No job records are visible.</p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {jobs.map((job) => (
            <Card as="li" key={job.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{job.job_type.replaceAll("_", " ")}</h2>
                    <Badge
                      tone={
                        job.status === "succeeded"
                          ? "success"
                          : job.status === "failed"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {job.status}
                    </Badge>
                    {job.requires_reconciliation && (
                      <Badge tone="warning">reconciliation required</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {job.feature.replaceAll("_", " ")} · {job.provider ?? "provider unassigned"} ·{" "}
                    {job.model_key ?? "model unassigned"}
                  </p>
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {job.id.slice(0, 8)}
                </span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-[var(--text-muted)]">Attempts</dt>
                  <dd className="mt-1 font-semibold">
                    {job.attempt_count} / {job.max_attempts}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Estimated</dt>
                  <dd className="mt-1 font-semibold">{job.estimated_cost_cents}¢</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Reserved</dt>
                  <dd className="mt-1 font-semibold">{job.reserved_cost_cents}¢</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Actual</dt>
                  <dd className="mt-1 font-semibold">
                    {job.actual_cost_cents === null
                      ? "not reconciled"
                      : `${job.actual_cost_cents}¢`}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Created {new Date(job.created_at).toLocaleString("en-US")}
                {job.completed_at === null
                  ? ""
                  : ` · completed ${new Date(job.completed_at).toLocaleString("en-US")}`}
                {job.error_code === null ? "" : ` · failure class ${job.error_code}`}
              </p>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}

function Unavailable({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <Card className="mt-6">
        <p className="text-[var(--text-muted)]">{message}</p>
      </Card>
    </div>
  );
}
