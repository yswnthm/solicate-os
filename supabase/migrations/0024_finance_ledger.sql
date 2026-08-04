-- 0024: Finance Ledger — centralized transaction-based finance architecture.
--
-- Replaces finance_items (project-scoped) with a global transactions ledger.
-- Projects, phases, and people reference transactions via transaction_allocations.
-- One transaction, many allocations. Money is never recorded twice.
--
-- Deliverables:
--   1. New enums: transaction_type, transaction_status, allocation_target, invoice_status
--   2. finance_categories — configurable income/expense categories (seeded)
--   3. payment_methods   — configurable payment channels (seeded: HDFC Savings)
--   4. transactions      — the ledger: one row per movement of money
--   5. transaction_allocations — splits a transaction across projects/phases/overhead
--   6. v_project_finance — computed view for project finance panels
--   7. v_person_finance  — computed view for person ledger panels
--   8. Data migration from finance_items (hard cut-over; old table renamed)
--   9. Updated activity trigger for the new tables
--  10. RLS policies

-- ─── 1. New enum types ────────────────────────────────────────────────────────

create type public.transaction_type as enum (
  'income', 'expense', 'transfer', 'refund', 'adjustment'
);

create type public.transaction_status as enum (
  'planned', 'pending', 'completed', 'cancelled'
);

create type public.allocation_target as enum (
  'project', 'phase', 'overhead'
);

create type public.invoice_status as enum (
  'preparing', 'sent', 'cleared'
);

-- ─── 2. finance_categories ────────────────────────────────────────────────────

create table public.finance_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) > 0),
  transaction_type public.transaction_type not null,
  is_default boolean not null default false,
  position   int not null default 99,
  created_at timestamptz not null default now()
);

alter table public.finance_categories enable row level security;
create policy "active users manage finance categories"
  on public.finance_categories for all
  using (public.is_active_internal_user())
  with check (public.is_active_internal_user());

-- Seed: Income categories
insert into public.finance_categories (name, transaction_type, is_default, position) values
  ('Client Payment',  'income',  true,  1),
  ('Advance',         'income',  false, 2),
  ('Milestone',       'income',  false, 3),
  ('Final Payment',   'income',  false, 4),
  ('Refund Received', 'income',  false, 5),
  ('Other Income',    'income',  false, 6);

-- Seed: Expense categories
insert into public.finance_categories (name, transaction_type, is_default, position) values
  ('Partner Payment', 'expense', true,  10),
  ('Freelancer',      'expense', false, 11),
  ('Salary',          'expense', false, 12),
  ('Software',        'expense', false, 13),
  ('Hosting',         'expense', false, 14),
  ('Equipment',       'expense', false, 15),
  ('Office',          'expense', false, 16),
  ('Marketing',       'expense', false, 17),
  ('Travel',          'expense', false, 18),
  ('Taxes',           'expense', false, 19),
  ('Bank Charges',    'expense', false, 20),
  ('Miscellaneous',   'expense', false, 21);

-- ─── 3. payment_methods ───────────────────────────────────────────────────────

create table public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) > 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;
create policy "active users manage payment methods"
  on public.payment_methods for all
  using (public.is_active_internal_user())
  with check (public.is_active_internal_user());

-- Seed: one account for now
insert into public.payment_methods (name, is_default) values ('HDFC Savings', true);

-- ─── 4. transactions ──────────────────────────────────────────────────────────

create table public.transactions (
  id                  uuid primary key default gen_random_uuid(),

  -- Core money fields
  type                public.transaction_type not null,
  amount              numeric(14,2) not null check (amount > 0),
  currency_code       char(3) not null default 'INR',
  transaction_date    date not null default current_date,
  status              public.transaction_status not null default 'pending',

  -- Invoice lifecycle (income transactions only)
  invoice_status      public.invoice_status,
  invoice_date        date,
  invoice_sent_at     timestamptz,
  invoice_cleared_at  timestamptz,
  invoice_number      text not null default '',

  -- Classification
  category_id         uuid references public.finance_categories(id) on delete set null,
  payment_method_id   uuid references public.payment_methods(id) on delete set null,

  -- Counterparties (external: person | internal: app_user — not both)
  from_person_id      uuid references public.people(id) on delete set null,
  from_user_id        uuid references public.app_users(id) on delete set null,
  to_person_id        uuid references public.people(id) on delete set null,
  to_user_id          uuid references public.app_users(id) on delete set null,

  -- References
  reference_number    text not null default '',
  notes               text not null default '',

  -- Audit
  created_by_id       uuid not null references public.app_users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  updated_by_id       uuid references public.app_users(id),

  -- Constraints
  check (from_person_id is null or from_user_id is null),
  check (to_person_id is null or to_user_id is null),
  check (invoice_status is null or type = 'income'),
  check (
    invoice_status is distinct from 'cleared'
    or invoice_cleared_at is not null
  )
);

