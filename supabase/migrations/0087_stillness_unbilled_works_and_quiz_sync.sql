-- 0087: Stillness unbilled works logging, pending quiz proposal status, and business model sync

BEGIN;

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE is_active = true) THEN
    RAISE EXCEPTION 'No active app_user exists.';
  END IF;
END $guard$;

-- ─── 1. Unbilled Income Transactions (public.transactions) ──────────────────

INSERT INTO public.transactions (
  id, type, amount, currency_code, transaction_date, status, invoice_status, notes, created_by_id
) VALUES
(
  '1ce4a5c0-0000-4000-8000-000000000609',
  'income',
  500.00,
  'INR',
  '2026-08-12',
  'pending',
  'preparing',
  'WooCommerce Event Age-Verification Checkbox (Aug 21 Youth Grant event, Product ID 7061). Delivered Aug 12, 2026; agreed to bill in next consolidated invoice cycle.',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '1ce4a5c0-0000-4000-8000-000000000610',
  'income',
  500.00,
  'INR',
  '2026-07-18',
  'pending',
  'preparing',
  'Events grid 5-vs-6 display fix and native event-date sorting setup. Delivered July 18, 2026; unbilled pending next invoice cycle.',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  notes = EXCLUDED.notes,
  status = EXCLUDED.status,
  invoice_status = EXCLUDED.invoice_status;

-- ─── 2. Transaction Allocations (public.transaction_allocations) ────────────

INSERT INTO public.transaction_allocations (
  id, transaction_id, target, project_id, phase_id, amount, notes, created_by_id
) VALUES
(
  '1ce4a5c0-0000-4000-8000-000000000709',
  '1ce4a5c0-0000-4000-8000-000000000609',
  'phase',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000502', -- Phase 2: Events & LPs
  500.00,
  'Age verification checkbox for grant event',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '1ce4a5c0-0000-4000-8000-000000000710',
  '1ce4a5c0-0000-4000-8000-000000000610',
  'phase',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000502', -- Phase 2: Events & LPs
  500.00,
  'Events 5-vs-6 grid query and event-date sorting setup',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  notes = EXCLUDED.notes;

-- ─── 3. Update & Add Tasks (public.tasks) ───────────────────────────────────

INSERT INTO public.tasks (
  id, project_id, phase_id, assignee_id, created_by_id, title, description_md, status, priority, due_at, completed_at
) VALUES
(
  '1ce4a5c0-0000-4000-8000-000000003040',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000503', -- Phase 3: Growth Foundation
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Follow up with Komal on Interactive Diagnostic Quiz proposal & add-ons decision',
  'Proposal sent Aug 13 (interactive-diagnostic-quiz.pdf) with native WordPress build recommendation, and follow-up add-ons doc sent Aug 24 (interactive-diagnostic-quiz-addons.pdf). Komal asked for a few days to decide. Proposal not yet accepted.',
  'todo',
  'high',
  '2026-08-30',
  null
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  due_at = EXCLUDED.due_at;

-- ─── 4. Subtasks (public.task_subtasks) ─────────────────────────────────────

INSERT INTO public.task_subtasks (id, task_id, title, done, position, created_by_id) VALUES
('1ce4a5c0-0000-4000-8000-000000008201', '1ce4a5c0-0000-4000-8000-000000003040', 'Check in with Komal on quiz proposal decision (Option A vs Option B)', false, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('1ce4a5c0-0000-4000-8000-000000008202', '1ce4a5c0-0000-4000-8000-000000003040', 'Re-confirm native WordPress build over third-party iframe embed (ScoreApp/Typeform)', false, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('1ce4a5c0-0000-4000-8000-000000008203', '1ce4a5c0-0000-4000-8000-000000003040', 'Once approved, setup 15 questions, scoring algorithm, and email marketing tag routing', false, 3, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  done = EXCLUDED.done,
  position = EXCLUDED.position;

-- ─── 5. Decision Entry ──────────────────────────────────────────────────────

INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000000405',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'decision',
  'Stillness unbilled works logged & Interactive Diagnostic Quiz proposal status',
  $str$Stillness (Komal). Logged two unbilled completed deliverables under Phase 2:
1. ₹500 INR — Event age confirmation checkbox on WooCommerce checkout for Aug 21 Youth Grant event (Product #7061).
2. ₹500 INR — Events grid 5-vs-6 loop query fix & native event-date sorting setup.
Both items logged with invoice_status 'preparing' to be consolidated into the next billing cycle per the July 17 bundled invoicing agreement.

Proposal Status:
- Interactive Diagnostic Quiz (15-question somatic diagnostic, scoring logic, lead capture gate, email marketing integration) sent on Aug 13 (interactive-diagnostic-quiz.pdf) and add-ons sent on Aug 24 (interactive-diagnostic-quiz-addons.pdf). Status: Proposal pending decision (not yet accepted).$str$,
  '2026-08-29 11:40:00+05:30',
  'filed',
  $str$Unbilled works logged in Phase 2 ledger (₹1,000 total preparing/draft). Quiz proposal tracked as pending client decision.$str$,
  'active',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  decision_outcome = EXCLUDED.decision_outcome,
  decision_state = EXCLUDED.decision_state;

COMMIT;
