/** Only private account destinations may be carried through an Auth callback. */
export function safeAccountNextPath(value: string | null): string {
  if (value === "/account" || value?.startsWith("/account/") === true) return value;
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
 * client that throws. Routes that treat authentication as a perk rather than a
 * requirement — the AI interpretation path — use this to decide, and a null
 * must always land on the free deterministic path, never on an error.
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
