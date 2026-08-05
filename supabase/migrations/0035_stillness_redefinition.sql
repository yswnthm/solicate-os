-- 0035: Stillness Co — redefine the client record from scratch.
--
-- The Stillness engagement was one flat project ("Website, Events & Organic
-- Growth") carrying web-dev, events, landing-page, and SEO work in a single
-- row, with financial terms only on a project_participant row. Per decision
-- 2026-08-05 it is rebuilt into the proper operating model
-- (Relationship → Project → Phase), following the CYCFDesign precedent (0008).
--
--   1. Client (people row) renamed "Stillness Co"; summary rewritten to the
--      defined business: experiential somatic anchoring, floating = flagship
--      + highest margin, monthly sessions = entry point, no fixed venue.
--   2. Relationship: one client relationship — Sakshi referral, ₹10k
--      commission tracked at the relationship level (not a participant).
--   3. Project: single standing engagement with strategy fields + summary.
--   4. Phases: 5 phases (Platform · Events & LPs · Growth Foundation ·
--      Growth Engine · Growth Scale). Completed work folds into Phases 1–2.
--   5. Execution: tasks/issues scoped to phases; key entries phase-scoped.
--   6. Finance: full ledger backfill via transactions + transaction_allocations
--      (historical income + Sakshi expense), replacing participant-row finance.
--
-- Idempotent: UPDATEs are safe to re-run; INSERTs use ON CONFLICT DO NOTHING
-- on deterministic ids. record_history triggers are disabled around the
-- task/issue UPDATEs because they write auth.uid() (NULL under migrations).

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

do $guard$
begin
  if not exists (select 1 from public.projects where id = '1ce4a5c0-0000-4000-8000-000000000021') then
    raise exception 'Stillness project not found — run migration 0005 first.';
  end if;
end $guard$;

-- ─── 1. Client record (people) ──────────────────────────────────────────────
-- 0027 collapsed clients into people; the Stillness business person is the
-- client row. Rename + rewrite the summary to the defined business.

update public.people
set name = 'Stillness Co',
    summary = $str$Wellness & mindfulness brand, Greater Vancouver, BC. Core offering: experiential somatic anchoring — active, immersive sessions (floating sound baths, breathwork, sound journeys, journaling, vocal yoga) that move people from mental overload into nervous-system regulation. No fixed location: ~9 group sessions/mo (10–15 people) at partner venues; floating sound baths = flagship, Canada's first (Jun 2026), highest-margin offering; monthly sessions = primary entry point. Positioning shifting accessible → premium (2026). Site: stillnesscuratedretreats.com (legacy wearestillness.com → 301). Primary decision-maker: Komal; ops & comms + referral partner: Sakshi.$str$
where id = '1ce4a5c0-0000-4000-8000-000000000001';

-- ─── 2. Relationship (Level 1) ──────────────────────────────────────────────
-- Sakshi referral + commission move here from project_participants. Guarded so
-- a pre-existing relationship row for Stillness is never duplicated.

insert into public.relationships (
  id, client_id, person_id, type, source, status, summary,
  communication_mode, financial_arrangement, referral_commission,
  commission_currency, payment_status, terms_note, created_by_id
)
select
  '1ce4a5c0-0000-4000-8000-000000000801',
  '1ce4a5c0-0000-4000-8000-000000000001',
  '1ce4a5c0-0000-4000-8000-000000000012',
  'client', 'referral_partner', 'active',
  $str$Stillness Co entered via Sakshi (referral partner / graphic designer). Contract signed 10 Feb 2026. ₹10,000 commission on the ₹25,000 redesign paid & cleared — recorded in the finance ledger (transaction 1ce4a5c0-…-000608).$str$,
  'shared', 'revenue_share', 10000.00, 'INR', 'paid',
  $str$Commission = 40% of the ₹25k redesign. Further per-phase splits decided by Solicate per work; partnership record at partnerships/Sakshi/Sakshi.md.$str$,
  (select id from public.app_users where is_active = true order by created_at limit 1)
where not exists (
  select 1 from public.relationships where client_id = '1ce4a5c0-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

-- ─── 3. Project ─────────────────────────────────────────────────────────────
-- Single standing engagement; strategy fields set (objective / success /
-- direction) per the 0010 operating model.

update public.projects
set name = 'Stillness Co — Digital Presence & Organic Growth',
    summary = $str$Stillness Co is a wellness & mindfulness brand in Greater Vancouver (BC) built on experiential somatic anchoring — immersive, active sessions that move people out of mental overload into nervous-system regulation (floating sound baths, breathwork, sound journeys, journaling, vocal yoga). No fixed venue: ~9 group sessions/mo (10–15 people) at partner locations; floating sound baths are Canada's first (Jun 2026), the flagship and highest-margin offering; monthly sessions are the acquisition entry point. Positioning shifting accessible → premium (2026).

Solicate runs one standing engagement across 5 phases: Phase 1 Website Redesign & Platform (completed, ₹25k fixed), Phase 2 Events, Ticketing & Landing Pages (completed: WooCommerce-native ticketing, MetForm waitlist, custom checkout + branded order email add-ons, events FAQ, event-date sorting, Men's Series LP, Hawaii Retreat LP), Phase 3 Organic Growth Foundation (active, ₹15k fixed — technical audit delivered 29 Jul 2026, 55.6/100), Phase 4 Organic Growth Engine (planned, ₹8–10k/mo retainer), Phase 5 Organic Growth Scale (planned, ₹18k/mo). Decision-maker: Komal (owner); referral & ops: Sakshi (₹10k commission cleared). Goal: own search demand and cut ad dependence (currently $20–300 CAD/mo, irregular, external team). Future: Night Decompression LP (proposed), bundled LP policy ₹3–3.2k, maintenance ₹400–₹900/hr.$str$,
    objective = $str$Make Stillness' ownable digital channels the primary source of new customers — sessions, memberships and shop — so the business stops renting demand from paid ads and sells out directly through the site.$str$,
    success_definition = $str$Organic search delivers consistent monthly session signups beyond the current ~80 tickets/mo baseline, the highest-margin floating offering ranks and converts, high-ticket retreats (e.g. Hawaii) book directly from owned landing pages, and paid-ad dependence measurably drops.$str$,
    direction = $str$1) Finish the Phase 3 foundation: index cleanup, schema, /floating-sound-bath-vancouver/ service page, /llms.txt, GSC/GA4/GBP wiring. 2) Move into the Phase 4 monthly engine: publish high-intent content, refine on-page, monitor rankings. 3) Scale via Phase 5 when high-ticket retreat promotion is live. Bundled LP policy (₹3–3.2k grouped, invoiced together) governs future landing pages.$str$
