-- 0032: Missing FK indexes (Database Handoff §3.3).
--
-- Postgres does not auto-index foreign key columns. The bulk of the doc's
-- index list already exists across migrations 0001/0002/0007/0010/0021/0024;
-- this migration closes the genuine gaps found in the audit:
--   people.created_by_id, projects.owner_id, conversations.client_id,
--   messages.sender_person_id, messages.sender_user_id, issues.assignee_id,
--   transactions.category_id, transactions.payment_method_id
-- plus audit-FK columns that get JOINed by the activity and editing systems.

create index if not exists idx_people_created_by_id on public.people(created_by_id);
create index if not exists idx_people_updated_by_id on public.people(updated_by_id);

create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_projects_created_by_id on public.projects(created_by_id);

create index if not exists idx_conversations_client_id on public.conversations(client_id);
create index if not exists idx_conversations_created_by_id on public.conversations(created_by_id);

create index if not exists idx_messages_sender_person_id on public.messages(sender_person_id) where sender_person_id is not null;
create index if not exists idx_messages_sender_user_id on public.messages(sender_user_id) where sender_user_id is not null;

create index if not exists idx_issues_assignee_id on public.issues(assignee_id);
create index if not exists idx_issues_created_by_id on public.issues(created_by_id);

create index if not exists idx_tasks_created_by_id on public.tasks(created_by_id);
create index if not exists idx_phases_created_by_id on public.phases(created_by_id);
create index if not exists idx_entries_created_by_id on public.entries(created_by_id);

create index if not exists idx_transactions_category_id on public.transactions(category_id) where category_id is not null;
create index if not exists idx_transactions_payment_method_id on public.transactions(payment_method_id) where payment_method_id is not null;

create index if not exists idx_relationships_updated_by_id on public.relationships(updated_by_id);
create index if not exists idx_activity_events_actor_id on public.activity_events(actor_id);

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT tablename, indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename;
