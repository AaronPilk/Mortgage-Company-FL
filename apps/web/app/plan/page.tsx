import type { Metadata } from "next";
import { Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { Planner } from "@/components/planner/planner";
import { GOAL_OPTIONS, type PlannerGoalValue } from "@/components/planner/options";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";
import { createRequestClient } from "@/lib/supabase";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  LEAD_DISCLOSURE_VERSION,
  SMS_CONSENT_TEXT
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Mortgage planner",
  description:
    "Sign up with your name, email, and phone, then answer a few questions and watch a payment estimate build as you go. No credit pull and no application.",
  path: "/plan"
});

// Reads the session so a signed-in visitor skips the sign-up gate.
export const dynamic = "force-dynamic";

/**
 * The planner is deep-linkable: /plan?goal=refinance opens with that goal
 * chosen. The value is validated against the known set here rather than trusted,
 * because anything in a query string arrived from outside.
 */
function goalFromQuery(value: string | string[] | undefined): PlannerGoalValue | "" {
  const candidate = Array.isArray(value) ? value[0] : value;
  const match = GOAL_OPTIONS.find((option) => option.value === candidate);
  return match === undefined ? "" : match.value;
}

export default async function PlanPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialGoal = goalFromQuery((await searchParams).goal);

  // For the optional save-to-account offer after the sign-up gate. The anon key
  // is public by design; nothing here weakens the accounts feature gate.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accountsConfigured =
    publicFeatures().accounts && supabaseUrl !== undefined && anonKey !== undefined;

  // A signed-in visitor should never be asked to "sign up" to plan. Read their
  // session and profile so the planner opens as a confirmation, pre-filled.
  const supabase = accountsConfigured ? await createRequestClient() : null;
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const user = userResult?.error === null ? userResult.data.user : null;

  let identity: { firstName: string; lastName: string; email: string; phone: string } | undefined;
  if (user !== null && supabase !== null) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, phone_e164")
      .eq("id", user.id)
      .maybeSingle();
    const nameParts = ((profile?.display_name as string | null) ?? "")
      .trim()
      .split(/\s+/)
      .filter((part) => part !== "");
    identity = {
      firstName: nameParts[0] ?? "",
      lastName: nameParts.slice(1).join(" "),
      email: user.email ?? "",
      phone: (profile?.phone_e164 as string | null) ?? ""
    };
  }

  return (
    <>
      <Section pad="head" orbs>
        <SectionHeading
          as="h1"
          eyebrow="Planner"
          title="Build the picture before you talk to anyone"
          gradientWord="before you talk to anyone"
          description="A quick sign-up — name, email, phone — opens four short steps. A payment estimate appears from the second one and keeps updating as you answer."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="text-base font-semibold text-[var(--text)]">No credit pull</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Nothing on this page runs a credit inquiry, soft or hard. The credit question is a
              range you tell us, and it is never treated as a score.
            </p>
          </Card>
          <Card>
            <h2 className="text-base font-semibold text-[var(--text)]">Not an application</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              We never ask for a Social Security number, a date of birth, an account number, or a
              document. Income and debt are ranges, not figures.
            </p>
          </Card>
          <Card>
            <h2 className="text-base font-semibold text-[var(--text)]">An illustration only</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              The estimate is arithmetic on the numbers you enter. It is not a quote, an approval,
              or a promise that any lender will do this.
            </p>
          </Card>
        </div>
      </Section>

      <Section pad="tight">
        <Planner
          initialGoal={initialGoal}
          disclosureText={LEAD_DISCLOSURE_TEXT}
          smsConsentText={SMS_CONSENT_TEXT}
          emailConsentText={EMAIL_CONSENT_TEXT}
          disclosureVersion={LEAD_DISCLOSURE_VERSION}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          accountsConfigured={accountsConfigured}
          supabaseUrl={supabaseUrl}
          anonKey={anonKey}
          signedIn={user !== null}
          identity={identity}
        />
        <Disclosure
          headline="Nothing here is a credit decision."
          body="This page collects a marketing inquiry and shows an estimate built from what you entered. It is not an application, it does not obligate you, and it does not result in a credit inquiry. Words like preapproved and approved describe things only a lender can say, after a real review, and nothing on this page means any of them. Binding figures arrive on a Loan Estimate from a lender."
          excludes={[
            "Any credit review, soft or hard",
            "Lender program eligibility and overlays",
            "Closing costs, prepaids, and escrow setup"
          ]}
          version={LEAD_DISCLOSURE_VERSION}
        />
      </Section>
    </>
  );
}