where id = '1ce4a5c0-0000-4000-8000-000000000021';

-- ─── 4. Phases ──────────────────────────────────────────────────────────────
-- 5 phases with scope + proposal workspaces populated.

insert into public.phases (
  id, project_id, name, description, position, status, started_on, target_date,
  completed_at, scope_deliverables, scope_requirements, scope_acceptance,
  proposal_quotation, proposal_pricing, proposal_revisions, created_by_id
)
select
  x.id::uuid, '1ce4a5c0-0000-4000-8000-000000000021', x.name, x.description, x.position,
  x.status::public.phase_status, x.started_on::date, x.target_date::date, x.completed_at,
  x.scope_deliverables, x.scope_requirements, x.scope_acceptance,
  x.proposal_quotation, x.proposal_pricing, x.proposal_revisions,
  (select id from public.app_users where is_active = true order by created_at limit 1)
from (values
  (
    '1ce4a5c0-0000-4000-8000-000000000501',
    'Phase 1 — Website Redesign & Platform', 'completed', '2026-02-08', null, '2026-03-01T12:00:00+05:30'::timestamptz, 1,
    $str$Full 11-page WordPress/Elementor/WooCommerce redesign launched Mar 2026; Stillness Kids page; ongoing platform maintenance at ₹400–₹900/hr.$str$,
    $str$11-page redesign (design, build, launch) · WordPress + WooCommerce platform setup · Stillness Kids page · ongoing maintenance$str$,
    $str$Client provides brand assets + copy direction; Sakshi handles graphic design (40% share).$str$,
    $str$Site launched Mar 2026; accepted by Komal.$str$,
    $str$Fixed ₹25,000 (60/40 Solicate/Sakshi); contract dated 10 Feb 2026. Sakshi ₹10k share cleared (ledger …608).$str$,
    $str$₹25,000 fixed$str$,
    $str$1 round of feedback included; changes beyond scope billed at ₹400–₹900/hr.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000502',
    'Phase 2 — Events, Ticketing & Landing Pages', 'completed', '2026-04-01', null, '2026-07-21T12:00:00+05:30'::timestamptz, 2,
    $str$WooCommerce-native event ticketing (events-as-products; no Eventbrite commissions), MetForm waitlist, custom checkout + branded order email add-ons, events FAQ, event-date sorting, Men's Series LP, Hawaii Retreat LP (built, awaiting Komal feedback), Night Decompression LP (proposed).$str$,
    $str$Ticketing system + waitlist · custom checkout (₹3k) · branded order email (₹3k) · events FAQ + shop fix (₹500) · event-date sorting (₹400–600) · Men's Series LP (₹3,500) · Hawaii Retreat LP (₹5,000) · future LPs bundled ₹3–3.2k$str$,
    $str$Client publishes events in WooCommerce; event dates power sorting (no backdating).$str$,
    $str$All deliverables shipped & accepted by Komal through the 21 Jul events handoff guide.$str$,
    $str$Per-item quotes: ticketing ₹3k + email ₹3k + FAQ/shop ₹500 + Men's LP ₹3,500 + Hawaii LP ₹5,000. Future LPs grouped ₹3–3.2k, invoiced together every 1–2 months.$str$,
    $str$₹3k–₹5k per item; bundled LP policy for future work$str$,
    $str$Add-ons approved 15 Jun; Hawaii LP locked 09 Jun (from ₹7,500).$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000503',
    'Phase 3 — Organic Growth: Foundation', 'active', '2026-07-17', '2026-08-31', null, 3,
    $str$Discovery audit + technical SEO rebuild. Business discovery & organic growth pitch accepted 17 Jul ("Let's do it"); technical audit delivered 29 Jul 2026 scoring 55.6/100. Remaining work tracked as W2 tasks.$str$,
    $str$Business discovery · SEO technical audit (55.6/100) · index cleanup (15+ legacy/staging pages) · LocalBusiness + Event schema · /floating-sound-bath-vancouver/ service page · llms.txt + OG canonical · GSC / GA4 / GBP / Meta wiring$str$,
    $str$Client access: Google Search Console, GA4, GBP, Meta, Hostinger, social handles + brand assets.$str$,
    $str$Phase closes when foundation items ship; audit delivered 29 Jul 2026 (55.6/100) marks the audit milestone.$str$,
    $str$₹15,000 fixed (245 CAD) — bundled discovery audit + technical rebuild.$str$,
    $str$₹15,000 one-time (≈245 CAD)$str$,
    $str$Phase 4 retainer starts only after Phase 3 foundation.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000504',
    'Phase 4 — Organic Growth: Engine', 'planned', null, null, null, 4,
    $str$Monthly organic growth engine: high-intent content publishing, on-page improvement, ranking monitoring, and strategy refined from real performance data. Replaces irregular paid-ad spend with owned search traffic.$str$,
    $str$Monthly keyword + content publishing · on-page optimization · ranking monitoring · performance-driven refinement · join invoices via Sakshi$str$,
    $str$Client provides real performance data access (GSC/GA4); content feedback loops.$str$,
    $str$Requires Phase 3 completion + client approval; not yet started.$str$,
    $str$₹8,000–₹10,000/mo (130–160 CAD). Starts after Phase 3.$str$,
    $str$₹8,000–₹10,000/mo$str$,
    $str$Initial pitch framed this as "Phase 2" (₹8–10k/mo) — now Phase 4 in the 5-phase model.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000505',
    'Phase 5 — Organic Growth: Scale', 'planned', null, null, null, 5,
    $str$Advanced scale engine for aggressive promotion of high-ticket retreats (e.g. Hawaii). Custom landing pages + additional optimization and growth initiatives.$str$,
    $str$Custom landing pages · aggressive high-ticket retreat promotion · advanced optimization + growth initiatives$str$,
    $str$Not needed now; activate when retreat promotion is live.$str$,
    $str$Requires client approval; not yet started.$str$,
    $str$₹18,000/mo (300 CAD).$str$,
    $str$₹18,000/mo (≈300 CAD)$str$,
    $str$Initial pitch framed this as "Phase 3" (₹18k/mo) — now Phase 5 in the 5-phase model.$str$
  )
) as x(id, name, status, started_on, target_date, completed_at, position,
      description, scope_deliverables, scope_requirements, scope_acceptance,
      proposal_quotation, proposal_pricing, proposal_revisions)