create index transactions_date_idx  on public.transactions(transaction_date desc);
create index transactions_type_idx  on public.transactions(type, status, transaction_date desc);
create index transactions_from_person_idx on public.transactions(from_person_id) where from_person_id is not null;
create index transactions_to_person_idx   on public.transactions(to_person_id)   where to_person_id is not null;
create index transactions_invoice_idx on public.transactions(invoice_status, transaction_date desc) where invoice_status is not null;

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;
create policy "active users manage transactions"
  on public.transactions for all
  using (public.is_active_internal_user())
  with check (public.is_active_internal_user());

-- ─── 5. transaction_allocations ───────────────────────────────────────────────

create table public.transaction_allocations (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  target         public.allocation_target not null default 'project',
  project_id     uuid references public.projects(id) on delete set null,
  phase_id       uuid references public.phases(id) on delete set null,
  amount         numeric(14,2) not null check (amount > 0),
  notes          text not null default '',
  created_by_id  uuid not null references public.app_users(id),
  created_at     timestamptz not null default now(),

  -- If target = project, project_id must be set.
  -- If target = phase, both project_id and phase_id must be set.
  -- If target = overhead, neither should be set.
  check (
    (target = 'project'  and project_id is not null) or
    (target = 'phase'    and project_id is not null and phase_id is not null) or
    (target = 'overhead' and project_id is null     and phase_id is null)
  )
);

create index allocations_transaction_idx on public.transaction_allocations(transaction_id);
create index allocations_project_idx     on public.transaction_allocations(project_id) where project_id is not null;
create index allocations_phase_idx       on public.transaction_allocations(phase_id)   where phase_id is not null;

alter table public.transaction_allocations enable row level security;
create policy "active users manage transaction allocations"
  on public.transaction_allocations for all
  using (public.is_active_internal_user())
  with check (public.is_active_internal_user());

-- ─── 6. v_project_finance ─────────────────────────────────────────────────────
-- Used by project and phase finance panels. Joins allocations back to transactions.

create or replace view public.v_project_finance as
select
  ta.id                  as allocation_id,
  ta.transaction_id,
  ta.project_id,
  ta.phase_id,
  ta.target,
  ta.amount              as allocated_amount,
  ta.notes               as allocation_notes,
  t.type,
  t.status,
  t.invoice_status,
  t.invoice_number,
  t.invoice_sent_at,
  t.invoice_cleared_at,
  t.transaction_date,
  t.currency_code,
  t.reference_number,
  t.notes                as transaction_notes,
  t.from_person_id,
  t.to_person_id,
  t.from_user_id,
  t.to_user_id,
  t.created_at,
  fc.name                as category_name
from public.transaction_allocations ta
join public.transactions t  on t.id = ta.transaction_id
left join public.finance_categories fc on fc.id = t.category_id
where ta.project_id is not null;

-- ─── 7. v_person_finance ──────────────────────────────────────────────────────
-- Lightweight summary used by person detail pages.

create or replace view public.v_person_finance as
select
  person_id,
  direction,
  currency_code,
  sum(amount) as total
from (
  select
    from_person_id as person_id,
    'received_from_them' as direction,
    amount,
    currency_code
  from public.transactions
  where status = 'completed' and from_person_id is not null

  union all

  select
    to_person_id as person_id,
    'paid_to_them' as direction,
    amount,
    currency_code
  from public.transactions
  where status = 'completed' and to_person_id is not null
) sub
group by person_id, direction, currency_code;

-- ─── 8. Data migration from finance_items ────────────────────────────────────
-- Hard cut-over. Existing data is migrated where it maps cleanly.
-- The old table is renamed (not dropped) as a safety net for 30 days.

do $$
declare
  first_user_id uuid;
  default_category_income uuid;
  default_category_expense uuid;
