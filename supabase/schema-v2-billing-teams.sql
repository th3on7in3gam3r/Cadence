-- AI CMO v2 — Billing, teams, multi-brand (run after schema.sql)
-- Stripe webhooks + org invites require service role from API server.

-- ─── Billing ───
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  status text not null default 'active',
  seats int not null default 1,
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ─── Organizations (agency / team) ───
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My agency',
  owner_id uuid not null references auth.users (id) on delete cascade,
  agency_name text,
  agency_logo_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  invite_token text,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (org_id, email)
);

create index if not exists org_members_user_idx on public.organization_members (user_id);
create index if not exists org_members_org_idx on public.organization_members (org_id);

-- ─── Multi-brand clients ───
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  slug text not null,
  name text not null,
  brand_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create index if not exists brands_org_idx on public.brands (org_id);

-- ─── Usage metering (SEO audits per month) ───
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_month_idx on public.usage_events (user_id, created_at);

alter table public.subscriptions enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.brands enable row level security;

-- Members can read their org
create policy "Members read org" on public.organizations for select using (
  id in (select org_id from public.organization_members where user_id = auth.uid())
  or owner_id = auth.uid()
);

create policy "Members read membership" on public.organization_members for select using (
  user_id = auth.uid()
  or org_id in (select org_id from public.organization_members where user_id = auth.uid() and role = 'admin')
);

create policy "Members read brands" on public.brands for select using (
  org_id in (select org_id from public.organization_members where user_id = auth.uid())
);

create policy "Users read own subscription" on public.subscriptions for select using (user_id = auth.uid());