on conflict (id) do nothing;

-- ─── 5. Execution scoping: tasks, issues, entries ───────────────────────────
-- record_history triggers write auth.uid() (NULL under migrations) — disable
-- them for the bulk UPDATEs and re-enable after.

alter table public.tasks disable trigger record_history_tasks;
alter table public.issues disable trigger record_history_issues;

update public.tasks set phase_id = '1ce4a5c0-0000-4000-8000-000000000501'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000003013', -- header V4.1 (blocked)
    '1ce4a5c0-0000-4000-8000-000000003014', -- full site redesign (done)
    '1ce4a5c0-0000-4000-8000-000000003021'  -- Stillness Kids page (done)
  );

update public.tasks set phase_id = '1ce4a5c0-0000-4000-8000-000000000502'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000003001', -- branded order email (todo)
    '1ce4a5c0-0000-4000-8000-000000003002', -- Eventbrite import (todo)
    '1ce4a5c0-0000-4000-8000-000000003003', -- Hawaii LP remaining (in_progress)
    '1ce4a5c0-0000-4000-8000-000000003010', -- waitlist per-event dropdown (todo)
    '1ce4a5c0-0000-4000-8000-000000003015', -- WooCommerce ticketing (done)
    '1ce4a5c0-0000-4000-8000-000000003016', -- MetForm waitlist (done)
    '1ce4a5c0-0000-4000-8000-000000003017', -- custom checkout (done)
    '1ce4a5c0-0000-4000-8000-000000003018', -- branded order email design (done)
    '1ce4a5c0-0000-4000-8000-000000003019', -- events FAQ (done)
    '1ce4a5c0-0000-4000-8000-000000003020', -- shop regression fix (done)
    '1ce4a5c0-0000-4000-8000-000000003022', -- event-date sorting (done)
    '1ce4a5c0-0000-4000-8000-000000003023', -- events 5-vs-6 fix (done)
    '1ce4a5c0-0000-4000-8000-000000003024'  -- events handoff guide (done)
  );

