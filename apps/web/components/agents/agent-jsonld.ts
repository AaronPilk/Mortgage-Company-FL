import type { AgentPublic } from "@tract/schemas";
import { cityList } from "./sample-agents";

/**
 * RealEstateAgent structured data — for REAL, approved agents only.
 *
 * A schema.org node is a machine-readable assertion that a person exists and
 * practices; emitting it over an invented sample profile would be a false claim
 * made to a party that cannot see the "sample profile" badge a human reads
 * (invariant 6). Callers gate on the sample flag before ever reaching this
 * function, and the pages assert that discipline in e2e.
 *
 * Deliberately absent: telephone and email (TRACT holds the contact and makes
 * the introduction — agent contact details are never published), and any
 * license identifier, because a license claim belongs in markup only once it is
 * verified against state records, and the page copy carries the honest
 * pending/verified state either way.
 *
 * An unclaimed public-record profile emits an even more conservative node:
 * name and area served (city and county) only. The employing brokerage is a
 * public-record fact and appears in page copy, but markup restates only what
 * the profile is fundamentally about — a licensed person practicing in a place
 * — until the agent claims the row and staff review it.
 */
export function realEstateAgentNode(agent: AgentPublic, url: string): Record<string, unknown> {
  const areaServed = [
    ...cityList(agent.cities).map((name) => ({ "@type": "City", name })),
    ...(agent.county === null ? [] : [{ "@type": "AdministrativeArea", name: agent.county }])
  ];
  return {
    "@type": "RealEstateAgent",
    "@id": `${url}#agent`,
    name: `${agent.firstName} ${agent.lastName}`,
    url,
    ...(agent.brokerage && !agent.unclaimed
      ? { worksFor: { "@type": "Organization", name: agent.brokerage } }
      : {}),
    areaServed
  };
}
