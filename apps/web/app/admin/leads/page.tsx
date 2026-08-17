import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { createRequestClient } from "@/lib/supabase";

function maskEmail(value: string): string {
  const [local = "", domain = ""] = value.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}

function maskPhone(value: string): string {
  return `••• ••• ${value.slice(-4)}`;
}

type LeadRow = {
  id: string;
  intent: string;
  status: string;
  first_name: string;
  last_name: string;
  email_normalized: string;
  phone_e164: string;
  source_path: string;
  created_at: string;
};

type RequestRow = {
  submission_id: string;
  lead_id: string;
  project_id: string;
  report_id: string;
  created_at: string;
};

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "lead", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
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
        <h1 className="text-3xl font-bold">Leads</h1>
        <Card className="mt-6">
          <p className="text-[var(--text-muted)]">
            The database is not configured in this environment, so there is no lead list to show.
          </p>
        </Card>
      </div>
    );
  }

  const { data: leadData, error: leadError } = await supabase
    .from("leads")
    .select(
      "id,intent,status,first_name,last_name,email_normalized,phone_e164,source_path,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (leadError !== null) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <Card className="mt-6 border-danger/40">
          <p className="text-danger">
            Lead records could not be loaded. No broader access was attempted.
          </p>
        </Card>
      </div>
    );
  }

  const leads = (leadData ?? []) as LeadRow[];
  const canSeeVisionContext =
    session.authorized && (session.roles.includes("operations") || session.roles.includes("admin"));
  let requests: RequestRow[] = [];
  const projects = new Map<string, { title: string; goal: string; status: string }>();
  const reports = new Map<
    string,
    { status: string; version: number; generated_at: string | null }
  >();

  if (canSeeVisionContext) {
    const { data: requestData } = await supabase
      .from("vision_report_requests")
      .select("submission_id,lead_id,project_id,report_id,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    requests = (requestData ?? []) as RequestRow[];

    if (requests.length > 0) {
      const [{ data: projectData }, { data: reportData }] = await Promise.all([
        supabase
          .from("vision_projects")
          .select("id,title,goal,status")
          .in(
            "id",
            requests.map((request) => request.project_id)
          ),
        supabase
          .from("vision_reports")
          .select("id,status,version,generated_at")
          .in(
            "id",
            requests.map((request) => request.report_id)
          )
      ]);
      for (const project of projectData ?? []) {
        projects.set(String(project.id), {
          title: String(project.title),
          goal: String(project.goal),
          status: String(project.status)
        });
      }
      for (const report of reportData ?? []) {
        reports.set(String(report.id), {
          status: String(report.status),
          version: Number(report.version),
          generated_at: report.generated_at === null ? null : String(report.generated_at)
        });
      }
    }
  }

  const requestByLead = new Map(requests.map((request) => [request.lead_id, request]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Newest 50 records. Contact details remain masked in the list view.
          </p>
        </div>
        <Badge tone="neutral">{leads.length} visible under your RLS policy</Badge>
      </div>

      {leads.length === 0 ? (
        <Card className="mt-6">
          <p className="text-[var(--text-muted)]">No lead records are visible to this account.</p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {leads.map((lead) => {
            const request = requestByLead.get(lead.id);
            const project = request === undefined ? undefined : projects.get(request.project_id);
            const report = request === undefined ? undefined : reports.get(request.report_id);
            return (
              <Card as="li" key={lead.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">
                        {lead.first_name} {lead.last_name}
                      </h2>
                      <Badge tone={lead.status === "error" ? "warning" : "purple"}>
                        {lead.status}
                      </Badge>
                      <Badge tone="neutral">{lead.intent.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {maskEmail(lead.email_normalized)} · {maskPhone(lead.phone_e164)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(lead.created_at).toLocaleString("en-US")} · {lead.source_path}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {lead.id.slice(0, 8)}
                  </span>
                </div>

                {request !== undefined && (
                  <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--purple)]">
                      Vision lifecycle
                    </p>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-[var(--text-muted)]">Request</p>
                        <p className="mt-1 font-semibold">Received</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Project</p>
                        <p className="mt-1 font-semibold">
                          {project?.status.replaceAll("_", " ") ?? "RLS filtered"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Report</p>
                        <p className="mt-1 font-semibold">
                          {report === undefined
                            ? "RLS filtered"
                            : `${report.status} · v${report.version}`}
                        </p>
                      </div>
                    </div>
                    {project !== undefined && (
                      <p className="mt-3 text-sm text-[var(--text-muted)]">
                        {project.title} · {project.goal.replaceAll("_", " ")}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
