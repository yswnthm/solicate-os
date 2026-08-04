-- 0018: Seed the free Opencode Zen model catalog.
-- Idempotent (ON CONFLICT DO NOTHING), like the other seeds.
--
-- Only FREE Opencode Zen models are seeded (the "-free" tier plus
-- big-pickle, which is always free). Paid Zen models are intentionally
-- excluded. Sourced from https://opencode.ai/zen/v1/models (2026-08-04).

insert into public.ai_models (provider, model_id, display_name, description, is_active, sort_order, created_by_id) values
  ('opencode', 'big-pickle', 'Big Pickle', 'Always free — OpenCode Zen default free model.', true, 9, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('opencode', 'deepseek-v4-flash-free', 'DeepSeek V4 Flash Free', 'Fast DeepSeek model, free tier.', true, 10, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('opencode', 'mimo-v2.5-free', 'MiMo V2.5 Free', 'MiMo V2.5 model, free tier.', true, 11, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('opencode', 'nemotron-3-ultra-free', 'Nemotron 3 Ultra Free', 'Nemotron 3 Ultra model, free tier.', true, 12, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('opencode', 'ling-3.0-flash-free', 'Ling 3.0 Flash Free', 'Ling 3.0 Flash model, free tier.', true, 13, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('opencode', 'north-mini-code-free', 'North Mini Code Free', 'North Mini Code model, free tier.', true, 14, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('opencode', 'laguna-s-2.1-free', 'Laguna S 2.1 Free', 'Laguna S 2.1 model, free tier.', true, 15, (select id from public.app_users where is_active = true order by created_at limit 1))
on conflict (provider, model_id) do nothing;
