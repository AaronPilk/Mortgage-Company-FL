import { createHash, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { unsubscribeToken, type NotificationKind } from "@tract/integrations";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase";

/**
 * Email unsubscribe.
 *
 * The single honor-the-opt-out endpoint for both alert kinds. It needs no auth
 * and carries no session: the link embeds an HMAC token (keyed by HASH_PEPPER)
 * over the kind and email, which this route recomputes and compares in constant
 * time. GET renders a noindex confirmation page (the human-clicked link); POST is
 * the RFC 8058 one-click path a mail client fires. Both write a cross-system
 * suppression — the authoritative stop the reserve gate reads — and flip the
 * matching source opt-in off, through a definer function so the owner is resolved
 * from identity, never from the request.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set<NotificationKind>(["home_value_move", "rate_threshold"]);
const NOINDEX = { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } as const;

type ParsedLink = { email: string; kind: NotificationKind; token: string };

function parseLink(request: NextRequest): ParsedLink | null {
  const params = new URL(request.url).searchParams;
  const email = params.get("email");
  const kind = params.get("kind");
  const token = params.get("token");
  if (email === null || kind === null || token === null) return null;
  if (!KINDS.has(kind as NotificationKind)) return null;
  return { email, kind: kind as NotificationKind, token };
}

function tokenValid(link: ParsedLink, pepper: string): boolean {
  const expected = unsubscribeToken(link.email, link.kind, pepper);
  // Hash both sides so timingSafeEqual always compares equal-length buffers.
  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(link.token).digest();
  return timingSafeEqual(expectedHash, providedHash);
}

async function applyUnsubscribe(link: ParsedLink): Promise<boolean> {
  const supabase = createServiceClient();
  if (supabase === null) return false;
  const { error } = await supabase.rpc("email_unsubscribe", {
    p_email_normalized: link.email.trim().toLowerCase(),
    p_kind: link.kind
  });
  return error === null;
}

function htmlResponse(status: number, message: string): NextResponse {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Email alerts</title></head><body style="font-family:system-ui,-apple-system,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">Email alerts</h1><p>${message}</p></body></html>`;
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...NOINDEX }
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const link = parseLink(request);
  if (link === null || !tokenValid(link, env().HASH_PEPPER)) {
    return htmlResponse(400, "This unsubscribe link is not valid.");
  }
  const ok = await applyUnsubscribe(link);
  if (!ok) {
    return htmlResponse(503, "We could not process that right now. Please try again in a moment.");
  }
  return htmlResponse(
    200,
    "You have been unsubscribed and will no longer receive these email alerts."
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // RFC 8058 one-click. The query still carries email/kind/token; the body
  // (List-Unsubscribe=One-Click) is not needed to act.
  const link = parseLink(request);
  if (link === null || !tokenValid(link, env().HASH_PEPPER)) {
    return NextResponse.json({ ok: false }, { status: 400, headers: NOINDEX });
  }
  const ok = await applyUnsubscribe(link);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503, headers: NOINDEX });
}
