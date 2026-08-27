-- 0084: Seed Navi partnership tasks in Solicate Phase 1 and operational tasks in CYC project

-- 1. Solicate Agency Strategic Tasks (solicate.tasks)
INSERT INTO solicate.tasks (
  id, phase_id, assignee_id, title, description_md, status, priority, position
) VALUES
(
  'a1100001-0000-4000-8000-000000000001',
  '5a647c24-d9c1-1fe2-de56-8d677bfe0805', -- Phase 1 Foundation
  'bfd9ec61-a872-38d3-e52a-08528c7bc624', -- Yeswanth
  'Draft & formalize Navi partnership agreement (55/45 CAD split)',
  'Formalize the referral and delivery partnership terms agreed with Navi on WhatsApp (Aug 25, 2026). Covers 55/45 revenue share, $700 strategy framing, SLAs, and payouts.',
  'todo',
  'high',
  1
),
(
  'a1100001-0000-4000-8000-000000000002',
  '5a647c24-d9c1-1fe2-de56-8d677bfe0805', -- Phase 1 Foundation
  'bfd9ec61-a872-38d3-e52a-08528c7bc624', -- Yeswanth
  'Weekly & monthly partner sync cadence with Navi',
  'Setup recurring operating rhythms with Navi to review referral leads, client onboarding progress, and monthly commission reconciliations.',
  'todo',
  'normal',
  2
),
(
  'a1100001-0000-4000-8000-000000000003',
  '5a647c24-d9c1-1fe2-de56-8d677bfe0805', -- Phase 1 Foundation
  '9cb86f33-92c3-4aac-cc8c-68288c4a3204', -- Sakshi
  'Collaborative Solicate x CYCF content engine & social proof',
  'Create announcement and collaborative social content showcasing the Solicate x CYCF partnership, plus-size growth case studies, and personal brand story.',
  'todo',
  'high',
  3
),
(
  'a1100001-0000-4000-8000-000000000004',
  '5a647c24-d9c1-1fe2-de56-8d677bfe0805', -- Phase 1 Foundation
  'bfd9ec61-a872-38d3-e52a-08528c7bc624', -- Yeswanth
  'Sakshi capacity planning & design intern onboarding plan',
  'Create a sustainable workflow structure for Sakshi to maintain high design quality without operational overload as client volume scales.',
  'todo',
  'normal',
  4
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  priority = EXCLUDED.priority,
  phase_id = EXCLUDED.phase_id,
  assignee_id = EXCLUDED.assignee_id;

-- 2. Solicate Subtasks (solicate.subtasks)
INSERT INTO solicate.subtasks (id, task_id, title, done, position) VALUES
-- Task 1 Subtasks
('b1100001-0000-4000-8000-000000000001', 'a1100001-0000-4000-8000-000000000001', 'Define 55% Solicate / 45% Navi revenue split terms on referred clients (CAD)', false, 1),
('b1100001-0000-4000-8000-000000000002', 'a1100001-0000-4000-8000-000000000001', 'Document $700 strategy package pitch ("complimentary strategy for client connections")', false, 2),
('b1100001-0000-4000-8000-000000000003', 'a1100001-0000-4000-8000-000000000001', 'Formalize client handover and delivery SLA between Navi and Solicate', false, 3),
('b1100001-0000-4000-8000-000000000004', 'a1100001-0000-4000-8000-000000000001', 'Define payment timeline upon client milestone clearance', false, 4),

-- Task 2 Subtasks
('b1100002-0000-4000-8000-000000000001', 'a1100001-0000-4000-8000-000000000002', 'Schedule weekly Friday video touchpoint for client pipeline & ops', false, 1),
('b1100002-0000-4000-8000-000000000002', 'a1100001-0000-4000-8000-000000000002', 'Establish monthly revenue and commission reconciliation', false, 2),
('b1100002-0000-4000-8000-000000000003', 'a1100001-0000-4000-8000-000000000002', 'Setup shared WhatsApp channel for incoming referral qualification', false, 3),

-- Task 3 Subtasks
('b1100003-0000-4000-8000-000000000001', 'a1100001-0000-4000-8000-000000000003', 'Brief Sakshi on designing the Solicate x CYCF partner announcement post', false, 1),
('b1100003-0000-4000-8000-000000000002', 'a1100001-0000-4000-8000-000000000003', 'Prepare 3-4 slide deck carousel post templates matching top-performing IG style', false, 2),
('b1100003-0000-4000-8000-000000000003', 'a1100001-0000-4000-8000-000000000003', 'Draft copy for founder milestone / personal brand story', false, 3),
('b1100003-0000-4000-8000-000000000004', 'a1100001-0000-4000-8000-000000000003', 'Schedule collaborative publish date on Instagram & LinkedIn', false, 4),

-- Task 4 Subtasks
('b1100004-0000-4000-8000-000000000001', 'a1100001-0000-4000-8000-000000000004', 'Scope design intern tasks to offload graphic workload from Sakshi', false, 1),
('b1100004-0000-4000-8000-000000000002', 'a1100001-0000-4000-8000-000000000004', 'Define criteria for project selection focusing on long-term compound growth', false, 2),
('b1100004-0000-4000-8000-000000000003', 'a1100001-0000-4000-8000-000000000004', 'Align on time management & delivery turnaround buffers', false, 3)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  done = EXCLUDED.done,
  position = EXCLUDED.position;

-- 3. CYCDesign Project Operational Tasks (public.tasks)
INSERT INTO public.tasks (
  id, project_id, phase_id, assignee_id, created_by_id, title, description_md, status, priority
) VALUES
(
  '2f9e3d70-0000-4000-8000-000000007040',
  '2f9e3d70-0000-4000-8000-000000000021', -- CYCDesign
  null, -- Ungrouped
  '662c2444-d9c6-4075-904e-5f6333426d55', -- yswnth
  '662c2444-d9c6-4075-904e-5f6333426d55',
  'Finalize CYCF Fashion Retreat post-event review questionnaire',
  'Form setup for gathering attendee feedback, testimonials, and coupon reward incentive with founder connection link.',
  'todo',
  'urgent'
),
(
  '2f9e3d70-0000-4000-8000-000000007041',
  '2f9e3d70-0000-4000-8000-000000000021', -- CYCDesign
  null, -- Ungrouped
  '662c2444-d9c6-4075-904e-5f6333426d55', -- yswnth
  '662c2444-d9c6-4075-904e-5f6333426d55',
  'Execute Etsy research questionnaire & catalog prep for CYCF purses',
  'Groundwork and Step 3 questions for purse collection listings, packaging inspection, and shipping tiers.',
  'todo',
  'high'
),
(
  '2f9e3d70-0000-4000-8000-000000007042',
  '2f9e3d70-0000-4000-8000-000000000021', -- CYCDesign
  null, -- Ungrouped
  '662c2444-d9c6-4075-904e-5f6333426d55', -- yswnth
  '662c2444-d9c6-4075-904e-5f6333426d55',
  'Resolve Zoho Payroll MFA & GoDaddy email transition for CYC',
  'Confirm $193 CAD GoDaddy refund and fix authenticator app access for Zoho Payroll.',
  'todo',
  'normal'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  priority = EXCLUDED.priority,
  phase_id = EXCLUDED.phase_id,
  assignee_id = EXCLUDED.assignee_id;

-- 4. CYCDesign Subtasks (public.task_subtasks)
INSERT INTO public.task_subtasks (id, task_id, title, done, position, created_by_id) VALUES
-- Fashion retreat survey subtasks
('2f9e3d70-0000-4000-8000-000000008101', '2f9e3d70-0000-4000-8000-000000007040', 'Add 3-5 experience & environment questions (culture, food, host, fitting)', false, 1, '662c2444-d9c6-4075-904e-5f6333426d55'),
('2f9e3d70-0000-4000-8000-000000008102', '2f9e3d70-0000-4000-8000-000000007040', 'Add open-ended "Drop your insights" field with coupon incentive', false, 2, '662c2444-d9c6-4075-904e-5f6333426d55'),
('2f9e3d70-0000-4000-8000-000000008103', '2f9e3d70-0000-4000-8000-000000007040', 'Add "Talk with founder Navi" direct link / WhatsApp button', false, 3, '662c2444-d9c6-4075-904e-5f6333426d55'),
('2f9e3d70-0000-4000-8000-000000008104', '2f9e3d70-0000-4000-8000-000000007040', 'Test form link and hand off to Navi for attendees', false, 4, '662c2444-d9c6-4075-904e-5f6333426d55'),

-- Etsy purses subtasks
('2f9e3d70-0000-4000-8000-000000008105', '2f9e3d70-0000-4000-8000-000000007041', 'Draft the Step 3 research questions on purse inventory & pricing', false, 1, '662c2444-d9c6-4075-904e-5f6333426d55'),
('2f9e3d70-0000-4000-8000-000000008106', '2f9e3d70-0000-4000-8000-000000007041', 'Send questionnaire to Navi and review received packages', false, 2, '662c2444-d9c6-4075-904e-5f6333426d55'),
('2f9e3d70-0000-4000-8000-000000008107', '2f9e3d70-0000-4000-8000-000000007041', 'Check domestic & international shipping requirements', false, 3, '662c2444-d9c6-4075-904e-5f6333426d55'),

-- Zoho / email subtasks
('2f9e3d70-0000-4000-8000-000000008108', '2f9e3d70-0000-4000-8000-000000007042', 'Verify $193 CAD / $136 USD GoDaddy refund status', false, 1, '662c2444-d9c6-4075-904e-5f6333426d55'),
('2f9e3d70-0000-4000-8000-000000008109', '2f9e3d70-0000-4000-8000-000000007042', 'Fix OneAuth / MFA login access for Zoho Payroll', false, 2, '662c2444-d9c6-4075-904e-5f6333426d55'),
('2f9e3d70-0000-4000-8000-000000008110', '2f9e3d70-0000-4000-8000-000000007042', 'Confirm MX records and deliverability on Google Workspace', false, 3, '662c2444-d9c6-4075-904e-5f6333426d55')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  done = EXCLUDED.done,
  position = EXCLUDED.position;
