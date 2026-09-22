-- HealthyFarm market intelligence schema (Supabase / Postgres)
-- Run in the Supabase SQL editor. Designed to hold analytics aggregates
-- that power the public market panel and the admin dashboard.
-- API responses are currently mocked in the app; these tables are the
-- intended destination when live data is connected.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Raw observation store (optional; mirrors analytics pipeline fields)
-- ---------------------------------------------------------------------------
create table if not exists public.egg_price_observations (
  id uuid primary key default gen_random_uuid(),
  record_id text,
  observed_on date not null,
  scrape_timestamp timestamptz,
  source text,
  source_type text,
  market_level text,
  price_level text not null check (price_level in ('Farmgate', 'Retail')),
  country text default 'Vietnam',
  region text,
  province text,
  city text,
  location text,
  housing_system text check (housing_system in ('Caged', 'Cage-Free')),
  housing_label_status text,
  brand text,
  product_name text,
  egg_count numeric,
  pack_price_vnd numeric,
  price_per_egg_vnd numeric not null,
  availability text,
  analytics_eligible boolean default true,
  quality_status text,
  created_at timestamptz not null default now()
);

create index if not exists egg_price_observations_date_idx
  on public.egg_price_observations (observed_on);
create index if not exists egg_price_observations_level_system_idx
  on public.egg_price_observations (price_level, housing_system);

-- ---------------------------------------------------------------------------
-- Pre-aggregated summary (matches dashboard summary() output)
-- ---------------------------------------------------------------------------
create table if not exists public.market_summaries (
  id uuid primary key default gen_random_uuid(),
  price_level text not null,
  housing_system text not null,
  region text,
  average_price numeric not null,
  observations integer not null,
  days integer not null,
  sources integer not null,
  period_start date,
  period_end date,
  refreshed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Time series points (matches dashboard time_series() output)
-- ---------------------------------------------------------------------------
create table if not exists public.market_time_series (
  id uuid primary key default gen_random_uuid(),
  series_name text not null,
  price_level text not null,
  interval text not null check (interval in ('Daily', 'Weekly', 'Monthly')),
  bucket_date date not null,
  average_price numeric not null,
  observations integer not null,
  refreshed_at timestamptz not null default now(),
  unique (series_name, price_level, interval, bucket_date)
);

-- ---------------------------------------------------------------------------
-- Matched comparisons (housing / supply-chain premiums)
-- ---------------------------------------------------------------------------
create table if not exists public.market_comparisons (
  id uuid primary key default gen_random_uuid(),
  comparison_type text not null check (comparison_type in ('housing', 'supply_chain')),
  baseline_label text not null,
  target_label text not null,
  baseline_price numeric not null,
  target_price numeric not null,
  difference numeric not null,
  percent numeric,
  cells integer,
  days integer,
  refreshed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Farmer-facing insights (rule-based explanations)
-- ---------------------------------------------------------------------------
create table if not exists public.market_insights (
  id uuid primary key default gen_random_uuid(),
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
  refreshed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public read for aggregate tables used by the embeddable market panel.
-- Write access remains service-role / authenticated admin only.
-- ---------------------------------------------------------------------------
alter table public.egg_price_observations enable row level security;
alter table public.market_summaries enable row level security;
alter table public.market_time_series enable row level security;
alter table public.market_comparisons enable row level security;
alter table public.market_insights enable row level security;

-- Raw observations: authenticated admins only
create policy "Admins can read observations"
  on public.egg_price_observations for select
  to authenticated
  using (true);

-- Aggregates: public read (anon + authenticated)
create policy "Public can read market summaries"
  on public.market_summaries for select
  to anon, authenticated
  using (true);

create policy "Public can read market time series"
  on public.market_time_series for select
  to anon, authenticated
  using (true);

create policy "Public can read market comparisons"
  on public.market_comparisons for select
  to anon, authenticated
  using (true);

create policy "Public can read market insights"
  on public.market_insights for select
  to anon, authenticated
  using (true);

-- Authenticated users can refresh aggregates (tighten later with roles)
create policy "Authenticated can upsert summaries"
  on public.market_summaries for insert
  to authenticated
  with check (true);

create policy "Authenticated can upsert time series"
  on public.market_time_series for insert
  to authenticated
  with check (true);

create policy "Authenticated can upsert comparisons"
  on public.market_comparisons for insert
  to authenticated
  with check (true);

create policy "Authenticated can upsert insights"
  on public.market_insights for insert
  to authenticated
  with check (true);

grant select on public.market_summaries to anon, authenticated;
grant select on public.market_time_series to anon, authenticated;
grant select on public.market_comparisons to anon, authenticated;
grant select on public.market_insights to anon, authenticated;
grant select on public.egg_price_observations to authenticated;
