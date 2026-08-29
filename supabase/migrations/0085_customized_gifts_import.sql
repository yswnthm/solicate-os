-- 0085: Customized Gifts import — lead relationship, paused catalog project, and follow-up reminders.

BEGIN;

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE is_active = true) THEN
    RAISE EXCEPTION 'No active app_user exists.';
  END IF;
END $guard$;

-- ─── 1. Client record (people) ──────────────────────────────────────────────

INSERT INTO public.people (
  id, name, kind, is_partner, summary, created_by_id
) VALUES (
  'c61f7000-0000-4000-8000-000000000001',
  'Customized Gifts (Chandana''s Husband)',
  'individual',
  false,
  $str$Husband of Chandana (connected via Chandana & Bhanu / family-friend network). Operates a customized gifts and sarees business. Recently opened a new physical retail store in Pragati College opposite street. Initial engagement: proposed 30-product mobile catalog website with WhatsApp ordering flow (₹8,500 build fee). Status: paused following offline store investment.$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  summary = EXCLUDED.summary;

-- ─── 2. Relationship (Level 1) ──────────────────────────────────────────────

INSERT INTO public.relationships (
  id, client_id, person_id, type, source, status, summary,
  communication_mode, financial_arrangement, payment_status, terms_note, created_by_id
) VALUES (
  'c61f7000-0000-4000-8000-000000000801',
  'c61f7000-0000-4000-8000-000000000001',
  null,
  'lead', 'direct_outreach', 'inactive',
  $str$Customized Gifts & Sarees business. Initial quote given for ₹8,500 website build. Paused on July 9, 2026 due to physical retail store launch opposite Pragati College.$str$,
  'solicate_leads', 'none', 'not_applicable',
  $str$Quotation: ₹8,500 build fee for 30 products catalog with WhatsApp checkout. Domain (~₹1,000/yr) separate. Hosting managed free initially, later minimal monthly usage. Paused by client due to offline shop opening.$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  source = EXCLUDED.source,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  terms_note = EXCLUDED.terms_note;

-- ─── 3. Project ─────────────────────────────────────────────────────────────

INSERT INTO public.projects (
  id, owner_id, person_id, name, code, status, summary,
  objective, success_definition, direction, created_by_id
) VALUES (
  'c61f7000-0000-4000-8000-000000000021',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'c61f7000-0000-4000-8000-000000000001',
  'Customized Gifts — Catalog Website & WhatsApp Ordering',
  'CG-CATALOG',
  'paused',
  $str$Mobile-first product catalog website with 30 initial products, customization options, and direct WhatsApp ordering flow. Currently paused following client's physical shop launch opposite Pragati College.$str$,
  $str$Launch a smooth, high-converting product catalog website enabling customers to browse 30 gift/saree products on mobile and place customized orders directly via WhatsApp.$str$,
  $str$Live 30-product catalog, responsive mobile layout, custom order parameters, and working WhatsApp order routing.$str$,
  $str$Phase 1: Catalog build (30 products) + WhatsApp checkout → Phase 2: Ongoing product additions & seasonal promotions.$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  objective = EXCLUDED.objective,
  success_definition = EXCLUDED.success_definition,
  direction = EXCLUDED.direction;

-- ─── 4. Follow-up Tasks ─────────────────────────────────────────────────────

INSERT INTO public.tasks (
  id, project_id, phase_id, assignee_id, created_by_id, title, description_md, status, priority
) VALUES
(
  'c61f7000-0000-4000-8000-000000007001',
  'c61f7000-0000-4000-8000-000000000021',
  null,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Check in on offline shop launch & offer split milestone payment option',
  'Follow up with Chandana''s husband regarding the Pragati College street store and propose a 2-part payment plan (50% upfront, 50% at launch) to reduce initial cashflow strain.',
  'todo',
  'normal'
),
(
  'c61f7000-0000-4000-8000-000000007002',
  'c61f7000-0000-4000-8000-000000000021',
  null,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Seasonal follow-up during peak gifting & festival season',
  'Re-engage during festive and gifting rush to emphasize how a digital catalog allows customers to browse items before visiting the offline shop or ordering online.',
  'todo',
  'low'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  priority = EXCLUDED.priority;

-- ─── 5. Subtasks ────────────────────────────────────────────────────

INSERT INTO public.task_subtasks (id, task_id, title, done, position, created_by_id) VALUES
-- Task 1 Subtasks
('c61f7000-0000-4000-8000-000000008001', 'c61f7000-0000-4000-8000-000000007001', 'Follow up on how the new store opposite Pragati College is running', false, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('c61f7000-0000-4000-8000-000000008002', 'c61f7000-0000-4000-8000-000000007001', 'Propose a 2-part milestone payment rollout (50% start / 50% launch) to reduce upfront pressure', false, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('c61f7000-0000-4000-8000-000000008003', 'c61f7000-0000-4000-8000-000000007001', 'Re-confirm if 30-product catalog scope remains unchanged', false, 3, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),

-- Task 2 Subtasks
('c61f7000-0000-4000-8000-000000008004', 'c61f7000-0000-4000-8000-000000007002', 'Check seasonal demand surge (July–August / festive season)', false, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('c61f7000-0000-4000-8000-000000008005', 'c61f7000-0000-4000-8000-000000007002', 'Prepare sample mobile demo catalog link to showcase WhatsApp order convenience', false, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  done = EXCLUDED.done,
  position = EXCLUDED.position;

-- ─── 6. Decision Entry ──────────────────────────────────────────────────────

INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) VALUES (
  'c61f7000-0000-4000-8000-000000000401',
  'c61f7000-0000-4000-8000-000000000021',
  'decision',
  'Customized Gifts project logged with paused status pending offline shop launch',
  $str$Customized Gifts (Chandana's Husband). Quoted ₹8,500 for a 30-product mobile catalog website with WhatsApp ordering. Project put on hold following client's retail shop opening opposite Pragati College. Logged as paused project with strategic follow-up reminders.$str$,
  NOW(),
  'filed',
  $str$Project paused. Quotation terms logged. Follow-up reminders created.$str$,
  'active',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  decision_outcome = EXCLUDED.decision_outcome,
  decision_state = EXCLUDED.decision_state;

COMMIT;
