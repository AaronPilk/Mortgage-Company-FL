import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { features } from "@/lib/env";
import { createRequestClient } from "@/lib/supabase";

const CONFIGURATION_NAMES = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FEATURE_ACCOUNTS",
  "HASH_PEPPER",
  "TURNSTILE_MODE",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "TURNSTILE_HOSTNAMES",
  "GHL_MODE",
  "GHL_PRIVATE_INTEGRATION_TOKEN",
  "GHL_LOCATION_ID",
  "GHL_CUSTOM_FIELD_MAP",
  "GHL_PIPELINE_MAP",
  "GHL_WEBHOOK_PUBLIC_KEY",
  "OUTBOX_DRAIN_TOKEN",
  "AI_MODE",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "HIGGSFIELD_API_KEY",
  "BYTEPLUS_API_KEY",
  "AI_DAILY_PLATFORM_BUDGET_CENTS",
  "AI_DEFAULT_USER_DAILY_BUDGET_CENTS",
  "EMAIL_MODE",
  "RESEND_API_KEY",
  "ATTOM_MODE",
  "ATTOM_API_KEY",
  "FLOOD_MODE",
  "FEATURE_HOME_LOOKUP",
  "FEATURE_HOME_VALUE",
  "SHOW_SAMPLE_PROPERTY_DATA",
  "RATE_FEED_MODE",
  "FRED_API_KEY",
  "FEATURE_RATE_WATCH",
  "FEATURE_ASSISTANT",
  "EMAIL_FROM",
  "ALERTS_RUN_TOKEN",
  "FEATURE_EMAIL_ALERTS",
  "META_CAPI_MODE",
  "META_PIXEL_ID",
  "META_CAPI_ACCESS_TOKEN",
  "META_CAPI_TEST_EVENT_CODE",
  "META_CAPI_LIVE_CLEARED",
  "FEATURE_AGENT_DASHBOARD"
] as const;

type OutboxStatus = {
  status: string;
  attempt_count: number;
  last_error_code: string | null;
  completed_at: string | null;
  created_at: string;
};

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

  const modes = features();
  const supabase = await createRequestClient();
  let rows: OutboxStatus[] = [];
  let databaseState = "Not configured";
  if (supabase !== null) {
    const { data, error } = await supabase
      .from("integration_outbox")
      .select("status,attempt_count,last_error_code,completed_at,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    databaseState = error === null ? "Connected under staff RLS" : "Query denied or unavailable";
    rows = error === null ? ((data ?? []) as OutboxStatus[]) : [];
  }

  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  const lastSucceeded = rows.find((row) => row.status === "succeeded")?.completed_at ?? null;
  const lastFailure = rows.find((row) => row.last_error_code !== null) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Read-only runtime modes and first-party outbox evidence. No token value is queried or
            rendered.
          </p>
        </div>
        <Badge tone={rows.length > 0 ? "purple" : "neutral"}>{databaseState}</Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["CRM", modes.ghl],
          ["Turnstile", modes.turnstile],
          ["Email", modes.email],
          ["Listings", modes.mls],
          ["Property data", modes.attom],
          ["Rate feed", modes.rateFeed],
          ["AI", modes.ai],
          ["Conversions (Meta)", modes.metaCapi]
        ].map(([label, mode]) => (
          <Card key={label}>
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-xl font-bold capitalize">{mode}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">CRM outbox</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {["pending", "processing", "retry", "succeeded", "dead"].map((status) => (
            <div key={status} className="rounded-lg bg-[var(--surface-2)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{status}</p>
              <p className="mt-1 text-2xl font-bold">{counts.get(status) ?? 0}</p>
            </div>
          ))}
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--text-muted)]">Last succeeded</dt>
            <dd className="mt-1 font-semibold">
              {lastSucceeded === null
                ? "No visible success"
                : new Date(lastSucceeded).toLocaleString("en-US")}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Last failure class</dt>
            <dd className="mt-1 font-semibold">
              {lastFailure?.last_error_code ?? "No visible failure"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">Required configuration names</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Names only. Values belong in the approved deployment secret store and must never be copied
          into documentation, chat, or source.
        </p>
        <ul className="mt-4 grid gap-2 font-mono text-xs sm:grid-cols-2 xl:grid-cols-3">
          {CONFIGURATION_NAMES.map((name) => (
            <li key={name} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
              {name}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
