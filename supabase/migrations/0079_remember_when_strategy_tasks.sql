-- 0079: Remember When HealthCare — Strategy Document Preparation Tasks
--
-- Adds actionable tasks under project RWHC-M1 (e0a1b000-0000-4000-8000-000000000021)
-- to track the drafting, positioning synthesis, and finalization of the
-- 30-Day Market Discovery & Growth Strategy document.

BEGIN;

-- ─── 1. Insert Strategy Preparation Tasks ───────────────────────────────────

INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) VALUES
(
  'e0a1b000-0000-4000-8000-000000000201',
  'e0a1b000-0000-4000-8000-000000000021',
  null,
  'Prepare Remember When HealthCare 30-Day Growth & Positioning Strategy Document',
  $str$Draft the comprehensive Month One strategy document (clients/remember-when-healthcare/strategy/remember-when-100x-growth-strategy.md) covering market discovery, nurse-led authority positioning thesis, 4-week roadmap, content distribution engine, and Family Caregiver Check-In diagnostic mechanism.$str$,
  'in_progress',
  'high',
  1,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  'e0a1b000-0000-4000-8000-000000000202',
  'e0a1b000-0000-4000-8000-000000000021',
  null,
  'Synthesize Ashley & Jeff origin story + clinical service differentiation into strategy thesis',
  $str$Extract key positioning hooks from RWHC background: nurse-led oversight vs non-clinical agencies, personalized care vs institutional waitlists, specialized dementia/Alzheimer care, mobile diabetic foot care, and rural/HRM coverage.$str$,
  'todo',
  'normal',
  2,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  'e0a1b000-0000-4000-8000-000000000203',
  'e0a1b000-0000-4000-8000-000000000021',
  null,
  'Define Family Caregiver Check-In intake diagnostic & outreach scripts',
  $str$Structure the low-friction 20-30 min caregiver diagnostic consultation protocol and outreach templates for adult children (daughters/sons aged 40-60) and local medical clinics/physicians.$str$,
  'todo',
  'normal',
  3,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  'e0a1b000-0000-4000-8000-000000000204',
  'e0a1b000-0000-4000-8000-000000000021',
  null,
  'Review & finalize strategy doc for presentation / pitch to Ashley Boucher',
  $str$Complete final quality review, executive summary, and next-step proposal ready for presentation/outreach to Ashley Boucher.$str$,
  'todo',
  'high',
  4,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  position = EXCLUDED.position;

-- ─── 2. Log Progress Update Entry ───────────────────────────────────────────

INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  'e0a1b000-0000-4000-8000-000000000402',
  'e0a1b000-0000-4000-8000-000000000021',
  'update',
  'Strategy preparation tasks initialized',
  $str$Initialized 4 roadmap preparation tasks for drafting, synthesizing positioning thesis, formulating the Caregiver Check-In mechanism, and finalizing the pitch document for Ashley Boucher.$str$,
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

COMMIT;
