-- 0073: CYCDesign - Record Metta Pinterest Channel Kickoff & Expansion

BEGIN;

INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006034',
  '2f9e3d70-0000-4000-8000-000000000021',
  'note',
  'Metta Pinterest Channel Kickoff (admin@celebrateyourcurves.ca)',
  '**Pinterest Channel Operational Briefing Sent - 21 Aug 2026:**\n\n* **Account:** Pinterest Business Account under `admin@celebrateyourcurves.ca`\n* **Board Architecture:** Core dress collections, jewelry/accessories, occasion wear, resort styles, and body positivity.\n* **Product Linking:** Direct backlinks to `celebrateyourcurves.ca` and Etsy shop listings.\n* **Metta Response:** Confirmed immediate execution - native Pinterest user ("a piece of cake for me"). Integration added to Master Google Sheet tracking.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

COMMIT;
