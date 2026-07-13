-- Cadence v5 — Pulse site claims (run after schema-v4-billing-bundles.sql)
-- One claim per user per site_id; read keys stay server-side (never RLS-selectable from client).

create table if not exists public.pulse_site_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  site_id text not null,
  domain text not null,
  pulse_read_key text not null,
  claimed_at timestamptz not null default now(),
  unique (user_id, site_id)
);

create index if not exists pulse_site_claims_user_idx on public.pulse_site_claims (user_id);
create index if not exists pulse_site_claims_site_idx on public.pulse_site_claims (site_id);

alter table public.pulse_site_claims enable row level security;

-- No client policies — service role only via Cadence server.
