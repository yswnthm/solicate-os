# Solicate OS — AI Agent Database Guide

Operational reference for AI agents reading and modifying the Solicate OS database.

> **Hard Rule:** Never paste secrets into code, commits, logs, or chat. Credentials live strictly in `.env.local` (gitignored).

---

## 1. Connection & RLS

* **Runtime API:** Read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `.env.local`.
* **Access Model:** Row-Level Security (RLS) is enabled on all tables. Unauthenticated queries return `[]` (empty list), **not** an error.
* **Direct Postgres / psql (Bypasses RLS — for admin scripts & migrations):**
  ```bash
  PGPASSWORD=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) \
    psql "postgresql://postgres.krfqsroptgwnmqoqvjle@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
  ```
* **App Context:** `app_users` table gates active internal users via `public.is_active_internal_user()`.

---

## 2. Table Inventory & Schema Reference

### Operational & Relationship Core

| Table | Purpose | Key Columns & Foreign Keys |
| :--- | :--- | :--- |
| **`app_users`** | Internal team members | `id`, `display_name`, `is_active`, `role` (`owner\|admin\|member`), `workspace_id` |
| **`people`** | Contacts, partners, clients | `id`, `name`, `email`, `phone`, `is_partner` (bool), `archived_at` |
| **`relationships`** | People connections | `person_id` → `people(id)`, `type` (`client\|lead\|partner\|team\|internal`), `status` (`active\|paused\|completed\|archived`) |
| **`projects`** | Client / internal engagements | `id`, `name`, `code`, `status` (`active\|paused\|completed\|archived`), `person_id` → `people(id)`, `summary`, `objective`, `started_on`, `archived_at` |
| **`project_participants`** | People on a project | `project_id` → `projects(id)`, `person_id` → `people(id)`, `role` (`lead\|owner\|partner\|contractor\|advisor\|client_contact`), `financial_arrangement`, `payment_status` |
| **`phases`** | Sequential project phases | `id`, `project_id` → `projects(id)`, `name`, `position` (int), `status` (`planned\|active\|on_hold\|completed\|cancelled`), `started_on`, `completed_at`, `scope_deliverables`, `proposal_pricing` |
| **`tasks`** | Actionable work items | `id`, `project_id` (nullable for global agency tasks), `phase_id` → `phases(id)`, `title`, `description_md`, `status` (`todo\|in_progress\|blocked\|done\|cancelled`), `priority` (`low\|normal\|high\|urgent`), `assignee_id` → `app_users(id)`, `due_at`, `completed_at`, `position` |
| **`task_subtasks`** | Task checklist items | `id`, `task_id` → `tasks(id)`, `title`, `notes`, `done` (bool), `position` (int) |
| **`entries`** | Notes, docs, decisions, captures | `id`, `project_id` (nullable), `phase_id`, `type` (`note\|meeting\|decision\|document\|update\|milestone\|capture`), `triage_state` (`inbox\|filed\|dismissed`), `decision_outcome`, `decision_state` (`active\|superseded\|reversed`), `occurred_at` |

### Finance Ledger

| Table | Purpose | Key Columns & Constraints |
| :--- | :--- | :--- |
| **`transactions`** | Master income / expense ledger | `id`, `type` (`income\|expense`), `amount` (numeric > 0), `currency_code`, `invoice_status` (`preparing\|sent\|cleared` for income only), `invoice_number`, `occurred_at` |
| **`transaction_allocations`** | Split of transaction to projects | `id`, `transaction_id` → `transactions(id)`, `project_id` → `projects(id)`, `phase_id` → `phases(id)`, `amount` (sum <= transaction.amount) |

### Audit Trail & Triggers

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| **`activity_events`** | User-facing activity feed | `project_id`, `actor_id` → `app_users(id)`, `record_type`, `record_id`, `event_type`, `summary`, `occurred_at` |
| **`record_history`** | Automated field-level diffs | `entity_type` (`task\|phase\|transaction\|project`), `entity_id`, `changed_by_id` → `app_users(id)`, `diff` (jsonb) |

---

## 3. Standard AI Operational SOPs

