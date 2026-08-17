import { Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "content_item", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Content</h1>
        <p className="mt-4 text-muted">Your role does not include access to this view.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Content</h1>
      <Card className="mt-6">
        <p className="text-muted">
          Editorial workflow states, source completeness, preview and diff, author and reviewer
          assignment, and an indexation toggle guarded by the same validation the database
          constraint enforces.
        </p>
      </Card>
    </div>
  );
}
