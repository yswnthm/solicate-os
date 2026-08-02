-- 0009: Editing system — every edit records who made it and when.
--
--   * adds updated_by_id to every editable table
--   * set_updated_meta() sets updated_at + updated_by_id on before-update
--   * activity logging for entries/phases/conversations updates
--   * tasks activity trigger now also fires on phase changes
--
-- Activity stays project-scoped (activity_events.project_id is not null), so
-- client/person/message edits are tracked by updated_by_id only, not activity.

-- ─── updated_by_id columns ───────────────────────────────────────────────────

alter table public.clients
  add column updated_by_id uuid references public.app_users(id);

alter table public.people
  add column updated_by_id uuid references public.app_users(id);

alter table public.projects
  add column updated_by_id uuid references public.app_users(id);

alter table public.project_participants
  add column updated_by_id uuid references public.app_users(id);

alter table public.conversations
  add column updated_by_id uuid references public.app_users(id);

alter table public.entries
  add column updated_by_id uuid references public.app_users(id);

alter table public.tasks
  add column updated_by_id uuid references public.app_users(id);

alter table public.issues
  add column updated_by_id uuid references public.app_users(id);

alter table public.phases
  add column updated_by_id uuid references public.app_users(id);

-- messages gets updated_at for the first time (it had none) plus updated_by_id.
alter table public.messages
  add column updated_at timestamptz not null default now(),
  add column updated_by_id uuid references public.app_users(id);

-- ─── set_updated_meta (updated_at + updated_by) ──────────────────────────────

create or replace function public.set_updated_meta() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  new.updated_by_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_meta();

drop trigger if exists people_updated_at on public.people;
create trigger people_updated_at before update on public.people for each row execute function public.set_updated_meta();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_meta();

drop trigger if exists project_participants_updated_at on public.project_participants;
create trigger project_participants_updated_at before update on public.project_participants for each row execute function public.set_updated_meta();

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at before update on public.conversations for each row execute function public.set_updated_meta();

drop trigger if exists entries_updated_at on public.entries;
create trigger entries_updated_at before update on public.entries for each row execute function public.set_updated_meta();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_meta();

drop trigger if exists issues_updated_at on public.issues;
create trigger issues_updated_at before update on public.issues for each row execute function public.set_updated_meta();

drop trigger if exists phases_updated_at on public.phases;
create trigger phases_updated_at before update on public.phases for each row execute function public.set_updated_meta();

drop trigger if exists messages_updated_at on public.messages;
create trigger messages_updated_at before update on public.messages for each row execute function public.set_updated_meta();

-- ─── Entries update activity ─────────────────────────────────────────────────

create or replace function public.log_entry_updated() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.project_id is not null then
    insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
    values (new.project_id, auth.uid(), 'entry', new.id, 'updated', 'Updated ' || new.type || ': ' || new.title);
  end if;
  return new;
end;
$$;

drop trigger if exists entries_log_updated on public.entries;
create trigger entries_log_updated
  after update on public.entries
  for each row when (
    new.title is distinct from old.title
    or new.body_md is distinct from old.body_md
    or new.type is distinct from old.type
    or new.project_id is distinct from old.project_id
    or new.occurred_at is distinct from old.occurred_at
    or new.decision_outcome is distinct from old.decision_outcome
  )
  execute function public.log_entry_updated();

-- ─── Phases activity ─────────────────────────────────────────────────────────

create or replace function public.log_phase_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'phase', new.id, 'created', 'Added phase: ' || new.name);
  return new;
end;
$$;

drop trigger if exists phases_log_created on public.phases;
create trigger phases_log_created
  after insert on public.phases
  for each row execute function public.log_phase_created();

create or replace function public.log_phase_updated() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'phase', new.id, 'updated', 'Updated phase: ' || new.name);
  return new;
end;
$$;

drop trigger if exists phases_log_updated on public.phases;
create trigger phases_log_updated
  after update on public.phases
  for each row when (
    new.name is distinct from old.name
    or new.description is distinct from old.description
    or new.status is distinct from old.status
    or new.position is distinct from old.position
    or new.started_on is distinct from old.started_on
    or new.target_date is distinct from old.target_date
  )
  execute function public.log_phase_updated();

-- ─── Conversations update activity ───────────────────────────────────────────

create or replace function public.log_conversation_updated() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.project_id is not null then
    insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
    values (new.project_id, auth.uid(), 'conversation', new.id, 'updated', 'Updated conversation');
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_log_updated on public.conversations;
create trigger conversations_log_updated
  after update on public.conversations
  for each row when (
    new.title is distinct from old.title
    or new.kind is distinct from old.kind
    or new.channel is distinct from old.channel
    or new.project_id is distinct from old.project_id
  )
  execute function public.log_conversation_updated();

-- ─── Tasks: phase changes should log activity too ────────────────────────────

drop trigger if exists tasks_log_updated on public.tasks;
create trigger tasks_log_updated
  after update on public.tasks
  for each row when (
    new.status is distinct from old.status
    or new.title is distinct from old.title
    or new.description_md is distinct from old.description_md
    or new.priority is distinct from old.priority
    or new.assignee_id is distinct from old.assignee_id
    or new.due_at is distinct from old.due_at
    or new.phase_id is distinct from old.phase_id
  )
  execute function public.log_task_updated();
