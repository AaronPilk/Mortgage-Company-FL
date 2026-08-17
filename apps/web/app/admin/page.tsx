import { Card } from "@/components/ui";
import { features } from "@/lib/env";
import { databaseConfigured } from "@/lib/supabase";
import { isPreLaunch } from "@/lib/site";

/**
 * Operations overview.
 *
 * Deliberately not a chart gallery. Every tile answers a question someone would
 * otherwise have to ask in chat: is anything stuck, is anything spending, is
 * anything blocking launch.
 */
export default function AdminHome() {
  const state = features();

  const tiles = [
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
      <h1 className="text-3xl font-bold">Operations</h1>
      <p className="mt-2 text-[var(--text-muted)]">
        Current configuration. Values are modes and states only — no credential, endpoint, or
        account identifier is ever rendered here.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card as="li" key={tile.label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {tile.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">{tile.value}</p>
          </Card>
        ))}
      </ul>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold">What is not built yet</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          The lead, job, usage, content, and audit views read from the database and require a
          configured Supabase project with the migrations applied. Until then they render an empty
          state rather than sample data.
        </p>
      </Card>
    </div>
  );
}
