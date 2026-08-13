-- 0060: Colleen Munn import — lead relationship, Month One project, 4 phases, tasks.
--
-- Colleen Munn is a Sun Life financial advisor (Bedford, NS) who entered via
-- Navi, owner of CYCFDesign (an existing Solicate client) — a referral, not a
-- partner lead. Engagement: 100x organic growth; month one = market-discovery +
-- positioning + authority experiment. Strategy drafted 2026-08-09
-- (clients/colleen-munn/strategy/). No scope or revenue confirmed yet — she is
-- modeled as a LEAD relationship, not a client, until she signs.
--
-- Model (per 0010 operating model): Relationship → Project → Phase → Work.
--   1. people:      Colleen Munn (kind 'individual' — her practice is her
--                   personal advisor practice, no separate entity).
--   2. relationship: type 'lead', source 'existing_client', person_id = Navi
--                   (referrer). Guarded so it is never duplicated.
--   3. project:     single Month One project with strategy fields + summary.
--   4. phases:      4 week-long phases mirroring the roadmap (Week 1–4).
--   5. execution:   initial Week 1–4 tasks scoped to their phase.
--
-- Idempotent: inserts use ON CONFLICT DO NOTHING on deterministic ids. Prefix:
-- c011eec0 (from "Colleen").

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

do $guard$
begin
  if not exists (select 1 from public.app_users where is_active = true) then
    raise exception 'No active app_user exists. Sign in once so the auth trigger creates your app_users row, then re-run.';
  end if;
  if not exists (select 1 from public.people where name = 'Navi') then
    raise exception 'Referrer Navi not found — run migration 0006 first.';
  end if;
end $guard$;

-- ─── 1. Client record (people) ──────────────────────────────────────────────

