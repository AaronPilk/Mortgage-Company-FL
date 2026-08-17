-- Normalized property model with source lineage.
--
-- One MLS is not the product model. Provider records are normalized while their
-- attribution, timestamps, and rights metadata are preserved. Raw payload
-- retention is contract-specific and therefore has an explicit expiry column.

create table public.property_entities (
  id uuid primary key default gen_random_uuid(),
  normalized_address text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_code char(2),
  postal_code text,
  county_name text,
  latitude double precision,
  longitude double precision,
  parcel_identifier text,
  property_type text,
  bedrooms numeric,
  bathrooms numeric,
  living_area_sqft integer,
  lot_area_sqft bigint,
  year_built integer,
  source_quality text not null default 'unknown'
    check (source_quality in ('unknown','user_supplied','provider','verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_geo_idx on public.property_entities (latitude, longitude);
create index property_parcel_idx on public.property_entities (parcel_identifier);

create table public.listing_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.property_entities(id) on delete set null,
  provider text not null,
  provider_record_key text not null,
  resource_class text not null default 'Property',
  standard_status text not null default 'unknown'
    check (standard_status in ('active','coming_soon','pending','closed','expired','withdrawn','deleted','unknown')),
  list_price_cents bigint,
  list_date date,
  modification_timestamp timestamptz,
  -- Required by the display agreement. Never stripped for layout reasons.
  attribution_text text not null,
  source_url text,
  media_manifest jsonb not null default '[]'::jsonb,
  raw_payload jsonb,
  raw_payload_expires_at timestamptz,
  is_fixture boolean not null default false,
  published boolean not null default false,
  unpublished_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_record_key)
);

create index listing_status_price_idx on public.listing_records (standard_status, list_price_cents);
create index listing_published_idx on public.listing_records (published, modification_timestamp desc);

-- Fixture data must never be publishable. This is a database-level guarantee so
-- a configuration mistake cannot put synthetic listings in front of a consumer.
alter table public.listing_records
  add constraint fixtures_are_never_published
  check (not (is_fixture and published));

create table public.property_facts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.property_entities(id) on delete cascade,
  fact_kind text not null,
  fact_value jsonb not null,
  provider text not null,
  source_reference text,
  observed_at timestamptz,
  valid_from timestamptz,
  valid_until timestamptz,
  confidence numeric check (confidence between 0 and 1),
  license_class text not null default 'internal'
    check (license_class in ('public','display','internal','restricted')),
  -- A sourced fact without stated limitations cannot enter a report.
  limitations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index property_facts_lookup_idx
  on public.property_facts (property_id, fact_kind, observed_at desc);

alter table public.property_entities enable row level security;
alter table public.listing_records enable row level security;
alter table public.property_facts enable row level security;

create policy "public reads published listings"
  on public.listing_records for select to anon, authenticated
  using (published = true and is_fixture = false);

create policy "staff reads all listings"
  on public.listing_records for select to authenticated
  using (public.is_staff());

create policy "staff reads properties"
  on public.property_entities for select to authenticated
  using (public.is_staff());

create policy "staff reads property facts"
  on public.property_facts for select to authenticated
  using (public.is_staff());
