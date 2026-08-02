create extension if not exists "pgcrypto";

create type public.client_kind as enum ('business', 'person');
create type public.client_status as enum ('active', 'inactive', 'archived');
create type public.project_status as enum ('active', 'paused', 'completed', 'archived');
create type public.participant_role as enum ('client_contact', 'partner', 'collaborator');
create type public.communication_mode as enum ('solicate_leads', 'partner_leads', 'shared', 'advisory_only');
create type public.financial_arrangement as enum ('none', 'referral_commission', 'revenue_share', 'delivery_split', 'fixed_fee');
create type public.payment_status as enum ('not_applicable', 'pending', 'partially_paid', 'paid', 'disputed');
create type public.task_status as enum ('todo', 'in_progress', 'blocked', 'done', 'cancelled');
create type public.task_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.issue_status as enum ('open', 'investigating', 'waiting_external', 'resolved', 'accepted', 'closed');
create type public.issue_severity as enum ('low', 'medium', 'high', 'critical');
create type public.entry_type as enum ('note', 'meeting', 'decision', 'document', 'update', 'milestone', 'capture');
create type public.triage_state as enum ('inbox', 'filed', 'dismissed');
create type public.decision_state as enum ('active', 'superseded');
create type public.conversation_kind as enum ('direct', 'group');
create type public.conversation_channel as enum ('whatsapp', 'email', 'manual', 'other');
create type public.message_direction as enum ('inbound', 'outbound');
create type public.activity_event_type as enum ('created', 'updated', 'completed', 'cancelled', 'resolved', 'accepted', 'archived', 'restored');

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create or replace function public.is_active_internal_user() returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.app_users where id = auth.uid() and is_active = true);
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, display_name, is_active)
  values (new.id, split_part(new.email, '@', 1), true);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.clients (
  id uuid primary key default gen_random_uuid(), name text not null check (char_length(trim(name)) > 0),
  kind public.client_kind not null default 'business', status public.client_status not null default 'active',
  website_url text, summary text not null default '', created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), archived_at timestamptz, created_by_id uuid not null references public.app_users(id)
);

create table public.people (
  id uuid primary key default gen_random_uuid(), name text not null check (char_length(trim(name)) > 0),
  email text, phone text, is_partner boolean not null default false, summary text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz, created_by_id uuid not null references public.app_users(id)
);

create table public.client_people (
  client_id uuid not null references public.clients(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role_label text not null default '', is_primary boolean not null default false, created_at timestamptz not null default now(),
  primary key (client_id, person_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id),
  owner_id uuid not null references public.app_users(id), name text not null check (char_length(trim(name)) > 0),
  code text unique, status public.project_status not null default 'active', summary text not null default '',
  started_on date, target_date date, completed_at timestamptz, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id)
);

create table public.project_participants (
  project_id uuid not null references public.projects(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role public.participant_role not null, role_label text not null default '', is_referral_source boolean not null default false,
  communication_mode public.communication_mode, financial_arrangement public.financial_arrangement not null default 'none',
  financial_value numeric(12,2), currency_code char(3), payment_status public.payment_status not null default 'not_applicable',
  terms_note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (project_id, person_id),
  check (financial_value is null or financial_value >= 0),
  check ((financial_arrangement = 'fixed_fee' and currency_code is not null) or financial_arrangement <> 'fixed_fee')
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id),
  project_id uuid references public.projects(id) on delete set null, kind public.conversation_kind not null default 'direct',
  channel public.conversation_channel not null default 'manual', title text not null check (char_length(trim(title)) > 0),
  last_message_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id)
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  joined_at timestamptz, left_at timestamptz, created_at timestamptz not null default now(), primary key (conversation_id, person_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_person_id uuid references public.people(id), sender_user_id uuid references public.app_users(id),
  direction public.message_direction not null, body_md text not null check (char_length(trim(body_md)) > 0),
  sent_at timestamptz not null default now(), triage_state public.triage_state not null default 'filed', external_message_id text,
  source_reference text, imported_at timestamptz, created_at timestamptz not null default now(), created_by_id uuid not null references public.app_users(id),
  search_vector tsvector generated always as (to_tsvector('english', coalesce(body_md, ''))) stored,
  check ((sender_person_id is not null and sender_user_id is null) or (sender_person_id is null and sender_user_id is not null))
);

