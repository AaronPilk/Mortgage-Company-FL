import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { resolveReferralAgent } from "@/lib/referral";
import { ReferralCapture } from "@/components/referral/referral-capture";

/**
 * Referral landing — /r/<agent-slug>.
 *
 * A real-estate agent shares this link; a visitor who arrives here has the
 * agent remembered (client-side) so a lead they submit later still credits the
 * referrer. The page hits the public directory per request, so it is dynamic,
 * and it is a personalized entry point rather than something to rank, so it is
 * always noindex and off the sitemap.
 *
 * Two honest states, and nothing in between:
 *
 *   - The code resolves to a claimed, approved, consenting partner. Only then
 *     is a name shown, the referral remembered, and the page co-branded. Every
 *     name on the page comes from the reviewed directory row, never from the
 *     URL.
 *   - Anything else — a bogus code, an expired link, or an imported public
 *     record that never opted in — falls to a plain, friendly welcome that
 *     credits no one and echoes nothing from the URL back onto the page. It is
 *     never a 404: a shared link should not dead-end, and refusing to reflect
 *     the raw code is what keeps this from becoming a content-injection surface.
 *
 * No payment flows in either direction for a referral, and this is not an
 * application — the disclosure says both plainly.
 */

export const dynamic = "force-dynamic";

/** Personalized and never for search — noindex regardless of the code. */
export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "You've been referred to Wholesale Mortgage Lending",
    description:
      "A warm introduction to Wholesale Mortgage Lending, a licensed Florida mortgage brokerage. Start your plan or talk to a licensed loan officer.",
    path: "/r",
    noIndex: true
  });
}

export default async function ReferralLandingPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const agent = await resolveReferralAgent(decodeURIComponent(code));

  // Unresolved: a friendly, generic welcome that credits no one and reflects
  // nothing from the URL. No capture — there is no partner to remember.
  if (agent === null) {
    return (
      <Section width="narrow" orbs>
        <SectionHeading
          as="h1"
          eyebrow="Welcome"
          title="You've been referred to TRACT"
          gradientWord="TRACT"
          description="Wholesale Mortgage Lending is a licensed Florida mortgage brokerage. Whoever pointed you here thought we could help with the financing — here's where to start."
        />
        <NextSteps />
        <ReferralDisclosure />
      </Section>
    );
  }

  const firstName = agent.firstName;
  const fullName = `${agent.firstName} ${agent.lastName}`;
  const cities = agent.cities
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);

  return (
    <Section width="narrow" orbs>
      {/* Client-only: remembers the partner so a later lead still credits them. */}
      <ReferralCapture slug={agent.slug} />

      <SectionHeading
        as="h1"
        eyebrow="A personal introduction"
        title={`${firstName} sent you to TRACT`}
        gradientWord="TRACT"
        description={`${fullName} works with Wholesale Mortgage Lending on the financing side. TRACT is a licensed Florida mortgage brokerage — separate from ${firstName}'s real-estate business — and there's no cost to you for the introduction.`}
      />

      <Prose>
        <p>
          {firstName} pointed you here so the mortgage part is handled by people who do only that.
          {cities.length > 0
            ? ` ${firstName} works across ${cities.join(", ")}, and TRACT works with buyers throughout Florida.`
            : " TRACT works with buyers throughout Florida."}{" "}
          Nothing here is an application, and looking at your options costs nothing and pulls no
          credit.
        </p>
      </Prose>

      <NextSteps />

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-[var(--text)]">
          How the {firstName} × TRACT introduction works
        </h2>
        <ol
          className="mt-4 list-decimal space-y-3 pl-5 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <li>
            You start a plan or ask to talk — {firstName} doesn&rsquo;t receive your financial
            details, and neither does anyone until you choose to move forward.
          </li>
          <li>A licensed TRACT loan officer walks you through your real options, no obligation.</li>
          <li>
            You keep working with {firstName} on finding the home. TRACT handles the loan. Neither
            side pays the other for the referral.
          </li>
        </ol>
      </Card>

      <ReferralDisclosure />
    </Section>
  );
}

/** The two primary paths off the page. Shared by both states so the CTAs never drift apart. */
function NextSteps() {
  return (
    <Card className="mt-8">
      <h2 className="text-xl font-bold text-[var(--text)]">Where to start</h2>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        Build a plan in a few minutes, or talk it through with a licensed loan officer. Both are
        free, and neither is an application.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <ButtonLink href="/plan" variant="primary" data-cta="referral-plan">
          Build your plan
        </ButtonLink>
        <ButtonLink href="/talk" variant="secondary" data-cta="referral-talk">
          Talk to a loan officer
        </ButtonLink>
        <Link
          href="/calculators"
          className="self-center text-sm font-semibold underline"
          style={{ color: "var(--purple)" }}
        >
          Or explore the calculators
        </Link>
      </div>
    </Card>
  );
}

function ReferralDisclosure() {
  return (
    <Disclosure
      headline="What a referral here means — and what it doesn't."
      body="Wholesale Mortgage Lending is a licensed Florida mortgage brokerage. A referral is an introduction only: it is not an application, it involves no credit inquiry, and no payment flows in either direction between TRACT and the person who referred you. You are never obligated to work with anyone, and your financial details are shared with no one until you choose to move forward with a licensed loan officer."
    />
  );
}
