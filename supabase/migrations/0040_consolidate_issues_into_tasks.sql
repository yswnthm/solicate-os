-- Migration 0040: Consolidate issues into tasks
INSERT INTO public.tasks (
  id, project_id, phase_id, title, description_md, status, priority,
  assignee_id, due_at, completed_at, origin_entry_id,
  created_at, updated_at, created_by_id
)
SELECT 
  id,
  project_id,
  phase_id,
  title,
  CASE 
    WHEN resolution_summary IS NOT NULL AND resolution_summary != '' THEN description_md || E'\n\n**Resolution:** ' || resolution_summary
    ELSE description_md
  END,
  CASE 
    WHEN status IN ('resolved', 'accepted', 'closed') THEN 'done'::public.task_status
    ELSE 'todo'::public.task_status
  END,
  CASE 
    WHEN severity IN ('critical', 'high') THEN 'urgent'::public.task_priority
    ELSE 'high'::public.task_priority
  END,
  assignee_id,
  NULL,
  CASE WHEN status IN ('resolved', 'accepted', 'closed') THEN COALESCE(resolved_at, updated_at, now()) ELSE NULL END,
  origin_entry_id,
  created_at,
  updated_at,
  created_by_id
FROM public.issues
ON CONFLICT (id) DO NOTHING;

-- Drop issues table and enums
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TYPE IF EXISTS public.issue_status CASCADE;
DROP TYPE IF EXISTS public.issue_severity CASCADE;
