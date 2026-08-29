-- 0086: Harinath Reddy & Godrej Brooklyn Avenue import with verified historical timestamps

BEGIN;

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE is_active = true) THEN
    RAISE EXCEPTION 'No active app_user exists.';
  END IF;
END $guard$;

-- ─── 1. Person Record (public.people) ───────────────────────────────────────

INSERT INTO public.people (
  id, name, email, phone, kind, is_partner, summary, created_by_id
) VALUES (
  'a81a0000-0000-4000-8000-000000000001',
  'Harinath Reddy',
  'hari.reddyc@gmail.com',
  '9502542081',
  'individual',
  false,
  $str$Real estate lead generator, investor, and digital property marketer based in Gachibowli, Hyderabad. Associated with GrandWeddings (grandweddings.co.in) and PakkaJameen portal. Engaged Solicate in June 2026 for a 45-day validation trial to capture high-intent buyer leads for the new Godrej Brooklyn Avenue Kukatpally launch. Commercial model: 45-day trial leading into venture-based commission model + ongoing maintenance retainers for upcoming Hyderabad real estate launches.$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  summary = EXCLUDED.summary;

-- ─── 2. Relationship (Level 1) ──────────────────────────────────────────────

INSERT INTO public.relationships (
  id, client_id, person_id, type, source, status, summary,
  communication_mode, financial_arrangement, payment_status, terms_note, created_by_id
) VALUES (
  'a81a0000-0000-4000-8000-000000000801',
  'a81a0000-0000-4000-8000-000000000001',
  null,
  'client', 'direct_outreach', 'active',
  $str$Harinath Reddy (Hyderabad). Real estate lead generation and digital marketing. First engagement: Godrej Brooklyn Avenue Kukatpally landing page & SEO lead generation trial (45 days from June 22, 2026). Transitioning into commission per venture for future Hyderabad property launches.$str$,
  'solicate_leads', 'none', 'not_applicable',
  $str$45-day trial project started June 22, 2026 to validate organic search rank and lead capture. Future arrangement: Commission-based model per real estate venture with minimal ongoing server/maintenance fee. Also holds opportunities for PakkaJameen SEO content and GrandWeddings speed optimization.$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  source = EXCLUDED.source,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  terms_note = EXCLUDED.terms_note;

-- ─── 3. Project ─────────────────────────────────────────────────────────────

INSERT INTO public.projects (
  id, owner_id, person_id, name, code, status, summary, started_on, target_date,
  objective, success_definition, direction, created_by_id
) VALUES (
  'a81a0000-0000-4000-8000-000000000021',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'a81a0000-0000-4000-8000-000000000001',
  'Godrej Brooklyn Avenue — SEO Lead Generation & Landing Page',
  'GBA-KUKATPALLY',
  'active',
  $str$High-converting landing page and SEO lead capture system for Godrej Brooklyn Avenue (Kukatpally, Hyderabad; 7.8 acres, G+45 floors, 72,000 sq.ft clubhouse, RERA P02200010981). 45-day validation trial initiated June 22, 2026. Live at godrejbrooklyn.info with WhatsApp lead routing and Google Search Console indexation. Key strategic takeaway: New launch real estate keywords are high-velocity ('fastest fingers first'); future venture partnerships require Day-0 domain acquisition and launch before builder PR waves.$str$,
  '2026-06-22',
  '2026-08-08',
  $str$Capture high-intent luxury homebuyer enquiries for Godrej Brooklyn Avenue Kukatpally via organic search rankings and direct mobile WhatsApp capture.$str$,
  $str$1) Live responsive landing page at godrejbrooklyn.info with Floor Plans, Price Breakup, and WhatsApp lead flow; 2) Google Search Console indexation; 3) Rank on target commercial keywords; 4) 45-day trial evaluation for ongoing venture commission partnership.$str$,
  $str$Phase 1: Rapid Landing Page & Domain Infrastructure (June 22–23) → Phase 2: Trial SEO Ranking, Lead Capture & Venture Partnership Transition (June 24–August).$str$,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  started_on = EXCLUDED.started_on,
  target_date = EXCLUDED.target_date,
  objective = EXCLUDED.objective,
  success_definition = EXCLUDED.success_definition,
  direction = EXCLUDED.direction;