update public.tasks set phase_id = '1ce4a5c0-0000-4000-8000-000000000503'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000003004', -- SEO W2 noindex + sitemap (todo)
    '1ce4a5c0-0000-4000-8000-000000003005', -- SEO W2 URL + titles (todo)
    '1ce4a5c0-0000-4000-8000-000000003006', -- SEO W2 schema (todo)
    '1ce4a5c0-0000-4000-8000-000000003007', -- SEO W2 OG image + llms.txt (todo)
    '1ce4a5c0-0000-4000-8000-000000003008', -- SEO W2 credentials (blocked)
    '1ce4a5c0-0000-4000-8000-000000003009'  -- floating sound bath service page (todo)
  );

update public.issues set phase_id = '1ce4a5c0-0000-4000-8000-000000000501'
  where id = '1ce4a5c0-0000-4000-8000-000000004001'; -- header conflict

update public.issues set phase_id = '1ce4a5c0-0000-4000-8000-000000000502'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000004004', -- single-event page issues (resolved)
    '1ce4a5c0-0000-4000-8000-000000004005', -- events catalog feedback (resolved)
    '1ce4a5c0-0000-4000-8000-000000004006', -- events grid 5-vs-6 (resolved)
    '1ce4a5c0-0000-4000-8000-000000004007'  -- publish-date sorting (resolved)
  );

