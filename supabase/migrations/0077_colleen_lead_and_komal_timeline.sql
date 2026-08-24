-- 0077: Log Navi referral lead (Colleen) and Komal conversation update

BEGIN;

-- 1. CYCDesign: Log Colleen referral lead from Navi
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000006037',
  '2f9e3d70-0000-4000-8000-000000000021',
  'capture',
  'Potential Client Lead: Colleen (referred via Navi)',
  '**Navi shared the CYC strategy doc with Colleen on 24 Aug 2026.**\n\nNavi''s message: "I went through whole strategy with Colleen, and send her doc, she really appreciates. She will work on things. I am also in loop, so hopefully you keep me in loop too, when we get her as a client."\n\n* Colleen may become a Solicate client through Navi''s referral.\n* Keep Navi in the loop on any engagement with Colleen.\n* No action required yet - wait for Colleen to reach out or Navi to connect.',
  NOW(),
  'inbox',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

-- 2. Stillness: Update Komal conversation timeline on Quiz proposal
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  '1ce4a5c0-0000-4000-8000-000000002043',
  '1ce4a5c0-0000-4000-8000-000000000021',
  'note',
  'Komal Quiz Decision Timeline: "Give me a few days" (19 Aug)',
  '**Conversation Timeline:**\n\n* **13 Aug:** Sent Quiz proposal PDF to Komal.\n* **15 Aug:** Komal replied "Thank you for sending this".\n* **16 Aug:** Yeswanth sent "Let me know if I should proceed with this".\n* **19 Aug:** Komal replied **"Give me a few days"**.\n* **24 Aug:** Yeswanth sent "while you''re making decision check this document too" (linking the 9-page cleanup question).\n\n**Status:** Komal is actively deliberating. Not cold - she asked for time. Do not push further until she initiates.',
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md;

COMMIT;
