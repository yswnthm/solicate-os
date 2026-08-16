-- 0066: CYCDesign — Consolidate legacy & superseded tasks into the active Roadmap pipeline

BEGIN;

-- Close completed/resolved and questionnaire-superseded tasks
UPDATE public.tasks
SET status = 'done',
    completed_at = COALESCE(completed_at, NOW())
WHERE id IN (
  '2f9e3d70-0000-4000-8000-000000008004', -- Navi edits WordPress daily (resolved with WP upload completion)
  '2f9e3d70-0000-4000-8000-000000008005', -- Accounting help scope undefined (covered in questionnaire)
  '2f9e3d70-0000-4000-8000-000000007008', -- Clarify scope of accounting help (covered in questionnaire)
  '2f9e3d70-0000-4000-8000-000000008003', -- End-of-year product count unknown (covered in questionnaire)
  '2f9e3d70-0000-4000-8000-000000007010', -- Collect end-of-year product count (covered in questionnaire)
  '2f9e3d70-0000-4000-8000-000000007011', -- Deliver full-blown ecomm quote (superseded by roadmap proposal)
  '2f9e3d70-0000-4000-8000-000000007007', -- Build product-channel spreadsheet (consolidated into roadmap)
  '2f9e3d70-0000-4000-8000-000000007009'  -- Formalize product-channel mapping (consolidated into roadmap)
);

COMMIT;
