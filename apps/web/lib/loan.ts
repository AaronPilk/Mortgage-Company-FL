import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntakeAnswers, LoanPurpose, LoanStage } from "@tract/domain";
import { publicFeatures } from "./env";

/**
 * TRACT loan portal — server data access.
 *
 * Every call goes through the `loan` compartment's SECURITY DEFINER doors, never
 * a direct table read (the schema is off the REST surface). Reads use the
 * request-scoped client so the RPC self-scopes to auth.uid(); the create door is
 * service-role only and is handed the borrower id from the verified session,
 * never from a request body.
 */

export type LoanDocType = "w2" | "paystub" | "bank_statement" | "tax_return" | "id" | "other";
export type LoanConditionStatus = "open" | "submitted" | "cleared" | "waived";
export type LoanDocumentStatus = "pending" | "uploaded" | "verified" | "rejected";

export type LoanFileSummary = {
  id: string;
  purpose: LoanPurpose;
  stage: LoanStage;
  reference_code: string;
  price_band: string | null;
  loan_amount_band: string | null;
  updated_at: string;
};

export type LoanStageEvent = {
  from_stage: LoanStage | null;
  to_stage: LoanStage;
  note: string | null;
  created_at: string;
};

export type LoanCondition = {
  id: string;
  label: string;
  description: string | null;
  status: LoanConditionStatus;
  updated_at: string;
};

export type LoanDocumentMeta = {
  id: string;
  doc_type: LoanDocType;
  requirement_id: string | null;
  upload_status: LoanDocumentStatus;
  created_at: string;
};

export type LoanFileDetail = {
  id: string;
  reference_code: string;
  purpose: LoanPurpose;
  stage: LoanStage;
  price_band: string | null;
  loan_amount_band: string | null;
  /** The banded, structured intake answers. Never raw PII. May be null on old files. */
  intake: IntakeAnswers | null;
  created_at: string;
  updated_at: string;
  stage_events: LoanStageEvent[];
  conditions: LoanCondition[];
  documents: LoanDocumentMeta[];
};

/** The whole surface is dark unless FEATURE_TRACT (and accounts) are on. */
export function loanPortalAvailable(): boolean {
  return publicFeatures().tract;
}

/** A borrower's own files — the list view. Empty array on any read failure. */
export async function listLoanFiles(supabase: SupabaseClient): Promise<LoanFileSummary[]> {
  const { data, error } = await supabase.rpc("loan_list_my_files");
  if (error !== null || data === null) return [];
  return data as LoanFileSummary[];
}

/**
 * One of the borrower's own files, in full. Returns null when the file is not
 * theirs or does not exist — the door reveals nothing either way.
 */
export async function getLoanFileDetail(
  supabase: SupabaseClient,
  loanFileId: string
): Promise<LoanFileDetail | null> {
  const { data, error } = await supabase.rpc("loan_get_file", { p_loan_file_id: loanFileId });
  if (error !== null || data === null) return null;
  return data as LoanFileDetail;
}

// ---------------------------------------------------------------------------
// Document upload. Contents go to a private Storage bucket via a short-lived,
// server-minted signed URL; only metadata is recorded, through the service-role
// doors. The Worker never streams the bytes (Cloudflare CPU budget).
// ---------------------------------------------------------------------------

/** Private bucket. Never public; reached only through signed URLs. */
export const LOAN_DOCS_BUCKET = "loan-docs";

/** Matches the bucket's file_size_limit (25 MB). */
export const LOAN_DOC_MAX_BYTES = 25 * 1024 * 1024;

/** Accepted upload types → file extension. Mirrors the bucket allowlist. */
export const LOAN_DOC_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif"
};

export function isAllowedDocContentType(contentType: string): boolean {
  return Object.prototype.hasOwnProperty.call(LOAN_DOC_EXTENSIONS, contentType);
}

/** Record a pending document. Service-role; borrower id comes from the session. */
export async function addLoanDocument(
  service: SupabaseClient,
  params: {
    borrowerUserId: string;
    loanFileId: string;
    requirementId: string;
    docType: LoanDocType;
    storageKey: string;
    contentType: string;
    byteSize: number;
  }
): Promise<string | null> {
  const { data, error } = await service.rpc("loan_add_document", {
    p_borrower_user_id: params.borrowerUserId,
    p_loan_file_id: params.loanFileId,
    p_requirement_id: params.requirementId,
    p_doc_type: params.docType,
    p_storage_key: params.storageKey,
    p_content_type: params.contentType,
    p_byte_size: params.byteSize
  });
  if (error !== null || typeof data !== "string") return null;
  return data;
}

/** Flip a document to 'uploaded' once the browser confirms the PUT. Service-role. */
export async function markLoanDocumentUploaded(
  service: SupabaseClient,
  params: { borrowerUserId: string; documentId: string }
): Promise<boolean> {
  const { error } = await service.rpc("loan_mark_document_uploaded", {
    p_borrower_user_id: params.borrowerUserId,
    p_document_id: params.documentId
  });
  return error === null;
}

/**
 * Mint a one-shot signed upload URL for a server-derived key. The browser PUTs
 * the file straight to this URL — the token is embedded, so no client-side key
 * is needed and the bucket stays fully private.
 */
export async function createSignedDocumentUpload(
  service: SupabaseClient,
  storageKey: string
): Promise<string | null> {
  const { data, error } = await service.storage
    .from(LOAN_DOCS_BUCKET)
    .createSignedUploadUrl(storageKey);
  if (error !== null || data === null) return null;
  return data.signedUrl;
}

/**
 * Open a new file after intake. Service-role only. `borrowerUserId` MUST come
 * from the verified session, never from the request body.
 */
export async function openLoanFile(
  service: SupabaseClient,
  params: {
    borrowerUserId: string;
    purpose: LoanPurpose;
    intake: IntakeAnswers;
    priceBand?: string | null;
    loanAmountBand?: string | null;
  }
): Promise<string | null> {
  const { data, error } = await service.rpc("loan_open_file", {
    p_borrower_user_id: params.borrowerUserId,
    p_purpose: params.purpose,
    p_intake: params.intake,
    p_price_band: params.priceBand ?? null,
    p_loan_amount_band: params.loanAmountBand ?? null
  });
  if (error !== null || typeof data !== "string") return null;
  return data;
}
