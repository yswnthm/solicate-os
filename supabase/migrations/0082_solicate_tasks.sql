-- 0082: solicate.tasks and solicate.subtasks

CREATE TABLE IF NOT EXISTS solicate.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES solicate.phases(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  description_md text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  position int NOT NULL DEFAULT 1 CHECK (position >= 1),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'done' AND completed_at IS NOT NULL) OR (status <> 'done' AND completed_at IS NULL))
);

CREATE TABLE IF NOT EXISTS solicate.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES solicate.tasks(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX solicate_tasks_phase_position_idx ON solicate.tasks(phase_id, position);
CREATE INDEX solicate_subtasks_task_position_idx ON solicate.subtasks(task_id, position);

CREATE TRIGGER solicate_tasks_updated_at BEFORE UPDATE ON solicate.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER solicate_subtasks_updated_at BEFORE UPDATE ON solicate.subtasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Note: RLS for solicate schema is currently bypassed entirely by the PostgREST anon/auth roles but let's enable it and grant if they ever isolate it.
-- Actually solicate schema has no RLS policies yet. Let's keep it consistent.

GRANT ALL ON solicate.tasks TO anon, authenticated, service_role;
GRANT ALL ON solicate.subtasks TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
