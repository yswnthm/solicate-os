-- 0030: Workspace-isolation RLS (Database Handoff §4.3).
--
-- Replaces the flat "any active internal user can read/write everything"
-- policies with workspace-scoped ones. The `is_active_internal_user()` gate is
-- retained everywhere — workspace isolation is about WHICH workspace, the
-- active-user gate is about WHO is allowed in at all.
--
--   * Root tables (own workspace_id column)      → workspace_id = current
--   * Child tables                               → scope up through parent FK
--   * Projectless records (entries, summaries)   → creator's workspace, or
--                                                  global for AI memory chunks
--   * Config/reference tables                    → stay flat (internal only)
--
-- IMPORTANT: v_project_finance / v_person_finance (0024) were created WITHOUT
-- security_invoker, meaning they run as definer and would BYPASS these
-- policies. They are redefined here with security_invoker so base-table RLS
-- applies. Without this, workspace isolation silently leaks across tenants.

-- ─── 1. scoping helpers ──────────────────────────────────────────────────────

create or replace function public.project_in_current_workspace(p_id uuid) returns boolean
language sql stable set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_id and p.workspace_id = public.current_workspace_id()
  );
$$;

create or replace function public.conversation_in_current_workspace(c_id uuid) returns boolean
language sql stable set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = c_id and c.workspace_id = public.current_workspace_id()
  );
$$;

create or replace function public.transaction_in_current_workspace(t_id uuid) returns boolean
language sql stable set search_path = public as $$
  select exists (
    select 1 from public.transactions t
    where t.id = t_id and t.workspace_id = public.current_workspace_id()
  );
$$;

create or replace function public.user_in_current_workspace(u_id uuid) returns boolean
language sql stable set search_path = public as $$
  select exists (
    select 1 from public.app_users u
    where u.id = u_id and u.workspace_id = public.current_workspace_id()
  );
$$;

-- ─── 2. finance views: re-run under the caller (RLS applies) ─────────────────

create or replace view public.v_project_finance
with (security_invoker = true) as
select
  ta.id                  as allocation_id,
  ta.transaction_id,
  ta.project_id,
  ta.phase_id,
  ta.target,
  ta.amount              as allocated_amount,
  ta.notes               as allocation_notes,
  t.type,
  t.status,
  t.invoice_status,
  t.invoice_number,
  t.invoice_sent_at,
  t.invoice_cleared_at,
  t.transaction_date,
  t.currency_code,
  t.reference_number,
  t.notes                as transaction_notes,
  t.from_person_id,
  t.to_person_id,
  t.from_user_id,
  t.to_user_id,
  t.created_at,
  fc.name                as category_name
from public.transaction_allocations ta
join public.transactions t  on t.id = ta.transaction_id
left join public.finance_categories fc on fc.id = t.category_id
where ta.project_id is not null;

create or replace view public.v_person_finance
with (security_invoker = true) as
select
  person_id,
  direction,
  currency_code,
  sum(amount) as total
from (
  select
    from_person_id as person_id,
    'received_from_them' as direction,
    amount,
    currency_code
  from public.transactions
  where status = 'completed' and from_person_id is not null

  union all

  select
    to_person_id as person_id,
    'paid_to_them' as direction,
    amount,
    currency_code
  from public.transactions
  where status = 'completed' and to_person_id is not null
) sub
group by person_id, direction, currency_code;

-- ─── 3. workspaces: readable by active internal users, writable only by
-- service role (no write policy). `default_workspace_id()` depends on this
-- read policy, since column defaults evaluate under the invoking user. ────────

alter table public.workspaces enable row level security;
create policy "active users read workspaces" on public.workspaces
  for select using (public.is_active_internal_user());

-- ─── 4. root tables: direct workspace_id match ───────────────────────────────

drop policy if exists "active users manage people" on public.people;
create policy "workspace isolation people" on public.people
  for all
  using (public.is_active_internal_user() and workspace_id = public.current_workspace_id())
  with check (public.is_active_internal_user() and workspace_id = public.current_workspace_id());

drop policy if exists "active users manage projects" on public.projects;
create policy "workspace isolation projects" on public.projects
  for all
  using (public.is_active_internal_user() and workspace_id = public.current_workspace_id())
  with check (public.is_active_internal_user() and workspace_id = public.current_workspace_id());

drop policy if exists "active users manage conversations" on public.conversations;
create policy "workspace isolation conversations" on public.conversations
  for all
  using (public.is_active_internal_user() and workspace_id = public.current_workspace_id())
  with check (public.is_active_internal_user() and workspace_id = public.current_workspace_id());

drop policy if exists "active users manage relationships" on public.relationships;
create policy "workspace isolation relationships" on public.relationships
  for all
  using (public.is_active_internal_user() and workspace_id = public.current_workspace_id())
  with check (public.is_active_internal_user() and workspace_id = public.current_workspace_id());

drop policy if exists "active users manage transactions" on public.transactions;
create policy "workspace isolation transactions" on public.transactions
  for all
  using (public.is_active_internal_user() and workspace_id = public.current_workspace_id())
  with check (public.is_active_internal_user() and workspace_id = public.current_workspace_id());

drop policy if exists "active users manage capture sessions" on public.capture_sessions;
create policy "workspace isolation capture sessions" on public.capture_sessions
  for all
  using (public.is_active_internal_user() and workspace_id = public.current_workspace_id())
  with check (public.is_active_internal_user() and workspace_id = public.current_workspace_id());

-- ─── 5. child tables: scope through parent FK ─────────────────────────────────

