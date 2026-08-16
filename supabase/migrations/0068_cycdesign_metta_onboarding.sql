-- 0068: Onboard Metta (Administrative & Events Coordinator Intern) to CYCDesign

BEGIN;

-- 1. Insert Metta into people
INSERT INTO public.people (
  id, name, is_partner, summary, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000013',
  'Metta',
  false,
  'Administrative and Events Coordinator (Intern) working with CYCDesign on a 12-week operational runway (started early Aug 2026, ~11 weeks remaining). Passionate about inclusion with a Jamaican/Burmese background. Handles master operations tracker: influencers, boutiques, grants, makeup artists, model registration list, and finance/expense administration.',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  summary = EXCLUDED.summary;

-- 2. Link Metta as project participant under CYCDesign
INSERT INTO public.project_participants (
  project_id, person_id, role, role_label, is_referral_source, communication_mode, financial_arrangement, terms_note
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000021',
  '2f9e3d70-0000-4000-8000-000000000013',
  'collaborator',
  'Administrative & Events Coordinator (Intern)',
  false,
  'shared',
  'none',
  '12-week operational internship (Week 1 completed, ~11 weeks remaining). Primary responsibilities: multi-tab master operations tracking sheet (influencers, boutiques, grants, MUA, model registration, expenses/finance admin).'
) ON CONFLICT (project_id, person_id) DO UPDATE SET
  role = EXCLUDED.role,
  role_label = EXCLUDED.role_label,
  terms_note = EXCLUDED.terms_note;

-- 3. Log Onboarding Note Entry for Metta
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006031',
  '2f9e3d70-0000-4000-8000-000000000021',
  'note',
  'Metta Onboarding & Master Operations Tracker Delegation',
  '**Role:** Administrative & Events Coordinator (Intern, 12-week runway)\n**Joined:** 15 Aug 2026\n\n**Intro:**\n> "Hi I’m Metta!! I’m the administrative and events coordinator!!! I have a lifelong passion for inclusion, coming from the Caribbean with a Jamaican/Burmese background. My interests include the performing arts, exploring the city, and getting to interact with animals and wildlife!"\n\n**Operational Delegation:**\nCoordinating a single Master Google Sheet with dedicated tabs for Influencers, Boutiques, Grants, Makeup Artists, Model Registration list, and Finance/Expenses tracking during her 12-week internship.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

-- 4. Create active operational tasks for Metta workstream
INSERT INTO public.tasks (
  id, project_id, title, description_md, status, priority, position, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000007030',
  '2f9e3d70-0000-4000-8000-000000000021',
  'Review Metta''s 2-3 sample Google Sheet layout proposals (Influencers, Boutiques, Grants, MUA, Models, Expenses)',
  'Requested sample tab & column layouts from Metta on 16 Aug 2026. Awaiting her layout proposals to choose the best structure.',
  'in_progress',
  'high',
  1,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007031',
  '2f9e3d70-0000-4000-8000-000000000021',
  'Approve Master Operations Google Sheet structure & link URL in Solicate OS',
  'Select preferred layout, finalize tabs and headers with Metta, and record the live spreadsheet link in project entries.',
  'todo',
  'normal',
  2,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
),
(
  '2f9e3d70-0000-4000-8000-000000007032',
  '2f9e3d70-0000-4000-8000-000000000021',
  'Guide Metta through weekly data collection sprints across her 12-week internship',
  'Keep Metta leveraged on high-value data logging (boutiques, grants, influencer outreach, expenses) without blocking during the 11 remaining weeks.',
  'todo',
  'normal',
  3,
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  position = EXCLUDED.position;

COMMIT;
