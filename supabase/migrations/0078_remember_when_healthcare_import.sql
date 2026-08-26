-- 0078: Remember When HealthCare import — lead relationship, Month One project, decision entry.
--
-- Remember When HealthCare Ltd. is a nurse-led private home healthcare company
-- founded in August 2021 by Ashley Boucher (RN / CEO) & Jeff Boucher in Bedford, NS.
-- Engagement: 100x organic growth; month one = market discovery + positioning + authority experiment.
-- Modeled following the Colleen Munn minimal record pattern (0060/0061):
--   1. people:       Ashley Boucher / Remember When HealthCare (kind 'individual')
--   2. relationship: type 'lead', status 'active'
--   3. project:      single Month One strategy project (RWHC-M1)
--   4. entry:        decision entry documenting model and strategy scope

BEGIN;

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE is_active = true) THEN
    RAISE EXCEPTION 'No active app_user exists. Sign in once so the auth trigger creates your app_users row, then re-run.';
  END IF;
END $guard$;

-- ─── 1. Client record (people) ──────────────────────────────────────────────

INSERT INTO public.people (
  id, name, email, phone, kind, website_url, is_partner, summary, created_by_id
) VALUES (
  'e0a1b000-0000-4000-8000-000000000001',
  'Ashley Boucher',
  'community@rwhc.ca',
  '902-497-0722',
  'individual',
  'https://www.rwhc.ca',
  false,
  $str$Founder & CEO of Remember When HealthCare Ltd. (founded August 2021 with Jeff Boucher). Registered Nurse-led private home healthcare organization based in Bedford, NS (38 Ella Lane, Suite 205). Serves Nova Scotia (Halifax/HRM, South Shore, Colchester, Pictou, Antigonish) and Prince Edward Island. Core services: in-home private nursing, advanced & diabetic nursing foot care, personal care/ADL support, specialized dementia & Alzheimer's care, respite care, companionship, and 24/7 care. Engagement: 100x organic growth — month one = market discovery + positioning + authority experiment. No scope or revenue confirmed yet.$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  website_url = EXCLUDED.website_url,
  summary = EXCLUDED.summary;

-- ─── 2. Relationship (Level 1) ──────────────────────────────────────────────

INSERT INTO public.relationships (
  id, client_id, person_id, type, source, status, summary,
  communication_mode, financial_arrangement, payment_status, terms_note, created_by_id
) VALUES (
  'e0a1b000-0000-4000-8000-000000000801',
  'e0a1b000-0000-4000-8000-000000000001',
  null,
  'lead', 'direct_outreach', 'active',
  $str$Remember When HealthCare (Ashley & Jeff Boucher, Bedford NS). Nurse-led private home care & mobile clinical foot care. Engagement: 100x organic growth; month one = market discovery + positioning + authority experiment. No scope or revenue confirmed yet.$str$,
  'solicate_leads', 'none', 'not_applicable',
  $str$Lead relationship. Growth strategy in preparation. Flip to type 'client' and record revenue once scope is confirmed.$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  source = EXCLUDED.source,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  terms_note = EXCLUDED.terms_note;

-- ─── 3. Project ─────────────────────────────────────────────────────────────

INSERT INTO public.projects (
  id, owner_id, person_id, name, code, status, summary, started_on, target_date,
  objective, success_definition, direction, created_by_id
) VALUES (
  'e0a1b000-0000-4000-8000-000000000021',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'e0a1b000-0000-4000-8000-000000000001',
  'Remember When HealthCare — 100x Organic Growth (Month One)',
  'RWHC-M1',
  'active',
  $str$Nurse-led private home care (Bedford NS; serves HRM, South Shore, Colchester, Pictou, Antigonish, PEI). 30-day market-discovery + positioning + authority experiment: 10–15 family caregiver & referral interviews, clinical care pattern audit, Ashley origin story recording, educational authority content engine, Family Caregiver Check-In lead mechanism, day-30 scale/pivot decision. Core thesis: Nurse-led clinical dignity + compassionate aging in place for families navigating eldercare.$str$,
  '2026-08-26',
  '2026-09-25',
  $str$Establish Remember When HealthCare as the most trusted nurse-led home healthcare authority in Atlantic Canada, starting locally in Bedford/HRM and compounding through trust, caregiver education, family referrals, and clinical reputation.$str$,
  $str$Month-one gates: ≥10 family/caregiver & referral interviews; thesis validated with target decision-makers ("that's what we need for mom/dad"); first qualified Family Caregiver Check-In conversations booked; clear day-30 verdict on service focus, thesis, channels, and intake mechanism.$str$,
  $str$Week 1 discovery (interviews, clinical care pattern audit, Ashley origin story recording, profile cleanup) → Week 2 positioning (nurse-led authority thesis + content pillars + first educational batch) → Week 3 distribution (Family Caregiver Check-In launch, local community/clinical outreach) → Week 4 flywheel (referral loop, review, day-30 decision pack).$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  objective = EXCLUDED.objective,
  success_definition = EXCLUDED.success_definition,
  direction = EXCLUDED.direction;

-- ─── 4. Decision Entry ──────────────────────────────────────────────────────

INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) VALUES (
  'e0a1b000-0000-4000-8000-000000000401',
  'e0a1b000-0000-4000-8000-000000000021',
  'decision',
  'Remember When HealthCare modeled as lead relationship + Month One project',
  $str$Remember When HealthCare (Ashley & Jeff Boucher, Bedford NS). Modeled as relationship type 'lead' (source referral) with one project (RWHC-M1) for the growth strategy and market discovery scope. Minimal record: no execution phases or tasks in DB until scope and revenue are confirmed — strategy document lives in client folder.$str$,
  NOW(),
  'filed',
  $str$Minimal record: person + lead relationship + strategy project. No phases/tasks until scope/revenue confirmed.$str$,
  'active',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  decision_outcome = EXCLUDED.decision_outcome,
  decision_state = EXCLUDED.decision_state;

COMMIT;
