import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { userAgentFamily } from "@tract/domain";

/**
 * Per-request context.
 *
 * IP addresses are never stored in the clear. A truncated-prefix hash is enough
 * to rate limit and to spot abuse patterns, and it cannot be reversed into a
 * subscriber. The pepper is rotatable.
 */

export type RequestContext = {
  requestId: string;
  ipPrefixHash: string | null;
  userAgentFamily: string;
  origin: string | null;
};

/** IPv4 to /24 and IPv6 to /48 before hashing, so one household is one bucket. */
export function ipPrefix(ip: string): string {
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 3).join(":");
  }
  const octets = ip.split(".");
  return octets.length === 4 ? `${octets[0]}.${octets[1]}.${octets[2]}.0` : ip;
}

export function hashIp(ip: string | null, pepper: string): string | null {
  if (ip === null || ip === "") return null;
  return createHash("sha256")
    .update(`${pepper}:${ipPrefix(ip)}`)
    .digest("hex")
    .slice(0, 32);
}

export function clientIp(headers: Headers): string | null {
  // Cloudflare's connecting-IP header is set at the edge and cannot be spoofed
  // by the client when the origin only accepts authenticated Cloudflare traffic.
  const candidates = ["cf-connecting-ip", "x-real-ip"];
  for (const header of candidates) {
    const value = headers.get(header);
    if (value !== null && value.trim() !== "") return value.trim();
  }
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded !== null) {
    const first = forwarded.split(",")[0]?.trim();
    if (first !== undefined && first !== "") return first;
  }
  return null;
}

export function buildRequestContext(headers: Headers, pepper: string): RequestContext {
  return {
    requestId: randomUUID(),
    ipPrefixHash: hashIp(clientIp(headers), pepper),
    userAgentFamily: userAgentFamily(headers.get("user-agent")),
    origin: headers.get("origin")
  };
}

/**
 * Same-origin check for state-changing requests. A missing Origin header is
 * allowed only for non-browser clients on GET; every mutation requires it.
 */
export function isSameOrigin(origin: string | null, siteUrl: string): boolean {
  if (origin === null) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Deduplication key. Peppered so the stored hash is not a rainbow-table lookup. */
export function dedupeHash(
  emailNormalized: string,
  phoneE164: string,
  intent: string,
  pepper: string
): string {
  return createHash("sha256")
    .update(`${pepper}|${emailNormalized}|${phoneE164}|${intent}`)
    .digest("hex");
}
