import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AgentPublic } from "@tract/schemas";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";
import { Badge, Card, Disclosure, Section } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { SITE_URL, businessIdentity } from "@/lib/site";
import { fetchAgentBySlug, sampleAgentsAllowed } from "@/lib/agents";
import { AgentIntroductionForm } from "@/components/agents/introduction-form";
import { realEstateAgentNode } from "@/components/agents/agent-jsonld";
import {
  SampleProfileBadge,
  SampleProfilesBanner
} from "@/components/agents/sample-profile-notice";
import {
  SAMPLE_NAME_PREFIX,
  cityList,
  sampleAgentBySlug,
  type SampleAgent
} from "@/components/agents/sample-agents";

export const dynamic = "force-dynamic";

type Resolved =
  | { kind: "real"; agent: AgentPublic }
  | { kind: "sample"; agent: SampleAgent }
  | { kind: "missing" };

/**
 * A real approved agent, or — behind the sample gate — a labelled sample
 * profile, so the introduction flow can be exercised end to end before real
 * agents exist. A database failure resolves like a miss rather than a 500.
 */
async function resolveAgent(slug: string): Promise<Resolved> {
  let real: AgentPublic | null;
  try {
    real = await fetchAgentBySlug(slug);
  } catch {
    real = null;
  }
  if (real !== null) return { kind: "real", agent: real };
  if (sampleAgentsAllowed()) {
    const sample = sampleAgentBySlug(slug);
    if (sample !== undefined) return { kind: "sample", agent: sample };
  }
  return { kind: "missing" };
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveAgent(decodeURIComponent(slug));

  if (resolved.kind === "missing") {
    return pageMetadata({
      title: "Agent not found",
      description: "",
      path: "/agents",
      noIndex: true
    });
  }

  // A sample profile page exists for internal review of the flow and must
  // never become a search result about a person who does not exist.
  if (resolved.kind === "sample") {
    return pageMetadata({
      title: `Sample profile — ${resolved.agent.firstName} ${resolved.agent.lastName}`,
      description:
        "An illustrative sample agent profile used to demonstrate the directory and the introduction request. Not a real person.",
      path: `/agents/${resolved.agent.slug}`,
      noIndex: true
    });
  }

  // Real profiles are indexable — including unclaimed ones, which restate
  // Florida license records and claim nothing else. The page copy carries the
  // provenance either way.
  const { agent } = resolved;
  return pageMetadata({
    title: `${agent.firstName} ${agent.lastName} — Florida real estate agent`,
    description: `Request an introduction to ${agent.firstName} ${agent.lastName} (${agent.cities}). TRACT makes the connection personally.`,
    path: `/agents/${agent.slug}`
  });
}

/**
 * Agent profile.
 *
 * NO AGENT CONTACT DETAILS ARE RENDERED HERE, DELIBERATELY. The consumer never
 * gets the agent's phone or email — they request an introduction, which is a
 * TRACT lead, and a TRACT team member makes the call. That is the product, not
 * a gap, and the e2e suite asserts the absence.
 *
 * The license line claims exactly what is established (invariant 6): the
 * number is shown as given, and "verified against state records" appears only
 * when `licenseVerified` is true. Everything else says verification pending.
 * RealEstateAgent structured data is emitted for real agents only — never for
 * a sample fixture, because markup is a claim a crawler cannot see labelled.
 */
