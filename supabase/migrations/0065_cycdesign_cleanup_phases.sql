-- 0065: CYCDesign — Clean up unconfirmed placeholder phases and complete Phase 2

BEGIN;

-- 1. Unlink open strategy/accounting tasks from Phase 2 so Phase 2 reflects 100% completed trial upload scope
UPDATE public.tasks
SET phase_id = NULL
WHERE id IN (
  '2f9e3d70-0000-4000-8000-000000007007', -- Build spreadsheet variants
  '2f9e3d70-0000-4000-8000-000000007008', -- Clarify accounting scope
  '2f9e3d70-0000-4000-8000-000000007009', -- Formalize product-channel mapping
  '2f9e3d70-0000-4000-8000-000000007010', -- Collect end-of-year product count
  '2f9e3d70-0000-4000-8000-000000007011'  -- Full-blown ecomm quote task
);

-- 2. Delete unconfirmed placeholder planned phases (3 & 4)
DELETE FROM public.phases
WHERE id IN (
  '2f9e3d70-0000-4000-8000-000000001002', -- Phase 3 — Zoho/Stripe integration
  '9748ea91-73fb-491d-8372-4eeccb91aaac', -- Phase 3 — Improving Existing Images
  '2f9e3d70-0000-4000-8000-000000001003'  -- Phase 4 — US growth retainer
);

-- 3. Log decision entry recording the cleanup until new roadmap phases are defined
INSERT INTO public.entries (
  id, project_id, type, title, body_md, decision_outcome, decision_state, occurred_at, triage_state, created_by_id
) VALUES (
  gen_random_uuid(),
  '2f9e3d70-0000-4000-8000-000000000021',
  'decision',
  'Phases streamlined: Phase 1 & 2 completed, upcoming phases to be set via Growth Roadmap',
  $str$Cleaned up unconfirmed planned phases 3 and 4. The historical Zoho/Stripe (₹20k+) and image improvement specs remain preserved in project notes. New execution phases will be introduced when the 90-day growth roadmap is approved.$str$,
  $str$Only completed phases (Phase 1 Etsy & Phase 2 WordPress) active in DB. Upcoming phases defined after roadmap approval.$str$,
  'active',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
);

COMMIT;
