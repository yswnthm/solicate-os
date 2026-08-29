-- 0090: Codify CYC 8-Photo + Video Listing Master Framework in Phase 3 tasks

BEGIN;

-- Update Task 7037 with the 8-photo + video framework
UPDATE public.tasks
SET
  description_md = $str$Build 2 benchmark listings (Single Purse + Multi-Color Envelope) using the approved 8-Photo + 15s Video Framework:
1. Photo 1 (Hero / Front): AI Studio background replacement (clean, warm luxury presentation).
2. Photo 2 (Angle / Side): 45° perspective showing 3D depth.
3. Photo 3 (Back / Reverse): Full rear perspective.
4. Photo 4 (Utility / In Use): Demonstrating shoulder chain attachment / item held.
5. Photo 5 (Raw Closeup): 100% real macro shot showing authentic embroidery, sequins & texture.
6. Photo 6 (Scale & Dimensions): Dimension graphic with height/width arrows.
7. Photo 7 (Lifestyle / Aesthetic): Styled in curated ambient setting.
8. Photo 8 (Packaging / Unboxing): Ready-to-gift presentation.
9. Video (10–15s): Natural lighting walkthrough in motion.$str$
WHERE id = '2f9e3d70-0000-4000-8000-000000007037';

-- Insert/update standard subtasks for the benchmark listings
INSERT INTO public.task_subtasks (id, task_id, title, done, position, created_by_id) VALUES
('2f9e3d70-0000-4000-8000-000000008301', '2f9e3d70-0000-4000-8000-000000007037', 'Generate AI studio hero thumbnails (stool / warm beige backdrop) from raw front shots', true, 1, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('2f9e3d70-0000-4000-8000-000000008302', '2f9e3d70-0000-4000-8000-000000007037', 'Clean side, back, and chain utility shots', false, 2, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('2f9e3d70-0000-4000-8000-000000008303', '2f9e3d70-0000-4000-8000-000000007037', 'Attach 100% authentic raw closeup shot (texture & sequins proof)', false, 3, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)),
('2f9e3d70-0000-4000-8000-000000008304', '2f9e3d70-0000-4000-8000-000000007037', 'Add dimension infographic & staging on Etsy + WordPress', false, 4, (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  done = EXCLUDED.done,
  position = EXCLUDED.position;

COMMIT;
