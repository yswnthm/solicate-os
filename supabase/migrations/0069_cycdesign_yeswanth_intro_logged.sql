-- 0069: Log Yeswanth's team intro submission and photos for CYCDesign

BEGIN;

INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006032',
  '2f9e3d70-0000-4000-8000-000000000021',
  'note',
  'Yeswanth Team Intro & Photos Submitted for Social Post',
  '**Submitted to Sakshi on 16 Aug 2026 for the CYCDesign introduction post:**\n\n- **Role / Position:** Founder @ Solicate · Tech & Growth Lead\n- **Hobbies & Interests:** Chess, writing, poetry, and music.\n- **Short Intro:**\n> "Hey everyone! I’m Yeswanth, founder at Solicate. I handle the website, tech, and sales strategy to help brands sell online and grow their presence. In my free time, you’ll find me playing chess, writing, or exploring good music and poetry. Really happy to be part of the team!"\n- **Assets:** 2 headshot/profile photos submitted.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

COMMIT;
