import { type NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/request-context";
import { createRequestClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = new URL(request.url).origin;
  if (!isSameOrigin(request.headers.get("origin"), origin)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const client = await createRequestClient();
  if (client !== null) await client.auth.signOut();
  return NextResponse.redirect(new URL("/account?auth=signed_out", origin), 303);
}
