-- Cadence v8 — Postwick API key on growth_stack_api_keys (run after schema-v7-pulse-collect.sql)

alter table public.growth_stack_api_keys
  add column if not exists postwick_api_key text not null default '';
