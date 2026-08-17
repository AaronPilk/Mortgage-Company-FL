import { Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "lead", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="mt-4 text-muted">Your role does not include access to this view.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Leads</h1>
      <Card className="mt-6">
        <p className="text-muted">
          Server-paginated lead list with masked contact details until an explicit reveal, a
          per-lead timeline of receipt, consent, sync, assignment, and handoff, and an audit record
          on every material change. Bulk export is disabled by default. Requires a configured
          database.
        </p>
      </Card>
    </div>
  );
}
