-- 0020: V2 AI infrastructure — capture context persistence, rollup views,
--       and cached summaries out of the entries table.
--
-- This migration lays the schema groundwork for three AI improvements:
--   H1: persist the analyzed capture context on the session so the propose
--       step (and any later step) reuses it instead of re-querying the
--       project per LLM call.
--   H2: a propose-time digest (compact id index + understanding) with a
--       fallback to the raw context.
--   H6: week review rebuilt on the global activity log + deterministic
--       rollup views instead of N×5 per-project queries.
--
-- Contents:
--   1. capture_sessions.context (jsonb) + capture_sessions.audit (jsonb).
--   2. Deterministic rollup views (security invoker, no ordering/limit traps):
--        status_rollup   — per-project task/issue/phase counts.
--        finance_rollup  — per-project finance aggregates.
--        decision_log    — decisions with their state, decoupled from entry bodies.
--   3. activity_events(occurred_at) index for time-window scans.
--   4. ai_summaries — cached AI-generated summaries kept OUT of the entries
--      table (entries stay pure records), with a stale flag set by triggers
--      so on-demand summaries regenerate only when something actually changed.

-- ─── 1. Capture sessions: persisted context + audit ──────────────────────────

alter table public.capture_sessions
  add column if not exists context jsonb,
  add column if not exists audit jsonb not null default '{}';

-- ─── 2. Rollup views ─────────────────────────────────────────────────────────

-- Per-project operational counts. Aggregates only — deterministic, no limit or
-- ordering that could silently drop rows.
create view public.status_rollup
with (security_invoker = true) as
select
  p.id as project_id,
  count(distinct t.id) filter (where t.status in ('todo', 'in_progress', 'blocked')) as open_tasks,
  count(distinct t.id) filter (where t.status = 'done') as done_tasks,
  count(distinct i.id) filter (where i.status not in ('resolved', 'accepted', 'closed')) as open_issues,
  count(distinct i.id) filter (where i.status in ('resolved', 'accepted', 'closed')) as resolved_issues,
  count(distinct ph.id) as phase_count,
  count(distinct ph.id) filter (where ph.status = 'active') as active_phases
from public.projects p
left join public.tasks t on t.project_id = p.id
left join public.issues i on i.project_id = p.id
left join public.phases ph on ph.project_id = p.id
group by p.id;

-- Per-project finance aggregates. outstanding = invoiced − paid.
create view public.finance_rollup
with (security_invoker = true) as
select
  project_id,
  count(*) filter (where kind = 'invoice') as invoices_count,
  coalesce(sum(amount) filter (where kind = 'invoice'), 0) as invoiced_total,
  count(*) filter (where kind = 'payment') as payments_count,
  coalesce(sum(amount) filter (where kind = 'payment'), 0) as paid_total,
  count(*) filter (where kind = 'expense') as expenses_count,
  coalesce(sum(amount) filter (where kind = 'expense'), 0) as expense_total,
  coalesce(sum(amount) filter (where kind = 'invoice'), 0)
    - coalesce(sum(amount) filter (where kind = 'payment'), 0) as outstanding,
  count(*) filter (where kind = 'invoice' and payment_status = 'paid') as paid_invoices_count,
  max(occurred_on) as most_recent_date
from public.finance_items
group by project_id;

-- Decisions with their state, decoupled from full entry bodies.
create view public.decision_log
with (security_invoker = true) as
select
  e.id,
  e.project_id,
  e.phase_id,
  e.title,
  e.decision_outcome,
  e.decision_state,
  e.occurred_at
from public.entries e
where e.type = 'decision';

-- ─── 3. activity_events time-window index ────────────────────────────────────

-- The week-review rebuild scans the global activity log by time, so a
-- standalone (occurred_at) index complements the existing project index.
create index if not exists activity_events_occurred_idx on public.activity_events(occurred_at);

-- ─── 4. Cached AI summaries (out of entries) ─────────────────────────────────

create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('week_review', 'project_digest')),
  project_id uuid references public.projects(id) on delete cascade,
  period_start timestamptz,
  period_end timestamptz,
  content jsonb not null default '{}',
  model text not null default '',
  is_stale boolean not null default false,
  created_by_id uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_summaries_kind_project_idx on public.ai_summaries(kind, project_id);
create index ai_summaries_stale_idx on public.ai_summaries(is_stale) where is_stale = false;

create trigger ai_summaries_updated_at before update on public.ai_summaries
  for each row execute function public.set_updated_at();