create table public.entries (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  type public.entry_type not null, title text not null check (char_length(trim(title)) > 0), body_md text not null default '',
  occurred_at timestamptz not null default now(), triage_state public.triage_state not null default 'filed',
  decision_outcome text, decision_state public.decision_state, origin_message_id uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by_id uuid not null references public.app_users(id),
  search_vector tsvector generated always as (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(body_md, '')), 'B')) stored,
  check ((type = 'decision' and decision_outcome is not null and decision_state is not null) or (type <> 'decision' and decision_outcome is null and decision_state is null))
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0), description_md text not null default '',
  status public.task_status not null default 'todo', priority public.task_priority not null default 'normal',
  assignee_id uuid references public.app_users(id), due_at timestamptz, completed_at timestamptz,
  origin_message_id uuid references public.messages(id) on delete set null, origin_entry_id uuid references public.entries(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by_id uuid not null references public.app_users(id),
  check ((status = 'done' and completed_at is not null) or (status <> 'done' and completed_at is null)),
  check (not (origin_message_id is not null and origin_entry_id is not null))
);

create table public.issues (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0), description_md text not null default '',
  status public.issue_status not null default 'open', severity public.issue_severity not null default 'medium',
  assignee_id uuid references public.app_users(id), reported_at timestamptz not null default now(), resolved_at timestamptz,
  resolution_summary text, origin_message_id uuid references public.messages(id) on delete set null, origin_entry_id uuid references public.entries(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by_id uuid not null references public.app_users(id),
  check ((status in ('resolved','accepted','closed') and resolved_at is not null and resolution_summary is not null) or (status not in ('resolved','accepted','closed') and resolved_at is null and resolution_summary is null)),
  check (not (origin_message_id is not null and origin_entry_id is not null))
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references public.app_users(id), record_type text not null, record_id uuid not null,
  event_type public.activity_event_type not null, summary text not null, occurred_at timestamptz not null default now()
);

create index projects_client_status_idx on public.projects(client_id, status, updated_at desc);
create index tasks_assignee_status_due_idx on public.tasks(assignee_id, status, due_at asc) where status not in ('done','cancelled');
create index tasks_project_status_due_idx on public.tasks(project_id, status, due_at asc);
create index issues_project_status_idx on public.issues(project_id, status, reported_at desc);
create index entries_project_occurred_idx on public.entries(project_id, occurred_at desc);
create index entries_search_idx on public.entries using gin(search_vector);
create index messages_conversation_sent_idx on public.messages(conversation_id, sent_at desc);
create index messages_search_idx on public.messages using gin(search_vector);
create index activity_events_project_occurred_idx on public.activity_events(project_id, occurred_at desc);

create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger people_updated_at before update on public.people for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger project_participants_updated_at before update on public.project_participants for each row execute function public.set_updated_at();
create trigger conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger entries_updated_at before update on public.entries for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger issues_updated_at before update on public.issues for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.clients enable row level security;
alter table public.people enable row level security;
alter table public.client_people enable row level security;
alter table public.projects enable row level security;
alter table public.project_participants enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.entries enable row level security;
alter table public.tasks enable row level security;
alter table public.issues enable row level security;
alter table public.activity_events enable row level security;

create policy "active users read profiles" on public.app_users for select using (id = auth.uid() or public.is_active_internal_user());
create policy "active users manage clients" on public.clients for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage people" on public.people for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage client people" on public.client_people for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage projects" on public.projects for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage project participants" on public.project_participants for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage conversations" on public.conversations for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage conversation participants" on public.conversation_participants for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage messages" on public.messages for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage entries" on public.entries for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage tasks" on public.tasks for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage issues" on public.issues for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage activity events" on public.activity_events for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
