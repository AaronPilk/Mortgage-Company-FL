/**
 * Only private account destinations may be carried through an Auth callback:
 * the account area itself, plus the password-reset completion page that
 * recovery links land on. Everything else — absolute URLs, protocol-relative
 * URLs, unrelated local paths — collapses to /account.
 */
export function safeAccountNextPath(value: string | null): string {
  if (value === "/account" || value?.startsWith("/account/") === true) return value;
  if (value === "/auth/update-password") return value;
  return "/account";
}

/** The minimal slice of a Supabase client this module needs to resolve a user. */
export type UserResolvingClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
};

/**
 * Resolves the authenticated user id from a request-scoped Supabase client, or
 * null for anything else: no configured client, an auth error, no session, or a
 * client that throws. What null means is the caller's decision — the AI
 * interpretation route deliberately refuses it with a 401, because
 * natural-language search is an account feature. This helper's only contract
 * is that every non-session outcome collapses to null and it never throws, so
 * a flaky auth backend reads as "anonymous", not as a broken route.
 */
export async function resolveAuthenticatedUserId(
  client: UserResolvingClient | null
): Promise<string | null> {
  if (client === null) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (error !== null && error !== undefined) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
