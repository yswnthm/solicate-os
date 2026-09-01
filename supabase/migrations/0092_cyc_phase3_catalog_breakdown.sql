-- 0092: Update CYC Phase 3 Accessories & Bags taxonomy (19 variants across 4 distinct silhouettes)

BEGIN;

-- 1. Update Phase 3 description in public.phases
UPDATE public.phases
SET
  description = 'Etsy & WordPress catalog launch for 19 accessories & bags across 4 silhouettes: Purses (7 variants, 6"×8"), Clutches (6 variants, 8"×4.5"×3"), Bags with Elephant (4 colors), and Envelope Clutches (2 colors). Includes 8-photo AI benchmark listings, Metta upload guidance, and 14-day Etsy Ads test.'
WHERE id = '2f9e3d70-0000-4000-8000-000000001002';

-- 2. Insert Decision Entry for the 19-Product Catalog Taxonomy
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state,
  decision_outcome, decision_state, created_by_id
) VALUES (
  '2f9e3d70-0000-4000-8000-000000000404',
  '2f9e3d70-0000-4000-8000-000000000021',
  'decision',
  'CYC Phase 3 Catalog Structure: 19 Total Variants across 4 Silhouette Families',
  $str$Finalized the complete Phase 3 accessories & bags catalog breakdown for CYCDesign:
1. Purses (7 variants): Tall vertical minaudière box purse (6.0" W × 8.0" H × 2.0" D).
2. Envelope Clutches (2 colors): Wildflower envelope fold-over clutch.
3. Clutches (6 variants): Horizontal rounded pill box clutch (8.0" L × 4.5" H × 3.0" D).
4. Bags with Elephant (4 colors): Zardozi elephant motif embroidered box bag.
Total: 19 products to be staged across Etsy and WordPress WooCommerce.$str$,
  NOW(),
  'filed',
  'Phase 3 catalog taxonomy confirmed (19 products across 4 categories).',
  'active',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  decision_outcome = EXCLUDED.decision_outcome,
  decision_state = EXCLUDED.decision_state;

COMMIT;
