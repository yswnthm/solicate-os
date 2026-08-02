-- Performance review follow-up indexes.
-- Covers the read paths that current indexes do not serve.

-- /today issues widget: filters by status only, orders by reported_at desc.
create index issues_status_reported_idx on public.issues(status, reported_at desc);

-- /today "Recent Projects" + /projects list: filters status, orders updated_at desc.
create index projects_status_updated_idx on public.projects(status, updated_at desc);

-- /inbox + /today inbox widgets: filter triage_state, order by time.
create index messages_triage_sent_idx on public.messages(triage_state, sent_at desc);
create index entries_triage_occurred_idx on public.entries(triage_state, occurred_at desc);

-- /projects/[id] conversations: filter project, order by last message.
create index conversations_project_lastmsg_idx on public.conversations(project_id, last_message_at desc);
