-- 0045: task ordering (position) + Stillness phase-3 narrative start/end.
--
-- Tasks previously had no manual ordering — the board sorted by status then
-- due date (features/queries.ts), so a phase read as an arbitrary status-sorted
-- list with no defined start or end. This migration:
--
--   1. Adds tasks.position (nullable; NULL keeps the old status/due_at sort).
--   2. Backfills the Stillness Growth Foundation phase (…503) with a narrative
--      order: kickoff → access → index → on-page → schema → assets →
--      analytics → local → close-out.
--   3. Adds the Day-1 kickoff task (…3031) as the explicit phase start.
--   4. Adds a definition-of-done checklist item to the close-out task (…3029).
--   5. Frames the phase start/end in the phase row + adds a kickoff milestone
--      entry.
--
-- Idempotent: UPDATEs safe to re-run; INSERTs use ON CONFLICT DO NOTHING.

-- ─── 1. Column ──────────────────────────────────────────────────────────────

alter table public.tasks
  add column if not exists position integer;

-- ─── 2. Backfill phase-3 narrative order ────────────────────────────────────
-- record_history triggers write auth.uid() (NULL under migrations) — disable
-- them for the bulk UPDATEs and re-enable after.

alter table public.tasks disable trigger record_history_tasks;

update public.tasks set position = 1 where id = '1ce4a5c0-0000-4000-8000-000000003008';
update public.tasks set position = 2 where id = '1ce4a5c0-0000-4000-8000-000000003004';
update public.tasks set position = 3 where id = '1ce4a5c0-0000-4000-8000-000000003005';
update public.tasks set position = 4 where id = '1ce4a5c0-0000-4000-8000-000000003006';
update public.tasks set position = 5 where id = '1ce4a5c0-0000-4000-8000-000000003007';
update public.tasks set position = 6 where id = '1ce4a5c0-0000-4000-8000-000000003026';
update public.tasks set position = 7 where id = '1ce4a5c0-0000-4000-8000-000000003027';
update public.tasks set position = 8 where id = '1ce4a5c0-0000-4000-8000-000000003029';

alter table public.tasks enable trigger record_history_tasks;

-- ─── 3. Kickoff task (phase start, position 0) ──────────────────────────────

insert into public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) values (
  '1ce4a5c0-0000-4000-8000-000000003031',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000503',
  'Phase kickoff — Day 1: access, baseline, client asks',
  $str$Day 1 of the 09–15 Aug execution sprint. Re-verify all access under work.yeswanth@gmail.com (GSC, GA4, WordPress, Hostinger, Meta/GBP), capture the 55.6/100 audit baseline, and send the client asks (wearestillness.com, corporate logos/testimonials, 10 GBP photos). Gates the entire sprint — client decisions unlock the entity/NAP work.$str$,
  'todo', 'high', 0,
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007010',
       '1ce4a5c0-0000-4000-8000-000000003031',
       $str$Confirm access on work.yeswanth@gmail.com — GSC, GA4, WordPress, Hostinger, Meta/GBP$str$, false, 1,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007011',
       '1ce4a5c0-0000-4000-8000-000000003031',
       $str$Capture 55.6/100 audit baseline$str$, false, 2,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007012',
       '1ce4a5c0-0000-4000-8000-000000003031',
       $str$Send client asks — wearestillness.com decision, corporate logos/testimonials, 10 GBP photos$str$, false, 3,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

-- ─── 4. Definition of done on the close-out task (phase end) ────────────────

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007013',
       '1ce4a5c0-0000-4000-8000-000000003029',
       $str$Definition of done — re-audit improved over 55.6/100, all sprint items shipped by 15 Aug, invoice STILLNESS-007 cleared$str$, false, 4,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

-- ─── 5. Frame the phase start/end ───────────────────────────────────────────

alter table public.phases disable trigger record_history_phases;

update public.phases
set description = description || E'\n\nStart: kickoff task …3031 (Day 1 — access re-verify, 55.6/100 baseline, client asks). End: close-out task …3029 (re-audit + 90-day roadmap + summary report). Acceptance: re-audit improved over 55.6/100, all sprint items shipped by 15 Aug 2026, invoice STILLNESS-007 cleared.',
    scope_acceptance = $str$Phase closes when the foundation items ship; re-audit improved over the 55.6/100 baseline; 90-day roadmap + summary report delivered 15 Aug 2026; invoice STILLNESS-007 cleared.$str$
where id = '1ce4a5c0-0000-4000-8000-000000000503';

alter table public.phases enable trigger record_history_phases;

insert into public.entries (
  id, project_id, phase_id, type, title, body_md, occurred_at, triage_state, created_by_id
) values (
  '1ce4a5c0-0000-4000-8000-000000002037',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000503',
  'milestone',
  'Growth Foundation execution sprint kicked off — Day 1 (09 Aug)',
  $str$Day 1: access re-verified under work.yeswanth@gmail.com (GSC, GA4, WordPress, Hostinger, Meta/GBP), 55.6/100 baseline captured, client asks sent (wearestillness.com, corporate logos/testimonials, 10 GBP photos). Operating plan: clients/stillness-co/work/execution-plan.md. Sprint 09–15 Aug 2026.$str$,
  '2026-08-09T00:00:00Z'::timestamptz, 'filed',
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;
