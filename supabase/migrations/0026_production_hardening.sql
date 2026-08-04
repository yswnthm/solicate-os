-- 0026: Production hardening.
--
-- 1. Allocation integrity guard — SUM(allocations) can never exceed the
--    transaction amount, enforced at the DB level (planned but missing in 0024).
-- 2. Audit meta on transaction_allocations (updated_at / updated_by_id).
-- 3. transactions edits now populate updated_by_id via set_updated_meta.
-- 4. pg_trgm GIN indexes so ilike '%…%' name searches stay fast as tables grow.
-- 5. ai_usage — per-user, per-day AI call budget (rate limiting / spend cap).
-- 6. error_logs — persistent error trail for the observability layer.

-- ─── 1. Allocation integrity guard ────────────────────────────────────────────

-- BEFORE INSERT/UPDATE on allocations: reject any change that would push the
-- total allocated above the parent transaction's amount. The parent row is
-- locked FOR UPDATE so concurrent allocation writes serialize per transaction.
create or replace function public.guard_allocation_amount() returns trigger
language plpgsql set search_path = public as $$
declare
  txn_amount numeric(14,2);
  allocated  numeric(14,2);
begin
  select amount into txn_amount
  from public.transactions
  where id = new.transaction_id
  for update;

  if txn_amount is null then
    raise exception 'Transaction % does not exist.', new.transaction_id;
  end if;

  select coalesce(sum(amount), 0) into allocated
  from public.transaction_allocations
  where transaction_id = new.transaction_id
    and id <> new.id;

  if allocated + new.amount > txn_amount then
    raise exception
      'Cannot allocate %. Total allocations (%) would exceed the transaction amount (%).',
      new.amount, allocated, txn_amount;
  end if;

  return new;
end;
$$;

drop trigger if exists transaction_allocations_guard_amount on public.transaction_allocations;
create trigger transaction_allocations_guard_amount
  before insert or update of amount, transaction_id on public.transaction_allocations
  for each row execute function public.guard_allocation_amount();

-- BEFORE UPDATE on transactions: never let the amount drop below what is
-- already allocated to projects/phases/overhead.
create or replace function public.guard_transaction_amount() returns trigger
language plpgsql set search_path = public as $$
declare
  allocated numeric(14,2);
begin
  if new.amount is distinct from old.amount then
    select coalesce(sum(amount), 0) into allocated
    from public.transaction_allocations
    where transaction_id = new.id;

    if allocated > new.amount then
      raise exception
        'Cannot reduce transaction amount to %: % is already allocated.',
        new.amount, allocated;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_guard_amount on public.transactions;
create trigger transactions_guard_amount
  before update of amount on public.transactions
  for each row execute function public.guard_transaction_amount();

-- ─── 2. Audit meta on transaction_allocations ────────────────────────────────

alter table public.transaction_allocations
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by_id uuid references public.app_users(id);

drop trigger if exists transaction_allocations_updated_at on public.transaction_allocations;
create trigger transaction_allocations_updated_at
  before update on public.transaction_allocations
  for each row execute function public.set_updated_meta();

-- ─── 3. transactions edits track the editor ──────────────────────────────────

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_meta();

-- ─── 4. pg_trgm indexes for ilike name searches ──────────────────────────────

create extension if not exists pg_trgm;

create index if not exists people_name_trgm_idx   on public.people   using gin (name gin_trgm_ops);
create index if not exists projects_name_trgm_idx on public.projects using gin (name gin_trgm_ops);
create index if not exists clients_name_trgm_idx  on public.clients  using gin (name gin_trgm_ops);
create index if not exists phases_name_trgm_idx   on public.phases   using gin (name gin_trgm_ops);

-- ─── 5. ai_usage — per-user daily AI budget ──────────────────────────────────

create table if not exists public.ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  day        date not null,
  call_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.ai_usage enable row level security;
drop policy if exists "users manage own usage" on public.ai_usage;
create policy "users manage own usage"
  on public.ai_usage for all
  using (user_id = auth.uid() and public.is_active_internal_user())
  with check (user_id = auth.uid() and public.is_active_internal_user());

-- Atomically reserve one AI call for the user/day. Returns false (and does
-- nothing) when the daily cap is already reached. The p_user_id guard stops a
-- caller from burning another user's budget.
create or replace function public.ai_usage_consume(
  p_user_id uuid,
  p_max_calls int default 100
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  used int;
begin
  if auth.uid() is distinct from p_user_id then
    return true;
  end if;

  insert into public.ai_usage (user_id, day, call_count)
  values (p_user_id, current_date, 0)
  on conflict (user_id, day) do nothing;

  select call_count into used
  from public.ai_usage
  where user_id = p_user_id and day = current_date
  for update;

  if used is null or used >= p_max_calls then
    return false;
  end if;

  update public.ai_usage
  set call_count = call_count + 1, updated_at = now()
  where user_id = p_user_id and day = current_date;

  return true;
end;
$$;

-- ─── 6. error_logs — persistent error trail ─────────────────────────────────

create table if not exists public.error_logs (
  id          uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  user_id     uuid references public.app_users(id) on delete set null,
  route       text not null default '',
  message     text not null default '',
  stack       text not null default '',
  meta        jsonb not null default '{}'::jsonb
);

alter table public.error_logs enable row level security;
drop policy if exists "active users read error logs" on public.error_logs;
create policy "active users read error logs"
  on public.error_logs for select
  using (public.is_active_internal_user());

drop policy if exists "active users write error logs" on public.error_logs;
create policy "active users write error logs"
  on public.error_logs for all
  using (public.is_active_internal_user())
  with check (public.is_active_internal_user());

-- ─── 7. v_finance_ytd — year-to-date totals, aggregated in SQL ────────────────
-- Replaces the JS-side reduction in getFinanceDashboard. Sums stay in the DB,
-- so the dashboard costs O(1) regardless of ledger size. security_invoker keeps
-- the base table's RLS applied.

create or replace view public.v_finance_ytd
with (security_invoker = true) as
select
  coalesce(
    sum(amount) filter (
      where type = 'income' and status = 'completed'
        and transaction_date >= date_trunc('year', current_date)
    ), 0) as total_income,
  coalesce(
    sum(amount) filter (
      where type = 'expense' and status = 'completed'
        and transaction_date >= date_trunc('year', current_date)
    ), 0) as total_expense
from public.transactions;
