-- 0064: CYCDesign — Mark questionnaire prepared & add email handoff task

BEGIN;

-- 1. Mark preparation task as done
UPDATE public.tasks
SET title = 'Prepare Discovery Questionnaire Google Doc',
    status = 'done',
    completed_at = COALESCE(completed_at, NOW()),
    position = 1
WHERE id = '2f9e3d70-0000-4000-8000-000000007021';

-- 2. Insert handoff task: waiting for Navi's email to share doc
INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000007020',
  '2f9e3d70-0000-4000-8000-000000000021',
  null,
  'Receive Navi''s email & share Questionnaire Google Doc with her',
  $str$Asked Navi for her email address on WhatsApp. Once received, add her to the Google Doc permissions and share the link.$str$,
  'in_progress',
  'high',
  2,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      description_md = EXCLUDED.description_md,
      status = EXCLUDED.status,
      priority = EXCLUDED.priority,
      position = EXCLUDED.position;

-- 3. Adjust positions of subsequent roadmap pipeline tasks
UPDATE public.tasks SET position = 3 WHERE id = '2f9e3d70-0000-4000-8000-000000007022';
UPDATE public.tasks SET position = 4 WHERE id = '2f9e3d70-0000-4000-8000-000000007023';
UPDATE public.tasks SET position = 5 WHERE id = '2f9e3d70-0000-4000-8000-000000007024';
UPDATE public.tasks SET position = 6 WHERE id = '2f9e3d70-0000-4000-8000-000000007025';
UPDATE public.tasks SET position = 7 WHERE id = '2f9e3d70-0000-4000-8000-000000007026';

-- 4. Record progress update entry
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  gen_random_uuid(),
  '2f9e3d70-0000-4000-8000-000000000021',
  'update',
  'Questionnaire Google Doc prepared — awaiting Navi''s email',
  $str$Discovery questionnaire Google Doc is prepared. Asked Navi for her email address via WhatsApp to share access directly with her.$str$,
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
);

COMMIT;