export default async function AgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveAgent(decodeURIComponent(slug));
  if (resolved.kind === "missing") notFound();

  const { agent } = resolved;
  const isSample = resolved.kind === "sample";
  const displayName = `${isSample ? SAMPLE_NAME_PREFIX : ""}${agent.firstName} ${agent.lastName}`;
  const cities = cityList(agent.cities);
  const url = absoluteUrl(SITE_URL, `/agents/${agent.slug}`);

  const licenseLine = agent.licenseVerified
    ? `Florida license ${agent.licenseNumber} — verified against state records.`
    : `Florida license ${agent.licenseNumber} — verification pending.`;

  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: isSample
                ? `Sample profile — ${agent.firstName} ${agent.lastName}`
                : `${agent.firstName} ${agent.lastName} — Florida real estate agent`,
              description: isSample
                ? "An illustrative sample agent profile."
                : `Request an introduction to ${agent.firstName} ${agent.lastName}.`
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Agents", url: absoluteUrl(SITE_URL, "/agents") },
              { name: displayName, url }
            ]),
            isSample ? null : realEstateAgentNode(agent, url)
          ],
          businessIdentity
        )}
      />

      <Section pad="head">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--purple)]">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/agents" className="hover:text-[var(--purple)]">
            Agents
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{displayName}</span>
        </nav>

        {isSample && <SampleProfilesBanner scope="profile" />}

        <div className="mt-10 flex flex-wrap items-center gap-2">
          {isSample && <SampleProfileBadge />}
          {agent.licenseVerified ? (
            <Badge tone="success">License verified</Badge>
          ) : (
            <Badge tone="neutral">License verification pending</Badge>
          )}
        </div>

        <div className="mt-5 max-w-3xl">
          <h1 className="text-3xl tracking-[-0.02em] sm:text-4xl">{displayName}</h1>
          {agent.brokerage ? (
            <p className="mt-2 text-lg" style={{ color: "var(--text-muted)" }}>
              {agent.brokerage}
            </p>
          ) : null}
          {cities.length > 0 && (
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--text)" }}>
              Serves {cities.join("  ·  ")}
            </p>
          )}
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            {licenseLine}
          </p>
          {/*
            Unclaimed provenance, stated quietly: this profile restates the
            state license roll, the agent has not joined, and the claim path is
            one link away. Nothing is prefilled on the join form — the license
            number the claimant types is what matches them to this row, and
            staff review the claim before anything changes publicly.
          */}
          {!isSample && agent.unclaimed && (
            <div className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <p>Source: Florida license records. This agent hasn&rsquo;t joined TRACT yet.</p>
              <p className="mt-1">
                Are you {agent.firstName}?{" "}
                <Link
                  href="/agents/join"
                  className="font-semibold text-[var(--purple)] underline underline-offset-2"
                >
                  Claim this profile
                </Link>
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section pad="tight">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <div className="space-y-8">
            {agent.bio ? (
              <Card>
                <h2 className="text-xl font-semibold">About {agent.firstName}</h2>
                <p className="mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {agent.bio}
                </p>
              </Card>
            ) : null}

            <Card>
              <h2 className="text-xl font-semibold">How the introduction works</h2>
              <ol
                className="mt-4 list-decimal space-y-3 pl-5 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                <li>You tell us how to reach you — nothing goes to the agent yet.</li>
                <li>A TRACT team member calls you first to understand what you are looking for.</li>
                <li>
                  We make the introduction personally. You are never obligated to work with anyone
                  we introduce.
                </li>
              </ol>
              <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
                We do not publish agent phone numbers or email addresses, and we do not hand yours
                out. The introduction happens person to person, through TRACT.
              </p>
            </Card>
          </div>

          <div id="introduction">
            <AgentIntroductionForm
              agentSlug={agent.slug}
              agentFirstName={agent.firstName}
              cities={agent.cities}
            />
          </div>
        </div>
      </Section>

      <Section pad="tight">
        <Disclosure
          headline="What this profile does and does not claim."
          body={
            isSample
              ? "This profile is an illustrative sample invented to demonstrate the directory. The name, brokerage, cities, bio, and license number are all made up, the license format is deliberately invalid, and no verification has occurred or could occur. TRACT Mortgage is a mortgage brokerage; requesting an introduction is not an application and involves no credit inquiry."
              : agent.unclaimed
                ? "This profile restates public Florida real estate license records — name, license number, license type, location, and employing brokerage — and nothing more. The agent has not joined TRACT, provided any information here, or endorsed TRACT in any way, and no contact details of theirs are held or published. License status is stated exactly as established: 'verification pending' means TRACT has not independently re-verified the record. TRACT Mortgage is a mortgage brokerage; requesting an introduction is not an application, involves no credit inquiry, and no payment flows in either direction for referrals."
                : "Profile details were provided by the agent and reviewed before publication. License status is stated exactly as established: a profile says 'verified against state records' only after that check has completed, and 'verification pending' otherwise. TRACT Mortgage is a mortgage brokerage; requesting an introduction is not an application, involves no credit inquiry, and no payment flows in either direction for referrals."
          }
        />
      </Section>
    </>
  );
}
