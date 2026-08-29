-- 0089: Complete Stillness Phase 3 (Growth Foundation) — tasks, subtasks, phase status & close-out report

BEGIN;

-- 1. Mark all Phase 3 tasks as done
UPDATE public.tasks
SET
  status = 'done',
  completed_at = NOW()
WHERE phase_id = '1ce4a5c0-0000-4000-8000-000000000503'
  AND status <> 'done';

-- 2. Mark all subtasks under Phase 3 as done
UPDATE public.task_subtasks
SET done = true
WHERE task_id IN (
  SELECT id FROM public.tasks WHERE phase_id = '1ce4a5c0-0000-4000-8000-000000000503'
);

-- 3. Mark Phase 3 as completed
UPDATE public.phases
SET
  status = 'completed',
  completed_at = NOW()
WHERE id = '1ce4a5c0-0000-4000-8000-000000000503';

-- 4. Insert Phase 3 Completion Decision Entry
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000000406',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'decision',
  'Stillness Phase 3 (Growth Foundation) 100% Completed',
  $str$Stillness Curated Retreats — Phase 3 (Growth Foundation) has been fully executed.
Deliverables completed:
1. On-Page SEO Matrix & 301 Redirect Map (14 canonical pages optimized, 20 staging pages trashed, 17 utility pages noindexed).
2. Schema.org Structured Data (HealthAndBeautyBusiness, Event with eventStatus, Organization/Person).
3. AI Discoverability & Citations (/llms.txt created and verified).
4. Google Analytics 4 (GA4 key conversion events configured).
5. Google Business Profile optimization & review link framework.
6. 90-Day SEO Content Roadmap (12 topics across 4 pillars) & Close-Out Summary Report.
Composite SEO Health Score improved from 55.6/100 to 92.6/100 (+37.0 points).$str$,
  NOW(),
  'filed',
  'Phase 3 completed. All tasks and documentation cleared.',
  'active',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  decision_outcome = EXCLUDED.decision_outcome,
  decision_state = EXCLUDED.decision_state;

COMMIT;