-- ─── 4. Phases ──────────────────────────────────────────────────────────────

INSERT INTO public.phases (
  id, project_id, position, name, description, status, started_on, target_date, completed_at, created_by_id
) VALUES
(
  'a81a0000-0000-4000-8000-000000001001',
  'a81a0000-0000-4000-8000-000000000021',
  1,
  'Phase 1 — Landing Page Launch & Domain Infrastructure',
  'Domain registration (godrejbrooklyn.info), Cloudflare DNS setup, mobile-first luxury landing page build, Godrej branding assets, and Google Search Console submission.',
  'completed',
  '2026-06-22',
  '2026-06-23',
  '2026-06-23 17:00:00+00',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  'a81a0000-0000-4000-8000-000000001002',
  'a81a0000-0000-4000-8000-000000000021',
  2,
  'Phase 2 — SEO Optimization & Venture Partnership Transition',
  'Rank tracking, keyword optimization, and transition conversation with Harinath Reddy to propose Day-0 pre-launch domain strategy and commission-based venture partnerships.',
  'active',
  '2026-06-24',
  '2026-08-08',
  null,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
)
ON CONFLICT (project_id, name) DO UPDATE SET
  position = EXCLUDED.position,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  started_on = EXCLUDED.started_on,
  target_date = EXCLUDED.target_date,
  completed_at = EXCLUDED.completed_at;

-- ─── 5. Tasks ───────────────────────────────────────────────────────────────

INSERT INTO public.tasks (
  id, project_id, phase_id, assignee_id, created_by_id, title, description_md, status, priority, due_at, completed_at
) VALUES
-- Phase 1 Tasks (Completed)
(
  'a81a0000-0000-4000-8000-000000007001',
  'a81a0000-0000-4000-8000-000000000021',
  'a81a0000-0000-4000-8000-000000001001',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Register godrejbrooklyn.info and configure Cloudflare DNS',
  'Connect GoDaddy domain to Cloudflare, configure SSL, and verify DNS propagation.',
  'done',
  'high',
  '2026-06-23',
  '2026-06-23 16:30:00+00'
),
(
  'a81a0000-0000-4000-8000-000000007002',
  'a81a0000-0000-4000-8000-000000000021',
  'a81a0000-0000-4000-8000-000000001001',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Build mobile-responsive landing page with WhatsApp lead capture',
  'Structure landing page with G+45 floor specs, 72,000 sq.ft clubhouse, RERA P02200010981, floor plan links, and direct WhatsApp contact number (9502542081).',
  'done',
  'urgent',
  '2026-06-23',
  '2026-06-23 17:00:00+00'
),
(
  'a81a0000-0000-4000-8000-000000007003',
  'a81a0000-0000-4000-8000-000000000021',
  'a81a0000-0000-4000-8000-000000001001',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Register property on Google Search Console & submit sitemap',
  'Verify domain property on GSC and submit sitemap for rapid organic indexing.',
  'done',
  'high',
  '2026-06-23',
  '2026-06-23 18:00:00+00'
),

-- Phase 2 Tasks (Active / Strategic Next Steps)
(
  'a81a0000-0000-4000-8000-000000007004',
  'a81a0000-0000-4000-8000-000000000021',
  'a81a0000-0000-4000-8000-000000001002',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Execute SEO optimization pass on godrejbrooklyn.info',
  'Perform title/meta tuning and content depth push on Godrej Brooklyn Avenue to capture remaining search traffic and push from top 4 pages towards Page 1.',
  'in_progress',
  'high',
  '2026-08-30',
  null
),
(
  'a81a0000-0000-4000-8000-000000007005',
  'a81a0000-0000-4000-8000-000000000021',
  'a81a0000-0000-4000-8000-000000001002',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Partner transition conversation with Harinath Reddy for upcoming ventures',
  'Connect with Harinath to present trial learnings (competitiveness of launch keywords, need for Day-0 domain registration) and pitch an ongoing commission-based model for upcoming Hyderabad property ventures.',
  'todo',
  'urgent',
  '2026-09-02',
  null
),
(
  'a81a0000-0000-4000-8000-000000007006',
  'a81a0000-0000-4000-8000-000000000021',
  'a81a0000-0000-4000-8000-000000001002',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1),
  'Integrate PakkaJameen real estate SEO blog architecture',
  'Structure evergreen commercial-intent real estate topics for Hyderabad micro-markets (Kukatpally, Gachibowli, IT Corridor) under PakkaJameen.',
  'todo',
  'normal',
  '2026-09-10',
  null
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  phase_id = EXCLUDED.phase_id,
  due_at = EXCLUDED.due_at,
  completed_at = EXCLUDED.completed_at;