### SOP 1: Triaging Inbox Captures
1. Captures arrive with `type = 'capture'` and `triage_state = 'inbox'`.
2. When triaged to a project: update `triage_state = 'filed'`, set `project_id = <target_id>`, and update `type` to `'note'`, `'document'`, or `'decision'` if applicable.
3. When converted to a task: insert row in `tasks` with `origin_entry_id = <entry_id>`, then set entry `triage_state = 'filed'`.

### SOP 2: Task Status & Completed Checks
* **Constraint:** A task with `status = 'done'` **must** have `completed_at IS NOT NULL`. A task with `status != 'done'` must have `completed_at = NULL`.
* Setting status to done:
  ```sql
  UPDATE public.tasks SET status = 'done', completed_at = NOW() WHERE id = '<task_id>';
  ```

### SOP 3: Phase Management & Task Alignment
1. **Scope Integrity:** Tasks representing core phase deliverables carry `phase_id`. General roadmap/strategy tasks should have `phase_id = NULL`.
2. **Completing a Phase:**
   ```sql
   UPDATE public.phases SET status = 'completed', completed_at = NOW() WHERE id = '<phase_id>';
   ```
3. Always log a milestone entry in `entries` when a major phase completes.

### SOP 4: Direct SQL & Migration Safety
1. **Wrap in Transactions:** Always execute multi-statement updates inside `BEGIN; ... COMMIT;`.
2. **Handle Audit Trigger Fallback:** In non-JWT migration scripts, `auth.uid()` is null. The `log_record_history()` function automatically falls back to `(SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)`.
3. **Foreign Key Cascade Order on Delete:** `task_subtasks` → `tasks` → `activity_events` → `phases` → `projects`.

---

## 4. Cache Invalidation Rule

After executing server actions or API writes, always trigger cache invalidation so the Next.js frontend updates:
* `revalidatePath("/projects/[projectId]")`
* `revalidatePath("/today")`
* `revalidateTag("inbox")` (for capture mutations)

---

## 5. Solicate Internal Schema (`solicate.*`)

A dedicated schema modeling **Solicate itself** as a first-class entity — completely separate from client data. No RLS: these are internal agency records. AI agents should query this schema for context on positioning, services, team, and growth phase before drafting proposals or content.

> **Rule:** Never mix `solicate.*` tables with client data. Cross-references are only via FK into `public.people` (partners) and `public.app_users` (internal users).

### Tables

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| **`solicate.profile`** | Singleton agency identity row | `name`, `tagline`, `founded_on`, `target_market`, `north_star`, `brand_voice` (empty until filled), `website_url` |
| **`solicate.phases`** | Agency growth eras | `position` (int), `name`, `status` (`planned\|active\|completed`), `started_on`, `target_date`, `description`, `success_definition` |
| **`solicate.services`** | Service lines Solicate offers | `name`, `slug` (unique key), `status` (`active\|experimental\|planned\|deprecated`), `pricing_from`, `pricing_currency`, `model` (`retainer\|project\|phase_based\|hybrid`) |
| **`solicate.team`** | Team + partner network | `name`, `role`, `role_type` (`founder\|employee\|partner\|contractor\|advisor`), `skills`, `status`, `person_id` → `public.people(id)`, `user_id` → `public.app_users(id)` |

### Quick Queries (for agent context injection)

```sql
-- Full agency context
SELECT name, tagline, target_market, north_star, brand_voice FROM solicate.profile LIMIT 1;

-- Active growth phase
SELECT name, description, success_definition FROM solicate.phases WHERE status = 'active' LIMIT 1;

-- All active services
SELECT name, slug, description, pricing_from, pricing_currency, model FROM solicate.services WHERE status = 'active' ORDER BY name;

-- Active team
SELECT name, role, role_type, skills FROM solicate.team WHERE status = 'active' ORDER BY joined_on;
```

### Current State (as of Aug 2026)

* **Phase:** Phase 1 — Foundation (`active`)
* **Services:** organic growth & authority · ecommerce catalog & content · web & digital presence
* **Team:** Yeswanth (Founder) · Sakshi (Partner)
* **Brand Voice:** Empty — fill when ready before agent-assisted content drafting.
