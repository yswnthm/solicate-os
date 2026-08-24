-- 0075: CYCDesign - Phase 3 Approved & Activated (9,500 INR / 500 INR Sakshi Partner Share)

BEGIN;

-- 1. Activate Phase 3
UPDATE public.phases
SET status = 'active',
    started_on = '2026-08-24'
WHERE id = '2f9e3d70-0000-4000-8000-000000001002';

-- 2. Mark Phase 3 approval task as done
UPDATE public.tasks
SET status = 'done',
    completed_at = COALESCE(completed_at, NOW())
WHERE id = '2f9e3d70-0000-4000-8000-000000007035';

-- 3. Insert Phase 3 Execution Tasks
INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000007036',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  'Build Master Accessories SEO & Copywriting Google Sheet (15 listings)',
  'Research US-market high-intent keywords, 13 Etsy search tags per listing, and write compelling SEO titles and product descriptions for all 15 accessory SKUs.',
  'in_progress',
  'high',
  1,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007037',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  'Build 2 live Benchmark listings on Etsy & WordPress (Single Purse + Multi-Color Envelope)',
  'Set up Benchmark 1 (single purse item) and Benchmark 2 (multi-color envelope variant with color swatches) to demonstrate the exact visual and SEO standard.',
  'todo',
  'high',
  2,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007038',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  'Guide Metta on remaining 13 listing uploads across Etsy & WordPress',
  'Walk Metta through the upload pass, image linking, and tag placement following the benchmark templates.',
  'todo',
  'normal',
  3,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007039',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  'Final QA pass, link verification & live catalog publish',
  'Complete end-to-end check of pricing, image quality, variation swatches, and SEO tags on both Etsy and WooCommerce.',
  'todo',
  'high',
  4,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  position = EXCLUDED.position;

-- 4. Record Income Transaction for Phase 3 (9,500 INR)
INSERT INTO public.transactions (
  id, workspace_id, type, amount, currency_code, transaction_date, status, invoice_status,
  from_person_id, reference_number, notes, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000601',
  (SELECT id FROM public.workspaces LIMIT 1),
  'income',
  9500.00,
  'INR',
  '2026-08-24',
  'pending',
  'sent',
  '2f9e3d70-0000-4000-8000-000000000011', -- Navi
  'CYC-PHASE3-001',
  'Phase 3 - Accessories & Bags catalog (Etsy + WordPress) approved by Navi on 24 Aug 2026 for 9,500 INR (~$150 CAD).',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  invoice_status = EXCLUDED.invoice_status,
  notes = EXCLUDED.notes;

INSERT INTO public.transaction_allocations (
  id, transaction_id, target, project_id, phase_id, amount, notes, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000611',
  '2f9e3d70-0000-4000-8000-000000000601',
  'phase',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  9500.00,
  'Full allocation to Phase 3 Accessories & Bags',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  notes = EXCLUDED.notes;

-- 5. Record Partner Commission Expense for Sakshi (500 INR)
INSERT INTO public.transactions (
  id, workspace_id, type, amount, currency_code, transaction_date, status,
  to_person_id, reference_number, notes, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000602',
  (SELECT id FROM public.workspaces LIMIT 1),
  'expense',
  500.00,
  'INR',
  '2026-08-24',
  'pending',
  '1ce4a5c0-0000-4000-8000-000000000012', -- Sakshi
  'CYC-SAKSHI-PHASE3',
  'Sakshi partner referral share for Phase 3 Accessories deal (500 INR).',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes;

INSERT INTO public.transaction_allocations (
  id, transaction_id, target, project_id, phase_id, amount, notes, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000612',
  '2f9e3d70-0000-4000-8000-000000000602',
  'phase',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  500.00,
  'Sakshi referral partner commission for Phase 3 Accessories',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  notes = EXCLUDED.notes;

-- 6. Log Milestone Entry
INSERT INTO public.entries (
  id, project_id, phase_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006036',
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000001002',
  'milestone',
  'Phase 3 Approved & Activated - Accessories & Bags (9,500 INR / 500 INR Sakshi Share)',
  '**Phase 3 Deal Closed & Activated on 24 Aug 2026:**\n\n* **Commercial Value:** 9,500 INR (~$150 CAD) booked to revenue pipeline.\n* **Partner Allocation:** 500 INR referral share allocated to Sakshi.\n* **Scope:** 15 listings across Etsy and WordPress (Purses, Clutches, Envelopes, Elephant motifs).\n* **Execution Model:** Solicate leads SEO research, copywriting, master sheet, 2 live benchmarks, and training; Metta assists with data entry uploads.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

COMMIT;
