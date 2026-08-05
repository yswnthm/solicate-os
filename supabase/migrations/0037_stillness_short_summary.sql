-- 0037: Stillness Co — trim the project summary to a short description.

update public.projects
set summary = $str$Stillness Co — wellness & mindfulness brand, Greater Vancouver BC. Experiential somatic anchoring; no fixed venue, ~9 sessions/mo. Floating sound baths = flagship + highest margin (Canada's first, Jun 2026). One standing engagement, 5 phases: 1 Website Redesign (₹25k, done) · 2 Events, Ticketing & LPs (done) · 3 Organic Growth Foundation (active, ₹15k) · 4 Growth Engine (₹8–10k/mo, planned) · 5 Growth Scale (₹18k/mo, planned). Goal: own search demand, cut ad dependence. DM: Komal (owner); Sakshi referral/ops (₹10k cleared).$str$
where id = '1ce4a5c0-0000-4000-8000-000000000021';

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT summary FROM projects WHERE id = '1ce4a5c0-0000-4000-8000-000000000021';
