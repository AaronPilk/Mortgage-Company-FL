-- Progressive planner answers for a marketing lead.
--
-- One row per lead, written in the SAME transaction as the lead, its consent
-- receipt, its attribution touch, and its outbox event. Either the consumer has
-- a receipt, a queued sync, and the context they gave us, or nothing happened.
--
-- This table holds a marketing qualification, NOT an application. Every column
-- below is a bounded band or an enumerated choice on purpose: income and debt
-- are ranges, credit is a self-reported band and never a score, and there is
-- deliberately no column here that could hold a government identifier, an
-- account number, a document, or an exact financial figure. It must never be
-- extended to hold one.
--
-- The answers are typed columns rather than a jsonb blob because operations
-- filters on goal, timing, price, and state, and a blob cannot carry a check
-- constraint that keeps those values meaningful.

create table public.lead_planner_responses (
  id uuid primary key default gen_random_uuid(),
  -- One planner response per lead. The unique constraint is the invariant, not
  -- a convention the application is trusted to keep.
  lead_id uuid not null unique references public.leads(id) on delete restrict,

  goal text not null
    check (goal in ('purchase','refinance','investment','land','construction_renovation')),

  property_state char(2) not null check (property_state ~ '^[A-Z]{2}$'),
  -- City or postal code only. A street address is never collected here.
  property_location text check (property_location is null or length(property_location) <= 80),
  property_type text not null
    check (property_type in ('single_family','condo','townhome','multi_family_2_4','manufactured','land','other')),
  property_stage text not null
    check (property_stage in ('under_contract','identified','actively_looking','early_research','own_it')),
  price_band text not null
    check (price_band in ('under_200k','200k_350k','350k_500k','500k_750k','750k_1m','1m_plus')),

  down_payment_band text not null
    check (down_payment_band in ('under_3','3_5','5_10','10_20','20_plus','not_sure')),
  current_mortgage_balance_band text
    check (current_mortgage_balance_band in ('under_100k','100k_250k','250k_500k','500k_750k','750k_plus','not_sure')),
  current_mortgage_rate_band text
    check (current_mortgage_rate_band in ('under_4','4_5','5_6','6_7','7_plus','not_sure')),

  -- Self-reported band. This is never a credit pull, never a score, and must
  -- never be relabelled as either.
  credit_band text not null
    check (credit_band in ('below_580','580_619','620_679','680_719','720_759','760_plus','unknown')),
  employment text not null
    check (employment in ('w2','self_employed','business_owner','contract_1099','retired','other')),
  -- Ranges, never figures.
  income_band text not null
    check (income_band in ('under_4k','4k_6k','6k_8k','8k_12k','12k_20k','20k_plus','prefer_not_to_say')),
  monthly_debt_band text not null
    check (monthly_debt_band in ('none','under_500','500_1000','1000_2000','2000_plus','prefer_not_to_say')),

  timing text not null
    check (timing in ('immediately','within_30_days','60_to_90_days','researching')),

  -- Which question set produced these answers, so a later revision cannot make
  -- a stored row ambiguous.
  planner_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Current-mortgage answers belong to a refinance and nothing else. Asking a
-- purchase buyer about their existing note would be noise; storing it against a
-- purchase would be wrong.
alter table public.lead_planner_responses
  add constraint current_mortgage_requires_refinance
  check (
    goal = 'refinance'
    or (current_mortgage_balance_band is null and current_mortgage_rate_band is null)
  );

create index lead_planner_lead_idx on public.lead_planner_responses (lead_id);
create index lead_planner_goal_idx on public.lead_planner_responses (goal, timing, created_at desc);
create index lead_planner_market_idx on public.lead_planner_responses (property_state, price_band);

create trigger lead_planner_responses_updated_at
  before update on public.lead_planner_responses
  for each row execute function public.set_updated_at();

alter table public.lead_planner_responses enable row level security;

-- Anonymous clients get no direct table access at all, exactly as with the lead
-- tables this one hangs off. Writes happen only through the security-definer
-- function below, called by a server route holding a narrowly scoped credential.
revoke all on public.lead_planner_responses from anon;

-- Reading follows the lead itself: the people who work a lead can see the
-- context that lead arrived with, and the assigned officer can see their own.
-- Consent review is a separate concern with a separate ledger, so a compliance
-- reviewer is not granted read here.
create policy "staff read planner responses"
  on public.lead_planner_responses for select to authenticated
  using (
    public.has_role('loan_officer')
    or public.has_role('operations')
    or public.has_role('admin')
    or exists (
      select 1 from public.leads l
      where l.id = lead_id and l.assigned_user_id = auth.uid()
    )
  );

-- There is deliberately no insert, update, or delete policy. A planner response
-- is a record of what the consumer said at a point in time; it is written once
-- by the function below and is not editable through an ordinary session.

-- Single transaction: lead + consent + attribution + outbox + planner answers.
--
-- This is a sibling of create_lead_with_receipt rather than a new signature for
-- it, because adding a defaulted parameter to the existing function would make
-- every five-argument call ambiguous. It delegates the lead write so there is
-- still exactly one implementation of the receipt, and because both run inside
-- this one function call, the planner insert shares that transaction.
create or replace function public.create_lead_with_planner_response(
  p_lead jsonb,
  p_consent jsonb,
  p_attribution jsonb,
  p_outbox jsonb,
  p_planner jsonb,
  p_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
begin
  v_lead_id := public.create_lead_with_receipt(p_lead, p_consent, p_attribution, p_outbox, p_request_id);

  insert into public.lead_planner_responses (
    lead_id, goal, property_state, property_location, property_type, property_stage,
    price_band, down_payment_band, current_mortgage_balance_band, current_mortgage_rate_band,
    credit_band, employment, income_band, monthly_debt_band, timing, planner_version
  ) values (
    v_lead_id,
    p_planner->>'goal',
    upper(p_planner->>'property_state'),
    p_planner->>'property_location',
    p_planner->>'property_type',
    p_planner->>'property_stage',
    p_planner->>'price_band',
    p_planner->>'down_payment_band',
    p_planner->>'current_mortgage_balance_band',
    p_planner->>'current_mortgage_rate_band',
    p_planner->>'credit_band',
    p_planner->>'employment',
    p_planner->>'income_band',
    p_planner->>'monthly_debt_band',
    p_planner->>'timing',
    coalesce(p_planner->>'planner_version', 'lead-planner@unversioned')
  );

  return v_lead_id;
end;
$$;

-- EXECUTE is granted to PUBLIC by default on a new function, so revoking from
-- anon and authenticated alone would leave this reachable. Revoke from PUBLIC.
revoke execute on function public.create_lead_with_planner_response(jsonb, jsonb, jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.create_lead_with_planner_response(jsonb, jsonb, jsonb, jsonb, jsonb, uuid) to service_role;
