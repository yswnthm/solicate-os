-- 0010: The full agency operating model.
--
--   Relationship → Client → Project → Phase → Work
--
--   * relationships:  Level 1 — how a client entered Solicate + partnership terms.
--                     Relationship-level data (referrals, commissions, history) is
--                     NOT project-specific; one relationship spans many projects.
--   * projects:       strategy fields — objective, success definition, direction.
--                     Project answers "what are we trying to achieve", never "what
--                     are we doing today".
--   * phases:         scope + proposal workspaces so execution has its own home.
--   * issues:         phase_id — execution records can be phase-scoped.
--   * entries:        phase_id — records (notes/decisions/documents/milestones)
--                     are phase-scoped; project-level when null.
--   * finance_items:  invoices / payments / expenses at project OR phase level.
--                     Project finances aggregate phase finances.

-- ─── Level 1: Relationships ────────────────────────────────────────────────────

create type public.relationship_source as enum (
  'referral_partner', 'direct_outreach', 'existing_client', 'marketplace', 'internal'
);
create type public.relationship_status as enum ('active', 'inactive', 'archived');

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  source public.relationship_source not null default 'direct_outreach',
  status public.relationship_status not null default 'active',
  summary text not null default '',
  communication_mode public.communication_mode,
  financial_arrangement public.financial_arrangement not null default 'none',
  referral_commission numeric(12,2),
  commission_currency char(3),
  payment_status public.payment_status not null default 'not_applicable',
  terms_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id),
  updated_by_id uuid references public.app_users(id),
  check (referral_commission is null or referral_commission >= 0),
  check ((financial_arrangement = 'fixed_fee' and commission_currency is not null) or financial_arrangement <> 'fixed_fee')
);

create index relationships_client_idx on public.relationships(client_id);
create index relationships_person_idx on public.relationships(person_id);

create trigger relationships_updated_at before update on public.relationships for each row execute function public.set_updated_meta();

alter table public.relationships enable row level security;
create policy "active users manage relationships" on public.relationships for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());

-- ─── Projects: strategy ────────────────────────────────────────────────────────

alter table public.projects
  add column objective text not null default '',
  add column success_definition text not null default '',
  add column direction text not null default '';

-- ─── Phases: scope + proposal workspaces ───────────────────────────────────────

alter table public.phases
  add column scope_deliverables text not null default '',
  add column scope_requirements text not null default '',
  add column scope_acceptance text not null default '',
  add column proposal_quotation text not null default '',
  add column proposal_pricing text not null default '',
  add column proposal_revisions text not null default '';

-- ─── Execution scoping: issues + entries can live in a phase ──────────────────

alter table public.issues
  add column phase_id uuid references public.phases(id) on delete set null;

alter table public.entries
  add column phase_id uuid references public.phases(id) on delete set null;

create index issues_phase_status_idx on public.issues(phase_id, status, reported_at desc);
create index entries_phase_occurred_idx on public.entries(phase_id, occurred_at desc);

-- ─── Finance: invoices / payments / expenses ──────────────────────────────────

create type public.finance_item_kind as enum ('invoice', 'payment', 'expense');

create table public.finance_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete set null,
  kind public.finance_item_kind not null,
  title text not null check (char_length(trim(title)) > 0),
  amount numeric(12,2) not null check (amount >= 0),
  currency_code char(3) not null default 'INR',
  occurred_on date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_id uuid not null references public.app_users(id),
  updated_by_id uuid references public.app_users(id)
);

create index finance_items_project_occurred_idx on public.finance_items(project_id, occurred_on desc);
create index finance_items_phase_occurred_idx on public.finance_items(phase_id, occurred_on desc);

create trigger finance_items_updated_at before update on public.finance_items for each row execute function public.set_updated_meta();

alter table public.finance_items enable row level security;
create policy "active users manage finance items" on public.finance_items for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());

-- ─── Activity for the new project-scoped record ───────────────────────────────

create or replace function public.log_finance_item_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
  values (new.project_id, auth.uid(), 'finance', new.id, 'created', 'Logged ' || new.kind || ': ' || new.title);
  return new;
end;
$$;

drop trigger if exists finance_items_log_created on public.finance_items;
create trigger finance_items_log_created
  after insert on public.finance_items
  for each row execute function public.log_finance_item_created();
