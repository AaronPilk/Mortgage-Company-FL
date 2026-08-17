import { Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "ai_job", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="mt-4 text-muted">Your role does not include access to this view.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Jobs</h1>
      <Card className="mt-6">
        <p className="text-muted">
          AI job queue filtered by feature, status, provider, and age, with redacted input
          manifests, cost detail, and retry or cancel actions that require a stated reason. No
          signed URL or provider credential is ever displayed.
        </p>
      </Card>
    </div>
  );
}
