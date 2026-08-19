import type { Metadata } from "next";
import { absoluteUrl, breadcrumbNode, graph, webPageNode } from "@tract/seo";
import { ButtonLink, Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { SITE_URL, businessIdentity } from "@/lib/site";
import { AgentJoinForm } from "@/components/agents/join-form";

export const metadata: Metadata = pageMetadata({
  title: "Join the TRACT agent network",
  description:
    "Get introduced to buyers already working through their financing with TRACT. You stay the agent of record, and every profile is reviewed before it goes live.",
  path: "/agents/join"
});

/**
 * Agent-side funnel.
 *
 * The pitch stays inside what is true today: TRACT introduces agents to
 * consumers who asked for an introduction, the agent remains the agent of
 * record, and profiles go live only after review. Nothing here mentions
 * pricing in any direction — and the RESPA framing from the partner page
 * applies in full: no payment flows either way for referrals.
 */
const PITCH = [
  {
    heading: "Introductions, made personally",
    body: "When a buyer asks to work with you, a TRACT team member makes the introduction by phone — not a form dump, not a shared spreadsheet of names."
  },
  {
    heading: "You stay the agent of record",
    body: "We are a mortgage brokerage. The buyer relationship on the real estate side is yours, and we have no listing business competing with it."
  },
  {
    heading: "Buyers working on their financing",
    body: "The people browsing this directory are here planning a mortgage. When one asks for you, the financing conversation is already underway."
  }
];

export default function AgentJoinPage() {
  const url = absoluteUrl(SITE_URL, "/agents/join");
  return (
    <>
      <JsonLd
        value={graph(
          [
            webPageNode({
              identity: businessIdentity,
              url,
              name: "Join the TRACT agent network",
              description:
                "Apply to be listed in the TRACT agent directory and receive personally made introductions."
            }),
            breadcrumbNode([
              { name: "Home", url: absoluteUrl(SITE_URL, "/") },
              { name: "Agents", url: absoluteUrl(SITE_URL, "/agents") },
              { name: "Join", url }
            ])
          ],
          businessIdentity
        )}
      />

      <Section orbs>
        <SectionHeading
          as="h1"
          eyebrow="For agents"
          title="Join the TRACT agent network"
          gradientWord="network"
          description="A profile in our directory, and introductions made personally when a buyer asks to work with you. Every profile is reviewed — including license verification — before it goes live."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {PITCH.map((item) => (
            <Card key={item.heading}>
              <h2 className="text-lg font-semibold text-[var(--text)]">{item.heading}</h2>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{item.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <AgentJoinForm />
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                What happens after you apply
              </h2>
              <ol
                className="mt-4 list-decimal space-y-3 pl-5 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                <li>
                  We review your application and check your license number against state records.
                </li>
                <li>
                  Until that check completes, your profile — if published — says &ldquo;License
                  verification pending.&rdquo; We only claim what we have verified.
                </li>
                <li>
                  Once you are live, buyers can request an introduction to you. We call you when one
                  does.
                </li>
              </ol>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Your contact details stay private
              </h2>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                The directory never shows your phone number or email address. Consumers ask TRACT
                for an introduction, and we make it personally — you hear from us, not from a form
                bot.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/agents" variant="secondary">
                  Browse the directory
                </ButtonLink>
                <ButtonLink href="/partners/real-estate-agents" variant="ghost">
                  How we work with agents
                </ButtonLink>
              </div>
            </Card>
          </div>
        </div>

        <Disclosure
          headline="No payment flows in either direction for referrals."
          body="We do not pay for referrals and we do not accept payment for introductions, because federal law prohibits exchanging things of value for settlement service referrals. Listing is at TRACT's discretion after review, and a profile only ever claims license verification once we have completed it against state records."
        />
      </Section>
    </>
  );
}
