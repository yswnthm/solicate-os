-- 0031: Universal entity links + record history (Database Handoff §4.4 + §4.5).
--
--   1. entity_links — open-ended many-to-many relationships between any two
--      entity types (blocks / duplicates / references / discussed-in …).
--      Dedicated provenance FKs (entries.origin_message_id, tasks.origin_entry_id)
--      are untouched; entity_links is only for links that don't have a home.
--      Polymorphic ids carry no native FK enforcement — the app layer must
--      insert valid (type, id) pairs. A validation trigger is added when a
--      second developer starts writing here (handoff decision).
--   2. record_history — generic before-update audit. The trigger diffs every
--      column except audit meta and records {from, to} per changed field.
--      Wired into transactions, phases, tasks, issues now; the same function
--      covers any table by passing its entity_type.

-- ─── 1. enums ────────────────────────────────────────────────────────────────

create type public.entity_type as enum (
  'person', 'project', 'phase', 'task', 'issue', 'entry',
  'message', 'conversation', 'transaction', 'capture_session'
);

create type public.entity_link_type as enum (
  'relates_to', 'originated_from', 'blocks', 'blocked_by',
  'duplicates', 'references', 'resolves', 'attached_to'
);

-- ─── 2. entity_links ─────────────────────────────────────────────────────────

create table public.entity_links (
  id uuid primary key default gen_random_uuid(),
  source_type public.entity_type not null,
  source_id uuid not null,
  target_type public.entity_type not null,
  target_id uuid not null,
  link_type public.entity_link_type not null default 'relates_to',
  note text not null default '',
  created_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id),
  constraint entity_links_no_self_link check (not (source_type = target_type and source_id = target_id)),
  constraint entity_links_unique unique (source_type, source_id, target_type, target_id, link_type)
);

create index entity_links_source_idx on public.entity_links(source_type, source_id);
create index entity_links_target_idx on public.entity_links(target_type, target_id);

alter table public.entity_links enable row level security;
create policy "active users manage entity links" on public.entity_links
  for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());

-- ─── 3. record_history ───────────────────────────────────────────────────────

create table public.record_history (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id uuid not null,
  changed_by_id uuid not null references public.app_users(id),
  diff jsonb not null,
  changed_at timestamptz not null default now()
);

create index idx_record_history_entity on public.record_history(entity_type, entity_id);

-- Generic audit function. Compares every column except audit meta and writes a
-- {field: {from, to}} diff. Pass the entity_type as the first trigger argument.
create or replace function public.log_record_history() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_before jsonb;
  v_after  jsonb;
  v_diff   jsonb := '{}';
  v_key    text;
  v_old    jsonb;
  v_new    jsonb;
begin
  v_before := to_jsonb(old) - 'created_at' - 'updated_at' - 'created_by_id' - 'updated_by_id';
  v_after  := to_jsonb(new) - 'created_at' - 'updated_at' - 'created_by_id' - 'updated_by_id';

  for v_key in
    select k from (
      select jsonb_object_keys(v_before) as k
      union
      select jsonb_object_keys(v_after) as k
    ) keys
  loop
    v_old := v_before -> v_key;
    v_new := v_after  -> v_key;
    if v_old is distinct from v_new then
      v_diff := jsonb_set(v_diff, array[v_key], jsonb_build_object('from', v_old, 'to', v_new));
    end if;
  end loop;

  if v_diff <> '{}'::jsonb then
    insert into public.record_history (entity_type, entity_id, changed_by_id, diff)
    values (TG_ARGV[0]::public.entity_type, new.id, auth.uid(), v_diff);
  end if;

  return new;
end;
$$;

create trigger record_history_transactions
  before update on public.transactions
  for each row execute function public.log_record_history('transaction');
create trigger record_history_phases
  before update on public.phases
  for each row execute function public.log_record_history('phase');
create trigger record_history_tasks
  before update on public.tasks
  for each row execute function public.log_record_history('task');
create trigger record_history_issues
  before update on public.issues
  for each row execute function public.log_record_history('issue');

-- Reads: internal users. Writes: the security-definer trigger above (and the
-- service role) — no client write policy, so history can't be forged through
-- the API.
alter table public.record_history enable row level security;
create policy "active users read record history" on public.record_history
  for select using (public.is_active_internal_user());

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- UPDATE tasks SET status = 'in_progress' WHERE id = '<task id>';
-- SELECT entity_type, entity_id, diff FROM record_history ORDER BY changed_at DESC;
-- expect one row with {"status": {"from": "todo", "to": "in_progress"}}
