-- Editorial system.
--
-- Everything starts as a draft and noindex. Moving a page to index is a separate
-- privileged action, not a side effect of saving an edit.

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null
    check (content_type in ('page','article','guide','glossary','market_report','faq','author')),
  slug text not null,
  locale text not null default 'en-US',
  title text not null,
  description text not null,
  body_mdx text not null,
  status text not null default 'draft'
    check (status in ('idea','brief','draft','review','approved','scheduled','published','retired')),
  search_intent text,
  primary_topic text,
  canonical_path text,
  indexation text not null default 'noindex' check (indexation in ('index','noindex')),
  author_id uuid references public.profiles(id),
  reviewer_id uuid references public.profiles(id),
  compliance_reviewer_id uuid references public.profiles(id),
  compliance_review_required boolean not null default true,
  published_at timestamptz,
  reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, slug, locale)
);

-- A page cannot be indexable unless it is published, has a named author and
-- reviewer, and carries a review date. This is the content quality gate as a
-- database constraint rather than a checklist someone can skip.
alter table public.content_items
  add constraint indexable_requires_review
  check (
    indexation = 'noindex'
    or (status = 'published' and author_id is not null and reviewer_id is not null and reviewed_at is not null)
  );

create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  publisher text not null,
  title text not null,
  url text not null,
  source_kind text not null
    check (source_kind in ('statute','regulation','regulator','agency','gse','lender','company','trade','other')),
  publication_date date,
  accessed_at timestamptz not null,
  relevant_excerpt text,
  claim_keys text[] not null default '{}',
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index content_sources_item_idx on public.content_sources (content_item_id);

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  revision integer not null,
  snapshot jsonb not null,
  change_summary text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (content_item_id, revision)
);

create table public.link_opportunities (
  id uuid primary key default gen_random_uuid(),
  target_content_id uuid references public.content_items(id) on delete set null,
  organization_name text not null,
  contact_name text,
  contact_email text,
  opportunity_type text not null,
  source_url text,
  status text not null default 'identified'
    check (status in ('identified','qualified','outreach_ready','contacted','responded','earned','declined','do_not_contact')),
  owner_user_id uuid references public.profiles(id),
  target_relevance text,
  requested_asset text,
  earned_url text,
  link_attributes text,
  first_seen_at timestamptz,
  last_checked_at timestamptz,
  notes text,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_revisions enable row level security;
alter table public.link_opportunities enable row level security;

create policy "public reads published indexed content"
  on public.content_items for select to anon, authenticated
  using (status = 'published');

create policy "editors read all content"
  on public.content_items for select to authenticated
  using (public.is_staff());

create policy "editors write content"
  on public.content_items for all to authenticated
  using (public.has_role('content_editor') or public.has_role('admin'))
  with check (public.has_role('content_editor') or public.has_role('admin'));

create policy "public reads sources of published content"
  on public.content_sources for select to anon, authenticated
  using (
    exists (select 1 from public.content_items c where c.id = content_item_id and c.status = 'published')
  );

create policy "editors read revisions"
  on public.content_revisions for select to authenticated
  using (public.is_staff());

create policy "staff manage link opportunities"
  on public.link_opportunities for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
