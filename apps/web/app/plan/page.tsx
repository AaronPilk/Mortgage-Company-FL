import type { Metadata } from "next";
import { Card, Disclosure, Section, SectionHeading } from "@/components/ui";
import { Planner } from "@/components/planner/planner";
import { GOAL_OPTIONS, type PlannerGoalValue } from "@/components/planner/options";
import { pageMetadata } from "@/lib/metadata";
import {
  EMAIL_CONSENT_TEXT,
  LEAD_DISCLOSURE_TEXT,
  LEAD_DISCLOSURE_VERSION,
  SMS_CONSENT_TEXT
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Mortgage planner",
  description:
    "Answer a few questions and watch a payment estimate build as you go. No credit pull, no application, and the estimate is yours before we ask for anything.",
  path: "/plan"
});

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

  return (
    <>
      <Section pad="head" orbs>
        <SectionHeading
          as="h1"
          eyebrow="Planner"
          title="Build the picture before you talk to anyone"
          gradientWord="before you talk to anyone"
          description="Four short steps. A payment estimate appears from the second one and keeps updating as you answer — it is yours whether or not you ever give us your name."
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
