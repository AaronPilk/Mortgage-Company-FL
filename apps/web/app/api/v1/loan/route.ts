import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { IntakeAnswersSchema } from "@tract/domain";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";
import { loanPortalAvailable, openLoanFile } from "@/lib/loan";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Open a TRACT loan file from a completed intake.
 *
 * The borrower's identity comes from the verified session (beginAccountMutation),
 * never from the body. The intake is re-validated here with the exact schema the
 * document engine uses, then written through the service-role `loan_open_file`
 * door — the only way into the sealed `loan` compartment. The purpose stored on
 * the file is taken from the validated intake, so the two can never disagree.
 */

const CreateLoanFileSchema = z.object({
  intake: IntakeAnswersSchema,
  priceBand: z.string().min(1).max(40).optional(),
  loanAmountBand: z.string().min(1).max(40).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;

  // The portal is dark unless the feature is on. Fail closed, uniformly.
  if (!loanPortalAvailable()) {
    return accountFailure("NOT_FOUND", context.requestId);
  }

  const body = await parseAccountBody(request, CreateLoanFileSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  const service = createServiceClient();
  if (service === null) return accountFailure("INTEGRATION_UNAVAILABLE", context.requestId);

  const loanFileId = await openLoanFile(service, {
    borrowerUserId: context.userId,
    purpose: body.intake.loanPurpose,
    intake: body.intake,
    priceBand: body.priceBand ?? null,
    loanAmountBand: body.loanAmountBand ?? null
  });

  if (loanFileId === null) return accountFailure("INTERNAL_ERROR", context.requestId);
  return accountSuccess({ loanFileId }, context.requestId, 201);
}
