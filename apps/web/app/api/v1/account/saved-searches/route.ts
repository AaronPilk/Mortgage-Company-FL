import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SaveSearchRequestSchema } from "@tract/schemas";
import {
  accountFailure,
  accountSuccess,
  beginAccountMutation,
  parseAccountBody
} from "@/lib/account-api";
import { PropertySearchQuerySchema, criteriaToQueryString } from "@/components/properties/criteria";
import { describeCriteria } from "@/components/properties/nl-parser";

export const dynamic = "force-dynamic";

/**
 * Saved property searches.
 *
 * The client sends the query string of the /properties URL it is looking at.
 * That string is untrusted: it is re-parsed here with the exact schema the
 * search page uses, rejected if it does not validate, and only the canonical
 * re-serialization (page reset to 1 — a saved search is a search, not a spot
 * in its pagination) is stored, together with the same human-readable
 * restatement the search UI shows.
 */

const DeleteSearchRequestSchema = z.object({ saveId: z.string().uuid() });

function searchToRawRecord(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    const first = values[0];
    raw[key] = values.length === 1 && first !== undefined ? first : values;
  }
  return raw;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, SaveSearchRequestSchema, context.requestId);
  if (body instanceof NextResponse) return body;

  const parsed = PropertySearchQuerySchema.safeParse(searchToRawRecord(body.search));
  if (!parsed.success) {
    return accountFailure("BAD_REQUEST", context.requestId, {
      search: ["That search could not be read."]
    });
  }
  const searchParams = criteriaToQueryString(parsed.data, { page: 1 });
  const summary = describeCriteria(parsed.data).slice(0, 200);

  const { error } = await context.supabase.from("saved_searches").insert({
    id: body.saveId,
    owner_user_id: context.userId,
    search_params: searchParams,
    summary
  });

  // A repeat save of a search this owner already keeps is confirmation, not a
  // conflict worth surfacing. Anything else colliding (a reused saveId carrying
  // a different search) genuinely is one.
  if (error?.code === "23505") {
    const { data } = await context.supabase
      .from("saved_searches")
      .select("id")
      .eq("owner_user_id", context.userId)
      .eq("search_params", searchParams)
      .maybeSingle();
    if (data === null) return accountFailure("CONFLICT", context.requestId);
    return accountSuccess({ saved: true, saveId: data.id as string }, context.requestId);
  }
  if (error !== null) return accountFailure("INTERNAL_ERROR", context.requestId);
  return accountSuccess({ saved: true, saveId: body.saveId }, context.requestId, 201);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const context = await beginAccountMutation(request);
  if (context instanceof NextResponse) return context;
  const body = await parseAccountBody(request, DeleteSearchRequestSchema, context.requestId);
  if (body instanceof NextResponse) return body;
  const { error } = await context.supabase
    .from("saved_searches")
    .delete()
    .eq("owner_user_id", context.userId)
    .eq("id", body.saveId);
  if (error !== null) return accountFailure("INTERNAL_ERROR", context.requestId);
  return accountSuccess({ saved: false, saveId: body.saveId }, context.requestId);
}
