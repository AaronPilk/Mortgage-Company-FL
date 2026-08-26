import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { AccountSignIn } from "@/components/account/account-sign-in";
import { ReferralDashboard } from "@/components/agents/referral-dashboard";
import {
  agentDashboardAvailable,
  readReferralSummary,
  readReferralTimeline,
  resolveApprovedAgent
} from "@/lib/agent-referrals";
import { pageMetadata } from "@/lib/metadata";
import { createRequestClient } from "@/lib/supabase";

/**
 * Agent partner referral dashboard — /agents/dashboard.
 *
 * A private, authenticated partner surface. It never enters the sitemap (it is
 * unregistered in the route table by design) and is forced noindex. The whole
 * page is dark unless FEATURE_AGENT_DASHBOARD (and accounts) are on.
 *
 * Four honest states, in order:
 *   1. Flag off, or no database configured — the surface does not exist (404).
 *   2. Signed out — the account sign-in card, same as /account.
 *   3. Signed in but not an approved partner (pending, unclaimed, or a plain
 *      consumer) — an honest "pending / join" state, with NO data fetch.
 *   4. An approved partner — their own coarse counts, buckets, and recency.
 */

export const metadata: Metadata = pageMetadata({
  title: "Your referral dashboard",
  description:
    "See the referrals your TRACT link has driven — counts, coarse stages, and recency. Never a consumer's identity.",
  path: "/agents/dashboard",
  noIndex: true
});

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  if (!agentDashboardAvailable()) notFound();

  const supabase = await createRequestClient();
  if (supabase === null) notFound();

  const userResult = await supabase.auth.getUser();
  const user = userResult.error === null ? userResult.data.user : null;

  // Signed out: reuse the account page's sign-in card. A partner already holds
  // an account, so sign-in leads; the create toggle is one tap away inside it.
  if (user === null) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return (
      <Section width="narrow">
        <SectionHeading
          as="h1"
          eyebrow="For agents"
          title="Sign in to your referral dashboard"
          description="Your dashboard shows the referrals your link has driven — counts and coarse stages only, never a consumer's identity. Sign in to your partner account to see it."
        />
        <Card>
          <AccountSignIn
            configured={supabaseUrl !== undefined && anonKey !== undefined}
            supabaseUrl={supabaseUrl}
            anonKey={anonKey}
            defaultMode="signIn"
            nextPath="/agents/dashboard"
          />
          <div className="mt-6">
            <ButtonLink href="/agents/join" variant="secondary">
              Not a partner yet? Join the network
            </ButtonLink>
          </div>
        </Card>
      </Section>
    );
  }

  const agent = await resolveApprovedAgent(supabase, user.id);

  // Signed in, but not an approved partner. Say so plainly and stop — no
  // referral read happens for someone who has no approved profile.
  if (agent === null) {
    return (
      <Section width="narrow">
        <SectionHeading
          as="h1"
          eyebrow="For agents"
          title="Your partner profile is pending"
          description="This dashboard is for approved TRACT referral partners. We couldn't find an approved partner profile on your account yet."
        />
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            If you&rsquo;ve applied, your profile is still in review — including the license check —
            and your dashboard turns on once it&rsquo;s approved. If you haven&rsquo;t applied yet,
            you can join the network below. Nothing here is an application, and we never share a
            consumer&rsquo;s identity.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/agents/join" variant="primary">
              Join the agent network
            </ButtonLink>
            <ButtonLink href="/account" variant="ghost">
              Back to your account
            </ButtonLink>
          </div>
        </Card>
      </Section>
    );
  }

  const [summary, timeline] = await Promise.all([
    readReferralSummary(supabase),
    readReferralTimeline(supabase)
  ]);

  return (
    <ReferralDashboard
      agentFirstName={agent.firstName}
      slug={agent.slug}
      summary={summary}
      timeline={timeline}
    />
  );
}
