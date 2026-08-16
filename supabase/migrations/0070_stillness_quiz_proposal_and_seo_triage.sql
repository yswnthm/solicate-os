-- 0070: Stillness — Log Interactive Diagnostic Quiz Proposal & Update Phase 3 SEO Tasks

BEGIN;

-- 1. Log Interactive Diagnostic Quiz Proposal Document Entry
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000002040',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'document',
  'Proposal: Interactive Diagnostic Quiz Integration (₹11k–₹14k)',
  '**Interactive 15-Question Diagnostic Quiz Integration Proposal**\n\n* **Delivered to Komal:** 13 Aug 2026 as PDF\n* **Build Approach:** Custom native WordPress development (replaces third-party SaaS embed to maintain exact Stillness styling, typography, and animation standards).\n* **Core Architecture:**\n  1. Dedicated landing page ("Take the 2-Minute Diagnostic")\n  2. 15 single-choice questions with smooth progression & live scoring\n  3. Lead capture gate (First Name + Email)\n  4. 4 Dynamic result screens (Types A, B, C, D) with tie-breaker logic on Q15\n\n* **Pricing Options:**\n  - **Option A (Core):** ₹11,000 (Leads saved inside website database)\n  - **Option B (Connected):** ₹14,000 (Leads automatically synced & tagged in email marketing tool)\n  - **Optional Add-Ons (9 available):** Blended results, practitioner note, result-matched email sequences, SEO landing page, etc.\n\n* **Source Document:** `clients/stillness-co/work/proposals/interactive-diagnostic-quiz.html`\n* **Status:** Awaiting client decision / kickoff.',
  '2026-08-13 08:33:00+00',
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

-- 2. Add Quiz Decision Tracking Task
INSERT INTO public.tasks (
  id, project_id, title, description_md, status, priority, position, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000003040',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'Awaiting Komal decision on Interactive Diagnostic Quiz proposal (Option A: ₹11k / Option B: ₹14k)',
  'Delivered proposal PDF on 13 Aug 2026. Awaiting Komal selection of Option A (Core ₹11k) vs Option B (Connected ₹14k) and kickoff confirmation.',
  'todo',
  'normal',
  1,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md;

-- 3. Update Phase 3 SEO Tasks: Mark Solicate Page Triage done
UPDATE public.tasks
SET status = 'done',
    completed_at = COALESCE(completed_at, NOW())
WHERE id = 'bef84497-1e45-4586-ab86-96bc54176582'; -- Page triage index cleanup plan

UPDATE public.tasks
SET title = 'Index cleanup — Solicate staging & utility pass (17 noindex + 20 trashed)',
    status = 'done',
    completed_at = COALESCE(completed_at, NOW())
WHERE id = '1ce4a5c0-0000-4000-8000-000000003004';

-- 4. Create Blocked Task for 9 remaining blogger/client pages
INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000003041',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000503', -- Phase 3 Growth Foundation
  'Awaiting client & blogger confirmation on 9 remaining pages (Astrology, floating, reviews, etc.)',
  'Solicate completed initial index cleanup (17 utility pages noindexed, 20 staging drafts deleted). Waiting on response from Komal / client blogger regarding the 9 question-mark pages: Astrology, Curated-calm, digital journal, Echo project, floating, Nervous system reset, reviews, Privacy Policy, Refund Policy.',
  'blocked',
  'high',
  2,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority;

COMMIT;
