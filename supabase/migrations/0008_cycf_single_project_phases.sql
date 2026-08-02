-- 0008: CYCFDesign — collapse the two projects (CYCF-001 Etsy / CYCF-002 WordPress)
-- into a single project with 4 phases, and tasks are scoped to their phase.
-- Decision dated 2026-08-02: Phase 1 (Etsy) and Phase 2 (WordPress) stay as they
-- were — they become the first two phases of one engagement. Phase 3 (Zoho/Stripe)
-- and Phase 4 (US growth) are future quotes.

do $guard$
begin
  if not exists (select 1 from public.projects where id = '2f9e3d70-0000-4000-8000-000000000021') then
    raise exception 'CYCF project CYCF-001 not found — run migration 0006 first.';
  end if;
  if not exists (select 1 from public.projects where id = '2f9e3d70-0000-4000-8000-000000000022') then
    raise exception 'CYCF project CYCF-002 not found — run migration 0006 first.';
  end if;
end $guard$;

-- 1) Repoint all CYCF-002 rows at the surviving project (CYCF-001).
update public.conversations set project_id = '2f9e3d70-0000-4000-8000-000000000021'
  where project_id = '2f9e3d70-0000-4000-8000-000000000022';
update public.entries set project_id = '2f9e3d70-0000-4000-8000-000000000021'
  where project_id = '2f9e3d70-0000-4000-8000-000000000022';
update public.tasks set project_id = '2f9e3d70-0000-4000-8000-000000000021'
  where project_id = '2f9e3d70-0000-4000-8000-000000000022';
update public.issues set project_id = '2f9e3d70-0000-4000-8000-000000000021'
  where project_id = '2f9e3d70-0000-4000-8000-000000000022';

-- 2) Participant rows already exist on the surviving project for both people —
-- drop the now-duplicate CYCF-002 rows.
delete from public.project_participants
  where project_id = '2f9e3d70-0000-4000-8000-000000000022';

-- 3) Rename/reshape the surviving project into the single CYCFDesign engagement.
update public.projects
set name = 'CYCFDesign — Etsy & WordPress (4 phases)',
    code = 'CYCF',
    summary = $str$Plus-size women's clothing brand (Celebrate Your Curves), US market. Phase 1 Etsy catalog pass (₹5,000) + Phase 2 WordPress trial (₹6,500) under one engagement — ₹11,500 secured; payment clearance not documented (treat as secured). Phase 3 Zoho/Stripe (₹20k+) and Phase 4 US growth retainer are separate quotes requiring written approval + advance.$str$,
    started_on = '2026-07-04'
where id = '2f9e3d70-0000-4000-8000-000000000021';

-- 4) Drop the obsolete CYCF-002 project.
delete from public.projects where id = '2f9e3d70-0000-4000-8000-000000000022';

-- 5) Create the 4 phases under the single project.
insert into public.phases (id, project_id, name, description, position, status, started_on, created_by_id) values
('2f9e3d70-0000-4000-8000-000000001000', '2f9e3d70-0000-4000-8000-000000000021', 'Phase 1 — Etsy catalog', $str$Etsy shop consistency pass: 4 existing + 20 new listings, plus-size only, US market. ₹5,000 deal closed via Sakshi.$str$, 1, 'active', '2026-07-04', (select id from public.app_users where is_active = true order by created_at limit 1)),
('2f9e3d70-0000-4000-8000-000000001001', '2f9e3d70-0000-4000-8000-000000000021', 'Phase 2 — WordPress trial', $str$WooCommerce trial: 25 dresses, 3 photos each (front/back/side), colors, sizes, SEO descriptions. ₹6,500 locked 09 Jul 2026.$str$, 2, 'active', '2026-07-09', (select id from public.app_users where is_active = true order by created_at limit 1)),
('2f9e3d70-0000-4000-8000-000000001002', '2f9e3d70-0000-4000-8000-000000000021', 'Phase 3 — Zoho/Stripe integration', $str$Zoho Inventory/Stripe ecomm integration. ₹20,000+ quote; requires written approval + advance.$str$, 3, 'planned', null, (select id from public.app_users where is_active = true order by created_at limit 1)),
('2f9e3d70-0000-4000-8000-000000001003', '2f9e3d70-0000-4000-8000-000000000021', 'Phase 4 — US growth retainer', $str$US growth strategy / monthly retainer. Requires written approval + advance.$str$, 4, 'planned', null, (select id from public.app_users where is_active = true order by created_at limit 1))
on conflict (id) do nothing;

-- 6) Scope tasks to their phase (Phase 1: 7001–7004, Phase 2: 7005–7010, Phase 3: 7011).
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001000' where id = '2f9e3d70-0000-4000-8000-000000007001';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001000' where id = '2f9e3d70-0000-4000-8000-000000007002';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001000' where id = '2f9e3d70-0000-4000-8000-000000007003';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001000' where id = '2f9e3d70-0000-4000-8000-000000007004';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001001' where id = '2f9e3d70-0000-4000-8000-000000007005';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001001' where id = '2f9e3d70-0000-4000-8000-000000007006';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001001' where id = '2f9e3d70-0000-4000-8000-000000007007';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001001' where id = '2f9e3d70-0000-4000-8000-000000007008';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001001' where id = '2f9e3d70-0000-4000-8000-000000007009';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001001' where id = '2f9e3d70-0000-4000-8000-000000007010';
update public.tasks set phase_id = '2f9e3d70-0000-4000-8000-000000001002' where id = '2f9e3d70-0000-4000-8000-000000007011';

-- 7) Enrich the referral note on the surviving project (covers the Phase 2 referral too).
update public.project_participants
set terms_note = $str$Referred client; closed Etsy deal verbally at ₹5,000 baseline (Phase 1) and connected the WordPress trial (Phase 2). No revenue split documented in files.$str$
where project_id = '2f9e3d70-0000-4000-8000-000000000021'
  and person_id = (select id from public.people where name = 'Sakshi' and is_partner = true limit 1);

-- 8) The "never merge" decision is superseded by the single-project-with-phases model.
update public.entries
set decision_state = 'superseded',
    decision_outcome = $str$Superseded 2026-08-02: CYCFDesign is now one project with 4 phases; per-phase revenue separation still tracked.$str$
where id = '2f9e3d70-0000-4000-8000-000000006009';

insert into public.entries (id, project_id, type, title, body_md, occurred_at, triage_state, decision_outcome, decision_state, origin_message_id, created_by_id) values
('2f9e3d70-0000-4000-8000-000000006021', '2f9e3d70-0000-4000-8000-000000000021', 'decision', 'CYCFDesign modeled as one project with 4 phases',
 $str$Per decision 2026-08-02: CYCF-001 (Etsy) and CYCF-002 (WordPress) merged into a single CYCFDesign project. Phase 1 = Etsy catalog (₹5,000), Phase 2 = WordPress trial (₹6,500), Phase 3 = Zoho/Stripe (₹20k+, quote required), Phase 4 = US growth retainer. Tasks are scoped to phases.$str$,
 '2026-08-02T00:00:00Z'::timestamptz, 'filed',
 $str$Single CYCFDesign project with phases 1–4; per-phase scope and revenue tracked on phases; tasks carry phase_id.$str$,
 'active', null, (select id from public.app_users where is_active = true order by created_at limit 1))
on conflict (id) do nothing;
