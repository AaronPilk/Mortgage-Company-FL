import type { Metadata } from "next";
import Link from "next/link";
import type { AgentPublic } from "@tract/schemas";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";
import { Button, ButtonLink, Card, CtaPanel, Section } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { SITE_URL, businessIdentity } from "@/lib/site";
import { fetchApprovedAgents, sampleAgentsAllowed } from "@/lib/agents";
import { AgentCard } from "@/components/agents/agent-card";
import { realEstateAgentNode } from "@/components/agents/agent-jsonld";
import { SampleProfilesBanner } from "@/components/agents/sample-profile-notice";
import { cityList, sampleAgentsForCity } from "@/components/agents/sample-agents";

export const dynamic = "force-dynamic";

/**
 * The directory is index-ready copy over honest data, but it must not enter a
 * search index while any invented profile can render on it — a crawler cannot
 * see the sample banner the way a person does. The noindex decision therefore
 * tracks the sample gate per-request, exactly the way the property surfaces
 * decide, and the route registry keeps /agents out of the sitemap until the
 * page renders real agents only (see content/routes.ts).
 */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Find a Florida real estate agent",
    description:
      "Browse Florida real estate agents and request an introduction. TRACT makes the connection personally — no cold calls, no handing your details around.",
    path: "/agents",
    noIndex: sampleAgentsAllowed()
  });
}

/**
 * Agent directory.
 *
 * The product decision this page is built around: TRACT controls the lead. A
 * visitor never receives an agent's phone or email; they request an
 * introduction, which is a TRACT lead, and a TRACT team member makes the
 * connection personally. That is why no card and no profile ever renders agent
 * contact details.
 *
 * License honesty (invariant 6): "verified" appears only where a profile's
 * `licenseVerified` is true. Samples and unverified real agents say "License
 * verification pending". RealEstateAgent structured data is emitted only for
 * real approved agents, never for fixtures — markup is a claim made to a party
 * that cannot read the sample badge.
 */
export default async function AgentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawCity = params.city;
  const city = typeof rawCity === "string" ? rawCity.trim() : "";

  const samplesAllowed = sampleAgentsAllowed();

  // A database problem degrades this page to the labelled sample set (or the
  // empty state), never to a 500: the directory read is display-only and holds
  // up no write anywhere.
  let approved: AgentPublic[];
  try {
    approved = await fetchApprovedAgents(city === "" ? undefined : city);
  } catch {
    approved = [];
  }

  const samples = samplesAllowed ? sampleAgentsForCity(city) : [];
  const showingSamples = samples.length > 0 || (samplesAllowed && city === "");
  const total = approved.length + samples.length;

  const cityOptions = [
    ...new Set(
      [...approved, ...(samplesAllowed ? sampleAgentsForCity("") : [])].flatMap((agent) =>
        cityList(agent.cities)
      )
    )
  ].sort((a, b) => a.localeCompare(b));

  const url = absoluteUrl(SITE_URL, "/agents");

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: "Find a Florida real estate agent",
              description:
                "Browse Florida real estate agents and request an introduction made personally by TRACT."
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Agents", url }
            ]),
            // Real approved agents only. A fixture never becomes a schema.org
            // assertion, and the e2e suite pins this.
            ...approved.map((agent) =>
              realEstateAgentNode(agent, absoluteUrl(SITE_URL, `/agents/${agent.slug}`))
            )
          ],
          businessIdentity
        )}
      />

      <Section pad="head" orbs>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl tracking-[-0.02em] sm:text-6xl">
            Find a Florida real estate <span className="text-gradient">agent</span>.
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Browse the directory, pick someone whose work fits yours, and ask for an introduction. A
            TRACT team member makes the connection personally — your contact details never go to an
            agent, and theirs never appear here.
          </p>
        </div>
        {showingSamples && (
          <div className="mx-auto mt-12 max-w-3xl">
            <SampleProfilesBanner scope="directory" />
          </div>
        )}
      </Section>

      <Section pad="tight">
        {/*
          A plain GET form: the filter state is the URL, so a filtered view is a
          link somebody can share, and the page needs no client search state.
        */}
        <form method="get" action="/agents" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="agents-city" className="text-sm font-semibold">
              City
            </label>
            <select
              id="agents-city"
              name="city"
              defaultValue={city}
              className="mt-1.5 min-h-[44px] w-56 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base"
            >
              <option value="">All cities</option>
              {cityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {city !== "" && (
            <Link
              href="/agents"
              className="pb-3 text-sm font-semibold text-[var(--purple)] underline underline-offset-2"
            >
              Clear
            </Link>
          )}
        </form>

        <p
          aria-live="polite"
          className="mt-8 text-lg font-semibold"
          style={{ color: "var(--text)" }}
        >
          {total === 0
            ? "No agents match"
            : `${total} ${total === 1 ? "agent" : "agents"}${city === "" ? "" : ` serving ${city}`}`}
        </p>

        {total > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isSample={false} />
            ))}
            {samples.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isSample />
            ))}
          </ul>
        ) : (
          <Card className="mt-6">
            <h2 className="text-xl font-semibold">Nothing matched that city</h2>
            <p className="mt-3 text-[var(--text-muted)]">
              The directory is young and grows as agents join and pass review. Clearing the filter
              shows everyone currently listed.
            </p>
            <div className="mt-5">
              <ButtonLink href="/agents" variant="secondary">
                Show all agents
              </ButtonLink>
            </div>
          </Card>
        )}
      </Section>

      <Section pad="tight" tone="surface">
        <CtaPanel
          title="Are you a Florida real estate agent?"
          body="Join the TRACT agent network: we introduce you to buyers who are already working through their financing, and you stay the agent of record. Every profile is reviewed before it goes live."
          primary={{
            href: "/agents/join",
            label: "Join as an agent",
            cta: "agents-directory-join"
          }}
          secondary={{ href: "/partners/real-estate-agents", label: "How we work with agents" }}
        />
      </Section>
    </>
  );
}