begin
  -- Get the first active user as a fallback created_by_id
  select id into first_user_id from public.app_users where is_active = true limit 1;

  -- If no users exist yet (empty DB), skip the migration gracefully
  if first_user_id is null then
    return;
  end if;

  -- Get default category ids
  select id into default_category_income
    from public.finance_categories
    where transaction_type = 'income' and is_default = true limit 1;

  select id into default_category_expense
    from public.finance_categories
    where transaction_type = 'expense' and is_default = true limit 1;

  -- Migrate finance_items → transactions + transaction_allocations
  -- Each old row becomes one transaction + one allocation (project or phase).
  insert into public.transactions (
    type, amount, currency_code, transaction_date, status,
    invoice_status, invoice_cleared_at,
    category_id, notes,
    created_by_id, created_at, updated_at
  )
  select
    case fi.kind
      when 'invoice' then 'income'::public.transaction_type
      when 'payment' then 'income'::public.transaction_type
      when 'expense' then 'expense'::public.transaction_type
    end,
    fi.amount,
    coalesce(fi.currency_code, 'INR'),
    coalesce(fi.occurred_on, current_date),
    -- status
    case fi.kind
      when 'expense' then 'completed'::public.transaction_status
      when 'payment' then 'completed'::public.transaction_status
      when 'invoice' then
        case coalesce(fi.payment_status, 'pending')
          when 'paid'    then 'completed'::public.transaction_status
          else                'pending'::public.transaction_status
        end
    end,
    -- invoice_status
    case fi.kind
      when 'invoice' then
        case coalesce(fi.payment_status, 'pending')
          when 'paid'    then 'cleared'::public.invoice_status
          when 'partial' then 'sent'::public.invoice_status
          else                'sent'::public.invoice_status
        end
      when 'payment' then 'cleared'::public.invoice_status
      else null
    end,
    -- invoice_cleared_at
    case fi.kind
      when 'payment' then coalesce(fi.paid_at, fi.occurred_on::timestamptz)
      when 'invoice' then
        case coalesce(fi.payment_status, 'pending')
          when 'paid' then coalesce(fi.paid_at, fi.occurred_on::timestamptz)
          else null
        end
      else null
    end,
    -- category_id
    case fi.kind
      when 'expense' then default_category_expense
      else default_category_income
    end,
    coalesce(fi.notes, ''),
    coalesce(fi.created_by_id, first_user_id),
    coalesce(fi.created_at, now()),
    coalesce(fi.updated_at, now())
  from public.finance_items fi;

  -- Now create allocations linking each migrated transaction to its project/phase.
  -- We match by joining on created_at + amount since we don't have the new ids yet.
  -- Strategy: use a temp table to capture the mapping.
  create temp table _txn_migration_map as
  select
    fi.id           as old_id,
    fi.project_id,
    fi.phase_id,
    t.id            as new_transaction_id,
    coalesce(fi.created_by_id, first_user_id) as creator_id
  from public.finance_items fi
  join public.transactions t on (
    t.amount = fi.amount
    and t.transaction_date = coalesce(fi.occurred_on, current_date)
    and t.created_at = coalesce(fi.created_at, t.created_at)
    and t.notes = coalesce(fi.notes, '')
  )
  where fi.project_id is not null;

  insert into public.transaction_allocations (
    transaction_id, target, project_id, phase_id, amount, created_by_id
  )
  select
    m.new_transaction_id,
    case when m.phase_id is not null then 'phase'::public.allocation_target
         else                             'project'::public.allocation_target
    end,
    m.project_id,
    m.phase_id,
    t.amount,
    m.creator_id
  from _txn_migration_map m
  join public.transactions t on t.id = m.new_transaction_id;

  drop table if exists _txn_migration_map;
end;
$$;

-- Rename old table as safety net (drop after 30 days of validation)
alter table public.finance_items rename to finance_items_legacy;

-- ─── 9. Activity trigger for transactions ────────────────────────────────────

create or replace function public.log_transaction_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  first_project_id uuid;
begin
  -- Find the first project allocation (may not exist yet at insert time for
  -- transactions created before allocations, but captures most cases).
  select project_id into first_project_id
  from public.transaction_allocations
  where transaction_id = new.id and project_id is not null
  limit 1;

  -- Only log to activity_events if we have a project to attach to.
  if first_project_id is not null then
    insert into public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
    values (
      first_project_id,
      auth.uid(),
      'transaction',
      new.id,
      'created',
      'Logged ' || new.type || ': ₹' || new.amount
    );
  end if;
  return new;
end;
$$;

create trigger transactions_log_created
  after insert on public.transactions
  for each row execute function public.log_transaction_created();