insert into public.people (
  id, name, email, phone, kind, website_url, is_partner, summary, created_by_id
) values (
  'c011eec0-0000-4000-8000-000000000001',
  'Colleen Munn',
  'colleen.munn@sunlife.com',
  '902-266-4562',
  'individual',
  'https://advisor.sunlife.ca/colleen.munn',
  false,
  $str$Sun Life financial advisor since April 2023. Office: 90 Western Parkway, Suite 610, Bedford, NS. Lives in Wellington (HRM, Hwy 2 corridor); member of the Centre for Women in Business (MSVU) and FRABA (Fall River & Area Business Association). Practice serves NS, PEI, NB + Ontario. Products: life insurance, critical illness, personal health, investments (TFSA/RRSP), employee/group benefits, travel insurance, mortgage protection, financial/estate planning. Entered via Navi (CYCFDesign) referral. Engagement: 100x organic growth — month one = market discovery + positioning + authority experiment. No scope or revenue confirmed yet.$str$,
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

-- ─── 2. Relationship (Level 1) ──────────────────────────────────────────────
-- Lead until she signs; referral source = Navi (existing CYCFDesign client).
-- Resolved by name so a duplicate for the same client is never created.

insert into public.relationships (
  id, client_id, person_id, type, source, status, summary,
  communication_mode, financial_arrangement, payment_status, terms_note, created_by_id
)
select
  'c011eec0-0000-4000-8000-000000000801',
  'c011eec0-0000-4000-8000-000000000001',
  navi.id,
  'lead', 'existing_client', 'active',
  $str$Colleen Munn entered via Navi, owner of CYCFDesign (existing Solicate client referral). Engagement: 100x organic growth; month one = market discovery + positioning + authority experiment (strategy drafted 9 Aug 2026). Advisor, Sun Life, Bedford NS. No scope or revenue confirmed yet.$str$,
  'solicate_leads', 'none', 'not_applicable',
  $str$Referred by Navi (CYCFDesign). No commission or split agreed. Flip to type 'client' and record revenue once scope is confirmed.$str$,
  (select id from public.app_users where is_active = true order by created_at limit 1)
from public.people navi
where navi.name = 'Navi'
  and not exists (
    select 1 from public.relationships
    where client_id = 'c011eec0-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

-- ─── 3. Project ─────────────────────────────────────────────────────────────
-- Single Month One experiment with strategy fields per the 0010 model.

insert into public.projects (
  id, owner_id, person_id, name, code, status, summary, started_on, target_date,
  objective, success_definition, direction, created_by_id
) values (
  'c011eec0-0000-4000-8000-000000000021',
  (select id from public.app_users where is_active = true order by created_at limit 1),
  'c011eec0-0000-4000-8000-000000000001',
  'Colleen Munn — 100x Organic Growth (Month One)',
  'COLLEEN-M1',
  'active',
  $str$Sun Life advisor (Bedford NS; serves NS, PEI, NB, Ontario). 30-day market-discovery + positioning + authority experiment: 10–15 market interviews, client-book audit (patterns only), Colleen thesis, content engine, CHECK-IN lead mechanism, day-30 scale/pivot decision. Referral via Navi (CYCFDesign). Working niche hypothesis (to validate, not assume): women business owners in Atlantic Canada whose business outran their personal finances. CWB + FRABA memberships are distribution assets. Compliance = Sun Life advisor rules (no guarantees, education not advice, review workflow before publish).$str$,
  '2026-08-09',
  '2026-09-08',
  $str$Build Colleen into the financial voice a specific group of Atlantic Canadians thinks of first when a specific financial problem shows up, starting locally in HRM and compounding through trust, conversations, referrals, and reputation.$str$,
  $str$Month-one gates: ≥10 market interviews; thesis confirmed by "that's literally me" responses in conversation; first qualified CHECK-IN conversations booked; clear day-30 verdict on niche, thesis, pillars, formats, channels, and lead mechanism — then scale or pivot.$str$,
  $str$Week 1 discovery (interviews, client-book audit, origin story, light profile cleanup) → Week 2 positioning (thesis + pillars + first content batch + profile rewrites) → Week 3 distribution (full cadence, CHECK-IN launch, 20+ outbound conversations) → Week 4 flywheel (referral habit, double down, day-30 decision pack).$str$,
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

-- ─── 4. Phases (Week 1–4, mirroring the roadmap) ────────────────────────────

insert into public.phases (
  id, project_id, name, description, position, status, started_on, target_date,
  scope_deliverables, scope_requirements, scope_acceptance, created_by_id
)
select
  x.id::uuid, 'c011eec0-0000-4000-8000-000000000021', x.name, x.description, x.position,
  x.status::public.phase_status, x.started_on::date, x.target_date::date,
  x.scope_deliverables, x.scope_requirements, x.scope_acceptance,
  (select id from public.app_users where is_active = true order by created_at limit 1)
from (values
  (
    'c011eec0-0000-4000-8000-000000000101',
    'Week 1 — Discovery & Market', 'active', '2026-08-09', '2026-08-16', 1,
    $str$Learn before speaking. 10–15 market interviews with the target segments; client-book audit for patterns only; origin-story recording with Colleen; light profile fixes (IG bio English + disclaimers). Listening-only content (polls, question boxes, origin-story video).$str$,
    $str$Interview protocol (strategy doc Annex A) · interview log with verbatim language · client-book pattern audit (no confidential data leaves the room) · origin-story recording · IG bio fix + pinned posts.$str$,
    $str$Colleen provides interviewee list + book access + 60–90 min for the origin-story recording. Approval of interview outreach language.$str$,
    $str$Pass: ≥10 interviews done; ≥1 segment produces repeated emotional language; client book clusters on a segment.$str$
  ),
  (
    'c011eec0-0000-4000-8000-000000000102',
    'Week 2 — Positioning', 'planned', '2026-08-17', '2026-08-23', 2,
    $str$Turn interview insights into the Colleen thesis. Pick the message by the "that's literally me" test. Produce the first real content batch from the origin story + interviews. Re-write profiles around the thesis. Attend 1–2 local events with a listening posture.$str$,
    $str$Thesis statement · content pillars (validate) · 2–3 main videos + 6–9 clips + 2 LinkedIn posts + 1 carousel + stories 4–5×/week · IG/LinkedIn/Facebook profile rewrites · 10+ thesis test conversations.$str$,
    $str$Colleen records the story/conversation material, approves the thesis wording and every asset before publish, and attends 1–2 local events.$str$,
    $str$Pass: ≥2 main videos posted; thesis confirmed in conversations ("that's me" ≥5×); first DMs/asks arrive.$str$
  ),
  (
    'c011eec0-0000-4000-8000-000000000103',
    'Week 3 — Distribution', 'planned', '2026-08-24', '2026-08-30', 3,
    $str$Content engine at full cadence. IG = personality/relationships, LinkedIn = professional authority, Facebook = local/community. Launch the Business Owner Financial Check-In lead mechanism. 20+ genuine outbound conversations; 2+ referral conversations; 1–2 local events.$str$,
    $str$CHECK-IN launch + CTA · 3–4 main videos + 8–10 clips + 3–4 LinkedIn posts + 1–2 carousels + stories 5–7×/week · 20+ outbound conversations · 2+ referral conversations.$str$,
    $str$Colleen books and runs the CHECK-IN conversations she can take; approves outreach drafts; posts/shares on cadence.$str$,
    $str$Pass: first qualified CHECK-IN conversations booked; DMs not just likes; clear platform signal.$str$
  ),
  (
    'c011eec0-0000-4000-8000-000000000104',
    'Week 4 — Flywheel & Day-30 Decision', 'planned', '2026-08-31', '2026-09-08', 4,
    $str$Compound and decide. Systematize the referral ask. Double down on the highest-signal content. Produce local-authority content. Run the day-30 decision pack: niche, thesis, pillars, formats, channels, lead mechanism, scale or pivot.$str$,
    $str$Referral-ask system · day-30 decision pack (7 gates) · local-authority content (CWB/FRABA) · month-one activity report.$str$,
    $str$Colleen runs the weekly review with Solicate; gives honest capacity numbers for month two.$str$,
    $str$Pass: clear day-30 verdict; month-two engine built on what compounded.$str$
  )
) as x(id, name, status, started_on, target_date, position,
      description, scope_deliverables, scope_requirements, scope_acceptance)
on conflict (id) do nothing;

-- ─── 5. Initial tasks (scoped to phase) ─────────────────────────────────────

insert into public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, due_at, created_by_id
) values
(
  'c011eec0-0000-4000-8000-000000000201',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000101',
  'Complete 10–15 market interviews',
  $str$Women business owners, incorporated professionals, business-owning mothers, established owners 45–60, existing clients who fit. Use strategy doc Annex A. Log every conversation with the exact words they use.$str$,
  'todo', 'high', '2026-08-16T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
),
(
  'c011eec0-0000-4000-8000-000000000202',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000101',
  'Audit existing client book (patterns only)',
  $str$Aggregates only: age bands, professions, business ownership, family stage, how clients first came to Colleen, referral patterns. No names or amounts; nothing confidential leaves the room.$str$,
  'todo', 'high', '2026-08-16T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
),
(
  'c011eec0-0000-4000-8000-000000000203',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000101',
  'Record the origin-story conversation with Colleen',
  $str$Career before Sun Life, why she moved to Wellington, why she does this, a story that made her cry/angry/proud. Raw material for Pillar 3.$str$,
  'todo', 'high', '2026-08-16T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
),
(
  'c011eec0-0000-4000-8000-000000000204',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000101',
  'Light profile cleanup (IG bio + disclaimers)',
  $str$Fix the Instagram bio (English), add consistent disclaimers, pin 3 best existing posts. Full repositioning waits for Week 2.$str$,
  'todo', 'normal', '2026-08-16T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
),
(
  'c011eec0-0000-4000-8000-000000000205',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000102',
  'Draft and validate the Colleen thesis',
  $str$Pick from the candidate theses by the "that's literally me" test; test in 10+ new conversations; refine wording. Write it in interviewees' language, not ours.$str$,
  'todo', 'high', '2026-08-23T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
),
(
  'c011eec0-0000-4000-8000-000000000206',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000102',
  'First content batch + profile rewrites',
  $str$2–3 main videos, 6–9 clips, 2 LinkedIn posts, 1 carousel, stories 4–5×/week. Re-write IG/LinkedIn/Facebook profiles around the thesis. Every asset through the compliance review checklist + Colleen approval.$str$,
  'todo', 'high', '2026-08-23T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
),
(
  'c011eec0-0000-4000-8000-000000000207',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000103',
  'Launch the Business Owner Financial Check-In',
  $str$30-min diagnostic conversation (personal wealth, protection, business dependency, retirement, family, succession, gaps). CTA: "send me CHECK-IN." Refine wording from Week 2 interviews.$str$,
  'todo', 'high', '2026-08-30T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
),
(
  'c011eec0-0000-4000-8000-000000000208',
  'c011eec0-0000-4000-8000-000000000021',
  'c011eec0-0000-4000-8000-000000000104',
  'Run the day-30 decision pack',
  $str$7 gates: niche, thesis, pillars, formats, channels, lead mechanism, scale-or-pivot. Build the month-two engine on what compounded.$str$,
  'todo', 'high', '2026-09-08T23:59:59+05:30'::timestamptz,
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

-- ─── 6. Entry record ────────────────────────────────────────────────────────

insert into public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) values (
  'c011eec0-0000-4000-8000-000000000401',
  'c011eec0-0000-4000-8000-000000000021',
  'decision', 'Colleen Munn modeled as lead relationship + Month One project',
  $str$Entered via Navi (CYCFDesign, existing client referral). Sun Life advisor, Bedford NS. Strategy drafted 9 Aug 2026 (clients/colleen-munn/strategy/): 30-day market-discovery + positioning + authority experiment. Modeled as relationship type 'lead' (source existing_client, referrer Navi) with one project (COLLEEN-M1) and 4 week-long phases. No scope or revenue confirmed yet — flip to client + record revenue when she signs.$str$,
  '2026-08-09T00:00:00Z'::timestamptz, 'filed',
  $str$Lead until scope/revenue confirmed; project holds the Month One experiment; phases mirror the 4-week roadmap.$str$,
  'active', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT id, name, kind, summary FROM people WHERE id = 'c011eec0-0000-4000-8000-000000000001';
-- SELECT r.id, r.type, r.source, r.status, p.name AS referrer
--   FROM relationships r JOIN people p ON p.id = r.person_id
--   WHERE r.client_id = 'c011eec0-0000-4000-8000-000000000001';
-- SELECT name, code, status, objective FROM projects WHERE id = 'c011eec0-0000-4000-8000-000000000021';
-- SELECT position, name, status FROM phases WHERE project_id = 'c011eec0-0000-4000-8000-000000000021' ORDER BY position;
-- SELECT title, status, priority FROM tasks WHERE project_id = 'c011eec0-0000-4000-8000-000000000021' ORDER BY due_at;
