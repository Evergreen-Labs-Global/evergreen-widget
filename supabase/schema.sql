-- HealthyFarm Supabase schema — FastAPI v1 contract
-- Endpoints this schema supports:
--   GET /health                         (no table)
--   GET /api/v1/options                 -> hf_filter_options
--   GET /api/v1/market                  -> hf_market_snapshots.response
--
-- Private source / store / provenance fields stay out of these tables.
-- The API may keep raw observations in a private store and write only
-- dashboard-ready aggregates here.
--
-- If an earlier draft was applied, drop those tables first:
--   drop table if exists public.market_insights, public.market_comparisons,
--     public.market_time_series, public.market_summaries,
--     public.egg_price_observations cascade;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Latest market document (exact GET /api/v1/market body)
-- ---------------------------------------------------------------------------
create table if not exists public.hf_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null,
  policy_version text not null,
  currency text not null default 'VND',
  unit text not null default 'per egg',
  dataset_start date not null,
  dataset_end date not null,
  selected_start date not null,
  selected_end date not null,
  latest_in_view date,
  interval text not null check (interval in ('Daily', 'Weekly', 'Monthly')),
  applied_filters jsonb not null default '{}'::jsonb,
  response jsonb not null,
  is_latest boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists hf_market_snapshots_one_latest
  on public.hf_market_snapshots (is_latest)
  where is_latest;

-- ---------------------------------------------------------------------------
-- GET /api/v1/options
-- ---------------------------------------------------------------------------
create table if not exists public.hf_filter_options (
  id integer primary key default 1 check (id = 1),
  price_levels text[] not null default array['Farmgate', 'Retail'],
  systems text[] not null default array['Caged', 'Cage-Free'],
  regions text[] not null default array['North', 'Central', 'South'],
  provinces text[] not null default '{}',
  brands text[] not null default '{}',
  intervals text[] not null default array['Daily', 'Weekly', 'Monthly'],
  updated_at timestamptz not null default now()
);

insert into public.hf_filter_options (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Normalized aggregates (optional query layer; snapshot JSON is canonical)
-- ---------------------------------------------------------------------------
create table if not exists public.hf_retail_system_summary (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  housing_system text not null,
  average_price numeric not null,
  observations integer not null,
  days integer not null
);

create table if not exists public.hf_series_points (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  scope text not null check (scope in ('retail', 'supply_chain')),
  series_name text not null,
  housing_system text,
  price_level text,
  interval text not null,
  bucket_date date not null,
  average_price numeric not null,
  observations integer not null
);

create table if not exists public.hf_comparisons (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  kind text not null check (kind in (
    'retail_unadjusted',
    'retail_matched_housing',
    'supply_spread'
  )),
  housing_system text,
  baseline_label text not null,
  target_label text not null,
  baseline_price numeric not null,
  target_price numeric not null,
  difference numeric not null,
  percent numeric,
  cells integer,
  days integer
);

create table if not exists public.hf_retail_regions (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  region text not null,
  housing_system text not null,
  average_price numeric not null,
  observations integer not null,
  days integer not null
);

create table if not exists public.hf_retail_brands (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  brand text,
  housing_system text not null,
  average_price numeric not null,
  observations integer not null,
  days integer not null
);

create table if not exists public.hf_insights (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  scope text not null check (scope in ('retail', 'farmgate')),
  housing_system text not null,
  price_level text not null,
  headline text not null,
  observation text not null,
  planning_note text not null,
  confidence text not null,
  evidence_note text,
  change_percent numeric,
  baseline_price numeric,
  recent_price numeric,
  matched_series integer not null default 0,
  previous_dates integer not null default 0,
  recent_dates integer not null default 0,
  sustained boolean not null default false
);

create table if not exists public.hf_supply_level_summary (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  price_level text not null,
  average_price numeric not null,
  observations integer not null,
  days integer not null
);

create table if not exists public.hf_coverage (
  snapshot_id uuid primary key references public.hf_market_snapshots (id) on delete cascade,
  price_observations integer not null,
  observed_dates integer not null,
  brands integer not null,
  unclassified_observations integer not null default 0
);

create table if not exists public.hf_coverage_matrix (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.hf_market_snapshots (id) on delete cascade,
  price_level text not null,
  housing_system text not null,
  average_price numeric not null,
  observations integer not null,
  days integer not null
);

-- ---------------------------------------------------------------------------
-- RLS: public read of snapshots + options; writes via service role
-- ---------------------------------------------------------------------------
alter table public.hf_market_snapshots enable row level security;
alter table public.hf_filter_options enable row level security;
alter table public.hf_retail_system_summary enable row level security;
alter table public.hf_series_points enable row level security;
alter table public.hf_comparisons enable row level security;
alter table public.hf_retail_regions enable row level security;
alter table public.hf_retail_brands enable row level security;
alter table public.hf_insights enable row level security;
alter table public.hf_supply_level_summary enable row level security;
alter table public.hf_coverage enable row level security;
alter table public.hf_coverage_matrix enable row level security;

create policy "Public can read latest market snapshots"
  on public.hf_market_snapshots for select
  to anon, authenticated
  using (is_latest = true);

create policy "Public can read filter options"
  on public.hf_filter_options for select
  to anon, authenticated
  using (true);

create policy "Public can read retail system summary"
  on public.hf_retail_system_summary for select to anon, authenticated using (true);
create policy "Public can read series points"
  on public.hf_series_points for select to anon, authenticated using (true);
create policy "Public can read comparisons"
  on public.hf_comparisons for select to anon, authenticated using (true);
create policy "Public can read retail regions"
  on public.hf_retail_regions for select to anon, authenticated using (true);
create policy "Public can read retail brands"
  on public.hf_retail_brands for select to anon, authenticated using (true);
create policy "Public can read insights"
  on public.hf_insights for select to anon, authenticated using (true);
create policy "Public can read supply summaries"
  on public.hf_supply_level_summary for select to anon, authenticated using (true);
create policy "Public can read coverage"
  on public.hf_coverage for select to anon, authenticated using (true);
create policy "Public can read coverage matrix"
  on public.hf_coverage_matrix for select to anon, authenticated using (true);

grant select on public.hf_market_snapshots to anon, authenticated;
grant select on public.hf_filter_options to anon, authenticated;
grant select on public.hf_retail_system_summary to anon, authenticated;
grant select on public.hf_series_points to anon, authenticated;
grant select on public.hf_comparisons to anon, authenticated;
grant select on public.hf_retail_regions to anon, authenticated;
grant select on public.hf_retail_brands to anon, authenticated;
grant select on public.hf_insights to anon, authenticated;
grant select on public.hf_supply_level_summary to anon, authenticated;
grant select on public.hf_coverage to anon, authenticated;
grant select on public.hf_coverage_matrix to anon, authenticated;
