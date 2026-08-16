-- 0063: CYCDesign — Growth Roadmap & Questionnaire Discovery Pipeline Setup

BEGIN;

-- 1. Create document entry placeholder for the Questionnaire Google Doc
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006030',
  '2f9e3d70-0000-4000-8000-000000000021',
  'document',
  'CYCDesign — 90-Day Growth Discovery Questionnaire (Google Doc)',
  $str$Placeholder for the 90-Day Growth Discovery Questionnaire Google Doc sent to Navi. Document URL and responses summary will be logged here once prepared.$str$,
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      body_md = EXCLUDED.body_md;

-- 2. Consolidate legacy placeholder roadmap task
UPDATE public.tasks
SET status = 'done',
    completed_at = COALESCE(completed_at, NOW())
WHERE id = '38898d2d-6c53-4601-9afc-ae9204790c1a';

-- 3. Insert structured sequential tasks for the 90-Day Growth Roadmap pipeline
INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) VALUES
(
  '2f9e3d70-0000-4000-8000-000000007021',
  '2f9e3d70-0000-4000-8000-000000000021',
  null,
  'Prepare & send Discovery Questionnaire Google Doc to Navi',
  $str$Draft strategic questionnaire Google Doc covering hero products, physical retail/boutique targets, inventory bottlenecks, photography assets, and revenue goals. Send directly to Navi.$str$,
  'in_progress',
  'high',
  1,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007022',
  '2f9e3d70-0000-4000-8000-000000000021',
  null,
  'Log Questionnaire Google Doc URL & document entry in Solicate OS',
  $str$Update entry 2f9e3d70-0000-4000-8000-000000006030 with the live Google Doc link and submission timestamp.$str$,
  'todo',
  'normal',
  2,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007023',
  '2f9e3d70-0000-4000-8000-000000000021',
  null,
  'Ingest Navi''s responses and synthesize business targets & constraints',
  $str$Extract confirmed SKU volumes, target retail split, COGS/accounting scope, and marketing reinvestment budget from completed questionnaire.$str$,
  'todo',
  'high',
  3,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007024',
  '2f9e3d70-0000-4000-8000-000000000021',
  null,
  'Draft 90-Day Overview Growth Roadmap (Visual assets, compositions, channel plans)',
  $str$Synthesize multi-channel plan: sales-generation campaigns, influencer outreach, boutique distribution, image compositions, and new operational phase definitions.$str$,
  'todo',
  'high',
  4,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007025',
  '2f9e3d70-0000-4000-8000-000000000021',
  null,
  'Restructure / replace Phase 3 & 4 with roadmap sprint phases in database',
  $str$Archive older planned phases in notes and insert agreed 90-day sprint phases with clear gates and milestones in public.phases.$str$,
  'todo',
  'normal',
  5,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007026',
  '2f9e3d70-0000-4000-8000-000000000021',
  null,
  'Present Growth Roadmap to Navi & issue phase pricing proposals',
  $str$Walk Navi through the 90-day overview roadmap; issue formal per-phase pricing proposals once she signs off on the strategy.$str$,
  'todo',
  'normal',
  6,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
)
ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      description_md = EXCLUDED.description_md,
      status = EXCLUDED.status,
      priority = EXCLUDED.priority,
      position = EXCLUDED.position;

COMMIT;
