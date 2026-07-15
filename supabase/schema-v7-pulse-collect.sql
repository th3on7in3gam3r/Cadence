-- Cadence v7 — per-site Pulse collect keys (pixel data-key)
-- Run after schema-v5-pulse-claims.sql

alter table public.pulse_site_claims
  add column if not exists pulse_collect_key text;

comment on column public.pulse_site_claims.pulse_collect_key is
  'Per-site Pulse collect key (pck_…) embedded as data-key on the pixel; not for dashboard unlock.';
