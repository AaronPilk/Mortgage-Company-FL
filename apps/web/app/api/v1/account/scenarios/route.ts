import { type NextRequest, NextResponse } from "next/server";
import { SaveScenarioRequestSchema } from "@tract/schemas";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";

export const dynamic = "force-dynamic";

async function validatedRequest(request: NextRequest) {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, SaveScenarioRequestSchema, context.requestId);
  if (body instanceof NextResponse) return body;
  return { context, body };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const input = await validatedRequest(request);
  if (input instanceof NextResponse) return input;
  const snapshot = input.body.snapshot;
  const { error } = await input.context.supabase.from("saved_calculator_scenarios").insert({
    id: input.body.saveId,
    owner_user_id: input.context.userId,
    source: snapshot.source,
    version: snapshot.version,
    calculation_version: snapshot.calculationVersion,
    input_snapshot: snapshot.inputSnapshot,
    result_snapshot: snapshot.resultSnapshot,
    summary: snapshot.summary
  });

  if (error?.code === "23505") {
    const { data } = await input.context.supabase
      .from("saved_calculator_scenarios")
      .select("id")
      .eq("id", input.body.saveId)
      .maybeSingle();
    if (data === null) return accountFailure("CONFLICT", input.context.requestId);
    return accountSuccess({ saved: true, saveId: input.body.saveId }, input.context.requestId);
  }
  if (error !== null) return accountFailure("INTERNAL_ERROR", input.context.requestId);
  return accountSuccess({ saved: true, saveId: input.body.saveId }, input.context.requestId, 201);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const input = await validatedRequest(request);
  if (input instanceof NextResponse) return input;
  const { error } = await input.context.supabase
    .from("saved_calculator_scenarios")
    .delete()
    .eq("owner_user_id", input.context.userId)
    .eq("id", input.body.saveId);
  if (error !== null) return accountFailure("INTERNAL_ERROR", input.context.requestId);
  return accountSuccess({ saved: false, saveId: input.body.saveId }, input.context.requestId);
}
