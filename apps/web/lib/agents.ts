import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AgentPublicSchema, type AgentPublic } from "@tract/schemas";
import { env } from "./env";

/**
 * Read access to the public agent directory. Real data only — sample-agent
 * fixtures belong to the pages that render them, not to this module.
 *
 * The anonymous key is used deliberately: Row Level Security limits it to
 * approved rows whose owner consented to display, so even a bug in this file
 * cannot surface a pending or non-consenting agent. The explicit status and
 * consent filters below are the application-layer half of that guarantee —
 * RLS and an application check, both.
 */

let anonClient: SupabaseClient | null | undefined;

function directoryClient(): SupabaseClient | null {
  if (anonClient !== undefined) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url === undefined || anonKey === undefined) {
    anonClient = null;
    return null;
  }
  anonClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return anonClient;
}

const AGENT_PUBLIC_COLUMNS =
  "id,slug,first_name,last_name,brokerage,cities,bio,license_number,license_verified";

type AgentRow = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  brokerage: string | null;
  cities: string;
  bio: string | null;
  license_number: string;
  license_verified: boolean;
};

function toPublic(row: AgentRow): AgentPublic {
  // Parsed, not cast: a row that does not satisfy the public contract is a bug
  // worth throwing on, not rendering.
  return AgentPublicSchema.parse({
    id: row.id,
    slug: row.slug,
    firstName: row.first_name,
    lastName: row.last_name,
    brokerage: row.brokerage,
    cities: row.cities,
    bio: row.bio,
    licenseNumber: row.license_number,
    licenseVerified: row.license_verified
  });
}

/** LIKE/ILIKE wildcards in user input match literally, not as patterns. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function fetchApprovedAgents(cityFilter?: string): Promise<AgentPublic[]> {
  const client = directoryClient();
  if (client === null) return [];

  let query = client
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("display_consent", true)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(200);

  const city = cityFilter?.trim().slice(0, 80);
  if (city !== undefined && city !== "") {
    query = query.ilike("cities", `%${escapeLikePattern(city)}%`);
  }

  const { data, error } = await query;
  if (error !== null) return [];
  return ((data ?? []) as AgentRow[]).map(toPublic);
}

export async function fetchAgentBySlug(slug: string): Promise<AgentPublic | null> {
  const client = directoryClient();
  if (client === null) return null;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;

  const { data, error } = await client
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("display_consent", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error !== null || data === null) return null;
  return toPublic(data as AgentRow);
}

/**
 * Whether sample agents may be rendered. Same two-switch shape as sample
 * listings: always allowed outside production, and in production only on the
 * explicit SHOW_SAMPLE_AGENTS opt-in. The fixtures themselves live with the
 * pages that render them, clearly labelled and never published as real people.
 */
export function sampleAgentsAllowed(): boolean {
  if (env().NODE_ENV !== "production") return true;
  return env().SHOW_SAMPLE_AGENTS === true;
}
