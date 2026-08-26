import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { IntakeAnswersSchema, requiredDocuments } from "@tract/domain";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";
import {
  addLoanDocument,
  createSignedDocumentUpload,
  getLoanFileDetail,
  isAllowedDocContentType,
  LOAN_DOCS_BUCKET,
  LOAN_DOC_EXTENSIONS,
  LOAN_DOC_MAX_BYTES,
  loanPortalAvailable,
  markLoanDocumentUploaded,
  type LoanDocType
} from "@/lib/loan";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Borrower document upload — the two-step, contents-never-touch-the-Worker flow.
 *
 *  POST  → validate ownership + type + size, derive the storage key and the
 *          doc type from the borrower's OWN checklist, record a pending row, and
 *          return a one-shot signed URL the browser PUTs the file to directly.
 *  PATCH → the browser confirms the PUT; flip the row to 'uploaded'.
 *
 * The borrower id always comes from the verified session, never the body. The
 * write goes through the service-role `loan` doors, which re-check ownership.
 */

const CreateSlotSchema = z.object({
  loanFileId: z.string().uuid(),
  requirementId: z.string().min(1).max(80),
  contentType: z.string().min(1).max(120),
  byteSize: z.number().int().positive().max(LOAN_DOC_MAX_BYTES)
});

const ConfirmSchema = z.object({
  documentId: z.string().uuid()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  if (!loanPortalAvailable()) return accountFailure("NOT_FOUND", context.requestId);

  const body = await parseAccountBody(request, CreateSlotSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  if (!isAllowedDocContentType(body.contentType)) {
    return accountFailure("BAD_REQUEST", context.requestId, {
      contentType: ["That file type isn't accepted. Use a PDF or a photo."]
    });
  }

  // Ownership + doc-type: loan_get_file is self-scoped (null if not theirs), and
  // its intake resolves the requirement's storable doc type server-side, so the
  // client can't spoof either the owner or the classification.
  const detail = await getLoanFileDetail(context.supabase, body.loanFileId);
  if (detail === null) return accountFailure("NOT_FOUND", context.requestId);

  let docType: LoanDocType = "other";
  if (detail.intake !== null) {
    const parsed = IntakeAnswersSchema.safeParse(detail.intake);
    if (parsed.success) {
      const match = requiredDocuments(parsed.data).find((r) => r.id === body.requirementId);
      if (match !== undefined) docType = match.storageDocType;
    }
  }

  const service = createServiceClient();
  if (service === null) return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);

  const extension = LOAN_DOC_EXTENSIONS[body.contentType] ?? "bin";
  const storageKey = `loan/${body.loanFileId}/${crypto.randomUUID()}.${extension}`;

  const documentId = await addLoanDocument(service, {
    borrowerUserId: context.userId,
    loanFileId: body.loanFileId,
    requirementId: body.requirementId,
    docType,
    storageKey,
    contentType: body.contentType,
    byteSize: body.byteSize
  });
  if (documentId === null) return accountFailure("INTERNAL_ERROR", context.requestId);

  const signedUrl = await createSignedDocumentUpload(service, storageKey);
  if (signedUrl === null) return accountFailure("INTERNAL_ERROR", context.requestId);

  return accountSuccess(
    { documentId, bucket: LOAN_DOCS_BUCKET, signedUrl },
    context.requestId,
    201
  );
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  if (!loanPortalAvailable()) return accountFailure("NOT_FOUND", context.requestId);

  const body = await parseAccountBody(request, ConfirmSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  const service = createServiceClient();
  if (service === null) return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);

  // The door re-verifies the document belongs to this borrower.
  const ok = await markLoanDocumentUploaded(service, {
    borrowerUserId: context.userId,
    documentId: body.documentId
  });
  if (!ok) return accountFailure("INTERNAL_ERROR", context.requestId);

  return accountSuccess({ confirmed: true }, context.requestId);
}
