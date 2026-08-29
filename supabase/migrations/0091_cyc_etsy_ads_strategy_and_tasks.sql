-- 0091: Log CYC Etsy Ads 14-day validation test and automated retargeting tasks in Solicate OS

BEGIN;

-- 1. Create Etsy Ads 14-Day Validation Test Task
INSERT INTO public.tasks (
  id, project_id, phase_id, assignee_id, created_by_id, title, description_md, status, priority, due_at
) VALUES (
  '2f9e3d70-0000-4000-8000-000000007043',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002', -- Phase 3: Accessories & Bags
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Launch 14-day Etsy Ads test for 2 benchmark clutch listings ($5 CAD/day)',
  $str$Execute a controlled 14-day Etsy Ads test on the top 2 benchmark clutch listings.
Parameters:
- Budget: $5.00 CAD / day ($70 CAD total over 14 days).
- Target: 200–250 targeted clicks at $0.25–$0.35 CPC, expected 1–3 sales + 25–40 favorites.
- Weekly Maintenance: Prune irrelevant search terms from Etsy Ads dashboard on Day 7 and Day 14.
- Retargeting: Configure automatic 10% Etsy coupon for shoppers who favorite or leave in cart.$str$,
  'todo',
  'high',
  '2026-09-05'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  due_at = EXCLUDED.due_at;

-- 2. Subtasks for the Etsy Ads Sprint
INSERT INTO public.task_subtasks (id, task_id, title, done, position, created_by_id) VALUES
('2f9e3d70-0000-4000-8000-000000008311', '2f9e3d70-0000-4000-8000-000000007043', 'Setup automated 10% "Thank you for Favoriting" coupon in Etsy Sales & Discounts', false, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('2f9e3d70-0000-4000-8000-000000008312', '2f9e3d70-0000-4000-8000-000000007043', 'Enable Etsy Ads on only the 2 benchmark clutch listings at $5 CAD/day', false, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('2f9e3d70-0000-4000-8000-000000008313', '2f9e3d70-0000-4000-8000-000000007043', 'Execute Day-7 Search Terms audit & turn off irrelevant search phrases', false, 3, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('2f9e3d70-0000-4000-8000-000000008314', '2f9e3d70-0000-4000-8000-000000007043', 'Review Day-14 ROAS, favorites conversion, and scale/pause decision', false, 4, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  done = EXCLUDED.done,
  position = EXCLUDED.position;

-- 3. Decision Entry for the 14-Day Etsy Ads Strategy
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000403',
  '2f9e3d70-0000-4000-8000-000000000021',
  'decision',
  'CYC Etsy Ads Strategy — 14-Day $5 CAD/day Validation Sprint',
  $str$Agreed on the advertising and conversion architecture for CYCDesign accessories listings on Etsy:
1. Ad Budget & Duration: $5 CAD/day across 2 benchmark clutch listings for 14 days ($70 CAD total).
2. Expected Funnel Metrics: 200–250 clicks (~$0.25–$0.35 CPC), 1–3 direct orders, 25–40 favorites.
3. Automated Coupon Retargeting: 10% discount auto-delivered to shoppers who favorite the listings.
4. Review Seeding Policy: Never review from seller account/IP. Use genuine purchases via personal network / retreat attendees on separate devices and networks to seed the initial 3–5 five-star photo reviews.$str$,
  NOW(),
  'filed',
  'Etsy Ads 14-day test approved with $70 CAD budget and automated retargeting.',
  'active',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  decision_outcome = EXCLUDED.decision_outcome,
  decision_state = EXCLUDED.decision_state;

COMMIT;
