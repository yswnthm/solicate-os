-- 0061: Colleen Munn — strip phases + tasks; record = person → lead → project only.
--
-- 0060 over-modeled: it created 4 week-phases and 8 tasks for a LEAD with no
-- confirmed scope. Solicate's responsibility here is the growth strategy scope
-- only (send the plan, execute the growth work once agreed). The Month One
-- roadmap lives in the strategy docs
-- (clients/colleen-munn/strategy/colleen-100x-growth-strategy.md), not as DB
-- execution rows. Phases/tasks will be added when Colleen signs and scope is set.

delete from public.tasks where project_id = 'c011eec0-0000-4000-8000-000000000021';
delete from public.phases where project_id = 'c011eec0-0000-4000-8000-000000000021';

-- Reframe the modeling decision: no phases/tasks until scope is confirmed.
update public.entries
set body_md = $str$Entered via Navi (CYCFDesign, existing client referral). Sun Life advisor, Bedford NS. Strategy drafted 9 Aug 2026 (clients/colleen-munn/strategy/): 30-day market-discovery + positioning + authority experiment. Modeled as relationship type 'lead' (source existing_client, referrer Navi) with one project (COLLEEN-M1) for the growth strategy scope. No phases or tasks — the roadmap lives in the strategy docs; add execution rows when scope and revenue are confirmed.$str$,
    decision_outcome = $str$Minimal record: person + lead relationship + project. No phases/tasks until scope/revenue confirmed.$str$
where id = 'c011eec0-0000-4000-8000-000000000401';
