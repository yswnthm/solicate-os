-- 0083: Upgrade solicate.tasks to support ungrouped tasks (nullable phase_id) and team assignees

ALTER TABLE solicate.tasks ALTER COLUMN phase_id DROP NOT NULL;

ALTER TABLE solicate.tasks 
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES solicate.team(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS solicate_tasks_assignee_idx ON solicate.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS solicate_tasks_status_idx ON solicate.tasks(status);

GRANT ALL ON solicate.tasks TO anon, authenticated, service_role;
GRANT ALL ON solicate.subtasks TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
