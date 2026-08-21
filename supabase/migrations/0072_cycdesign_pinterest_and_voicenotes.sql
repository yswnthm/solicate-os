-- 0072: CYCDesign - Log Pinterest workflow delegation and Questionnaire response ingestion

BEGIN;

-- 1. Mark Questionnaire shared task as done
UPDATE public.tasks
SET status = 'done',
    completed_at = COALESCE(completed_at, NOW())
WHERE id = '2f9e3d70-0000-4000-8000-000000007020';

-- 2. Mark Response Ingestion task as in_progress
UPDATE public.tasks
SET status = 'in_progress'
WHERE id = '2f9e3d70-0000-4000-8000-000000007023';

-- 3. Insert Pinterest Tasks for Metta
INSERT INTO public.tasks (
  id, project_id, title, description_md, status, priority, position, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000007033',
  '2f9e3d70-0000-4000-8000-000000000021',
  'Setup Pinterest board architecture, aesthetic guidelines & daily/weekly posting workflow',
  'Navi prioritized Pinterest board maintenance and posting first. Metta to organize boards (plus-size maxi dresses, styling inspiration, occasion wear), establish posting cadence, and link product listings.',
  'in_progress',
  'high',
  2,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007034',
  '2f9e3d70-0000-4000-8000-000000000021',
  'Pinterest creator & influencer outreach (Stage 2)',
  'Second stage of Pinterest strategy: map relevant plus-size fashion creators and board curators for collaboration once base posting rhythm is active.',
  'todo',
  'normal',
  4,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  position = EXCLUDED.position;

-- 4. Log Update Entry for Voice Note Ingestion & Pinterest
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006033',
  '2f9e3d70-0000-4000-8000-000000000021',
  'update',
  'Navi Voice Note Discovery & Pinterest Channel Prioritization',
  '**Status Update - 21 Aug 2026:**\n\n1. **Discovery Questionnaire:** Questions shared with Navi. Navi is actively responding with voice notes in the "Thoughts CYC" WhatsApp group.\n2. **Pinterest Workstream:** Navi requested assigning Metta to Pinterest. Explicit direction: **"Maintaining Pinterest and post maybe first"** (set up boards, aesthetics, and consistent pin schedule before creator outreach).\n3. **Active Pipeline:** Ingesting voice notes to formulate the 90-Day Growth Roadmap.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

COMMIT;
