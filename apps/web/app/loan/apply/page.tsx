import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section, SectionHeading } from "@/components/ui";
import { IntakeWizard } from "@/components/loan/intake-wizard";
import { LoanAuthPrompt } from "@/components/loan/auth-prompt";
import { loanPortalAvailable } from "@/lib/loan";
import { pageMetadata } from "@/lib/metadata";
import { createRequestClient } from "@/lib/supabase";

export const metadata: Metadata = pageMetadata({
  title: "Start your application",
  description: "A short, guided pre-application that builds your document checklist.",
  path: "/loan/apply",
  noIndex: true
});

export const dynamic = "force-dynamic";

export default async function LoanApplyPage() {
  if (!loanPortalAvailable()) notFound();

  const supabase = await createRequestClient();
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const user = userResult?.error === null ? userResult.data.user : null;

  if (supabase === null || user === null) {
    return (
      <LoanAuthPrompt
        defaultMode="create"
        title="Create your account to begin"
        intro="Your application saves as you go, so you can start now and finish whenever. First, a quick account to keep everything secure and in one place."
      />
    );
  }

  return (
    <Section width="narrow">
      <SectionHeading
        as="h1"
        eyebrow="TRACT"
        title="Your pre-application"
        description="Plain-language questions — no SSN, no account numbers, nothing to look up. As you answer, we build the exact checklist your loan needs."
      />
      <IntakeWizard />
    </Section>
  );
}
