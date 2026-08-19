import Link from "next/link";
import type { AgentPublic } from "@tract/schemas";
import { Badge, Card } from "@/components/ui";
import { SampleProfileBadge } from "./sample-profile-notice";
import { SAMPLE_NAME_PREFIX, cityList } from "./sample-agents";

/**
 * A single directory entry.
 *
 * Two statements on this card are not negotiable regardless of layout: the
 * sample badge on an invented profile (invariant 6), and the honest license
 * line — "verified" appears only where `licenseVerified` is true, and every
 * other profile says "License verification pending" instead. The card never
 * shows an agent's phone or email because the product is the introduction:
 * TRACT holds the contact and makes the call.
 */
export function AgentCard({ agent, isSample }: { agent: AgentPublic; isSample: boolean }) {
  const name = `${isSample ? SAMPLE_NAME_PREFIX : ""}${agent.firstName} ${agent.lastName}`;
  const cities = cityList(agent.cities);
  const href = `/agents/${encodeURIComponent(agent.slug)}`;

  return (
    <Card as="li" interactive className="!p-0">
      <Link href={href} className="flex h-full flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          {isSample && <SampleProfileBadge />}
          {agent.licenseVerified ? (
            <Badge tone="success">License verified</Badge>
          ) : (
            <Badge tone="neutral">License verification pending</Badge>
          )}
        </div>
        <h2 className="mt-4 text-xl font-semibold" style={{ color: "var(--text)" }}>
          {name}
        </h2>
        {agent.brokerage ? (
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--text)" }}>
            {agent.brokerage}
          </p>
        ) : null}
        {cities.length > 0 && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Serves {cities.join(", ")}
          </p>
        )}
        {agent.bio ? (
          <p className="mt-3 line-clamp-2 flex-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {agent.bio}
          </p>
        ) : (
          <span className="flex-1" />
        )}
        <span
          aria-hidden="true"
          className="mt-5 text-sm font-semibold"
          style={{ color: "var(--purple)" }}
        >
          Request an introduction &rarr;
        </span>
      </Link>
    </Card>
  );
}
