-- GE SÖKA BOLAG — AI Deal Sourcing Platform
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════════
-- SOURCES — crawl source library
-- ═══════════════════════════════════════════
create table sources (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  url text not null,
  domain text,
  category text not null default 'broker',
    -- broker | legal | distress | data | news | signal | custom
  source_type text default 'website',
    -- website | api | rss | manual
  trust_level int default 3 check (trust_level between 1 and 5),
  priority int default 3 check (priority between 1 and 5),
  crawl_frequency text default 'daily',
    -- hourly | daily | weekly | manual
  keywords text[],
  enabled boolean default true,
  last_crawled_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════
-- CRAWL_JOBS — crawl execution log
-- ═══════════════════════════════════════════
create table crawl_jobs (
  id uuid default gen_random_uuid() primary key,
  source_id uuid references sources(id) on delete cascade,
  status text default 'pending',
    -- pending | running | completed | failed
  pages_found int default 0,
  new_items int default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════
-- RAW_CONTENT — raw scraped snapshots
-- ═══════════════════════════════════════════
create table raw_content (
  id uuid default gen_random_uuid() primary key,
  source_id uuid references sources(id) on delete cascade,
  crawl_job_id uuid references crawl_jobs(id) on delete set null,
  url text not null,
  url_hash text generated always as (md5(url)) stored,
  title text,
  content_text text,
  content_html text,
  content_hash text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

create unique index on raw_content(url_hash);

-- ═══════════════════════════════════════════
-- COMPANIES — normalized company records
-- ═══════════════════════════════════════════
create table companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  org_nr text,
  website text,

  -- location
  address text,
  city text,
  municipality text,
  county text,   -- län
  country text default 'Sweden',

  -- business data
  revenue_msek numeric(10,1),
  employees int,
  business_description text,
  industry_tags text[],

  -- production capabilities
  machine_park text,
  capabilities text[],
  certifications text[],

  -- ownership
  owner_names text[],
  board_members text[],
  founded_year int,
  owner_age_estimate int,

  -- financial signals
  profit_margin numeric(5,1),
  revenue_trend text,       -- growing | stable | declining
  leverage text,            -- low | moderate | high

  -- status
  sale_status text default 'unknown',
    -- for_sale | distressed | bankruptcy | restructuring | early_signal | off_market | unknown
  transaction_type text,
    -- share_sale | asset_sale | bid_process | auction | unknown

  -- dedup
  data_quality int default 3 check (data_quality between 1 and 5),
  merged_into_id uuid references companies(id),

  -- meta
  first_seen_at timestamptz default now(),
  last_updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create unique index on companies(org_nr) where org_nr is not null;
create index on companies(county);
create index on companies(sale_status);

-- ═══════════════════════════════════════════
-- COMPANY_SOURCES — link companies to raw sources
-- ═══════════════════════════════════════════
create table company_sources (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  raw_content_id uuid references raw_content(id) on delete set null,
  source_url text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create index on company_sources(company_id);

-- ═══════════════════════════════════════════
-- SCORES — AI scoring per company
-- ═══════════════════════════════════════════
create table scores (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,

  strategic_fit int check (strategic_fit between 0 and 100),
  transaction_probability int check (transaction_probability between 0 and 100),
  improvement_potential int check (improvement_potential between 0 and 100),
  risk_score int check (risk_score between 0 and 100),
  source_confidence int check (source_confidence between 0 and 100),

  deal_priority int check (deal_priority between 0 and 100),

  -- explanations
  fit_reasons text[],
  risk_reasons text[],
  improvement_reasons text[],

  scored_at timestamptz default now(),
  model_version text default 'v1'
);

create index on scores(company_id);
create index on scores(deal_priority desc);

-- ═══════════════════════════════════════════
-- SIGNALS — weak signal detections
-- ═══════════════════════════════════════════
create table signals (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  signal_type text not null,
    -- owner_retirement | succession_issue | declining_financials | board_change
    -- stale_website | low_social | property_sale | restructuring_notice
    -- weak_digital | phrase_match | multiple_source_hits
  description text,
  confidence int check (confidence between 0 and 100),
  source_url text,
  detected_at timestamptz default now()
);

create index on signals(company_id);

-- ═══════════════════════════════════════════
-- DEAL_BRIEFS — AI-generated case summaries
-- ═══════════════════════════════════════════
create table deal_briefs (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  summary text,
  why_match text,
  why_available text,
  strengths text[],
  risks text[],
  suggested_next_step text,
  generated_at timestamptz default now(),
  model_version text default 'v1'
);

-- ═══════════════════════════════════════════
-- PIPELINE — user workflow states
-- ═══════════════════════════════════════════
create table pipeline (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade unique,
  status text default 'new',
    -- new | monitoring | interesting | contacted | under_review
    -- deprioritized | not_relevant | high_priority
  notes text,
  tags text[],
  watchlist boolean default false,
  user_override_score int,
  last_status_change timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on pipeline(status);
create index on pipeline(watchlist) where watchlist = true;

-- ═══════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════
create table notifications (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  type text not null,
    -- new_high_priority | new_bankruptcy | score_change | new_signal | source_update
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

create index on notifications(read, created_at desc);

-- ═══════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════
alter table sources enable row level security;
alter table crawl_jobs enable row level security;
alter table raw_content enable row level security;
alter table companies enable row level security;
alter table company_sources enable row level security;
alter table scores enable row level security;
alter table signals enable row level security;
alter table deal_briefs enable row level security;
alter table pipeline enable row level security;
alter table notifications enable row level security;

-- Authenticated full access policies (all tables)
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'sources','crawl_jobs','raw_content','companies','company_sources',
    'scores','signals','deal_briefs','pipeline','notifications'
  ]) loop
    execute format('create policy "auth_select_%s" on public.%s for select to authenticated using (true)', tbl, tbl);
    execute format('create policy "auth_insert_%s" on public.%s for insert to authenticated with check (true)', tbl, tbl);
    execute format('create policy "auth_update_%s" on public.%s for update to authenticated using (true) with check (true)', tbl, tbl);
    execute format('create policy "auth_delete_%s" on public.%s for delete to authenticated using (true)', tbl, tbl);
  end loop;
end $$;
