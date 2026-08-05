-- 0039: remove the conversations feature end-to-end.
--
-- Drops conversations, conversation_participants, messages, and message_drafts
-- along with everything that only existed to serve them: message/conversation
-- triggers, activity logging, RLS policies, the workspace helper, provenance
-- FKs, indexes, and the now-unused enums.
--
-- Keep triage_state (entries still use it) and the entity_type enum values
-- 'message'/'conversation' (shared with entity_links/record_history).

-- ─── 1. triggers referencing messages/conversations ─────────────────────────

drop trigger if exists messages_touch_conversation on public.messages;
drop trigger if exists messages_mark_ai_summaries_stale on public.messages;
drop trigger if exists messages_updated_at on public.messages;
drop trigger if exists conversations_log_created on public.conversations;
drop trigger if exists conversations_log_updated on public.conversations;
drop trigger if exists conversations_updated_at on public.conversations;
drop trigger if exists message_drafts_updated_at on public.message_drafts;

-- ─── 2. functions ───────────────────────────────────────────────────────────

drop function if exists public.touch_conversation_last_message();
drop function if exists public.log_conversation_created();
drop function if exists public.log_conversation_updated();

-- mark_ai_summaries_stale is shared by projects/phases/tasks/entries/issues/
-- finance_items triggers (kept). The messages branch referenced conversations,
-- so recreate it without that branch now that the messages trigger is gone.
create or replace function public.mark_ai_summaries_stale() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_project_id uuid;
begin
  if tg_table_name = 'projects' then
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

-- ─── 3. RLS policies + workspace helper ─────────────────────────────────────

drop policy if exists "workspace isolation conversations" on public.conversations;
drop policy if exists "workspace isolation conversation participants" on public.conversation_participants;
drop policy if exists "workspace isolation messages" on public.messages;
drop policy if exists "workspace isolation message drafts" on public.message_drafts;
drop policy if exists "active users manage conversations" on public.conversations;
drop policy if exists "active users manage conversation participants" on public.conversation_participants;
drop policy if exists "active users manage messages" on public.messages;
drop policy if exists "active users manage message drafts" on public.message_drafts;

drop function if exists public.conversation_in_current_workspace(uuid);

-- ─── 4. provenance FKs on kept tables ───────────────────────────────────────

alter table public.entries drop column if exists origin_message_id;
alter table public.tasks drop column if exists origin_message_id;
alter table public.issues drop column if exists origin_message_id;

-- ─── 5. tables ──────────────────────────────────────────────────────────────

drop table if exists public.message_drafts;
drop table if exists public.messages;
drop table if exists public.conversation_participants;
drop table if exists public.conversations;

-- ─── 6. enums ───────────────────────────────────────────────────────────────

drop type if exists public.message_draft_status;
drop type if exists public.message_direction;
drop type if exists public.conversation_kind;
drop type if exists public.conversation_channel;

-- ─── 7. seeded message-drafter AI template ───────────────────────────────────
-- The template (and its versions) only served the removed drafter.

delete from public.ai_template_versions where template_id = '9a000000-0000-4000-8000-000000000001';
delete from public.ai_templates where id = '9a000000-0000-4000-8000-000000000001';

-- ─── Verify ─────────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name IN
--     ('conversations','conversation_participants','messages','message_drafts');
-- expect 0 rows.
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND column_name = 'origin_message_id';
-- expect 0 rows.
