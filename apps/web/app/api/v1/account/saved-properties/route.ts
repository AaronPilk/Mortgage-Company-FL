import { type NextRequest, NextResponse } from "next/server";
import { SavePropertyRequestSchema } from "@tract/schemas";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";
import { demoListings, listings } from "@/lib/listings";

export const dynamic = "force-dynamic";

async function validatedRequest(request: NextRequest) {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, SavePropertyRequestSchema, context.requestId);
  if (body instanceof NextResponse) return body;
  return { context, body };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const input = await validatedRequest(request);
  if (input instanceof NextResponse) return input;

  const provider = input.body.sourceMode === "fixture" ? demoListings() : listings();
  const listing = await provider.getByKey(input.body.listingKey);
  if (listing === null || listing.isFixture !== (input.body.sourceMode === "fixture")) {
    return accountFailure("NOT_FOUND", input.context.requestId);
  }

  const { error } = await input.context.supabase.from("saved_properties").insert({
    owner_user_id: input.context.userId,
    listing_key: input.body.listingKey,
    source_mode: input.body.sourceMode
  });
  if (error?.code === "23505") {
    const { data } = await input.context.supabase
      .from("saved_properties")
      .select("listing_key")
      .eq("owner_user_id", input.context.userId)
      .eq("listing_key", input.body.listingKey)
      .maybeSingle();
    if (data !== null) {
      return accountSuccess(
        { saved: true, listingKey: input.body.listingKey },
        input.context.requestId
      );
    }
  }
  if (error !== null) return accountFailure("INTERNAL_ERROR", input.context.requestId);
  return accountSuccess(
    { saved: true, listingKey: input.body.listingKey },
    input.context.requestId
  );
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const input = await validatedRequest(request);
  if (input instanceof NextResponse) return input;
  const { error } = await input.context.supabase
    .from("saved_properties")
    .delete()
    .eq("owner_user_id", input.context.userId)
    .eq("listing_key", input.body.listingKey);
  if (error !== null) return accountFailure("INTERNAL_ERROR", input.context.requestId);
  return accountSuccess(
    { saved: false, listingKey: input.body.listingKey },
    input.context.requestId
  );
}
