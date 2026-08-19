import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AgentPublicSchema, type AgentPublic } from "@tract/schemas";
import { env } from "./env";

/**
 * Read access to the public agent directory. Real data only — sample-agent
 * fixtures belong to the pages that render them, not to this module.
 *
 * The anonymous key is used deliberately: Row Level Security limits it to the
 * two publicly honest row shapes — approved rows whose owner consented to
 * display, and unclaimed public-record rows imported from the state license
 * roll — so even a bug in this file cannot surface a pending or non-consenting
 * joined agent. The explicit visibility filter below is the application-layer
 * half of that guarantee — RLS and an application check, both.
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

export const AGENTS_PAGE_SIZE = 24;

/** Hard ceiling on the page parameter, matching a ~68k-row state import. */
export const AGENTS_MAX_PAGE = 5000;

const AGENT_PUBLIC_COLUMNS =
  "id,slug,first_name,last_name,brokerage,cities,bio,license_number,license_verified,status,county";

/**
 * PostgREST boolean-logic filter mirroring the RLS policy exactly: a row is
 * public when approved with display consent, or when it is an unclaimed
 * public-record import.
 */
const PUBLIC_VISIBILITY_FILTER =
  "and(status.eq.approved,display_consent.is.true),status.eq.unclaimed";

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
  status: string;
  county: string | null;
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
    licenseVerified: row.license_verified,
    unclaimed: row.status === "unclaimed",
    county: row.county
  });
}

/**
 * User input embedded in a PostgREST `.or()` filter string. Two layers of
 * hostile characters to neutralize: LIKE wildcards must match literally, and
 * the characters PostgREST's filter grammar itself uses (comma, parens,
 * quotes, dots) must not let a city name terminate the expression early.
 */
function sanitizeLocationFilter(value: string): string {
  return value.replace(/[(),."]/g, "").replace(/[\\%_]/g, (character) => `\\${character}`);
}

export type AgentDirectoryPage = {
  agents: AgentPublic[];
  totalCount: number;
  page: number;
  pageSize: number;
};

const EMPTY_PAGE: AgentDirectoryPage = {
  agents: [],
  totalCount: 0,
  page: 1,
  pageSize: AGENTS_PAGE_SIZE
};

/**
 * One page of the public directory, with the total for pagination. At state
 * scale (~68k imported profiles) the directory must never fetch the whole
 * table; the ordering and the location filter run in the database.
 *
 * Ordering: approved-and-consenting members first, then the unclaimed
 * public-record rows, each group alphabetical. `status` ascending happens to
 * produce exactly that ('approved' < 'unclaimed', and 'pending' rows are not
 * visible here at all) — a lexical accident this comment exists to make
 * deliberate.
 */
export async function fetchDirectoryAgents(options: {
  city?: string;
  page?: number;
}): Promise<AgentDirectoryPage> {
  const client = directoryClient();
  if (client === null) return EMPTY_PAGE;

  const page = Math.min(Math.max(Math.trunc(options.page ?? 1), 1), AGENTS_MAX_PAGE);
  const from = (page - 1) * AGENTS_PAGE_SIZE;

  let query = client
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS, { count: "exact" })
    .or(PUBLIC_VISIBILITY_FILTER)
    .order("status", { ascending: true })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(from, from + AGENTS_PAGE_SIZE - 1);

  // One box filters both the agent-typed cities list and the imported county,
  // because a visitor thinks in "where", not in which column we stored it.
  const city = options.city?.trim().slice(0, 80);
  if (city !== undefined && city !== "") {
    const pattern = `%${sanitizeLocationFilter(city)}%`;
    query = query.or(`cities.ilike.${pattern},county.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error !== null) return EMPTY_PAGE;
  return {
    agents: ((data ?? []) as AgentRow[]).map(toPublic),
    totalCount: count ?? 0,
    page,
    pageSize: AGENTS_PAGE_SIZE
  };
}

/**
 * Whether any real directory row exists at all. The pages use this to decide
 * between the database and the labelled sample fixtures — and metadata uses it
 * to keep the noindex decision aligned with what actually renders.
 */
export async function directoryHasRealAgents(): Promise<boolean> {
  const client = directoryClient();
  if (client === null) return false;
  const { count, error } = await client
    .from("agents")
    .select("id", { count: "exact", head: true })
    .or(PUBLIC_VISIBILITY_FILTER);
  if (error !== null) return false;
  return (count ?? 0) > 0;
}

export async function fetchAgentBySlug(slug: string): Promise<AgentPublic | null> {
  const client = directoryClient();
  if (client === null) return null;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;

  const { data, error } = await client
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS)
    .or(PUBLIC_VISIBILITY_FILTER)
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
 * With real rows present the pages prefer the database; fixtures render only
 * when the directory is genuinely empty, so a dev machine without a database
 * still shows something.
 */
export function sampleAgentsAllowed(): boolean {
  if (env().NODE_ENV !== "production") return true;
  return env().SHOW_SAMPLE_AGENTS === true;
}
