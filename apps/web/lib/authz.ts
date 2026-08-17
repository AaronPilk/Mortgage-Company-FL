import "server-only";
import { type AppRole, can, isStaff, type Action, type Resource } from "@tract/domain";
import { createRequestClient } from "./supabase";

/**
 * Server-side authorization.
 *
 * Every admin route calls this. Row Level Security independently constrains what
 * a query can return, but an application check is what produces a correct error
 * page instead of a confusing empty table, and it is what stops a mutation from
 * being attempted at all.
 */

export type StaffSession =
  { authorized: true; userId: string; roles: AppRole[] } | { authorized: false; message: string };

export async function requireStaff(): Promise<StaffSession> {
  const supabase = await createRequestClient();
  if (supabase === null) {
    return {
      authorized: false,
      message:
        "Authentication is not configured in this environment, so the admin area is unavailable."
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user === null) {
    // Deliberately the same message as an insufficient-role result: telling an
    // anonymous visitor that the area exists but they lack a role is more
    // information than they need.
    return { authorized: false, message: "You do not have access to this area." };
  }

  const { data, error } = await supabase.from("user_roles").select("role").is("revoked_at", null);

  if (error !== null) {
    return { authorized: false, message: "You do not have access to this area." };
  }

  const roles = (data ?? []).map((row) => row.role as AppRole);
  if (!isStaff(roles)) {
    return { authorized: false, message: "You do not have access to this area." };
  }

  return { authorized: true, userId: user.id, roles };
}

export function authorize(session: StaffSession, resource: Resource, action: Action): boolean {
  return session.authorized && can(session.roles, resource, action);
}
