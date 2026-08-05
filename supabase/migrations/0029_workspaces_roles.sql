-- 0029: Workspaces + user roles.
--
-- Multi-workspace tenancy foundation (Database Handoff §4.1 + §4.2):
--   * workspaces table + a "Default Workspace" seed row
--   * workspace_id on the ROOT-level tables — the tables whose records do not
--     derive their workspace from a single parent FK: app_users, people,
--     projects, transactions, conversations, relationships, capture_sessions.
--     Child tables inherit scope through their parent FK (enforced in 0030).
--   * user_role enum on app_users. client_viewer is intentionally deferred
--     until a client portal exists (handoff decision) — owner/admin/member only.
--   * handle_new_user() rewritten to assign the default workspace. This MUST
--     land in the same migration as the NOT NULL column, or new signups fail.
--
-- workspace_id gets a DEFAULT pointing at the default workspace so existing
-- app insert paths keep working unchanged until the app learns to set it
-- explicitly. 0030's RLS with-check still validates the value.

-- ─── 1. workspaces ───────────────────────────────────────────────────────────

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (name)
);

insert into public.workspaces (name) values ('Default Workspace');

-- Resolve the bootstrap workspace id. Used by column defaults and the
-- signup trigger so neither depends on a hardcoded uuid.
create or replace function public.default_workspace_id() returns uuid
language sql stable set search_path = public as $$
  select id from public.workspaces where name = 'Default Workspace' limit 1;
$$;

-- ─── 2. user_role ────────────────────────────────────────────────────────────

create type public.user_role as enum ('owner', 'admin', 'member');

alter table public.app_users add column role public.user_role not null default 'member';

-- Existing operator becomes the owner. Future signups default to member.
update public.app_users set role = 'owner';

-- ─── 3. workspace_id on root-level tables ────────────────────────────────────

alter table public.app_users add column workspace_id uuid references public.workspaces(id);
alter table public.people add column workspace_id uuid references public.workspaces(id);
alter table public.projects add column workspace_id uuid references public.workspaces(id);
alter table public.transactions add column workspace_id uuid references public.workspaces(id);
alter table public.conversations add column workspace_id uuid references public.workspaces(id);
alter table public.relationships add column workspace_id uuid references public.workspaces(id);
alter table public.capture_sessions add column workspace_id uuid references public.workspaces(id);

update public.app_users set workspace_id = public.default_workspace_id();
update public.people set workspace_id = public.default_workspace_id();
update public.projects set workspace_id = public.default_workspace_id();
update public.transactions set workspace_id = public.default_workspace_id();
update public.conversations set workspace_id = public.default_workspace_id();
update public.relationships set workspace_id = public.default_workspace_id();
update public.capture_sessions set workspace_id = public.default_workspace_id();

alter table public.app_users alter column workspace_id set default public.default_workspace_id();
alter table public.people alter column workspace_id set default public.default_workspace_id();
alter table public.projects alter column workspace_id set default public.default_workspace_id();
alter table public.transactions alter column workspace_id set default public.default_workspace_id();
alter table public.conversations alter column workspace_id set default public.default_workspace_id();
alter table public.relationships alter column workspace_id set default public.default_workspace_id();
alter table public.capture_sessions alter column workspace_id set default public.default_workspace_id();

alter table public.app_users alter column workspace_id set not null;
alter table public.people alter column workspace_id set not null;
alter table public.projects alter column workspace_id set not null;
alter table public.transactions alter column workspace_id set not null;
alter table public.conversations alter column workspace_id set not null;
alter table public.relationships alter column workspace_id set not null;
alter table public.capture_sessions alter column workspace_id set not null;

-- Current workspace of the signed-in user. Defined after app_users.workspace_id
-- exists (language sql bodies are validated at creation). Runs as invoker so
-- app_users RLS still applies: a user can only read their own row.
create or replace function public.current_workspace_id() returns uuid
language sql stable set search_path = public as $$
  select workspace_id from public.app_users where id = auth.uid();
$$;

create index app_users_workspace_idx on public.app_users(workspace_id);
create index people_workspace_idx on public.people(workspace_id);
create index projects_workspace_idx on public.projects(workspace_id);
create index transactions_workspace_idx on public.transactions(workspace_id);
create index conversations_workspace_idx on public.conversations(workspace_id);
create index relationships_workspace_idx on public.relationships(workspace_id);
create index capture_sessions_workspace_idx on public.capture_sessions(workspace_id);

-- ─── 4. signup trigger assigns the default workspace ─────────────────────────

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, display_name, is_active, workspace_id)
  values (
    new.id,
    split_part(new.email, '@', 1),
    true,
    public.default_workspace_id()
  );
  return new;
end;
$$;

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT count(*) FROM app_users WHERE workspace_id IS NULL;              -- 0
-- SELECT count(*) FROM people WHERE workspace_id IS NULL;                 -- 0
-- SELECT count(*) FROM projects WHERE workspace_id IS NULL;               -- 0
-- SELECT role, count(*) FROM app_users GROUP BY role;                     -- owner: 1
