import { Badge, Card } from "@/components/ui";
import { authorize, requireStaff } from "@/lib/authz";
import { createRequestClient } from "@/lib/supabase";

type Usage = {
  feature: string;
  provider: string | null;
  entry_kind: string;
  amount_cents: number;
  occurred_at: string;
};
type Quota = {
  id: string;
  subject_kind: string;
  feature: string;
  period: string;
  request_limit: number | null;
  cost_limit_cents: number | null;
  concurrency_limit: number | null;
  enabled: boolean;
};
type KillSwitch = {
  key: string;
  scope: string;
  engaged: boolean;
  engaged_at: string | null;
  reason: string | null;
};

export default async function Page() {
  const session = await requireStaff();
  if (!authorize(session, "usage_ledger", "read")) {
    return <Denied />;
  }
  const supabase = await createRequestClient();
  if (supabase === null)
    return <Unavailable message="The database is not configured in this environment." />;
  const [usageResult, quotaResult, switchResult] = await Promise.all([
    supabase
      .from("usage_ledger")
      .select("feature,provider,entry_kind,amount_cents,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(500),
    supabase
      .from("quota_policies")
      .select(
        "id,subject_kind,feature,period,request_limit,cost_limit_cents,concurrency_limit,enabled"
      )
      .order("feature"),
    supabase.from("kill_switches").select("key,scope,engaged,engaged_at,reason").order("key")
  ]);
  if ([usageResult, quotaResult, switchResult].some((result) => result.error !== null)) {
    return <Unavailable message="Usage controls could not be loaded under this role." />;
  }
  const usage = (usageResult.data ?? []) as Usage[];
  const quotas = (quotaResult.data ?? []) as Quota[];
  const switches = (switchResult.data ?? []) as KillSwitch[];
  const signedAmount = (entry: Usage) =>
    entry.entry_kind === "release" || entry.entry_kind === "credit"
      ? -entry.amount_cents
      : entry.amount_cents;
  const committed = usage.reduce((sum, entry) => sum + signedAmount(entry), 0);
  const reserved = usage
    .filter((entry) => entry.entry_kind === "reserve")
    .reduce((sum, entry) => sum + entry.amount_cents, 0);
  const charged = usage
    .filter((entry) => entry.entry_kind === "charge")
    .reduce((sum, entry) => sum + entry.amount_cents, 0);
  const features = new Map<string, number>();
  for (const entry of usage)
    features.set(entry.feature, (features.get(entry.feature) ?? 0) + signedAmount(entry));

  return (
    <div>
      <h1 className="text-3xl font-bold">Usage and budget</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Read-only ledger, quota, and emergency-stop state from first-party tables.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Net committed", committed],
          ["Reserved entries", reserved],
          ["Charged entries", charged]
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-3xl font-bold">{Number(value).toLocaleString("en-US")}¢</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="text-xl font-bold">Feature ledger totals</h2>
        {features.size === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">No usage entries are visible.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[...features].map(([feature, amount]) => (
              <li key={feature} className="rounded-lg bg-[var(--surface-2)] p-3">
                <span className="font-semibold">{feature.replaceAll("_", " ")}</span>
                <span className="float-right">{amount.toLocaleString("en-US")}¢</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="mt-6">
        <h2 className="text-xl font-bold">Quota policies</h2>
        {quotas.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">No quota policies are configured.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Feature</th>
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Requests</th>
                  <th className="py-2 pr-4">Cost</th>
                  <th className="py-2">Concurrency</th>
                </tr>
              </thead>
              <tbody>
                {quotas.map((quota) => (
                  <tr key={quota.id} className="border-b border-[var(--border)]">
                    <td className="py-3 pr-4">{quota.subject_kind}</td>
                    <td className="py-3 pr-4">{quota.feature}</td>
                    <td className="py-3 pr-4">{quota.period}</td>
                    <td className="py-3 pr-4">
                      {quota.enabled ? (quota.request_limit ?? "—") : "disabled"}
                    </td>
                    <td className="py-3 pr-4">
                      {quota.cost_limit_cents === null ? "—" : `${quota.cost_limit_cents}¢`}
                    </td>
                    <td className="py-3">{quota.concurrency_limit ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card className="mt-6">
        <h2 className="text-xl font-bold">Kill switches</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {switches.map((item) => (
            <li key={item.key} className="rounded-lg bg-[var(--surface-2)] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs">{item.key}</span>
                <Badge tone={item.engaged ? "warning" : "success"}>
                  {item.engaged ? "engaged" : "clear"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {item.reason ?? "No reason recorded"}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Denied() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Usage and budget</h1>
      <p className="mt-4 text-[var(--text-muted)]">
        Your role does not include access to this view.
      </p>
    </div>
  );
}
function Unavailable({ message }: { message: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">Usage and budget</h1>
      <Card className="mt-6">
        <p className="text-[var(--text-muted)]">{message}</p>
      </Card>
    </div>
  );
}