update public.issues set phase_id = '1ce4a5c0-0000-4000-8000-000000000503'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000004002', -- site not indexed (open)
    '1ce4a5c0-0000-4000-8000-000000004003'  -- on-page & technical gaps (open)
  );

alter table public.issues enable trigger record_history_issues;
alter table public.tasks enable trigger record_history_tasks;

-- Key entries scoped to their phase. entries has no record_history trigger.
-- Project-level (phase_id NULL) are left alone: 2018, 2019, 2024, 2031–2033.

update public.entries set phase_id = '1ce4a5c0-0000-4000-8000-000000000501'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000002001', -- contract signed — redesign
    '1ce4a5c0-0000-4000-8000-000000002002', -- website redesign launched
    '1ce4a5c0-0000-4000-8000-000000002022', -- header debug session
    '1ce4a5c0-0000-4000-8000-000000002023', -- contract doc
    '1ce4a5c0-0000-4000-8000-000000002029', -- copywriting pack
    '1ce4a5c0-0000-4000-8000-000000002030'  -- design assets
  );

update public.entries set phase_id = '1ce4a5c0-0000-4000-8000-000000000502'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000002003', -- Men's Series LP delivered
    '1ce4a5c0-0000-4000-8000-000000002004', -- event ticketing delivered
    '1ce4a5c0-0000-4000-8000-000000002005', -- Hawaii LP deal closed
    '1ce4a5c0-0000-4000-8000-000000002008', -- ticketing = WooCommerce-native
    '1ce4a5c0-0000-4000-8000-000000002009', -- checkout add-on approved
    '1ce4a5c0-0000-4000-8000-000000002010', -- branded order email approved
    '1ce4a5c0-0000-4000-8000-000000002011', -- events FAQ + shop fix
    '1ce4a5c0-0000-4000-8000-000000002012', -- Hawaii LP price locked
    '1ce4a5c0-0000-4000-8000-000000002013', -- LP bundling policy
    '1ce4a5c0-0000-4000-8000-000000002014', -- event sorting = Option 2
    '1ce4a5c0-0000-4000-8000-000000002016', -- events buyer fields minimal
    '1ce4a5c0-0000-4000-8000-000000002017', -- waitlist per-event dropdown
    '1ce4a5c0-0000-4000-8000-000000002021', -- Hawaii LP negotiation
    '1ce4a5c0-0000-4000-8000-000000002025', -- handover guides
    '1ce4a5c0-0000-4000-8000-000000002028', -- events technical docs
    '1ce4a5c0-0000-4000-8000-000000002034'  -- Night Decompression LP capture
  );

update public.entries set phase_id = '1ce4a5c0-0000-4000-8000-000000000503'
  where id in (
    '1ce4a5c0-0000-4000-8000-000000002006', -- organic growth approved
    '1ce4a5c0-0000-4000-8000-000000002007', -- SEO Phase 1 audit delivered
    '1ce4a5c0-0000-4000-8000-000000002015', -- SEO 3-phase pricing
    '1ce4a5c0-0000-4000-8000-000000002020', -- discovery & growth pitch
    '1ce4a5c0-0000-4000-8000-000000002026', -- SEO audit report
    '1ce4a5c0-0000-4000-8000-000000002027', -- SEO strategy
    '1ce4a5c0-0000-4000-8000-000000002035'  -- external marketing team
  );

