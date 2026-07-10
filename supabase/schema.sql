-- AI CMO — run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Enable Google OAuth in Authentication → Providers before going live.

-- Workspace: one active blob per user (brand, assets, SEO, settings)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My workspace',
  brand_url text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Saved campaign runs (multi-brand history)
create table if not exists public.campaign_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  brand_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_runs_user_id_idx on public.campaign_runs (user_id);

-- OAuth tokens & integration config (server writes via service role)
create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.workspaces enable row level security;
alter table public.campaign_runs enable row level security;
alter table public.integration_connections enable row level security;

create policy "Users read own workspace" on public.workspaces
  for select using (auth.uid() = user_id);
create policy "Users upsert own workspace" on public.workspaces
  for insert with check (auth.uid() = user_id);
create policy "Users update own workspace" on public.workspaces
  for update using (auth.uid() = user_id);

create policy "Users read own runs" on public.campaign_runs
  for select using (auth.uid() = user_id);
create policy "Users insert own runs" on public.campaign_runs
  for insert with check (auth.uid() = user_id);
create policy "Users update own runs" on public.campaign_runs
  for update using (auth.uid() = user_id);
create policy "Users delete own runs" on public.campaign_runs
  for delete using (auth.uid() = user_id);

-- Integrations: no client policies (service role only from API server)