drop policy if exists "active users manage project participants" on public.project_participants;
create policy "workspace isolation project participants" on public.project_participants
  for all
  using (public.is_active_internal_user() and public.project_in_current_workspace(project_id))
  with check (public.is_active_internal_user() and public.project_in_current_workspace(project_id));

drop policy if exists "active users manage conversation participants" on public.conversation_participants;
create policy "workspace isolation conversation participants" on public.conversation_participants
  for all
  using (public.is_active_internal_user() and public.conversation_in_current_workspace(conversation_id))
  with check (public.is_active_internal_user() and public.conversation_in_current_workspace(conversation_id));

drop policy if exists "active users manage messages" on public.messages;
create policy "workspace isolation messages" on public.messages
  for all
  using (public.is_active_internal_user() and public.conversation_in_current_workspace(conversation_id))
  with check (public.is_active_internal_user() and public.conversation_in_current_workspace(conversation_id));

drop policy if exists "active users manage phases" on public.phases;
create policy "workspace isolation phases" on public.phases
  for all
  using (public.is_active_internal_user() and public.project_in_current_workspace(project_id))
  with check (public.is_active_internal_user() and public.project_in_current_workspace(project_id));

drop policy if exists "active users manage tasks" on public.tasks;
create policy "workspace isolation tasks" on public.tasks
  for all
  using (public.is_active_internal_user() and public.project_in_current_workspace(project_id))
  with check (public.is_active_internal_user() and public.project_in_current_workspace(project_id));

drop policy if exists "active users manage issues" on public.issues;
create policy "workspace isolation issues" on public.issues
  for all
  using (public.is_active_internal_user() and public.project_in_current_workspace(project_id))
  with check (public.is_active_internal_user() and public.project_in_current_workspace(project_id));

drop policy if exists "active users manage activity events" on public.activity_events;
create policy "workspace isolation activity events" on public.activity_events
  for all
  using (public.is_active_internal_user() and public.project_in_current_workspace(project_id))
  with check (public.is_active_internal_user() and public.project_in_current_workspace(project_id));

-- entries: project-scoped normally; projectless (inbox) entries belong to the
-- workspace of whoever created them.
drop policy if exists "active users manage entries" on public.entries;
create policy "workspace isolation entries" on public.entries
  for all
  using (
    public.is_active_internal_user()
    and (
      public.project_in_current_workspace(project_id)
      or (project_id is null and public.user_in_current_workspace(created_by_id))
    )
  )
  with check (
    public.is_active_internal_user()
    and (
      public.project_in_current_workspace(project_id)
      or (project_id is null and public.user_in_current_workspace(created_by_id))
    )
  );

-- transaction_allocations: always belong to their transaction's workspace.
drop policy if exists "active users manage transaction allocations" on public.transaction_allocations;
create policy "workspace isolation transaction allocations" on public.transaction_allocations
  for all
  using (public.is_active_internal_user() and public.transaction_in_current_workspace(transaction_id))
  with check (public.is_active_internal_user() and public.transaction_in_current_workspace(transaction_id));

-- capture_actions: scope through their session.
drop policy if exists "active users manage capture actions" on public.capture_actions;
create policy "workspace isolation capture actions" on public.capture_actions
  for all
  using (
    public.is_active_internal_user()
    and exists (
      select 1 from public.capture_sessions cs
      where cs.id = capture_actions.session_id
        and cs.workspace_id = public.current_workspace_id()
    )
  )
  with check (
    public.is_active_internal_user()
    and exists (
      select 1 from public.capture_sessions cs
      where cs.id = capture_actions.session_id
        and cs.workspace_id = public.current_workspace_id()
    )
  );

-- message_drafts: project-scoped (project_id is NOT NULL).
drop policy if exists "active users manage message drafts" on public.message_drafts;
create policy "workspace isolation message drafts" on public.message_drafts
  for all
  using (public.is_active_internal_user() and public.project_in_current_workspace(project_id))
  with check (public.is_active_internal_user() and public.project_in_current_workspace(project_id));

-- semantic_chunks / ai_summaries: project-scoped; projectless (global AI
-- memory / week_review rollups) are shared across the internal team.
drop policy if exists "active users manage semantic chunks" on public.semantic_chunks;
create policy "workspace isolation semantic chunks" on public.semantic_chunks
  for all
  using (
    public.is_active_internal_user()
    and (project_id is null or public.project_in_current_workspace(project_id))
  )
  with check (
    public.is_active_internal_user()
    and (project_id is null or public.project_in_current_workspace(project_id))
  );

drop policy if exists "active users manage ai summaries" on public.ai_summaries;
create policy "workspace isolation ai summaries" on public.ai_summaries
  for all
  using (
    public.is_active_internal_user()
    and (project_id is null or public.project_in_current_workspace(project_id))
  )
  with check (
    public.is_active_internal_user()
    and (project_id is null or public.project_in_current_workspace(project_id))
  );

-- ─── 6. config / reference / per-user tables stay flat (internal only) ────────
-- finance_categories, payment_methods, ai_templates, ai_template_versions,
-- ai_models: shared application config, not client data. Existing policies are
-- already exactly as strict as they can be with no client_viewer role.
-- ai_usage and error_logs keep their per-user / internal-read policies too.

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- Sign in as a member in workspace A and confirm they cannot read a row in
-- workspace B on any table in sections 4–5. Service role access is unchanged
-- (bypassrls): SELECT is_active_internal_user(), current_workspace_id();
-- REVOKE nothing — confirm via the service key that cross-workspace rows are
-- still queryable for backend jobs.
