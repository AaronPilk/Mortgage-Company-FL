import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "./env";

/**
 * Supabase clients.
 *
 * Two distinct clients with two distinct purposes:
 *
 *  - the request-scoped client carries the user's session and is subject to Row
 *    Level Security. Use it for anything a signed-in person does.
 *  - the service client bypasses RLS and therefore lives behind narrow,
 *    audited server functions only. It is never constructed in a component and
 *    never handed a value that came from a request body unvalidated.
 */

export async function createRequestClient() {
  const configuration = env();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url === undefined || anonKey === undefined) return null;
  void configuration;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // middleware refresh path handles renewal, so this is safe to ignore.
        }
      }
    }
  });
}

let serviceClient: SupabaseClient | null | undefined;

export function createServiceClient(): SupabaseClient | null {
  if (serviceClient !== undefined) return serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env().SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || serviceKey === undefined) {
    serviceClient = null;
    return null;
  }

  serviceClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return serviceClient;
}

export function databaseConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    env().SUPABASE_SERVICE_ROLE_KEY !== undefined
  );
}
