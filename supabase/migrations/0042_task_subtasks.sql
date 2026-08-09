-- 0042: lightweight task subtasks (checklist items).
--
-- Subtasks are simple checkable items under a task: title + done + position.
-- They deliberately do NOT carry status/priority/assignee/due_at — those remain
-- task concerns, so phase health, status rollups, the today page, and the AI
-- capture context stay untouched. Deleting a task cascades its subtasks; the
-- "complete the parent when every subtask is done" behaviour is app code, not
-- a trigger.

create table public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_id uuid references public.app_users(id) on delete set null,
  updated_by_id uuid references public.app_users(id) on delete set null
);

create index task_subtasks_task_position_idx
  on public.task_subtasks (task_id, position);

drop trigger if exists task_subtasks_updated_at on public.task_subtasks;
create trigger task_subtasks_updated_at
  before update on public.task_subtasks
  for each row execute function public.set_updated_meta();

-- RLS: workspace isolation via the parent task's project.
alter table public.task_subtasks enable row level security;

create policy "workspace isolation task subtasks"
  on public.task_subtasks
  for all
  to authenticated
  using (
    public.is_active_internal_user()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.project_in_current_workspace(t.project_id)
    )
  )
  with check (
    public.is_active_internal_user()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and public.project_in_current_workspace(t.project_id)
    )
  );
