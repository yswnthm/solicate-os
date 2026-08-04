-- 0027: Person-first model — clients collapse into people.
--
--   The `clients` table goes away. A client is now a person
--   (people.kind = 'business') who is the subject of a client relationship
--   (relationships.type = 'client'). Contacts move from client_people into
--   people.organization_id (the business person they belong to). Projects link
--   to people directly via projects.person_id.
--
--   1. people.kind + people.website_url + people.organization_id (self-link)
--   2. relationships.type — what the subject IS to us (client/lead/partner/…)
--   3. projects.person_id replaces projects.client_id
--   4. conversations / capture_sessions / relationships client_id → people
--   5. drop client_people, clients, and the now-unused client enums

-- ─── 1. people: kind + website_url + organization self-link ──────────────────

create type public.people_kind as enum ('business', 'individual');

alter table public.people
  add column kind public.people_kind not null default 'individual',
  add column website_url text,
  add column organization_id uuid references public.people(id) on delete set null;

create index people_organization_idx on public.people(organization_id);

-- Move every client into people, preserving ids so existing FKs keep working.
-- clients.kind 'business' stays 'business'; 'person' clients become
-- individuals. Archived clients also get people.archived_at set.
insert into public.people (
  id, name, kind, website_url, summary,
  created_at, updated_at, archived_at, created_by_id
)
select
  id, name,
  case when kind = 'person' then 'individual'::public.people_kind else 'business'::public.people_kind end,
  website_url, summary,
  created_at, updated_at,
  coalesce(archived_at, case when status = 'archived' then now() end),
  created_by_id
from public.clients;

-- Contacts: client_people links become people.organization_id → the business
-- person. Prefer the primary link, else the earliest created.
update public.people p
set organization_id = sub.client_id
from (
  select distinct on (person_id) person_id, client_id
  from public.client_people
  order by person_id, is_primary desc, created_at
) sub
where p.id = sub.person_id;

-- ─── 2. relationships.type ──────────────────────────────────────────────────

create type public.relationship_type as enum ('client', 'lead', 'partner', 'team', 'internal');

alter table public.relationships
  add column type public.relationship_type not null default 'client';

-- ─── 3. projects.person_id replaces client_id ───────────────────────────────

alter table public.projects
  add column person_id uuid references public.people(id);

update public.projects set person_id = client_id;

alter table public.projects
  alter column person_id set not null;

drop index public.projects_client_status_idx;
alter table public.projects drop constraint projects_client_id_fkey;
alter table public.projects drop column client_id;

create index projects_person_status_idx on public.projects(person_id, status, updated_at desc);

-- ─── 4. conversations / capture_sessions / relationships client_id → people ──

alter table public.conversations drop constraint conversations_client_id_fkey;
alter table public.conversations
  add constraint conversations_client_id_fkey foreign key (client_id) references public.people(id);

alter table public.capture_sessions drop constraint capture_sessions_client_id_fkey;
alter table public.capture_sessions
  add constraint capture_sessions_client_id_fkey foreign key (client_id) references public.people(id) on delete set null;

alter table public.relationships drop constraint relationships_client_id_fkey;
alter table public.relationships
  add constraint relationships_client_id_fkey foreign key (client_id) references public.people(id) on delete cascade;

-- ─── 5. Drop the client tables + unused enums ───────────────────────────────

drop table public.client_people;
drop table public.clients;

drop type public.client_kind;
drop type public.client_status;
