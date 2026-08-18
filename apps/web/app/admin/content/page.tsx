import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { createRequestClient } from "@/lib/supabase";

type ContentItem = {
  id: string;
  content_type: string;
  slug: string;
  locale: string;
  title: string;
  status: string;
  indexation: string;
  canonical_path: string | null;
  author_id: string | null;
  reviewer_id: string | null;
  compliance_reviewer_id: string | null;
  compliance_review_required: boolean;
  reviewed_at: string | null;
  next_review_at: string | null;
  updated_at: string;
};
type ContentSource = { content_item_id: string; is_primary: boolean };

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "content_item", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Content</h1>
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
    .from("content_items")
    .select(
      "id,content_type,slug,locale,title,status,indexation,canonical_path,author_id,reviewer_id,compliance_reviewer_id,compliance_review_required,reviewed_at,next_review_at,updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error !== null)
    return <Unavailable message="Content records could not be loaded under this role." />;
  const items = (data ?? []) as ContentItem[];
  const { data: sourceData, error: sourceError } =
    items.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("content_sources")
          .select("content_item_id,is_primary")
          .in(
            "content_item_id",
            items.map((item) => item.id)
          );
  if (sourceError !== null)
    return <Unavailable message="Content sources could not be loaded under this role." />;
  const sourceCounts = new Map<string, { all: number; primary: number }>();
  for (const source of (sourceData ?? []) as ContentSource[]) {
    const current = sourceCounts.get(source.content_item_id) ?? { all: 0, primary: 0 };
    sourceCounts.set(source.content_item_id, {
      all: current.all + 1,
      primary: current.primary + (source.is_primary ? 1 : 0)
    });
  }
  const statusCounts = new Map<string, number>();
  for (const item of items) statusCounts.set(item.status, (statusCounts.get(item.status) ?? 0) + 1);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Read-only workflow evidence from content_items. Body content is intentionally omitted
            from this list.
          </p>
        </div>
        <Badge tone="neutral">{items.length} visible under your RLS policy</Badge>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {["draft", "review", "approved", "published"].map((status) => (
          <Card key={status}>
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{status}</p>
            <p className="mt-1 text-2xl font-bold">{statusCounts.get(status) ?? 0}</p>
          </Card>
        ))}
      </div>
      {items.length === 0 ? (
        <Card className="mt-6">
          <p className="text-[var(--text-muted)]">No content records are visible.</p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => {
            const assignmentComplete = item.author_id !== null && item.reviewer_id !== null;
            const complianceComplete =
              !item.compliance_review_required || item.compliance_reviewer_id !== null;
            const sources = sourceCounts.get(item.id) ?? { all: 0, primary: 0 };
            return (
              <Card as="li" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{item.title}</h2>
                      <Badge tone={item.status === "published" ? "success" : "neutral"}>
                        {item.status}
                      </Badge>
                      <Badge tone={item.indexation === "index" ? "purple" : "neutral"}>
                        {item.indexation}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {item.content_type} · {item.locale} · /{item.slug}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {item.id.slice(0, 8)}
                  </span>
                </div>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-[var(--text-muted)]">Sources</dt>
                    <dd className="mt-1 font-semibold">
                      {sources.all} total · {sources.primary} primary
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Author + reviewer</dt>
                    <dd className="mt-1 font-semibold">
                      {assignmentComplete ? "Assigned" : "Incomplete"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Compliance review</dt>
                    <dd className="mt-1 font-semibold">
                      {complianceComplete ? "Assigned or not required" : "Required and unassigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Reviewed</dt>
                    <dd className="mt-1 font-semibold">
                      {item.reviewed_at === null
                        ? "Not recorded"
                        : new Date(item.reviewed_at).toLocaleDateString("en-US")}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-[var(--text-muted)]">
                  Canonical: {item.canonical_path ?? "not assigned"} · updated{" "}
                  {new Date(item.updated_at).toLocaleString("en-US")}
                  {item.next_review_at === null
                    ? ""
                    : ` · next review ${new Date(item.next_review_at).toLocaleDateString("en-US")}`}
                </p>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">Content</h1>
      <Card className="mt-6">
        <p className="text-[var(--text-muted)]">{message}</p>
      </Card>
    </div>
  );
}
