/**
 * TRACT loan-stage model — the borrower's status tracker.
 *
 * One shared source of truth for the order of the checkpoints, their
 * borrower-facing labels, and the plain-English "what's happening / what you can
 * do" copy. The portal renders it; the loan-officer workspace advances it.
 *
 * Compliance boundary (ECOA / Reg B): this is presentation only. A stage is set
 * by a human loan officer through loan_advance_stage — no logic here decides or
 * implies whether anyone qualifies. Copy is deliberately process-oriented
 * ("your file is with underwriting"), never a guarantee of approval.
 */

export const LOAN_STAGES = [
  "intake",
  "pre_approval",
  "processing",
  "underwriting",
  "conditions",
  "final_approval",
  "withdrawn",
  "denied"
] as const;

export type LoanStage = (typeof LOAN_STAGES)[number];

/** The happy-path checkpoints, in order — what the progress bar walks through. */
export const LOAN_STAGE_FLOW = [
  "intake",
  "pre_approval",
  "processing",
  "underwriting",
  "conditions",
  "final_approval"
] as const satisfies readonly LoanStage[];

/** Files that have left the flow. Rendered apart from the progress bar. */
export const TERMINAL_STAGES = ["withdrawn", "denied"] as const satisfies readonly LoanStage[];

export type StageTone = "active" | "done" | "upcoming" | "stopped";

export interface LoanStageMeta {
  stage: LoanStage;
  /** Short label for the tracker node. */
  label: string;
  /** One line: what this step means, in the borrower's words. */
  blurb: string;
  /** What the borrower can do to move it forward, if anything. */
  action: string | null;
}

export const LOAN_STAGE_META: Record<LoanStage, LoanStageMeta> = {
  intake: {
    stage: "intake",
    label: "Application started",
    blurb: "You've told us about your loan. Next we build your document checklist.",
    action: "Upload the documents on your checklist below — that's what moves this forward."
  },
  pre_approval: {
    stage: "pre_approval",
    label: "Pre-approval review",
    blurb: "Your loan officer is reviewing your file and documents for pre-approval.",
    action: "Keep an eye out for any document requests — clearing them quickly keeps things fast."
  },
  processing: {
    stage: "processing",
    label: "Processing",
    blurb: "Your file is being packaged and your documents verified for the lender.",
    action:
      "If we ask for anything else, upload it here — it's the one thing that can hold this up."
  },
  underwriting: {
    stage: "underwriting",
    label: "Underwriting",
    blurb: "The lender's underwriter is reviewing everything. This is the deep review.",
    action: "Nothing needed right now. If a condition comes back, you'll see it here."
  },
  conditions: {
    stage: "conditions",
    label: "Conditions",
    blurb: "The underwriter approved your loan with a short list of items to satisfy.",
    action:
      "Clear the conditions below — you're close, and each one you clear moves you toward closing."
  },
  final_approval: {
    stage: "final_approval",
    label: "Cleared to close",
    blurb: "Every condition is satisfied and your loan is cleared to close.",
    action: "Your loan officer will reach out to schedule closing. Nothing to upload."
  },
  withdrawn: {
    stage: "withdrawn",
    label: "Withdrawn",
    blurb:
      "This application was withdrawn. Your loan officer can restart it whenever you're ready.",
    action: null
  },
  denied: {
    stage: "denied",
    label: "Not approved",
    blurb:
      "This application didn't move forward. Your loan officer can walk you through why and what options may fit better.",
    action: null
  }
};

export function isTerminalStage(stage: LoanStage): boolean {
  return (TERMINAL_STAGES as readonly LoanStage[]).includes(stage);
}

export interface StageProgress {
  /** Zero-based index of the current stage within the flow, or -1 if terminal. */
  index: number;
  /** Number of checkpoints in the happy-path flow. */
  total: number;
  isTerminal: boolean;
}

/** Where a file sits in the flow, for rendering the tracker. */
export function stageProgress(stage: LoanStage): StageProgress {
  const total = LOAN_STAGE_FLOW.length;
  if (isTerminalStage(stage)) return { index: -1, total, isTerminal: true };
  const index = (LOAN_STAGE_FLOW as readonly LoanStage[]).indexOf(stage);
  return { index, total, isTerminal: false };
}

/** The tone of one flow node relative to where the file currently sits. */
export function stageToneAt(nodeIndex: number, currentIndex: number): StageTone {
  if (currentIndex < 0) return "upcoming"; // terminal file: flow nodes are inert
  if (nodeIndex < currentIndex) return "done";
  if (nodeIndex === currentIndex) return "active";
  return "upcoming";
}
