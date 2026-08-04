-- 0023: fix mark_ai_summaries_stale for the projects table.
--
-- The 0020 trigger function referenced new.project_id in its default branch,
-- but public.projects has no project_id column — only id. Every insert/update
-- on projects therefore died with:
--
--   record "new" has no field "project_id"
--
-- (e.g. the capture executor's project.update at lib/capture/execute.ts.)
-- The project's own id is the stale scope for the projects table.

create or replace function public.mark_ai_summaries_stale() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_project_id uuid;
begin
  if tg_table_name = 'messages' then
    select c.project_id into v_project_id from public.conversations c where c.id = new.conversation_id;
  elsif tg_table_name = 'projects' then
    v_project_id := new.id;
  else
    v_project_id := coalesce(new.project_id, old.project_id);
  end if;

  update public.ai_summaries
     set is_stale = true
   where is_stale = false
     and ((project_id is null and kind = 'week_review') or project_id = v_project_id);
  return new;
end;
$$;
