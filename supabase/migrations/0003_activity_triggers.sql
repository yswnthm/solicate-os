-- Phase 4: move activity_events + conversations.last_message_at writes into
-- DB triggers so the app records each mutation in a single round trip, atomically.
-- After triggers:
--   * messages insert   → conversations.last_message_at (greatest of sent_at, so
--                         backdated messages can never regress it)
--   * projects update   → "project" activity (archived/completed/updated)
--   * tasks insert      → "task" activity (created)
--   * tasks update      → "task" activity (completed/cancelled/updated)
--   * issues insert     → "issue" activity (created)
--   * issues update     → "issue" activity (resolved/accepted)
--   * entries insert    → "entry" activity (created)
--   * project_participants insert → "participant" activity (created)
--   * conversations insert → "conversation" activity (created, only when a project
--                           is attached since activity_events.project_id is not null)
--
-- actor_id = auth.uid() (the authenticated user), matching what the app wrote.
-- record_id is the REAL record id (the app previously wrote a throwaway UUID).

create or replace function public.touch_conversation_last_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message_at = greatest(coalesce(last_message_at, '-infinity'::timestamptz), new.sent_at)
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_last_message();

-- ─── Projects ────────────────────────────────────────────────────────────────

create or replace function public.log_project_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_event public.activity_event_type;
begin
  v_event := case new.status
    when 'archived' then 'archived'::public.activity_event_type
    when 'completed' then 'completed'::public.activity_event_type
    else 'updated'::public.activity_event_type
  end;
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.id, auth.uid(), 'project', new.id, v_event, 'Project marked ' || new.status);
  return new;
end;
$$;

drop trigger if exists projects_log_status on public.projects;
create trigger projects_log_status
  after update on public.projects
  for each row when (new.status is distinct from old.status)
  execute function public.log_project_status();

-- ─── Tasks ───────────────────────────────────────────────────────────────────

create or replace function public.log_task_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'task', new.id, 'created', 'Created task: ' || new.title);
  return new;
end;
$$;

drop trigger if exists tasks_log_created on public.tasks;
create trigger tasks_log_created
  after insert on public.tasks
  for each row execute function public.log_task_created();

create or replace function public.log_task_updated() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_event public.activity_event_type;
  v_summary text;
begin
  if new.status is distinct from old.status then
    v_event := case new.status
      when 'done' then 'completed'::public.activity_event_type
      when 'cancelled' then 'cancelled'::public.activity_event_type
      else 'updated'::public.activity_event_type
    end;
    v_summary := 'Task ' || replace(new.status::text, '_', ' ');
  else
    v_event := 'updated'::public.activity_event_type;
    v_summary := 'Updated task details';
  end if;
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'task', new.id, v_event, v_summary);
  return new;
end;
$$;

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
  )
  execute function public.log_task_updated();

-- ─── Issues ──────────────────────────────────────────────────────────────────

create or replace function public.log_issue_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'issue', new.id, 'created', 'Opened issue: ' || new.title);
  return new;
end;
$$;

drop trigger if exists issues_log_created on public.issues;
create trigger issues_log_created
  after insert on public.issues
  for each row execute function public.log_issue_created();

create or replace function public.log_issue_resolved() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_event public.activity_event_type;
begin
  -- 'closed' maps to 'accepted' exactly as the app did
  v_event := case new.status
    when 'resolved' then 'resolved'::public.activity_event_type
    else 'accepted'::public.activity_event_type
  end;
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'issue', new.id, v_event, 'Issue ' || new.status || ': ' || left(coalesce(new.resolution_summary, ''), 80));
  return new;
end;
$$;

drop trigger if exists issues_log_resolved on public.issues;
create trigger issues_log_resolved
  after update on public.issues
  for each row when (new.status is distinct from old.status and new.status in ('resolved', 'accepted', 'closed'))
  execute function public.log_issue_resolved();

-- ─── Entries ─────────────────────────────────────────────────────────────────

create or replace function public.log_entry_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'entry', new.id, 'created', 'Added ' || new.type || ': ' || new.title);
  return new;
end;
$$;

drop trigger if exists entries_log_created on public.entries;
create trigger entries_log_created
  after insert on public.entries
  for each row execute function public.log_entry_created();

-- ─── Project participants ────────────────────────────────────────────────────

create or replace function public.log_participant_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'participant', new.person_id, 'created', 'Added project participant');
  return new;
end;
$$;

drop trigger if exists participants_log_created on public.project_participants;
create trigger participants_log_created
  after insert on public.project_participants
  for each row execute function public.log_participant_created();

-- ─── Conversations ───────────────────────────────────────────────────────────

create or replace function public.log_conversation_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.project_id is not null then
    insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
    values (new.project_id, auth.uid(), 'conversation', new.id, 'created', 'Created conversation');
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_log_created on public.conversations;
create trigger conversations_log_created
  after insert on public.conversations
  for each row execute function public.log_conversation_created();
