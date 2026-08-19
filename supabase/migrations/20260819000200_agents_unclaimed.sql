-- Unclaimed agent profiles seeded from Florida DBPR public license records.
--
-- The directory adopts the claim model: a row can now exist before its agent
-- ever hears of TRACT, imported from the state's public licensee extract. An
-- unclaimed row republishes public-record facts only — name, license number
-- and rank, city/county, employing brokerage — and is public without display
-- consent because consent gates *our* publication of details an agent gave us,
-- not the restatement of a record the state already publishes. The import
-- writes no private contact data by design: email, phone, and bio are NULL on
-- every imported row, and street addresses are never read out of the extract.
--
-- license_verified stays false on imported rows on purpose. We copied the
-- record; a human has not re-verified it against the live license lookup, so
-- the UI keeps saying "verification pending" (invariant 6).

-- 'unclaimed' precedes 'pending' in the lifecycle: a claim through the join
-- form moves an unclaimed row to 'pending', and staff approval to 'approved'.
alter table public.agents
  drop constraint agents_status_check;
alter table public.agents
  add constraint agents_status_check
  check (status in ('unclaimed', 'pending', 'approved'));

-- Public-record rows have no email, so the column can no longer be NOT NULL
-- and the plain unique constraint becomes a partial unique index: uniqueness
-- still deduplicates every row that *has* an email, while any number of
-- imported rows may sit at NULL. The existing @-shape check constraint stays
-- as written — a CHECK passes on NULL, so it already binds only when an email
-- is present.
alter table public.agents
  alter column email_normalized drop not null;
alter table public.agents
  drop constraint agents_email_normalized_key;
create unique index agents_email_normalized_unique_idx
  on public.agents (email_normalized)
  where email_normalized is not null;

alter table public.agents
  -- County from the state extract, for the directory's location filter.
  add column county text
    check (char_length(county) between 1 and 80),
  -- Provenance: how this row came to exist. A claim keeps 'dbpr_import' so
  -- the record's origin remains auditable after the agent takes it over.
  add column source text not null default 'joined'
    check (source in ('joined', 'dbpr_import')),
  add column imported_at timestamptz,
  -- License rank as the state words it, e.g. 'SL Sales Associate',
  -- 'BK Broker', 'BL Broker Sales'. Bounded free text rather than an enum
  -- because the DBPR vocabulary is theirs to extend, not ours.
  add column license_rank text
    check (char_length(license_rank) between 1 and 40);

-- The directory filters on county the same way it filters on cities.
create index agents_county_idx on public.agents (county);
-- Directory listing at state scale (~68k rows): the public page orders by
-- status then name and paginates, so the composite index serves the scan.
create index agents_directory_order_idx on public.agents (status, last_name, first_name);

-- Public visibility now has two honest shapes: an approved row whose owner
-- consented to display, or an unclaimed public-record row. A pending row —
-- including a freshly claimed one — remains invisible to the public either
-- way, because a claim is an assertion anyone could type and staff have not
-- reviewed it yet.
drop policy "public directory shows approved consenting agents" on public.agents;
create policy "public directory shows approved consenting or unclaimed agents"
  on public.agents for select to anon, authenticated
  using ((status = 'approved' and display_consent) or status = 'unclaimed');
