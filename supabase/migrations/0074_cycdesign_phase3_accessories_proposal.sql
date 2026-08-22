-- 0074: CYCDesign - Create Phase 3 (Accessories & Bags) and log proposal to Navi

BEGIN;

-- 1. Create Phase 3 in phases table
INSERT INTO public.phases (
  id, project_id, position, name, status, description, started_on, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000001002',
  '2f9e3d70-0000-4000-8000-000000000021',
  3,
  'Phase 3 - Accessories & Bags (Etsy + WordPress)',
  'planned',
  '15 product listings across Etsy and WordPress: Purses (7 colors), Clutches (6 colors), Envelope style (2 colors), and Elephant motif (4 colors). Includes complete US SEO keyword research, copywriting, master spreadsheet, benchmark builds, and Metta training walkthrough. Quoted at 9,500 INR (~$150 CAD).',
  '2026-08-22',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

-- 2. Log Phase 3 Proposal Entry
INSERT INTO public.entries (
  id, project_id, phase_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006035',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  'update',
  'Proposal Sent: Phase 3 Accessories & Bags (9,500 INR / $150 CAD)',
  '**Phase 3 Proposal Sent to Navi on 22 Aug 2026:**\n\n* **Scope:** 15 listings across Etsy and WordPress (Purses 7 colors, Clutches 6 colors, Envelope 2 colors, Elephant 4 colors).\n* **Deliverables:** Deep US keyword research, SEO product titles, descriptions, and 13 Etsy tags organized in a master spreadsheet; end-to-end guidance/training for Metta on live benchmark listings; final QA and publishing.\n* **Commercial Pricing:** 9,500 INR (~$150 CAD), discounted from standard 11,500 INR benchmark to factor in Metta assisting and learning the upload workflow.\n* **Status:** Awaiting Navi confirmation to begin groundwork.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

-- 3. Insert Pipeline Task for Phase 3 Confirmation
INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000007035',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  'Awaiting Navi confirmation on Phase 3 proposal (9,500 INR / $150 CAD)',
  'Sent proposal on 22 Aug 2026 for 15 accessories listings across Etsy and WordPress with Metta training. Awaiting Navi green light to kick off SEO research.',
  'todo',
  'high',
  1,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority;

COMMIT;