-- Decision entry recording the redefinition (project-level, like 0008).
insert into public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) values (
  '1ce4a5c0-0000-4000-8000-000000002036',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'decision', 'Stillness Co redefined as one standing engagement with 5 phases',
  $str$Per decision 2026-08-05: the flat "Website, Events & Organic Growth" project is rebuilt into the proper relationship → project → phase model. Client renamed "Stillness Co" (summary rewritten to the defined business). Phase 1 Website Redesign & Platform (completed, ₹25k), Phase 2 Events, Ticketing & Landing Pages (completed), Phase 3 Organic Growth Foundation (active, ₹15k fixed), Phase 4 Organic Growth Engine (planned, ₹8–10k/mo), Phase 5 Organic Growth Scale (planned, ₹18k/mo). Sakshi's ₹10k redesign commission moved to the relationship row (…801) + finance ledger (…608). Full ledger backfilled.$str$,
  '2026-08-05T00:00:00Z'::timestamptz, 'filed',
  $str$Single Stillness project with 5 phases; revenue tracked per phase via transaction_allocations; tasks/issues/entries carry phase_id.$str$,
  'active', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

-- ─── 6. Finance ledger backfill ─────────────────────────────────────────────
-- Historical income (from Komal) + Sakshi expense, each with one allocation
-- to the owning phase. Payments documented as received are 'completed'/'cleared';
-- the rest are 'pending'/'sent' pending clearance confirmation.

do $backfill$
declare
  v_user      uuid;
  v_income    uuid;
  v_expense   uuid;
begin
  select id into v_user from public.app_users where is_active = true order by created_at limit 1;
  select id into v_income  from public.finance_categories where transaction_type = 'income'  and is_default = true limit 1;
  select id into v_expense from public.finance_categories where transaction_type = 'expense' and is_default = true limit 1;

  insert into public.transactions (
    id, type, amount, currency_code, transaction_date, status,
    invoice_status, invoice_date, invoice_cleared_at, category_id,
    from_person_id, to_person_id, reference_number, notes, created_by_id
  ) values
  (
    '1ce4a5c0-0000-4000-8000-000000000601', 'income', 25000.00, 'INR', '2026-03-05',
    'completed', 'cleared', '2026-02-10', '2026-03-05T12:00:00+05:30', v_income,
    '1ce4a5c0-0000-4000-8000-000000000011', null, 'STILLNESS-001',
    $str$Website redesign — 11-page WordPress/Elementor/WooCommerce rebuild (Feb–Mar 2026). Fixed ₹25,000, 60/40 Solicate/Sakshi; Sakshi's ₹10k share recorded as expense STILLNESS-SAKSHI-001.$str$,
    v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000602', 'income', 3500.00, 'INR', '2026-04-30',
    'completed', 'cleared', '2026-04-29', '2026-05-07T12:00:00+05:30', v_income,
    '1ce4a5c0-0000-4000-8000-000000000011', null, 'STILLNESS-002',
    $str$Men's Series landing page (Apr 2026). ₹3,400 net received after ₹100 fee deduction.$str$,
    v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000603', 'income', 3000.00, 'INR', '2026-06-15',
    'pending', 'sent', '2026-06-15', null, v_income,
    '1ce4a5c0-0000-4000-8000-000000000011', null, 'STILLNESS-003',
    $str$Custom checkout add-on (decision 15 Jun 2026). Payment status unconfirmed — mark completed when cleared.$str$,
    v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000604', 'income', 3000.00, 'INR', '2026-06-15',
    'pending', 'sent', '2026-06-15', null, v_income,
    '1ce4a5c0-0000-4000-8000-000000000011', null, 'STILLNESS-004',
    $str$Branded order email add-on (decision 15 Jun 2026). Payment status unconfirmed — mark completed when cleared.$str$,
    v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000605', 'income', 500.00, 'INR', '2026-06-15',
    'pending', 'sent', '2026-06-15', null, v_income,
    '1ce4a5c0-0000-4000-8000-000000000011', null, 'STILLNESS-005',
    $str$Events FAQ + shop regression fix (decision 15 Jun 2026). Payment status unconfirmed — mark completed when cleared.$str$,
    v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000606', 'income', 5000.00, 'INR', '2026-06-09',
    'pending', 'sent', '2026-06-09', null, v_income,
    '1ce4a5c0-0000-4000-8000-000000000011', null, 'STILLNESS-006',
    $str$Hawaii retreat landing page — locked 09 Jun 2026 at ₹5,000 (from ₹7,500). Built; awaiting Komal feedback.$str$,
    v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000607', 'income', 15000.00, 'INR', '2026-07-17',
    'pending', 'sent', '2026-07-17', null, v_income,
    '1ce4a5c0-0000-4000-8000-000000000011', null, 'STILLNESS-007',
    $str$Organic Growth Phase 1 — discovery audit + technical rebuild (245 CAD ≈ ₹15,000). Approved 17 Jul; audit delivered 29 Jul 2026 (55.6/100). Payment status unconfirmed — mark completed when cleared.$str$,
    v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000608', 'expense', 10000.00, 'INR', '2026-03-05',
    'completed', null, null, null, v_expense,
    null, '1ce4a5c0-0000-4000-8000-000000000012', 'STILLNESS-SAKSHI-001',
    $str$Sakshi 40% share of the ₹25k redesign — received & cleared. Referenced by relationship 1ce4a5c0-…-000801.$str$,
    v_user
  )
  on conflict (id) do nothing;

  insert into public.transaction_allocations (
    id, transaction_id, target, project_id, phase_id, amount, notes, created_by_id
  ) values
  (
    '1ce4a5c0-0000-4000-8000-000000000701',
    '1ce4a5c0-0000-4000-8000-000000000601', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000501',
    25000.00, 'Phase 1 — website redesign', v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000702',
    '1ce4a5c0-0000-4000-8000-000000000602', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000502',
    3500.00, 'Phase 2 — Men''s Series LP', v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000703',
    '1ce4a5c0-0000-4000-8000-000000000603', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000502',
    3000.00, 'Phase 2 — custom checkout add-on', v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000704',
    '1ce4a5c0-0000-4000-8000-000000000604', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000502',
    3000.00, 'Phase 2 — branded order email add-on', v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000705',
    '1ce4a5c0-0000-4000-8000-000000000605', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000502',
    500.00, 'Phase 2 — events FAQ + shop fix', v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000706',
    '1ce4a5c0-0000-4000-8000-000000000606', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000502',
    5000.00, 'Phase 2 — Hawaii Retreat LP', v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000707',
    '1ce4a5c0-0000-4000-8000-000000000607', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000503',
    15000.00, 'Phase 3 — organic growth foundation', v_user
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000000708',
    '1ce4a5c0-0000-4000-8000-000000000608', 'phase',
    '1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000501',
    10000.00, 'Phase 1 — Sakshi redesign share (expense)', v_user
  )
  on conflict (id) do nothing;
end;
$backfill$;

-- ─── 7. Participant row hygiene ─────────────────────────────────────────────
-- Sakshi's participant row keeps its role/linkage but the financial terms now
-- live in the relationship + ledger. Note the move for future readers.

update public.project_participants
set terms_note = $str$₹10k redesign share received & cleared — recorded in the finance ledger (STILLNESS-SAKSHI-001, transaction …608) and at the relationship level (…801). Per-phase splits decided by Solicate per work (Preksha ₹3k/₹1k); partnership record: partnerships/Sakshi/Sakshi.md; no GST/invoicing on file.$str$
where project_id = '1ce4a5c0-0000-4000-8000-000000000021'
  and person_id = '1ce4a5c0-0000-4000-8000-000000000012';

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT name, summary FROM people WHERE id = '1ce4a5c0-0000-4000-8000-000000000001';
-- SELECT name, status, objective, success_definition FROM projects WHERE id = '1ce4a5c0-0000-4000-8000-000000000021';
-- SELECT position, name, status FROM phases WHERE project_id = '1ce4a5c0-0000-4000-8000-000000000021' ORDER BY position;
-- SELECT t.reference_number, t.amount, t.status, ta.phase_id
--   FROM transactions t JOIN transaction_allocations ta ON ta.transaction_id = t.id
--   WHERE ta.project_id = '1ce4a5c0-0000-4000-8000-000000000021' ORDER BY t.transaction_date;
-- SELECT id, type, source, referral_commission FROM relationships WHERE client_id = '1ce4a5c0-0000-4000-8000-000000000001';