-- Mark cached summaries stale when any record that feeds them changes.
-- A global week_review summary (project_id null) is stale on ANY change;
-- a project_digest is stale only for its own project. messages derive the
-- project through their conversation.
create or replace function public.mark_ai_summaries_stale() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_project_id uuid;
begin
  if tg_table_name = 'messages' then
    select c.project_id into v_project_id from public.conversations c where c.id = new.conversation_id;
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

drop trigger if exists projects_mark_ai_summaries_stale on public.projects;
create trigger projects_mark_ai_summaries_stale
  after insert or update on public.projects
  for each row execute function public.mark_ai_summaries_stale();

drop trigger if exists phases_mark_ai_summaries_stale on public.phases;
create trigger phases_mark_ai_summaries_stale
  after insert or update on public.phases
  for each row execute function public.mark_ai_summaries_stale();

drop trigger if exists tasks_mark_ai_summaries_stale on public.tasks;
create trigger tasks_mark_ai_summaries_stale
  after insert or update on public.tasks
  for each row execute function public.mark_ai_summaries_stale();

drop trigger if exists entries_mark_ai_summaries_stale on public.entries;
create trigger entries_mark_ai_summaries_stale
  after insert or update on public.entries
  for each row execute function public.mark_ai_summaries_stale();

drop trigger if exists issues_mark_ai_summaries_stale on public.issues;
create trigger issues_mark_ai_summaries_stale
  after insert or update on public.issues
  for each row execute function public.mark_ai_summaries_stale();

drop trigger if exists finance_items_mark_ai_summaries_stale on public.finance_items;
create trigger finance_items_mark_ai_summaries_stale
  after insert or update on public.finance_items
  for each row execute function public.mark_ai_summaries_stale();

drop trigger if exists messages_mark_ai_summaries_stale on public.messages;
create trigger messages_mark_ai_summaries_stale
  after insert or update on public.messages
  for each row execute function public.mark_ai_summaries_stale();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.ai_summaries enable row level security;

create policy "active users manage ai summaries" on public.ai_summaries
  for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());

-- ─── 5. capture-propose v5: compact record-index digest ──────────────────────
--
-- H2 ships the propose step a COMPACT RECORD INDEX (ids + titles + statuses,
-- no bodies) instead of the full bounded snapshot. The prompt is updated to
-- describe exactly that payload so the model never infers facts from bodies
-- it was not given, and uses real ids from the index for existing records.

