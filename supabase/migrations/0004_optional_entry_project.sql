-- Phase 1 (M0): allow quick captures without a project.
-- A capture is a thought parked in the inbox; it may not belong to a project
-- yet. The inbox "assign project" flow gives it a home later.

alter table public.entries alter column project_id drop not null;

-- The activity trigger must not write a project-scoped event for a projectless
-- capture (activity_events.project_id is not null).
create or replace function public.log_entry_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.project_id is not null then
    insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
    values (new.project_id, auth.uid(), 'entry', new.id, 'created', 'Added ' || new.type || ': ' || new.title);
  end if;
  return new;
end;
$$;
