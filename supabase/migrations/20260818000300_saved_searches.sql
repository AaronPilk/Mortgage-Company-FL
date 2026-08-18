-- Saved property searches.
--
-- One row per search a signed-in visitor explicitly asked to keep. The stored
-- value is the canonical /properties query string, re-serialized by the
-- application from validated criteria before insert — never the raw string a
-- browser sent. Like every consumer-account table, it holds only persistence
-- the user asked for: no loan application data, no documents, no media.

create table public.saved_searches (
  id uuid primary key,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  -- Canonical query string ('' means "all sample listings"). Bounded, and
  -- restricted to the characters x-www-form-urlencoded serialization can emit
  -- (URLSearchParams leaves *, -, . and _ unencoded), so nothing free-form is
  -- ever stored.
  search_params text not null check (
    char_length(search_params) <= 512
    and search_params ~ '^[A-Za-z0-9%&=+*._-]*$'
  ),
  -- Human-readable restatement of the criteria, shown on the account page.
  summary text not null check (char_length(summary) between 1 and 200),
  saved_at timestamptz not null default now(),
  -- Saving the same search twice is a retry, not a second record.
  unique (owner_user_id, search_params)
);

create index saved_searches_owner_idx
  on public.saved_searches (owner_user_id, saved_at desc);

alter table public.saved_searches enable row level security;

revoke all on public.saved_searches from anon;
grant select, insert, delete on public.saved_searches to authenticated;

create policy "owners manage saved searches"
  on public.saved_searches for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
