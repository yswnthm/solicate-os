-- 0071: Stillness - Log completed age-restriction task, photo gallery asset, and pending add-ons invoice tracking

BEGIN;

-- 1. Insert completed task for Aug 21 age-restriction checkbox
INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, completed_at, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000003042',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000502', -- Phase 2: Events & LPs
  'Event age-restriction verification checkbox for Aug 21 session (18-29 youth grant)',
  'Implemented and deployed age verification checkbox on Aug 12 2026 for the Aug 21 "The Reset" session to comply with youth grant requirements. Value: 400 - 500 INR (to be included in upcoming consolidated invoice).',
  'done',
  'normal',
  2,
  '2026-08-12 10:44:00+00',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description_md = EXCLUDED.description_md,
  status = EXCLUDED.status,
  completed_at = EXCLUDED.completed_at;

-- 2. Insert Commercial Photo Gallery Asset Document Entry
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000002041',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'document',
  'Asset Gallery: Stillness Commercial Photography (Alisha Khan / SmugMug)',
  '**High-Resolution Commercial Photography Archive**\n\n* **Gallery Link:** https://alishakhan.smugmug.com/Commercial/Stillness-Co\n* **Provided By:** Komal on Aug 12 2026\n* **Usage:** Google Business Profile (GBP 10 - 20 photo assets), website event headers, and future SEO service pages.\n* **Coverage:** Sanctuary sessions, floating journeys, sound baths, founder portraits, and community events.',
  '2026-08-12 00:42:00+00',
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

-- 3. Insert Unbilled Add-Ons Ledger Note Entry
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000002042',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'note',
  'Unbilled Add-Ons Ledger: Event Sorting & Age Gate (~900 - 1,100 INR)',
  '**Delivered Small Add-Ons Awaiting Next Consolidated Invoice:**\n\n1. **Event Sorting & Auto-Hide Feature (Delivered 21 Jul 2026):** ~400 - 600 INR\n2. **Event Age-Restriction Checkbox for Aug 21 Grant Session (Delivered 12 Aug 2026):** ~400 - 500 INR\n\n* **Total Pending Add-Ons:** ~900 - 1,100 INR\n* **Agreement:** To be consolidated into next major billing cycle (with Phase 3 SEO Foundation or Quiz kickoff) to avoid separate small transaction deductions.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

-- 4. Clean up any remaining unicode em-dashes and en-dashes in Stillness tasks
UPDATE public.tasks
SET title = replace(replace(title, '—', '-'), '–', '-'),
    description_md = replace(replace(description_md, '—', '-'), '–', '-')
WHERE project_id = '1ce4a5c0-0000-4000-8000-000000000021'
  AND (title LIKE '%—%' OR title LIKE '%–%' OR description_md LIKE '%—%' OR description_md LIKE '%–%');

-- 5. Clean up any remaining unicode em-dashes and en-dashes in Stillness entries
UPDATE public.entries
SET title = replace(replace(title, '—', '-'), '–', '-'),
    body_md = replace(replace(body_md, '—', '-'), '–', '-')
WHERE project_id = '1ce4a5c0-0000-4000-8000-000000000021'
  AND (title LIKE '%—%' OR title LIKE '%–%' OR body_md LIKE '%—%' OR body_md LIKE '%–%');

COMMIT;
