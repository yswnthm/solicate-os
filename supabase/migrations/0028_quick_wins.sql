-- 0028_quick_wins.sql: Database Handoff — Same-Day Quick Wins
--
-- Low-risk schema improvements:
--   1. Extensions check (pgcrypto, vector, pg_trgm)
--   2. Uniqueness constraints on ai_models, finance_categories, payment_methods
--   3. Table and column comments for structural clarity
--   4. Date-order CHECK constraints on projects and phases

-- ─── 1. Extensions ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── 2. Uniqueness Constraints ───────────────────────────────────────────────

-- Pre-flight deduplication queries:
-- SELECT provider, model_id, count(*) FROM ai_models GROUP BY 1,2 HAVING count(*) > 1;
-- SELECT name, transaction_type, count(*) FROM finance_categories GROUP BY 1,2 HAVING count(*) > 1;
-- SELECT name, count(*) FROM payment_methods GROUP BY 1 HAVING count(*) > 1;

ALTER TABLE public.ai_models
  ADD CONSTRAINT ai_models_provider_model_unique UNIQUE (provider, model_id);

ALTER TABLE public.finance_categories
  ADD CONSTRAINT finance_categories_name_type_unique UNIQUE (name, transaction_type);

ALTER TABLE public.payment_methods
  ADD CONSTRAINT payment_methods_name_unique UNIQUE (name);

-- ─── 3. Table & Column Comments ──────────────────────────────────────────────

COMMENT ON COLUMN public.capture_actions.project_id IS
  'Intentionally text, not uuid FK — AI may propose a project that does not exist yet';

COMMENT ON COLUMN public.capture_actions.phase_id IS
  'Intentionally text, not uuid FK — same reason as project_id';

COMMENT ON COLUMN public.capture_actions.person_id IS
  'Intentionally text, not uuid FK — same reason as project_id';

COMMENT ON TABLE public.finance_items_legacy IS
  'Legacy finance table, being phased out in favor of transactions/transaction_allocations. Do not add new write paths here. See Section 5.3 of database-handoff.md for consolidation plan.';

COMMENT ON TABLE public.ai_summaries IS
  'week_review and project_digest kinds share this table via the kind column + content jsonb pattern';

COMMENT ON TABLE public.capture_sessions IS
  'AI "brain dump to structured actions" flow. See capture_actions for the proposed changes each session generates.';

-- ─── 4. Date-Order CHECK Constraints ─────────────────────────────────────────

-- Pre-flight violation queries:
-- SELECT id, started_on, target_date FROM public.projects WHERE target_date < started_on;
-- SELECT id, started_on, target_date FROM public.phases WHERE target_date < started_on;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_dates_order
  CHECK (target_date IS NULL OR started_on IS NULL OR target_date >= started_on);

ALTER TABLE public.phases
  ADD CONSTRAINT phases_dates_order
  CHECK (target_date IS NULL OR started_on IS NULL OR target_date >= started_on);
