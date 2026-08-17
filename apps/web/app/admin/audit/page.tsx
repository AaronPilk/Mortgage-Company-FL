import { Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "audit_event", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Audit</h1>
        <p className="mt-4 text-muted">Your role does not include access to this view.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Audit</h1>
      <Card className="mt-6">
        <p className="text-muted">
          Append-only privileged action history. Readable by admin and compliance reviewer roles
          only; there is no update or delete path from anywhere in the application.
        </p>
      </Card>
    </div>
  );
}
