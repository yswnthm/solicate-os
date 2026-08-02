-- 0007: Project phases — a project can be broken into ordered phases
-- (e.g. CYCFDesign Phase 1–4) and tasks are scoped to a specific phase via tasks.phase_id.

create type public.phase_status as enum ('planned', 'active', 'on_hold', 'completed', 'cancelled');

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  position int not null default 1 check (position >= 1),
  status public.phase_status not null default 'planned',
  started_on date,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id),
  unique (project_id, name)
);

alter table public.tasks
  add column phase_id uuid references public.phases(id) on delete set null;

create index phases_project_position_idx on public.phases(project_id, position);
create index tasks_phase_status_due_idx on public.tasks(phase_id, status, due_at asc);

create trigger phases_updated_at before update on public.phases for each row execute function public.set_updated_at();

alter table public.phases enable row level security;
create policy "active users manage phases" on public.phases for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
