-- Cadence v6 — Growth stack API keys (run after schema-v5-pulse-claims.sql)
-- Server-only storage for optional CitePilot / Kerygma / Aegis keys (one row per user).

create table if not exists public.growth_stack_api_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  citepilot_api_key text not null default '',
  kerygma_api_key text not null default '',
  aegis_api_key text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.growth_stack_api_keys enable row level security;

-- No client policies — service role only via Cadence server.
