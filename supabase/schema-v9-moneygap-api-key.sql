-- Cadence v9 — MoneyGap AI API key on growth_stack_api_keys (run after schema-v8-postwick-api-key.sql)

alter table public.growth_stack_api_keys
  add column if not exists moneygap_api_key text not null default '';
