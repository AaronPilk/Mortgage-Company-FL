import type { Metadata } from "next";
import Link from "next/link";
import type { AgentPublic } from "@tract/schemas";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";
import { Button, ButtonLink, Card, CtaPanel, Section } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { SITE_URL, businessIdentity } from "@/lib/site";
import {
  directoryHasRealAgents,
  fetchDirectoryAgents,
  sampleAgentsAllowed,
  type AgentDirectoryPage
} from "@/lib/agents";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentPagination } from "@/components/agents/agent-pagination";
import { realEstateAgentNode } from "@/components/agents/agent-jsonld";
import { SampleProfilesBanner } from "@/components/agents/sample-profile-notice";
import { sampleAgentsForCity } from "@/components/agents/sample-agents";

export const dynamic = "force-dynamic";

/**
 * The directory is indexable now that it renders real records — joined agents
 * and unclaimed public-record profiles from the state license roll. The one
 * remaining honesty guard is per-request: if the database is empty (or
 * unreachable) and the labelled sample fixtures render instead, the page says
 * noindex for that response, because a crawler cannot read a sample banner the
 * way a person does. content/routes.ts carries the matching sitemap decision.
 */
export async function generateMetadata(): Promise<Metadata> {
  // An unreachable database counts as "no real agents": the page would render
  // fixtures for the same request, so the metadata must say noindex with it.
  const hasRealAgents = await directoryHasRealAgents().catch(() => false);
  return pageMetadata({
    title: "Find a Florida real estate agent",
    description:
      "Browse Florida real estate agents and request an introduction. TRACT makes the connection personally — no cold calls, no handing your details around.",
    path: "/agents",
    noIndex: !hasRealAgents && sampleAgentsAllowed()
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
 * Two kinds of real rows render here. Joined agents (approved + consenting)
 * carry a bio and richer copy. Unclaimed rows restate Florida license records
 * — name, license, city/county, employing brokerage — with a quiet provenance
 * line instead of a sample badge, because the record is real even though the
 * agent has not joined. Fixtures render only when the database has no public
 * rows at all, so a dev machine without a database still shows the page.
 *
 * License honesty (invariant 6): "verified" appears only where a profile's
 * `licenseVerified` is true; everyone else — imported records included — says
 * "License verification pending".
 *
 * Scale: the state import is ~68k rows, so fetching, filtering, and ordering
 * happen in the database, 24 rows a page, with the filter and page number in
 * the URL.
 */
export default async function AgentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawCity = params.city;
  const city = (typeof rawCity === "string" ? rawCity.trim() : "").slice(0, 80);
  const rawPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const requestedPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const samplesAllowed = sampleAgentsAllowed();

  // A database problem degrades this page to the labelled sample set (or the
  // empty state), never to a 500: the directory read is display-only and holds
  // up no write anywhere.
  let directory: AgentDirectoryPage;
  try {
    directory = await fetchDirectoryAgents({ city, page: requestedPage });
  } catch {
    directory = { agents: [], totalCount: 0, page: 1, pageSize: 24 };
  }

  // Fixtures are a fallback for an empty database, not a supplement to a real
  // one: the moment any real row exists, samples disappear from this page.
  const samples =
    directory.totalCount === 0 && samplesAllowed && requestedPage === 1
      ? sampleAgentsForCity(city)
      : [];
  const showingSamples = directory.totalCount === 0 && samplesAllowed;
  const agents: AgentPublic[] = directory.agents.length > 0 ? directory.agents : samples;
  const total = directory.totalCount > 0 ? directory.totalCount : samples.length;

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
            // Real rows only — joined or public-record. A fixture never
            // becomes a schema.org assertion, and the e2e suite pins this.
            ...directory.agents.map((agent) =>
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
          Free text rather than a select because the option list would need the
          whole state-scale table to build.
        */}
        <form method="get" action="/agents" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="agents-city" className="text-sm font-semibold">
              City or county
            </label>
            <input
              id="agents-city"
              name="city"
              type="text"
              defaultValue={city}
              maxLength={80}
              placeholder="e.g. Tampa or Pinellas"
              className="mt-1.5 min-h-[44px] w-56 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base"
            />
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
            : `${total.toLocaleString("en-US")} ${total === 1 ? "agent" : "agents"}${city === "" ? "" : ` serving ${city}`}`}
        </p>

        {agents.length > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isSample={showingSamples} />
            ))}
          </ul>
        ) : (
          <Card className="mt-6">
            <h2 className="text-xl font-semibold">Nothing matched that city</h2>
            <p className="mt-3 text-[var(--text-muted)]">
              The directory covers agents who joined TRACT and Florida license records. Clearing the
              filter shows everyone currently listed.
            </p>
            <div className="mt-5">
              <ButtonLink href="/agents" variant="secondary">
                Show all agents
              </ButtonLink>
            </div>
          </Card>
        )}

        <AgentPagination
          city={city}
          page={directory.page}
          totalCount={directory.totalCount}
          pageSize={directory.pageSize}
        />
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
