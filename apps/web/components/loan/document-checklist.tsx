import { requiredDocuments, type IntakeAnswers, type RequirementCategory } from "@tract/domain";
import { Badge } from "@/components/ui";
import { DocumentUploadButton } from "@/components/loan/document-upload-button";
import type { LoanDocumentMeta } from "@/lib/loan";

/**
 * The borrower's personalised document checklist.
 *
 * Built deterministically from their intake answers by @tract/domain
 * requiredDocuments — the encoding of the standard agency documentation logic
 * Dan refines with experience. Each item says, in plain English, WHY it's
 * needed, and carries a one-tap upload. This is a checklist generator, never a
 * credit decision (ECOA / Reg B).
 *
 * Per-item status is derived from document metadata: an item is "received" once
 * a matching upload is recorded against its requirement id.
 */

const CATEGORY_ORDER: RequirementCategory[] = [
  "identity",
  "income",
  "assets",
  "purpose",
  "property",
  "credit",
  "explanation"
];

const CATEGORY_TITLE: Record<RequirementCategory, string> = {
  identity: "Who you are",
  income: "Your income",
  assets: "Your down payment & savings",
  purpose: "The loan & property",
  property: "The property",
  credit: "Credit history",
  explanation: "Quick explanations"
};

type ItemStatus = "received" | "needed" | "optional";

function statusOf(requirementId: string, required: boolean, provided: Set<string>): ItemStatus {
  if (provided.has(requirementId)) return "received";
  return required ? "needed" : "optional";
}

export function DocumentChecklist({
  loanFileId,
  intake,
  documents
}: {
  loanFileId: string;
  intake: IntakeAnswers;
  documents: LoanDocumentMeta[];
}) {
  const requirements = requiredDocuments(intake);

  // An item is satisfied once a matching upload is recorded and not rejected.
  const provided = new Set(
    documents
      .filter((d) => d.requirement_id !== null && d.upload_status !== "rejected")
      .map((d) => d.requirement_id as string)
  );

  const requiredCount = requirements.filter((r) => r.required).length;
  const receivedRequired = requirements.filter((r) => r.required && provided.has(r.id)).length;

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: requirements.filter((r) => r.category === category)
  })).filter((group) => group.items.length > 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {receivedRequired} of {requiredCount} required items in
        </p>
        <div
          className="h-2 w-40 overflow-hidden rounded-full"
          style={{ background: "var(--surface-2)" }}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${requiredCount === 0 ? 0 : (receivedRequired / requiredCount) * 100}%`,
              background: "var(--color-success)"
            }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {grouped.map((group) => (
          <section key={group.category}>
            <h3
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--text-muted)" }}
            >
              {CATEGORY_TITLE[group.category]}
            </h3>
            <ul className="space-y-3">
              {group.items.map((item) => {
                const status = statusOf(item.id, item.required, provided);
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor:
                        status === "received" ? "rgb(15 122 79 / 0.35)" : "var(--border)",
                      background: status === "received" ? "rgb(15 122 79 / 0.06)" : "var(--surface)"
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {item.label}
                      </p>
                      {status === "received" ? (
                        <Badge tone="success">Received</Badge>
                      ) : status === "needed" ? (
                        <Badge tone="purple">Needed</Badge>
                      ) : (
                        <Badge tone="neutral">If it applies to you</Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                      {item.why}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <DocumentUploadButton
                        loanFileId={loanFileId}
                        requirementId={item.id}
                        received={status === "received"}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
