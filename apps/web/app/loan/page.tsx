import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOAN_PURPOSE_LABELS, LOAN_STAGE_META } from "@tract/domain";
import { Badge, ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { LoanAuthPrompt } from "@/components/loan/auth-prompt";
import { listLoanFiles, loanPortalAvailable } from "@/lib/loan";
import { pageMetadata } from "@/lib/metadata";
import { createRequestClient } from "@/lib/supabase";

export const metadata: Metadata = pageMetadata({
  title: "Your loan",
  description: "Track your loan, see what's needed, and upload your documents.",
  path: "/loan",
  noIndex: true
});

export const dynamic = "force-dynamic";

function date(value: string): string {
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium" });
}

export default async function LoanHomePage() {
  if (!loanPortalAvailable()) notFound();

  const supabase = await createRequestClient();
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const user = userResult?.error === null ? userResult.data.user : null;

  if (supabase === null || user === null) {
    return (
      <LoanAuthPrompt
        defaultMode="signIn"
        title="Sign in to your loan"
        intro="Your application, your document checklist, and your loan status all live here — behind your secure login."
      />
    );
  }

  const files = await listLoanFiles(supabase);

  if (files.length === 0) {
    return (
      <Section width="narrow">
        <div className="mb-2">
          <ButtonLink href="/account" variant="ghost" className="px-0 text-sm">
            ← Account &amp; saved homes
          </ButtonLink>
        </div>
        <SectionHeading
          as="h1"
          eyebrow="TRACT"
          title="Let's get your loan started"
          description="Answer a few plain-language questions and we'll build your exact document checklist — no guessing what underwriting wants."
        />
        <Card>
          <ol className="space-y-4">
            {[
              [
                "Tell us about your loan",
                "A short, guided set of questions. No SSN, no account numbers."
              ],
              [
                "Get your personalized checklist",
                "We show you exactly which documents you'll need, and why."
              ],
              [
                "Upload at your own pace",
                "Snap a photo or upload a file. Watch your status move in real time."
              ]
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "var(--purple)" }}
                >
                  {i + 1}
                </span>
                <span>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    {title}
                  </span>
                  <span className="mt-0.5 block text-sm" style={{ color: "var(--text-muted)" }}>
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <ButtonLink href="/loan/apply" variant="primary">
              Start my application
            </ButtonLink>
          </div>
        </Card>
      </Section>
    );
  }

  return (
    <Section width="wide">
      <div className="mb-2">
        <ButtonLink href="/account" variant="ghost" className="px-0 text-sm">
          ← Account &amp; saved homes
        </ButtonLink>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading as="h1" eyebrow="TRACT" title="Your loans" />
        <ButtonLink href="/loan/apply" variant="secondary">
          Start another application
        </ButtonLink>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {files.map((file) => {
          const meta = LOAN_STAGE_META[file.stage];
          const denied = file.stage === "denied";
          return (
            <Card key={file.id} as="article">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
                    {file.reference_code}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{LOAN_PURPOSE_LABELS[file.purpose]}</h2>
                </div>
                <Badge tone={denied ? "warning" : "purple"}>{meta.label}</Badge>
              </div>
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {meta.blurb}
              </p>
              <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
                Updated {date(file.updated_at)}
              </p>
              <div className="mt-4">
                <ButtonLink href={`/loan/${file.id}`} variant="ghost" className="px-0">
                  Open my file
                </ButtonLink>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
