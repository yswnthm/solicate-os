# Database Guide for AI Agents

Operational reference for reading and modifying the Solicate OS database. This is
the file to consult whenever you need to query, create, update, or delete data.

> **Hard rule: never paste secrets into code, commits, logs, or chat.**
> Credentials live **only** in `.env.local` (gitignored). This repo is **public**
> on GitHub — any key committed here is immediately exposed.

---

## 1. Connection

- Project ref / URL: `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` (a `*.supabase.co` URL).
- The app reads its key from `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key).
- Read `.env.local` at the repo root to obtain the current URL + anon key at runtime.
- Service-role key (full admin, bypasses RLS): get it from Supabase Dashboard →
  Project Settings → API keys. Do **not** add it to `.env.local` unless you're
  willing to treat that file as strictly local, and never commit it.

### Postgres / psql (bypasses RLS — use for admin reads & fixes)

- The DB password lives in `.env.local` as `SUPABASE_DB_PASSWORD`. The project
  is linked in `supabase/.temp/linked-project.json` (ref `krfqsroptgwnmqoqvjle`,
  pooler host `aws-1-ap-south-1.pooler.supabase.com`). Never paste the password
  into docs, chat, or commits — always read it from `.env.local`.
- The Supabase CLI is already logged in and linked, so `supabase db push` works
  once the password has been cached (`supabase link --project-ref <ref>` will
  prompt for it). Direct psql (pooler, Postgres-level, no RLS):

```bash
PGPASSWORD=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) \
  psql "postgresql://postgres.krfqsroptgwnmqoqvjle@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

How the app connects (server components): `lib/supabase/server.ts` →
`createSupabaseServerClient()` (cookie session) and
`createSupabaseServerClientWithToken(token)` (JWT-header client for `unstable_cache`).

## 2. Access model — read this before querying anything

- **RLS is enforced.** Every table has row-level security. Unauthenticated /
  anon-key requests return `[]` (empty), **not** an error — an empty result is
  *never proof that rows don't exist*.
