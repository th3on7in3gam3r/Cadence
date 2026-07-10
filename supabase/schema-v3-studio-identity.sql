-- AI CMO v3 — Studio identity hub (run after schema-v2-billing-teams.sql)
-- Phase 3: federated product links without forcing SSO migration.
-- One row per Supabase user; optional external IDs for future Clerk / Neon / GitHub linking.

create table if not exists public.studio_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  clerk_id text,
  citepilot_user_id text,
  kerygma_user_id text,
  aegis_github_id text,
  aegis_github_login text,
  linked_products jsonb not null default '{"ai_cmo":true,"kerygma":false,"citepilot":false,"aegis":false}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists studio_accounts_email_idx on public.studio_accounts (email);

alter table public.studio_accounts enable row level security;

create policy "Users read own studio account" on public.studio_accounts
  for select using (user_id = auth.uid());

create policy "Users update own studio account" on public.studio_accounts
  for update using (user_id = auth.uid());
