-- AI CMO v4 — Studio bundle billing (run after schema-v3-studio-identity.sql)
-- Tracks cross-product Stripe subscriptions purchased via AI-CMO checkout.

create table if not exists public.studio_billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bundle_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null default 'active',
  products jsonb not null default '[]'::jsonb,
  entitlements jsonb not null default '{}'::jsonb,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists studio_billing_sub_user_idx
  on public.studio_billing_subscriptions (user_id);

create index if not exists studio_billing_sub_bundle_idx
  on public.studio_billing_subscriptions (bundle_id);

alter table public.studio_billing_subscriptions enable row level security;

create policy "Users read own studio billing subs" on public.studio_billing_subscriptions
  for select using (user_id = auth.uid());
