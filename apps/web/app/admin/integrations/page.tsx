import { Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "integration_config", "read")) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="mt-4 text-[var(--text-muted)]">
          Your role does not include access to this view.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Integrations</h1>
      <Card className="mt-6">
        <p className="text-[var(--text-muted)]">
          Per-integration mode, health, last success and failure, and outbox backlog. Environment
          variable names are listed; values never are, and there is no button that reveals a token.
        </p>
      </Card>
    </div>
  );
}
