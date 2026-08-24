import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  IntakeAnswersSchema,
  LOAN_PURPOSE_LABELS,
  LOAN_STAGE_META,
  isTerminalStage
} from "@tract/domain";
import { Badge, ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { StageTracker } from "@/components/loan/stage-tracker";
import { DocumentChecklist } from "@/components/loan/document-checklist";
import { LoanAuthPrompt } from "@/components/loan/auth-prompt";
import { getLoanFileDetail, loanPortalAvailable, type LoanCondition } from "@/lib/loan";
import { pageMetadata } from "@/lib/metadata";
import { createRequestClient } from "@/lib/supabase";

export const metadata: Metadata = pageMetadata({
  title: "Your loan file",
  description: "Your loan status, conditions, and document checklist.",
  path: "/loan",
  noIndex: true
});

export const dynamic = "force-dynamic";

function conditionTone(status: LoanCondition["status"]): "purple" | "neutral" | "success" {
  if (status === "cleared") return "success";
  if (status === "open") return "purple";
  return "neutral";
}

const CONDITION_LABEL: Record<LoanCondition["status"], string> = {
  open: "Needs your attention",
  submitted: "Submitted — under review",
  cleared: "Cleared",
  waived: "Waived"
};

export default async function LoanFilePage({ params }: { params: Promise<{ id: string }> }) {
  if (!loanPortalAvailable()) notFound();

  const { id } = await params;

  const supabase = await createRequestClient();
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const user = userResult?.error === null ? userResult.data.user : null;

  if (supabase === null || user === null) {
    return (
      <LoanAuthPrompt
        defaultMode="signIn"
        title="Sign in to view your file"
        intro="Your loan file is private to you. Sign in to see your status and document checklist."
      />
    );
  }

  const detail = await getLoanFileDetail(supabase, id);
  if (detail === null) notFound();

  const meta = LOAN_STAGE_META[detail.stage];
  const terminal = isTerminalStage(detail.stage);
  const parsedIntake = detail.intake === null ? null : IntakeAnswersSchema.safeParse(detail.intake);
  const openConditions = detail.conditions.filter((c) => c.status === "open");

  return (
    <Section width="wide">
      <div className="mb-2">
        <ButtonLink href="/loan" variant="ghost" className="px-0 text-sm">
          ← All my loans
        </ButtonLink>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
            {detail.reference_code}
          </p>
          <SectionHeading as="h1" title={LOAN_PURPOSE_LABELS[detail.purpose]} />
        </div>
        <Badge tone={detail.stage === "denied" ? "warning" : "purple"}>{meta.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Status + what to do next */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">Where your loan is</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {meta.blurb}
            </p>
            {meta.action !== null && !terminal && (
              <p
                className="mt-4 rounded-xl border p-4 text-sm"
                style={{
                  borderColor: "var(--purple)",
                  background: "var(--purple-subtle)",
                  color: "var(--text)"
                }}
              >
                {meta.action}
              </p>
            )}
            <div className="mt-6">
              <StageTracker stage={detail.stage} />
            </div>
          </Card>

          {detail.conditions.length > 0 && (
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Your conditions</h2>
                {openConditions.length > 0 && (
                  <Badge tone="purple">{openConditions.length} to clear</Badge>
                )}
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Items the lender needs to finish your loan. Clear these and you're moving to
                closing.
              </p>
              <ul className="mt-4 space-y-3">
                {detail.conditions.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {c.label}
                      </p>
                      <Badge tone={conditionTone(c.status)}>{CONDITION_LABEL[c.status]}</Badge>
                    </div>
                    {c.description !== null && (
                      <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                        {c.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Document checklist */}
        <Card>
          <h2 className="text-xl font-bold">Your documents</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Built from your answers — exactly what your loan needs, and why each one matters.
          </p>
          <div
            className="mt-4 rounded-xl border p-3 text-xs"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-muted)"
            }}
          >
            Secure upload is being switched on. For now this is your prepared checklist — your loan
            officer will confirm the fastest way to send each item.
          </div>
          <div className="mt-6">
            {parsedIntake !== null && parsedIntake.success ? (
              <DocumentChecklist intake={parsedIntake.data} documents={detail.documents} />
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                We'll show your personalized checklist here as soon as your intake is on file.
              </p>
            )}
          </div>
        </Card>
      </div>
    </Section>
  );
}