-- ─── 6. Subtasks ────────────────────────────────────────────────────────────

INSERT INTO public.task_subtasks (id, task_id, title, done, position, created_by_id) VALUES
-- Task 1 Subtasks (Done)
('a81a0000-0000-4000-8000-000000008001', 'a81a0000-0000-4000-8000-000000007001', 'Acquire DNS control on GoDaddy account', true, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('a81a0000-0000-4000-8000-000000008002', 'a81a0000-0000-4000-8000-000000007001', 'Route nameservers to Cloudflare and enforce HTTPS SSL', true, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),

-- Task 2 Subtasks (Done)
('a81a0000-0000-4000-8000-000000008003', 'a81a0000-0000-4000-8000-000000007002', 'Implement responsive luxury real estate design', true, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('a81a0000-0000-4000-8000-000000008004', 'a81a0000-0000-4000-8000-000000007002', 'Add Floor Plans, Price Breakup, and WhatsApp enquiry routing', true, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('a81a0000-0000-4000-8000-000000008005', 'a81a0000-0000-4000-8000-000000007002', 'Embed Godrej branding favicon and OpenGraph metadata', true, 3, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),

-- Task 4 Subtasks (In Progress)
('a81a0000-0000-4000-8000-000000008006', 'a81a0000-0000-4000-8000-000000007004', 'Review GSC search queries, click-through rates, and average positions', false, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('a81a0000-0000-4000-8000-000000008007', 'a81a0000-0000-4000-8000-000000007004', 'Optimize on-page heading tags and keyword density for Kukatpally luxury apartments', false, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),

-- Task 5 Subtasks (Todo)
('a81a0000-0000-4000-8000-000000008008', 'a81a0000-0000-4000-8000-000000007005', 'Compile trial performance summary (ranking reach, speed, indexing proof)', false, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('a81a0000-0000-4000-8000-000000008009', 'a81a0000-0000-4000-8000-000000007005', 'Articulate the "fastest fingers first" Day-0 advantage for future real estate ventures', false, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('a81a0000-0000-4000-8000-000000008010', 'a81a0000-0000-4000-8000-000000007005', 'Propose commission per lead/sale + minimal ongoing maintenance fee model', false, 3, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  done = EXCLUDED.done,
  position = EXCLUDED.position;

-- ─── 7. Decision Entry ──────────────────────────────────────────────────────

INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) VALUES (
  'a81a0000-0000-4000-8000-000000000401',
  'a81a0000-0000-4000-8000-000000000021',
  'decision',
  'Godrej Brooklyn Avenue 45-day trial execution and ongoing venture partnership roadmap',
  $str$Harinath Reddy (Hyderabad). Initiated a 45-day validation trial on June 22, 2026 for Godrej Brooklyn Avenue Kukatpally. Rapidly launched godrejbrooklyn.info within 24 hours with WhatsApp lead capture and GSC indexing. Site achieved top 4 pages ranking (6th position for select queries). Core operational insight: New venture real estate keywords are highly competitive ('fastest fingers first' race). To reach Page 1, Solicate must acquire the exact domain and launch on Day 0 of builder PR. Roadmap: Present trial learnings to Harinath and transition into an ongoing commission-per-venture partnership with minimal maintenance fees.$str$,
  '2026-08-29 11:25:00+05:30',
  'filed',
  $str$Trial completed. Phase 1 deliverables cleared. Moving to strategic partner pitch for future venture commission pipeline.$str$,
  'active',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  decision_outcome = EXCLUDED.decision_outcome,
  decision_state = EXCLUDED.decision_state;

COMMIT;
