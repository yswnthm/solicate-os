-- 0011: AI framework — templates, models, and message drafts.
--
-- Every AI capability is a template (editable, versioned). The context
-- retrieval engine + execution engine read these records; nothing AI-related
-- is hardcoded in the application.

create type public.ai_provider as enum ('groq', 'gemini');
create type public.message_draft_status as enum ('draft', 'sent', 'discarded');

-- ─── Templates ───────────────────────────────────────────────────────────────
-- Identity row; content lives in ai_template_versions. "Current" is just a
-- pointer so edits never overwrite history.

create table public.ai_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  current_version int not null default 1 check (current_version >= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id),
  updated_by_id uuid references public.app_users(id)
);

create table public.ai_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.ai_templates(id) on delete cascade,
  version int not null check (version >= 1),
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  system_prompt text not null check (char_length(trim(system_prompt)) > 0),
  default_model text not null default '',
  output_rules jsonb not null default '[]',
  context_sources jsonb not null default '[]',
  enabled_variables jsonb not null default '[]',
  config jsonb,
  response_format text not null default 'json_field' check (response_format in ('text', 'json_field')),
  output_field text not null default 'output',
  max_tokens int not null default 2048 check (max_tokens between 1 and 8192),
  temperature numeric(3, 2) not null default 0.4 check (temperature between 0 and 2),
  change_note text not null default '',
  created_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id),
  unique (template_id, version)
);

create index ai_template_versions_template_idx on public.ai_template_versions(template_id, version desc);

-- ─── Models ──────────────────────────────────────────────────────────────────
-- Catalog of model IDs per provider. Executor resolves a model_id → provider.

create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider public.ai_provider not null,
  model_id text not null check (char_length(trim(model_id)) > 0),
  display_name text not null check (char_length(trim(display_name)) > 0),
  description text not null default '',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  created_by_id uuid references public.app_users(id),
  unique (provider, model_id)
);

-- ─── Message drafts ──────────────────────────────────────────────────────────
-- Drafted messages reviewed by the operator. "Mark sent" files an outbound
-- message into an inferred (or auto-created) conversation.

create table public.message_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  content text not null check (char_length(trim(content)) > 0),
  intent text not null default '',
  length_label text not null default '',
  styles jsonb not null default '[]',
  additional_context text not null default '',
  direction text not null default '',
  model_id text not null default '',
  status public.message_draft_status not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id)
);

create index message_drafts_status_created_idx on public.message_drafts(status, created_at desc);
create index message_drafts_project_idx on public.message_drafts(project_id);
create index message_drafts_person_idx on public.message_drafts(person_id);

-- ─── Triggers + RLS ─────────────────────────────────────────────────────────

create trigger ai_templates_updated_at before update on public.ai_templates for each row execute function public.set_updated_at();
create trigger message_drafts_updated_at before update on public.message_drafts for each row execute function public.set_updated_at();

alter table public.ai_templates enable row level security;
alter table public.ai_template_versions enable row level security;
alter table public.ai_models enable row level security;
alter table public.message_drafts enable row level security;

create policy "active users manage ai templates" on public.ai_templates for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage ai template versions" on public.ai_template_versions for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage ai models" on public.ai_models for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
create policy "active users manage message drafts" on public.message_drafts for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());
