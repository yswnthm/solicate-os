-- 0033: Hardening constraints (Database Handoff §5.1 + §5.2).
--
--   1. Partial unique index on active client emails — one live person per
--      email; archived people may reuse theirs.
--   2. Pin finance_items_legacy.amount to numeric(14,2) to match the ledger.
--   3. Explicit ON DELETE for message senders and activity actors:
--      deleting a person/user must never cascade or block, so history keeps
--      its rows and the reference just goes null.
--   4. Deliberately NOT done (handoff decision): the exactly-one XOR on
--      transactions.from_/to_ — the existing 'not both set' checks stay,
--      because transfers between own accounts legitimately have no
--      counterparty. ai_template_versions (template_id, version) unique and
--      transactions/allocations numeric(14,2) already exist.

-- ─── 1. unique active client emails ─────────────────────────────────────────

-- Pre-flight dedup query — the index creation fails loudly if duplicates exist:
-- SELECT email, count(*) FROM people
-- WHERE email IS NOT NULL AND archived_at IS NULL
-- GROUP BY email HAVING count(*) > 1;

create unique index idx_people_email_unique on public.people(email)
  where email is not null and archived_at is null;

-- ─── 2. pin legacy money precision ───────────────────────────────────────────

-- finance_rollup (0020) reads amount from the legacy table, so ALTER TYPE is
-- blocked while the view depends on the column. Drop, cast, recreate. Sums are
-- cast back to double precision so PostgREST keeps returning numbers to the AI
-- context builder (numeric would serialize as strings).
drop view public.finance_rollup;

alter table public.finance_items_legacy alter column amount type numeric(14,2);

create view public.finance_rollup
with (security_invoker = true) as
select
  project_id,
  count(*) filter (where kind = 'invoice') as invoices_count,
  coalesce(sum(amount) filter (where kind = 'invoice'), 0)::double precision as invoiced_total,
  count(*) filter (where kind = 'payment') as payments_count,
  coalesce(sum(amount) filter (where kind = 'payment'), 0)::double precision as paid_total,
  count(*) filter (where kind = 'expense') as expenses_count,
  coalesce(sum(amount) filter (where kind = 'expense'), 0)::double precision as expense_total,
  coalesce(sum(amount) filter (where kind = 'invoice'), 0)::double precision
    - coalesce(sum(amount) filter (where kind = 'payment'), 0)::double precision as outstanding,
  count(*) filter (where kind = 'invoice' and payment_status = 'paid') as paid_invoices_count,
  max(occurred_on) as most_recent_date
from public.finance_items_legacy
group by project_id;

-- ─── 3. explicit ON DELETE behavior ──────────────────────────────────────────

alter table public.messages drop constraint messages_sender_person_id_fkey;
alter table public.messages add constraint messages_sender_person_id_fkey
  foreign key (sender_person_id) references public.people(id) on delete set null;

alter table public.messages drop constraint messages_sender_user_id_fkey;
alter table public.messages add constraint messages_sender_user_id_fkey
  foreign key (sender_user_id) references public.app_users(id) on delete set null;

alter table public.activity_events drop constraint activity_events_actor_id_fkey;
alter table public.activity_events add constraint activity_events_actor_id_fkey
  foreign key (actor_id) references public.app_users(id) on delete set null;

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT column_name, data_type, numeric_precision, numeric_scale
-- FROM information_schema.columns
-- WHERE table_name = 'finance_items_legacy' AND column_name = 'amount';
-- expect numeric_precision 14, scale 2.
-- DELETE a person who appears as a message sender; the message row survives
-- with sender_person_id = null.
