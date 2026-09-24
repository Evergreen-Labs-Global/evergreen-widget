-- HealthyFarm Supabase schema — FastAPI v1 contract
-- Endpoints this schema supports:
--   GET /health                         (no table)
--   GET /api/v1/options                 -> hf_filter_options
--   GET /api/v1/market                  -> hf_market_snapshots.response
--
-- Two layers:
--   1. hf_analytics_observations  PRIVATE rows FastAPI must query
--      (full analytics dataset, including source/store/provenance).
--      No anon or authenticated access. Service role only.
--   2. hf_market_snapshots and hf_* aggregate tables
--      PUBLIC dashboard output the website may read.
-- FastAPI reads layer 1, calculates, then writes layer 2.
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

drop policy if exists "Public can read latest market snapshots" on public.hf_market_snapshots;
create policy "Public can read latest market snapshots"
  on public.hf_market_snapshots for select
  to anon, authenticated
  using (is_latest = true);

drop policy if exists "Public can read filter options" on public.hf_filter_options;
create policy "Public can read filter options"
  on public.hf_filter_options for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read retail system summary" on public.hf_retail_system_summary;
create policy "Public can read retail system summary"
  on public.hf_retail_system_summary for select to anon, authenticated using (true);
drop policy if exists "Public can read series points" on public.hf_series_points;
create policy "Public can read series points"
  on public.hf_series_points for select to anon, authenticated using (true);
drop policy if exists "Public can read comparisons" on public.hf_comparisons;
create policy "Public can read comparisons"
  on public.hf_comparisons for select to anon, authenticated using (true);
drop policy if exists "Public can read retail regions" on public.hf_retail_regions;
create policy "Public can read retail regions"
  on public.hf_retail_regions for select to anon, authenticated using (true);
drop policy if exists "Public can read retail brands" on public.hf_retail_brands;
create policy "Public can read retail brands"
  on public.hf_retail_brands for select to anon, authenticated using (true);
drop policy if exists "Public can read insights" on public.hf_insights;
create policy "Public can read insights"
  on public.hf_insights for select to anon, authenticated using (true);
drop policy if exists "Public can read supply summaries" on public.hf_supply_level_summary;
create policy "Public can read supply summaries"
  on public.hf_supply_level_summary for select to anon, authenticated using (true);
drop policy if exists "Public can read coverage" on public.hf_coverage;
create policy "Public can read coverage"
  on public.hf_coverage for select to anon, authenticated using (true);
drop policy if exists "Public can read coverage matrix" on public.hf_coverage_matrix;
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

-- ---------------------------------------------------------------------------
-- PRIVATE observation layer
-- FastAPI queries: public.hf_analytics_observations
-- One row = one analytics CSV record (84 columns).
-- Source, store, URL, and provenance columns are in this table on purpose
-- and are revoked from anon and authenticated.
-- ---------------------------------------------------------------------------
create table if not exists public.hf_analytics_observations (
  record_id text primary key,
  observed_on date,
  scrape_timestamp text,
  source text,
  source_type text,
  market_level text,
  country text,
  region text,
  region_label text,
  region_raw text,
  province text,
  city text,
  location text,
  store_name text,
  store_address text,
  store_code text,
  store_group_code text,
  species text,
  egg_type_raw text,
  egg_type_normalized text,
  egg_type_label text,
  shell_color text,
  production_system text,
  brand text,
  product_name text,
  item_no text,
  pack_size text,
  egg_count numeric,
  price_raw text,
  buying_price_vnd numeric,
  selling_price_vnd numeric,
  pack_price_vnd numeric,
  price_per_egg_vnd numeric,
  unit_raw text,
  unit_normalized text,
  quantity_sold numeric,
  stock_quantity numeric,
  feed_cost_vnd numeric,
  buyer_type text,
  weather_condition text,
  event_impact text,
  availability text,
  source_url text,
  quality_flag text,
  notes text,
  date_clean date,
  scrape_timestamp_clean text,
  price_level text,
  region_normalized text,
  province_normalized text,
  city_normalized text,
  data_origin text,
  housing_system text,
  housing_label_status text,
  housing_label_basis text,
  housing_dashboard_eligible text,
  egg_count_clean numeric,
  price_per_egg_vnd_clean numeric,
  duplicate_flag text,
  quality_status text,
  preprocessing_issues text,
  analytics_eligible text,
  analytics_exclusion_reason text,
  year integer,
  month_number integer,
  month_label text,
  year_month text,
  quarter text,
  week integer,
  day_of_week text,
  analytics_price_available text,
  production_system_clean text,
  production_system_dashboard_eligible text,
  observation_count integer,
  housing_comparison_count integer,
  market_price_vnd_clean numeric,
  farmgate_price_vnd_clean numeric,
  retail_price_vnd_clean numeric,
  caged_price_vnd_clean numeric,
  cage_free_price_vnd_clean numeric,
  free_range_price_vnd_clean numeric,
  caged_retail_price_vnd_clean numeric,
  cage_free_retail_price_vnd_clean numeric,
  free_range_retail_price_vnd_clean numeric,
  loaded_at timestamptz not null default now()
);

create index if not exists hf_analytics_date_clean_idx
  on public.hf_analytics_observations (date_clean);
create index if not exists hf_analytics_level_system_idx
  on public.hf_analytics_observations (price_level, housing_system);
create index if not exists hf_analytics_region_idx
  on public.hf_analytics_observations (region_normalized);
create index if not exists hf_analytics_eligible_idx
  on public.hf_analytics_observations (analytics_eligible);

alter table public.hf_analytics_observations enable row level security;

revoke all on table public.hf_analytics_observations from anon, authenticated;
grant select, insert, update, delete on table public.hf_analytics_observations to service_role;

comment on table public.hf_analytics_observations is
  'Private HealthyFarm analytics rows. FastAPI service role only. Do not expose to the public market panel.';
