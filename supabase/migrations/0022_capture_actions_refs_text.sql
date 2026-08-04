-- 0022: capture_actions reference columns are text, not uuid.
--
-- The proposer may emit cross-action references like "action:<localId>" so a
-- later action can target a record created by an earlier one (e.g. create a
-- project, then a phase under it). The executor (lib/capture/execute.ts)
-- resolves those references to real ids just before applying. The uuid-typed
-- columns rejected such references at insert time:
--
--   invalid input syntax for type uuid: "action:88c3-1"
--
-- Widen the four ref columns to text. Existing uuid values are preserved
-- verbatim (uuid::text keeps the canonical form), so already-proposed actions
-- still validate and apply.

alter table public.capture_actions
  alter column project_id type text,
  alter column phase_id type text,
  alter column person_id type text,
  alter column ref_id type text;
