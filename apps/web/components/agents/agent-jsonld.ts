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
 */
export function realEstateAgentNode(agent: AgentPublic, url: string): Record<string, unknown> {
  return {
    "@type": "RealEstateAgent",
    "@id": `${url}#agent`,
    name: `${agent.firstName} ${agent.lastName}`,
    url,
    ...(agent.brokerage ? { worksFor: { "@type": "Organization", name: agent.brokerage } } : {}),
    areaServed: cityList(agent.cities).map((name) => ({ "@type": "City", name }))
  };
}
