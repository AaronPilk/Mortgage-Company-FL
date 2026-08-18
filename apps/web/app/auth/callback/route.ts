import { type NextRequest, NextResponse } from "next/server";
import { safeAccountNextPath } from "@/lib/account-auth";
import { createRequestClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const next = safeAccountNextPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const client = await createRequestClient();
  if (code === null || client === null) {
    return NextResponse.redirect(new URL(`${next}?auth=unavailable`, url.origin));
  }

  const { error } = await client.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(
    new URL(`${next}?auth=${error === null ? "verified" : "error"}`, url.origin)
  );
}