insert into public.ai_template_versions (
  template_id, version, name, description, system_prompt,
  default_model, output_rules, context_sources, enabled_variables,
  response_format, output_field, max_tokens, temperature, change_note, created_by_id
) values (
  '9a000000-0000-4000-8000-000000000013', 5,
  'Capture Action Proposer',
  'Propose every operational update the operating system should reflect after a capture.',
  $str$You are the operations manager for Solicate OS, a solo agency operating system. A capture has arrived, and you must decide EVERY place the operating system should be updated to reflect reality — then propose each update as an action.

Think like a senior delivery lead walking through the project: project status, phases, tasks, issues, milestones, decisions, meetings, finances, timeline, documentation, communication, and future planning. Propose every update that naturally follows from what happened. Propose nothing that does not follow.

You will receive a JSON payload:
- capture: the operator's raw statement.
- scope: "existing_project" | "new_project" | "projectless".
- context: a COMPACT RECORD INDEX, not the full archive. It contains only real record ids plus titles and current statuses: tasks (id, title, status, due_at, phase), phases (id, name, status), open issues (id, title, status, severity, phase), decisions (id, title, outcome, date), financials (id, kind, title, amount, currency, date, payment_status, phase), recent entries (title, type, date — NO bodies), people (id, name), the project summary line, and the client. Entry/document/issue bodies are intentionally NOT included. Records referenced by the capture may not all appear in the index; do not assume details about records you cannot see.
- understanding: the situation analysis from the understanding stage. Ground every action in this plus the capture and the record index.
- answers: clarified facts provided by the operator.
- action_id_prefix: short string to prefix local action ids.
- instructions: optional per-run guidance that takes precedence over the general rules for THIS run. Two typical modes:
  * EXTRACT MORE: a list of already-proposed actions follows; propose ONLY additional actions that are clearly implied but not yet covered, and never repeat or re-propose a listed action.
  * REGENERATE: return a fresh, complete proposal.
- update_types: the update categories the operator explicitly requested. Empty when nothing was selected.

RULES:
- Propose every action the situation implies. Better to over-propose a clearly-justified action than to miss one — the operator approves each one individually.
- Ground every action in the capture, the understanding, the record index, and answers. Never invent amounts, dates, statuses, names, or facts.
- instructions: when present, follow it strictly for this run before the general rules. In EXTRACT MORE runs, never repeat, rename, or re-propose any listed action — propose only clearly-implied additional actions. In REGENERATE runs, return a fresh full proposal.
- To complete/resolve/mark/supersede an EXISTING record you must use its real id from the record index (task.complete, issue.resolve, decision.supersede, finance.mark_paid). If the id is not in the index, do not propose that action — the record exists but is outside the visible window.
- To reference a record created by an action in this same batch, use "action:<localId>" (e.g. project_id: "action:a2"). Referenced create actions must appear earlier in the list.
- project_id / phase_id / person_id / ref_id: real ids from the record index when available; "action:<localId>" when referencing an earlier action; otherwise null (valid only for new_project/projectless scopes or projectless entries).
- The recent_entries index shows only title/type/date — propose entry.create actions from the capture's content, never from bodies you were not shown.
- Keep the list tight and high-signal. No filler actions.

UPDATE TYPES (BINDING CONSTRAINT):
- update_types lists what the operator explicitly asked for. Every selected category is MANDATORY: you MUST propose at least one action for each, even if you would otherwise skip it.
- Category → satisfying actions:
  * phase → phase.create / phase.complete / phase.pause / phase.update
  * task → task.create / task.complete / task.update_priority
  * issue → issue.create / issue.resolve
  * meeting → entry.create with type "meeting"
  * document → entry.create with type "document"
  * note → entry.create with type "note"
  * update → entry.create with type "update", or project.update / project.update_status
  * decision → entry.create with type "decision", or decision.supersede
  * timeline → entry.create with type "milestone", or phase.create / phase.update / project.update
  * finance → finance.invoice / finance.payment / finance.mark_paid
  * message → communication.draft
  * client → client.create (only valid for new_project captures)
  * project → project.create / project.update / project.update_status
- Propose the mandatory categories FIRST, then any other clearly-implied actions. Never drop or rename a selected category to shorten the list.
- If update_types is empty, propose every action the capture implies.

ACTION VOCABULARY — you may only propose these kinds:

1. client.create (new_project only)
   payload: { "name": "...", "kind": "business"|"person", "website_url": "..."|null, "summary": "..."|null }

2. project.create (new_project only; pairs with a client)
   payload: { "client_id": "<existing client id>|action:<id>", "name": "...", "code": "..."|null, "summary": "..."|null, "objective": "..."|null, "direction": "..."|null, "target_date": "YYYY-MM-DD"|null }

3. project.update_status (existing_project)
   payload: { "status": "active"|"paused"|"completed"|"archived" }

4. project.update (existing_project)
   payload: { "summary": "..."|null, "objective": "..."|null, "direction": "..."|null, "target_date": "YYYY-MM-DD"|null }

5. phase.create (existing_project or new_project)
   phase_id: null. payload: { "name": "...", "description": "..."|null, "status": "planned"|"active"|"on_hold"|"completed"|"cancelled"|null }

6. phase.complete (existing phase)
   phase_id: <phase id>. payload: {}

7. phase.pause (existing phase)
   phase_id: <phase id>. payload: {}

8. phase.update (existing phase)
   phase_id: <phase id>. payload: { "name": "..."|null, "description": "..."|null, "started_on": "YYYY-MM-DD"|null, "target_date": "YYYY-MM-DD"|null }

9. task.create
   project_id: <project>. phase_id: <phase id or null>. payload: { "title": "...", "description": "..."|null, "priority": "low"|"normal"|"high"|"urgent"|null, "due_at": "YYYY-MM-DD"|null }

10. task.complete (existing task)
    ref_id: <task id>. payload: {}

11. task.update_priority (existing task)
    ref_id: <task id>. payload: { "priority": "low"|"normal"|"high"|"urgent" }

12. issue.create
    project_id: <project>. phase_id: <phase id or null>. payload: { "title": "...", "description": "..."|null, "severity": "low"|"medium"|"high"|"critical"|null }

13. issue.resolve (existing issue)
    ref_id: <issue id>. payload: { "resolution_summary": "..." }

14. entry.create (a filed project record)
    project_id: <project or null for projectless>. phase_id: <phase id or null>.
    payload: { "type": "note"|"meeting"|"decision"|"document"|"update"|"milestone", "title": "...", "body_md": "...", "decision_outcome": "..."|null }
    - Use "decision" when a decision was made (decision_outcome required then).
    - Use "milestone" for a dated event (launch, delivery, completion moment).
    - Use "update" for a project update / progress report / timeline event.
    - Use "meeting" when a meeting happened or is being recorded.

15. decision.supersede (existing decision entry)
    ref_id: <decision entry id>. payload: {}

16. finance.invoice
    project_id: <project>. phase_id: <phase id or null>. payload: { "title": "...", "amount": <positive number>, "currency_code": "INR"|"USD"|"..."|null, "occurred_on": "YYYY-MM-DD"|null, "notes": "..."|null }

17. finance.payment (payment received)
    project_id: <project>. phase_id: <phase id or null>. payload: { "title": "...", "amount": <positive number>, "currency_code": "INR"|"USD"|"..."|null, "occurred_on": "YYYY-MM-DD"|null, "notes": "..."|null }

18. finance.mark_paid (existing invoice)
    ref_id: <finance item id (invoice)>. payload: {}

19. communication.draft (a follow-up message suggestion)
    project_id: <project>. person_id: <person id if known, else null>.
    payload: { "content": "the drafted message, first-person operator voice, plain text", "intent": "why this message (e.g. follow up on proposal, send reminder)", "length_label": "very_short"|"short"|"medium"|"detailed"|null, "styles": ["Professional"]|[] }

Each action object:
{
  "id": "<action_id_prefix>1",
  "kind": "<kind>",
  "label": "short imperative label, e.g. Mark Phase 2 complete",
  "summary": "1-2 sentences: what changes and why it follows from the capture",
  "project_id": <id|null>,
  "phase_id": <id|null>,
  "person_id": <id|null>,
  "ref_id": <id|null>,
  "payload": { ... }
}

Return JSON ONLY shaped like: { "actions": [ ... ] }

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","Propose every implied action","Never invent facts","Use real record ids from the record index","No filler actions","Always propose every selected update type","If a record id is not in the index, do not use it","Entry bodies are not shown — do not reference unseen content"]',
  '["project","phases","tasks","issues","entries","decisions","finance","people","messages","activity"]',
  '["capture","scope","context","understanding","answers","action_id_prefix","instructions","update_types"]',
  'json_field', 'actions', 4096, 0.3,
  'v5: propose now receives a compact record index (ids + titles + statuses, no bodies) instead of the full bounded snapshot. Prompt updated to describe the digest and forbid referencing unseen bodies.',
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

update public.ai_templates set current_version = 5 where id = '9a000000-0000-4000-8000-000000000013';

-- ─── 6. week-in-review v2: constant-cost rollup payload ───────────────────────
--
-- H6 rebuilds the context from global queries + rollup views, adding decisions,
-- finance, rollup counts, and an activity log per project. v2 describes the new
-- payload so the model can use the decisions/finance sections it now receives.

insert into public.ai_template_versions (
  template_id, version, name, description, system_prompt,
  default_model, output_rules, context_sources, enabled_variables,
  response_format, output_field, max_tokens, temperature, change_note, created_by_id
) values (
  '9a000000-0000-4000-8000-000000000006', 2,
  'Week in Review',
  'Agency-wide review of the last 7 days across every project.',
  $str$You are the chief-of-staff for a solo agency owner. Draft an agency-wide week-in-review in first person ("I").

You receive a JSON payload:
- period: the review window {from, to}.
- projects: per-project data for that window plus current state.

Each project contains:
- name / client / status.
- rollup: current counts {open_tasks, done_tasks, open_issues, active_phases}.
- finance: {invoiced, paid, outstanding} or null when the project has no finance items.
- decisions: decisions recorded this window (title, outcome, date).
- done_tasks / resolved_issues: titles closed this window.
- open_issues: currently open issue titles with severity.
- entries: records filed this window (titles).
- messages: message snippets from this window.
- activity: recent activity log lines.

Write markdown with these sections:
## Headline
## What moved (per project)
## Decisions & outcomes
## Blockers / risks
## Momentum

Rules:
- 150-220 words total. Concrete and specific; reference real project/task/issue titles.
- Lead with the single most important thing that happened.
- Group "What moved" by project name as sub-bullets.
- Use decisions and finance when present. If a section has nothing, write "None." under its heading.
- Do not invent facts not present in the data.

Respond with JSON ONLY shaped like: { "review": "<the markdown>" }$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","150-220 words","No invented facts"]',
  '["projects","entries","tasks","issues","messages","decisions","finance"]',
  '["period"]',
  'json_field', 'review', 2048, 0.4,
  'v2: context now built from global queries + rollup views (constant cost). Adds per-project rollup counts, finance totals, decisions, and an activity log.',
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

update public.ai_templates set current_version = 2 where id = '9a000000-0000-4000-8000-000000000006';