- To actually see data you need either:
  - A signed-in user session (the app's cookies), or
  - The **service-role key** passed as `Authorization: Bearer <service_role>`, or
  - A **direct Postgres connection** (psql / `supabase db`), which bypasses RLS
    entirely — see §1 for the pooler connection using `SUPABASE_DB_PASSWORD`.
- `public.is_active_internal_user()` gates most tables (auth.uid() is an active
  internal user). Workspaces (migration 0029/0030) add a second layer of scoping
  via `current_workspace_id()`.

### Quick check queries (REST, curl)

```bash
URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2)
KEY=$(grep NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env.local | cut -d= -f2)

# Signed-in session (RLS-scoped) — pass the user's JWT:
curl -s "$URL/rest/v1/tasks?select=id,title,status&limit=5" \
  -H "apikey: $KEY" -H "Authorization: Bearer <USER_JWT>"

# Admin (service-role, bypasses RLS). Replace SR with the dashboard key.
curl -s "$URL/rest/v1/tasks?select=id,title,status&limit=5" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR"
```

Filters: `?col=eq.value&col=neq.value&order=col.asc.nullslast`. Row-level:
`&limit=1&select=id`. Supabase REST docs apply.

## 3. Making changes — order of preference

1. **App server actions** (`features/actions.ts`) — *preferred.* They enforce auth,
   RLS, validation (zod), audit triggers, and activity logging for you. Call
   `revalidatePath(...)` after writes. Example: `createTask(formData)`,
   `updateTaskStatus(formData)`, `addSubtask(formData)`.
2. **New migration** for schema/backfill (see §5). Apply via the SQL editor or
   `supabase db push` after `supabase link --project-ref <ref>`.
3. **Direct SQL/service-role** only for admin data fixes that have no action —
   and follow the delete rules in §4.

Every write should set `created_by_id` / `updated_by_id` (trigger
`set_updated_meta()` handles `updated_at` + `updated_by_id` on update).

## 4. Deleting data — safety rules

- **Prefer soft delete.** `clients`, `people`, `projects` use `archived_at`;
  set it instead of deleting where possible.
- **SELECT before DELETE.** Always run the `select id` version of the filter
  first, read the row count, then delete the exact ids.
- Never bulk-delete without a `limit`/`in` on explicit ids.
- `tasks`, `task_subtasks`, `entries`, `activity_events` etc. are hard-deletable
  in the app via their delete actions — but foreign-key children (`task_subtasks`
  before `tasks`, `activity_events`, `record_history`) must go first.
- No transactions over REST. For multi-table changes, run them as a single SQL
  block in the SQL editor inside `begin; ... commit;`.

## 5. Schema workflow / migrations

- Migrations live in `supabase/migrations/NNNN_snake_name.sql`, applied in order.
  Latest is `0042_task_subtasks.sql`.
- **Never edit an applied migration** — add a new one (`0043_...`).
- Convention: `alter table public.x ...` + `create policy` + RLS enable +
  triggers + enums with `create type`. Run as a single script.

## 6. Table inventory

Core relationships/operational tables:

| Table | Purpose | Key columns / FKs |
| --- | --- | --- |
| `app_users` | Internal users | `display_name`, `is_active`, `role` (`user_role`), `workspace_id` |
| `workspaces` | Multi-user tenant | from migration 0029 |
| `clients` / `client_people` | Legacy client hierarchy (superseded by `relationships`) | `kind`, `status` |
| `people` | People: contacts, partners, team | `kind` (`people_kind`), `is_partner`, `archived_at` |
| `relationships` | Client/lead/partner/team connections | `client_id`/`person_id` → `people`, `type` (`relationship_type`), `status` |
| `projects` | Engagements | `name`, `code`, `status` (`project_status`), `person_id` → `people`, `objective`, `summary` |
| `project_participants` | People on a project | `person_id` → `people`, `role` (`participant_role`), `financial_arrangement`, `payment_status`, `communication_mode` |
| `phases` | Project phases | `project_id`, `position`, `name`, `status` (`phase_status`), `started_on`, `target_date`, scope/proposal JSON fields |
| `tasks` | Work items | `project_id`, `phase_id`, `title`, `status` (`task_status`: todo/in_progress/blocked/done/cancelled), `priority` (`task_priority`: low/normal/high/urgent), `assignee_id` → `app_users`, `due_at`, `completed_at` |
| `task_subtasks` | Checklist items under a task | `task_id`, `title`, `done`, `position` (migration 0042) |
| `entries` | Records: notes/meetings/decisions/docs | `project_id` (optional), `phase_id`, `type` (`entry_type`), `triage_state` (inbox/filed/dismissed), `decision_outcome`, `decision_state`, `occurred_at` |
| `activity_events` | Audit trail | `project_id`, `actor_id` → `app_users`, `record_type`, `record_id`, `event_type`, `summary` |
| `entity_links` | Related-record links | from migration 0031 |
| `record_history` | Field-level change history | from migration 0031 |

AI / capture:

| Table | Purpose |
| --- | --- |
| `ai_models` | Model registry (provider `ai_provider`: groq/gemini) |
| `ai_templates` / `ai_template_versions` | Prompt templates |
| `ai_summaries` | Stale-able project summaries |
| `semantic_chunks` | Embeddings / semantic memory (migration 0021) |
| `capture_sessions` / `capture_actions` | Capture inbox pipeline |
| `message_drafts` | Drafted outbound messages |

Finance (migration 0024+):

| Table | Purpose |
| --- | --- |
| `transactions` | Invoices/payments/expenses; `type`, `amount`, `currency_code`, guards `guard_transaction_amount` |
| `transaction_allocations` | Split of a transaction across projects; guard `guard_allocation_amount` |
| `finance_items` / `finance_categories` / `payment_methods` | Ledger support; deprecated in favor of `transactions` (migration 0034) |

Views: `v_project_finance` (finance joined to projects), `finance_rollup`,
`status_rollup`, `decision_log`.

Removed/legacy: `conversations`, `conversation_participants`, `messages`
(dropped in 0039), `issues` (consolidated into `tasks` in 0040).

## 7. Enum reference (relevant values)

- `task_status`: `todo | in_progress | blocked | done | cancelled`
- `task_priority`: `low | normal | high | urgent`
- `project_status`: `active | paused | completed | archived`
- `phase_status`: `planned | active | on_hold | completed | cancelled`
- `entry_type`: `note | meeting | decision | document | update | milestone | capture`
- `relationship_type`: `client | lead | partner | team | internal`
- `user_role`: `owner | admin | member`

## 8. Worked example (Stillness)

- Stillness project id: `1ce4a5c0-0000-4000-8000-000000000021`
  (seeded in migration `0005_stillness_import.sql`).
- To list its tasks (admin only): query `tasks` with
  `project_id=eq.1ce4a5c0-0000-4000-8000-000000000021`, join `phases` and
  `app_users!tasks_assignee_id_fkey` (note: `app_users` needs the FK hint —
  `tasks` has 3 FKs to `app_users`).

## 9. Golden rules

1. Never commit or print secrets. `.env.local` is gitignored — keep it that way.
2. Empty query results from anon key ≠ missing data (RLS). Use a session JWT or
   service-role key for real verification.
3. Prefer app actions → migrations → direct SQL, in that order.
4. Soft-delete before hard-delete. Select before delete.
5. Always `revalidatePath(...)` after writes so cached pages refresh.
