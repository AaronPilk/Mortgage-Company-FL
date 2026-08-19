-- Real-estate agent directory.
--
-- One row per agent, keyed twice on purpose: the license number and the
-- normalized email are both unique, so a returning agent — whether they come
-- back through the join form or later make an account — lands on their existing
-- row instead of creating a duplicate. All writes happen through the service
-- role in the join API after validation, bot challenge, and rate limiting; the
-- browser key can only read, and only what the policies below allow.
--
-- license_verified starts false and stays false until a human actually checks
-- the license. Nothing in this schema or the application flips it on submit —
-- the UI renders a pending state, never a claim.

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  -- Null until the agent has an account. Deleting the account keeps the
  -- directory entry but orphans the ownership, so the row can be re-claimed.
  owner_user_id uuid references public.profiles(id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  brokerage text check (char_length(brokerage) between 1 and 120),
  -- Bounded and charset-checked: a license number is an identifier the state
  -- issued, not free text. Format verification against the licensing board is
  -- a separate, human step recorded in license_verified.
  license_number text unique not null check (license_number ~ '^[A-Za-z0-9-]{4,20}$'),
  email_normalized text unique not null check (
    char_length(email_normalized) <= 320 and position('@' in email_normalized) > 1
  ),
  phone_e164 text check (phone_e164 ~ '^\+[0-9]{8,15}$'),
  -- Comma-separated served cities. Plain bounded text: the directory filters
  -- with a substring match, and a join table would be premature for a list the
  -- agent types themselves.
  cities text not null default '' check (char_length(cities) <= 400),
  bio text check (char_length(bio) <= 1000),
  slug text unique not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  -- Consent to be displayed publicly is separate from approval. Both must be
  -- true before the row is visible to anyone but its owner and staff.
  display_consent boolean not null default false,
  license_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The public directory query: approved, consenting rows.
create index agents_directory_idx on public.agents (status, display_consent);
-- City filtering is a substring match over a short text column; a plain btree
-- keeps the equality/prefix cases cheap and is enough at directory scale.
create index agents_cities_idx on public.agents (cities);

create trigger agents_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

alter table public.agents enable row level security;

-- Both browser-facing roles start from zero: Supabase's default privileges
-- hand every new table to anon and authenticated in full, and the CI shim
-- mirrors that, so an explicit revoke here is load-bearing, not ceremony.
-- Anonymous clients read the public directory and nothing else; all writes go
-- through the service role in the join API.
revoke all on public.agents from anon, authenticated;
grant select on public.agents to anon;

-- An authenticated owner may read their own row and edit their profile fields.
-- The column list is the safety net under the application-layer check: status,
-- license_verified, slug, license_number, email_normalized, and owner_user_id
-- are simply not grantable targets, so a crafted PATCH through the REST surface
-- cannot self-approve or claim a verification that never happened.
grant select on public.agents to authenticated;
grant update (first_name, last_name, brokerage, phone_e164, cities, bio, display_consent)
  on public.agents to authenticated;

-- The directory shows an agent only when staff approved the row AND the agent
-- consented to public display. Either alone is not enough.
create policy "public directory shows approved consenting agents"
  on public.agents for select to anon, authenticated
  using (status = 'approved' and display_consent);

-- An owner sees their own row in any state, so the join flow can show
-- "verification pending" instead of pretending the row does not exist.
create policy "owners read own agent row"
  on public.agents for select to authenticated
  using (owner_user_id = auth.uid());

create policy "owners update own agent row"
  on public.agents for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Staff review pending rows in /admin/agents through the request-scoped client.
-- Same audience as lead access: directory rows carry contact details.
create policy "staff read agents"
  on public.agents for select to authenticated
  using (
    public.has_role('loan_officer')
    or public.has_role('operations')
    or public.has_role('admin')
  );
