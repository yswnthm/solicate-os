# Finance Module — Centralized Ledger Redesign

## Background

The current implementation stores `finance_items` as rows keyed by `project_id` + optional `phase_id`. This means:
- A payment received from a client that covers multiple phases must be entered multiple times (one per phase).
- There is no global view of cash flow across the whole agency.
- People (partners, freelancers) have no financial dimension — you cannot ask "how much do we still owe Sakshi?"
- The system cannot express that one payment covers partial amounts of several deliverables.

The redesign elevates Finance to a **first-class module** with its own navigation entry, global dashboard, and a centralized `transactions` ledger. Projects, phases, and people **reference** transactions through an `allocations` junction table. No money is ever recorded twice.

---

## All Decisions Confirmed

| Item | Decision |
|---|---|
| **Migration approach** | Hard cut-over. Existing data is not important — migrate what maps cleanly, discard the rest. |
| **Finance as top-level nav** | Yes — `/finance` added to sidebar alongside Projects, People, Relationships, Capture. |
| **Capture action types** | Yes — extend with new finance verbs via a new migration. Old templates unchanged. |
| **`payment_status` migration** | Yes — map old values to new `invoice_status` correctly. |

---

## Decisions Locked In

| Decision | Resolution |
|---|---|
| **Currency** | INR only. No multi-currency support now. `currency_code` column exists in schema for future but all UI assumes INR. |
| **Payment methods** | Configurable table. Start with one entry: "HDFC Savings". Will add Wise and Razorpay as the business grows. |
| **from/to entity** | `from_person_id` → `people`, `from_user_id` → `app_users` (and same for `to_`). External parties go through `people`; internal team goes through `app_users`. |
| **Invoice lifecycle** | Three stages: `preparing → sent → cleared`. Modeled as `invoice_status` on `income` transactions (see schema below). |

---

## Proposed Architecture

### Mental model shift

```
OLD:                          NEW:
Project                       Transaction (Ledger)
└── finance_items ──┐             └── allocations ──► Project / Phase / Person
                    │
                    ▼
              [data is trapped in project scope]
```

Every money movement is recorded once as a `transaction`. Then zero or more `allocations` slice that money across projects, phases, or cost centres.

---

## Proposed Database Schema (Migration 0024)

### New enum types

```sql
public.transaction_type    → income | expense | transfer | refund | adjustment
public.transaction_status  → planned | pending | completed | cancelled
public.allocation_target   → project | phase | overhead
public.invoice_status      → preparing | sent | cleared
```

### New tables

#### `finance_categories`
Configurable list of income/expense categories. Pre-seeded with sensible defaults.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Client Payment", "Freelancer" |
| transaction_type | transaction_type | income or expense |
| is_default | boolean | pre-seeded defaults |
| position | int | display order |
| created_at | timestamptz | |

Seed data — **Income**: Client Payment, Advance, Milestone, Final Payment, Refund, Other Income  
Seed data — **Expense**: Partner Payment, Freelancer, Salary, Software, Hosting, Equipment, Office, Marketing, Travel, Taxes, Bank Charges, Miscellaneous

#### `payment_methods`
Configurable payment channels. Seeded with the current account; more added as business grows.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "HDFC Savings", "Wise", "Razorpay", "Cash" |
| is_default | boolean | |
| created_at | timestamptz | |

Seed data: `HDFC Savings` (is_default = true)

#### `transactions`
The single source of truth for every movement of money.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| type | transaction_type | income / expense / transfer / refund / adjustment |
| amount | numeric(14,2) | always positive |
| currency_code | char(3) | Default `INR`. Column exists for future; all UI assumes INR now. |
| transaction_date | date | when the money moved |
| status | transaction_status | planned / pending / completed / cancelled |
| **invoice_status** | **invoice_status** | **NULL for non-income. For income: `preparing` → `sent` → `cleared`.** |
| invoice_date | date | when the invoice was prepared (income only, nullable) |
| invoice_sent_at | timestamptz | when the invoice was sent (nullable) |
| invoice_cleared_at | timestamptz | when payment was received / invoice cleared (nullable) |
| category_id | uuid → finance_categories | nullable |
| payment_method_id | uuid → payment_methods | nullable |
| from_person_id | uuid → people | nullable (external party who sent money) |
| from_user_id | uuid → app_users | nullable (internal sender) |
| to_person_id | uuid → people | nullable (external party who received money) |
| to_user_id | uuid → app_users | nullable (internal receiver) |
| reference_number | text | bank ref, UTR, cheque number |
| invoice_number | text | human-readable invoice number (e.g. "INV-2025-042") |
| notes | text | |
| created_by_id | uuid → app_users | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| updated_by_id | uuid → app_users | |

CHECKs:
- `(from_person_id IS NULL OR from_user_id IS NULL)` — sender is either external or internal, not both.
- `(to_person_id IS NULL OR to_user_id IS NULL)` — same for receiver.
- `(invoice_status IS NULL OR type = 'income')` — invoice lifecycle only applies to income transactions.
- `(invoice_status != 'cleared' OR invoice_cleared_at IS NOT NULL)` — cleared must have a timestamp.

#### `transaction_allocations`
One transaction → many allocations. Amounts must sum ≤ transaction amount.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| transaction_id | uuid → transactions ON DELETE CASCADE | |
| target | allocation_target | project / phase / overhead |
| project_id | uuid → projects ON DELETE SET NULL | nullable |
| phase_id | uuid → phases ON DELETE SET NULL | nullable |
| amount | numeric(14,2) | slice of the transaction amount |
| notes | text | |
| created_by_id | uuid → app_users | |
| created_at | timestamptz | |

CHECK: `(target = 'project' AND project_id IS NOT NULL)` OR `(target = 'phase' AND phase_id IS NOT NULL AND project_id IS NOT NULL)` OR `(target = 'overhead' AND project_id IS NULL AND phase_id IS NULL)`

#### DB view: `v_project_finance`
A computed view used by Project Finance panels — joins allocations back to transactions.
```sql
SELECT
  ta.project_id,
  t.id            AS transaction_id,
  t.type,
  t.status,
  t.transaction_date,
  t.currency_code,
  ta.amount       AS allocated_amount,
  t.notes,
  t.from_person_id, t.to_person_id,
  ta.phase_id,
  fc.name         AS category_name
FROM transaction_allocations ta
JOIN transactions t ON t.id = ta.transaction_id
LEFT JOIN finance_categories fc ON fc.id = t.category_id
WHERE ta.project_id IS NOT NULL;
```

#### DB view: `v_person_finance`
Summarizes what a person has sent and received.
```sql
SELECT
  person_id,
  direction,   -- 'received_from' | 'paid_to'
  SUM(amount) AS total,
  currency_code
FROM (
  SELECT from_person_id AS person_id, 'paid_to_us' AS direction, amount, currency_code FROM transactions WHERE status = 'completed'
  UNION ALL
  SELECT to_person_id   AS person_id, 'paid_by_us' AS direction, amount, currency_code FROM transactions WHERE status = 'completed'
) sub
WHERE person_id IS NOT NULL
GROUP BY person_id, direction, currency_code;
```

### Migration of existing `finance_items` data

Migration 0024 will:
1. Create all new tables above.
2. Seed `finance_categories` and `payment_methods` with defaults.
3. `INSERT INTO transactions SELECT …` — map `finance_items` to `transactions`:
   - `kind = 'invoice'` → `type = 'income'`, `invoice_status = 'sent'` (we know they were sent), `status = 'pending'`
   - `kind = 'payment'` → `type = 'income'`, `invoice_status = 'cleared'`, `status = 'completed'`, `invoice_cleared_at = occurred_on`
   - `kind = 'expense'` → `type = 'expense'`, `invoice_status = NULL`, `status = 'completed'`
   - Old `payment_status = 'paid'` → `invoice_status = 'cleared'`
   - Old `payment_status = 'partial'` → `invoice_status = 'sent'` (still outstanding)
   - `currency_code` defaults to `INR` for all migrated rows
4. `INSERT INTO transaction_allocations` — one allocation per old `finance_items` row, pointing to its `project_id` / `phase_id`.
5. Rename `finance_items` to `finance_items_legacy` (not dropped — kept as safety net for 30 days).
6. Update activity triggers to write to the new tables.
7. Update AI template rows to use new action verbs.

---

## Proposed Changes

### Database Layer

#### [NEW] `supabase/migrations/0024_finance_ledger.sql`
Full migration implementing all new tables, views, data migration from `finance_items`, updated RLS policies, updated triggers, and seeded categories + payment methods.

---

### Validation Layer

#### [MODIFY] [lib/validation.ts](file:///Users/yswnth/Documents/node/Projects/Solicate/solicate-os/lib/validation.ts) *(if it exists)* or equivalent schema file
- Add `transactionSchema`, `allocationSchema`, `financeCategorySchema`, `paymentMethodSchema`.
- Keep `financeItemSchema` as a deprecated alias during the cut-over period.

---

### Data Layer

#### [MODIFY] [features/queries.ts](file:///Users/yswnth/Documents/node/Projects/Solicate/solicate-os/features/queries.ts)
- Add `getGlobalFinanceDashboard()` — totals across all transactions (income, expense, net profit, outstanding receivables/payables).
- Add `getTransactions(filters?)` — paginated transaction list with optional filters (type, status, date range, project, person).
- Add `getTransactionDetail(txId)` — single transaction with all allocations expanded.
- Add `getProjectFinance(projectId)` — uses `v_project_finance` view; replaces the `finance_items` query in `getProjectWorkspace`.
- Add `getPhaseFinance(phaseId)` — same via phase filter.
- Add `getPersonFinance(personId)` — uses `v_person_finance` view; added to `getPersonDetail`.
- **Modify** `getProjectWorkspace()` — replace `finance_items` query with `v_project_finance` query. Same return key (`finance`) for backward compatibility with existing UI.
- **Modify** `getPhaseWorkspace()` — same as above.
- **Modify** `getProjectWorkspaceForAI()` — same.

#### [MODIFY] [features/actions.ts](file:///Users/yswnth/Documents/node/Projects/Solicate/solicate-os/features/actions.ts)
- Add `createTransaction(formData)` — inserts into `transactions`.
- Add `createAllocation(formData)` — inserts into `transaction_allocations`.
- Add `updateTransactionStatus(txId, status)` — mark completed / cancelled.
- **Deprecate** `createFinanceItem` — keep temporarily for backward compat; internally delegates to `createTransaction`.

#### [MODIFY] [features/update-actions.ts](file:///Users/yswnth/Documents/node/Projects/Solicate/solicate-os/features/update-actions.ts)
- Add `updateTransaction(id, data)` with full validation.
- Add `updateAllocation(id, data)`.
- Add `deleteAllocation(id)`.

#### [MODIFY] [features/ai-actions.ts](file:///Users/yswnth/Documents/node/Projects/Solicate/solicate-os/features/ai-actions.ts)
- Update `executeFinanceAction` handler to understand new action verbs: `finance.transaction`, `finance.allocate`, `finance.mark_completed`, `finance.mark_cancelled`.
- The existing `finance.mark_paid` action should remap to `finance.mark_completed`.

---

### UI Layer

#### [NEW] `app/(app)/finance/` — Global Finance Module

```
app/(app)/finance/
├── layout.tsx              ← Finance shell with sub-nav
├── page.tsx                ← Redirect to /finance/dashboard
├── dashboard/
│   └── page.tsx            ← Revenue, Expenses, Net, Outstanding, Recent Txns
├── transactions/
│   ├── page.tsx            ← Paginated transaction ledger with filter bar
│   └── [transactionId]/
│       └── page.tsx        ← Transaction detail + allocations panel
├── invoices/
│   └── page.tsx            ← Income transactions only, filtered by invoice_status
│                              Columns: Invoice #, Client, Amount, Status pill
│                              (preparing / sent / cleared), Date, Actions
├── categories/
│   └── page.tsx            ← CRUD for finance_categories
└── settings/
    └── page.tsx            ← Payment methods + other config
```

#### [NEW] `components/finance/` — Finance Components

```
components/finance/
├── transaction-ledger.tsx      ← Full ledger table (replaces finance-table.tsx)
├── transaction-form.tsx        ← Create/edit transaction modal form
├── allocation-form.tsx         ← Add/edit allocation on a transaction
├── allocation-list.tsx         ← Expandable allocation breakdown
├── finance-dashboard.tsx       ← Global metric cards
├── project-finance-panel.tsx   ← Embedded in project detail (replaces FinanceTable)
├── phase-finance-panel.tsx     ← Embedded in phase detail
├── person-finance-panel.tsx    ← Embedded in person detail
└── finance-table.tsx           ← KEEP (unchanged) — still used during transition
```

#### [MODIFY] `components/app-shell.tsx`
- Add `/finance` nav link to the sidebar, positioned after `/projects` and before `/people`.

#### [MODIFY] `app/(app)/projects/[projectId]/finances/page.tsx`
- Replace `FinanceTable` with `ProjectFinancePanel`.
- Show budget, revenue received, expenses, profit, outstanding, allocations.
- Keep "+ Log item" button but now it opens `TransactionForm`.
- Show invoice pipeline: a mini Kanban-style row of `preparing | sent | cleared` counts for this project's income transactions.

#### [MODIFY] `app/(app)/projects/[projectId]/phases/[phaseId]/` finances page (if exists)
- Replace with `PhaseFinancePanel`.

#### [MODIFY] `app/(app)/people/[personId]/` page
- Add a "Finances" section using `PersonFinancePanel`.
- Show: Money Received From / Paid To / Outstanding / Lifetime Value / Transaction History.

---

### AI Context Layer

#### [NEW] `supabase/migrations/0025_finance_ledger_ai_templates.sql`
- Update `capture_action_types` to include `finance.transaction`, `finance.allocate`, `finance.mark_completed`, `finance.invoice_sent`, `finance.invoice_cleared`.
- Update the active capture-propose template to describe:
  - New action verbs and the allocation model.
  - Invoice lifecycle: the AI should propose `finance.invoice_sent` when a capture implies "sent invoice to client" and `finance.invoice_cleared` when "received payment".
- Add finance-specific AI context to `getProjectWorkspaceForAI`: include 25 most recent transactions with allocations + invoice_status expanded.
- **Seed a new AI template pair**: `finance-capture-analyze` and `finance-capture-propose` — finance-only system prompts tuned for financial language (see Finance Capture section below).

---

## Finance Capture Module

A dedicated AI capture tuned exclusively for financial activity. Same approval-first philosophy as the general Capture — the AI proposes, the operator reviews, nothing writes without approval.

### Why a separate Finance Capture?

The general Capture is focused on project delivery: tasks, entries, decisions, issues. Its prompts and action menus are built around that domain. Financial language is different:

> "Received payment from Etsy, ₹52,000, split between Phase 3 and Phase 4"

The general capture can handle this today (via `finance.invoice`/`finance.payment`) but the context it loads and the actions it proposes are noisy with non-financial content. A dedicated Finance Capture:
- Loads only financial context (recent transactions, outstanding invoices, unallocated amounts)
- Proposes only financial action types
- Uses financial terminology in every label
- Is reachable directly from the Finance dashboard

### Architecture

```
app/(app)/finance/capture/
└── page.tsx             ← Finance Capture page (force-dynamic)

components/capture/
├── capture-flow.tsx        ← EXISTING (unchanged)
└── finance-capture-flow.tsx  ← NEW — finance-specific flow

features/
├── capture-actions.ts         ← EXISTING (shared session logic)
└── finance-capture-actions.ts ← NEW — finance-specific submit/analyze

lib/capture/
├── finance-context.ts   ← NEW — builds financial context for AI
└── finance-types.ts     ← NEW — Finance Capture action types
```

### New route: `/finance/capture`

```tsx
// app/(app)/finance/capture/page.tsx
export const dynamic = "force-dynamic";

import { getFinanceCaptureOptions } from "@/features/queries";
import { FinanceCaptureFlow } from "@/components/capture/finance-capture-flow";

export default async function FinanceCapturePage() {
  const options = await getFinanceCaptureOptions();
  return (
    <>
      <PageHeader
        title="Finance Capture"
        description="Tell the OS what moved. It proposes every transaction, allocation and invoice update — you approve before anything writes."
      />
      <FinanceCaptureFlow options={options} />
    </>
  );
}
```

### `getFinanceCaptureOptions()` (new query)

Loads the minimal context needed for the Finance Capture form:
- All active projects (for allocation targeting)
- All phases (for allocation targeting)
- All people (for from/to counterparty)
- Recent transactions (last 30, with allocations + invoice_status)
- Unallocated transactions (transactions where SUM(allocations) < amount)
- Open invoices (invoice_status = 'sent')
- Finance categories and payment methods
- Active AI models + the `finance-capture-analyze` template default model

### `FinanceCaptureFlow` component

Same multi-step flow as `CaptureFlow` (loading → form → analyzing → clarify → review → done), but:
- The **form** step shows finance-specific scope options:
  - `income` — received money from someone
  - `expense` — paid money to someone
  - `allocation` — split an existing transaction
  - `invoice_update` — update an invoice stage
- The **context** sent to the AI is the financial context (not the project workspace)
- The **action list** in the review step shows only finance action types
- The **KIND_LABELS** are financial terms ("New income transaction", "Mark invoice sent", etc.)

### Finance Capture Action Specs (new entries in `action-fields.tsx`)

```ts
"finance.transaction": {
  fields: [
    select("type", "Type", ["income", "expense", "transfer", "refund", "adjustment"]),
    { key: "amount", label: "Amount (₹)", type: "number" },
    { key: "transaction_date", label: "Date", type: "date" },
    select("invoice_status", "Invoice stage", ["preparing", "sent", "cleared"]),
    { key: "invoice_number", label: "Invoice #", type: "text", placeholder: "INV-2025-042" },
    { key: "reference_number", label: "Reference / UTR", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  refs: [
    { key: "person_id", label: "Counterparty (person)" },
  ],
},
"finance.allocate": {
  fields: [
    { key: "amount", label: "Amount (₹)", type: "number" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  refs: [
    { key: "ref_id", label: "Transaction" },
    { key: "project_id", label: "Project" },
    { key: "phase_id", label: "Phase" },
  ],
},
"finance.invoice_sent": {
  fields: [
    { key: "invoice_sent_at", label: "Sent at", type: "date" },
  ],
  refs: [{ key: "ref_id", label: "Transaction (invoice)" }],
},
"finance.invoice_cleared": {
  fields: [
    { key: "invoice_cleared_at", label: "Cleared at", type: "date" },
    { key: "reference_number", label: "UTR / Reference", type: "text" },
  ],
  refs: [{ key: "ref_id", label: "Transaction (invoice)" }],
},
"finance.mark_completed": {
  fields: [],
  refs: [{ key: "ref_id", label: "Transaction" }],
},
```

### Finance-specific AI templates (seeded in migration 0025)

**`finance-capture-analyze`** — first pass: understands what happened, asks for clarification if amounts/people/phases are ambiguous.

**`finance-capture-propose`** — second pass: proposes the exact `transactions` + `allocations` rows to write. Knows the invoice lifecycle. Can see unallocated transactions. Proposes allocations to resolve them.

The prompts are finance-domain focused — no tasks, entries, or project management language. They understand:
- "Received ₹52,000 from Etsy" → income transaction from client person
- "Split across Phase 3 and Phase 4" → two allocations
- "Sakshi invoice cleared" → `finance.invoice_cleared` on her latest sent invoice
- "Paid Sakshi ₹15,000" → expense transaction to Sakshi

### Entry points to Finance Capture

1. **Finance Dashboard** (`/finance/dashboard`)  
   Prominent "+ Finance Capture" button in the header bar — primary call-to-action on the dashboard.

2. **Finance Transactions list** (`/finance/transactions`)  
   Header-level "Capture" button beside "+ New Transaction".

3. **Finance Invoices list** (`/finance/invoices`)  
   Header-level "Capture" button for quickly updating invoice stages via AI.

4. **General Capture** (`/capture`)  
   A visible callout/link below the main form: **"Logging a payment or invoice? Use Finance Capture →"** — redirects to `/finance/capture`. Not buried — rendered as a styled button or banner just above or below the text area.

---

## UI Hierarchy

```
Finance (Global)
├── Dashboard
│   ├── KPI Cards: Revenue | Expenses | Net Profit | Outstanding In | Outstanding Out
│   ├── Cash Flow Chart (monthly bar chart)
│   └── Recent Transactions List
├── Transactions
│   ├── Filter Bar (type, status, date range, person, project)
│   ├── Transaction List (ledger table)
│   └── Transaction Detail
│       ├── Header: amount, type, status, date, counterparty
│       ├── Invoice Status (for income): Preparing → Sent → Cleared  [stage pills]
│       ├── Allocations List (project/phase breakdown)
│       └── Actions: Edit | Add Allocation | Mark Sent | Mark Cleared | Cancel
├── Invoices
│   ├── Filter: All | Preparing | Sent | Cleared
│   ├── Invoice List (income transactions showing invoice pipeline)
│   └── Quick Actions: Mark Sent | Mark Cleared | View Allocations
├── Categories (Settings)
└── Payment Methods (Settings)

Finance (Project-embedded)
├── Summary Cards: Budget | Revenue | Expenses | Profit | Outstanding
├── Transaction Timeline (all transactions allocated to this project)
└── Allocation Breakdown (per phase)
Finance (Phase-embedded)
├── Summary Cards: Quoted | Received | Expenses | Outstanding
└── Related Transactions

Finance (Person-embedded)
├── Summary: Lifetime Value | Outstanding Balance
├── Received From (income)
├── Paid To (expenses)
└── Transaction History
```

---

## Navigation Flow

```
Sidebar: Finance
    → /finance/dashboard              (default)
    → /finance/transactions           (full ledger)
        → /finance/transactions/[id]  (detail + allocations)
    → /finance/invoices               (invoice pipeline — preparing/sent/cleared)
    → /finance/capture                (Finance Capture — AI for financial activity)
    → /finance/categories             (settings)
    → /finance/settings               (payment methods)

General Capture (/capture)
    → Banner: "Logging a payment or invoice? → Finance Capture"
       redirects to /finance/capture

Project detail sub-nav
    → /projects/[id]/finances         (project finance panel — unchanged URL)

Person detail
    → /people/[id]                    (finances section added inline)
```

---

## Dashboard Layouts

### Global Finance Dashboard (`/finance/dashboard`)

```
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│ Revenue(YTD)│Expenses(YTD)│ Net Profit │  Invoices  │ Outstanding│
│  ₹X,XX,XXX │  ₹X,XX,XXX │  ₹X,XX,XXX │  Sent: N   │  ₹X,XXX   │
└────────────┴────────────┴────────────┴────────────┴────────────┘

Invoice Pipeline
┌──────────────────┬───────────────────┬───────────────────┐
│   Preparing (N)  │    Sent (N)       │   Cleared (N)     │
│  ₹X,XX,XXX       │  ₹X,XX,XXX        │  ₹X,XX,XXX        │
└──────────────────┴───────────────────┴───────────────────┘

┌───────────────────────────┐  ┌──────────────────────────────────┐
│  Cash Flow (last 6 months)│  │  Upcoming Payments               │
│  [Bar chart — INR]        │  │  • Sakshi — ₹15k due Nov 10      │
└───────────────────────────┘  └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Recent Transactions                                            │
│  Date │ Invoice # │  Description  │  Type  │  Amount │  Status  │
└─────────────────────────────────────────────────────────────────┘
```

### Project Finance Panel

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  Budget      │  Revenue In  │  Expenses    │  Profit      │  Outstanding │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
[Transaction Timeline — grouped by phase]
Phase 1 ──────────────────────────────────
  $700 (of $1500 txn #104 · Etsy client payment)
  $500 Freelancer payment to Sakshi
Phase 2 ──────────────────────────────────
  $500 (of $1500 txn #104 · Etsy client payment)
```

---

## Transaction Workflow

### Standard (Expense / Transfer)
1. **Create Transaction** — operator enters amount, type (expense/transfer), counterparty, date, category, payment method.
2. **Save** → `transactions` row created with `status = completed` for expenses.
3. **Add Allocations** (optional) — operator splits the amount across projects/phases.

### Invoice Workflow (Income)
1. **Prepare Invoice** — operator creates income transaction with `invoice_status = preparing`.
   - Fields: client/person, amount, invoice_number, invoice_date, category.
2. **Send Invoice** — click "Mark Sent" → `invoice_status = sent`, `invoice_sent_at = now()`.
3. **Clear Invoice** — click "Mark Cleared" when payment received → `invoice_status = cleared`, `invoice_cleared_at = now()`, `status = completed`.
4. **Allocate** — at any stage, operator can add allocations to projects/phases.

This three-stage lifecycle means:
- You can see exactly which invoices are still being prepared.
- You can see which are sent but unpaid (these are your outstanding receivables).
- You can see which are cleared (revenue confirmed).

### Allocation Workflow

1. On any transaction detail page: click "Allocate".
2. Select target: Project / Phase / Overhead.
3. Enter amount (must not exceed unallocated balance).
4. Save → `transaction_allocations` row created.
5. The "Unallocated" badge on the transaction updates in real time.

---

## AI Integration Points

### Capture → Finance Actions

The capture-propose template will be updated to understand:

| Action verb | What it does |
|---|---|
| `finance.transaction` | Creates a new `transactions` row |
| `finance.allocate` | Adds an `allocation` to an existing transaction |
| `finance.invoice_sent` | Sets `invoice_status = 'sent'` + `invoice_sent_at` on an income transaction |
| `finance.invoice_cleared` | Sets `invoice_status = 'cleared'` + `invoice_cleared_at` + `status = 'completed'` |
| `finance.mark_completed` | Sets `status = 'completed'` (for non-invoice expenses) |
| `finance.mark_cancelled` | Sets `status = 'cancelled'` |

The AI can now reason:

> "Received $1500 from Etsy client"
> → Propose: `finance.transaction { type: income, amount: 1500, currency: USD, from_person: <Etsy contact id> }`
> → Propose: `finance.allocate { transaction_id: <new>, project_id: <Etsy>, phase_id: <Phase 2>, amount: 700 }`
> → Propose: `finance.allocate { transaction_id: <new>, project_id: <Etsy>, phase_id: <Phase 3>, amount: 500 }`

### AI Context in Project Workspace

The project AI context (`getProjectWorkspaceForAI`) will include:
```json
"finance": [
  {
    "id": "txn-uuid",
    "type": "income",
    "amount": 1500,
    "currency": "USD",
    "status": "completed",
    "date": "2025-11-01",
    "from": "Etsy Client Name",
    "allocations": [
      { "phase": "Phase 2", "amount": 700 },
      { "phase": "Phase 3", "amount": 500 },
      { "overhead": "Revision", "amount": 300 }
    ]
  }
]
```

This enables AI answers to:
- "Has Phase 2 been paid?" — Yes: $700 allocated via txn #104.
- "How much do we still owe Sakshi?" — Sum of incomplete `expense` transactions where `to_person = Sakshi`.
- "Which transactions need allocation?" — `transactions` where `SUM(allocations.amount) < transactions.amount`.

---

## Migration Strategy from Current System

| Step | What happens | Risk |
|---|---|---|
| **1. Schema** | Run migration 0024 — create new tables, migrate data, rename `finance_items` → `finance_items_legacy` | Low — additive |
| **2. Queries** | Update `getProjectWorkspace` to read from `v_project_finance` | Medium — test sum parity |
| **3. UI** | Replace `FinanceTable` with `ProjectFinancePanel`, add `/finance` route | Low — feature addition |
| **4. Actions** | Add new create/update actions; keep old `createFinanceItem` as delegate | Low |
| **5. AI** | Run migration 0025 — update template rows | Low |
| **6. Validate** | Verify totals match pre-migration for each project | Manual check |
| **7. Cleanup** | Drop `finance_items_legacy` after 30 days if no issues | Low |

---

## Risks & Edge Cases

| Risk | Mitigation |
|---|---|
| Allocation amounts exceed transaction amount | DB constraint: `CHECK (SUM(allocations) <= transaction.amount)` via trigger |
| Transaction with no allocations | Allowed — show as "unallocated" with a UI badge |
| Multi-currency allocations | Allocations inherit the transaction's currency; no cross-currency allocation |
| Old `payment_status` mapping | `pending` → `pending`, `partial` → `pending` (with partial allocations), `paid` → `completed` |
| AI context token budget | AI workspace still capped at 25 finance items; now they carry richer allocation data |
| Project delete cascades | `project_id` in allocations is `ON DELETE SET NULL` — transaction survives, allocation becomes unlinked |
| Person not always present | `from_person_id` and `to_person_id` are nullable; internal transfers use `from_user_id` |

---

## Future Scalability Considerations

The schema as designed supports without further redesign:

- **Invoice management (full)** — the `invoice_status` lifecycle on transactions is the lightweight first version. A dedicated `invoices` table (with PDF generation, line items, GST) can be added later without touching `transactions`. The two will link via `invoice_number`.
- **Partial payments** — a single invoice can have multiple `income` transactions linked via `invoice_number`.
- **Installments** — multiple `planned` transactions with future dates.
- **Currency conversion** — add `exchange_rate` + `base_currency_amount` columns to `transactions`.
- **Profit reports** — `v_project_finance` aggregated by project.
- **Cash flow forecast** — `transactions WHERE status = 'planned' ORDER BY transaction_date`.
- **Tax reports** — category filter on `expense` transactions.
- **Client account statements** — `v_person_finance` filtered by `from_person_id`.
- **Partner settlements** — `transactions WHERE to_person_id = <partner> AND status != 'completed'`.
- **AI financial summaries** — feed `v_project_finance` into `getProjectWorkspaceForAI`.
- **Financial reminders** — scheduled job reading `transactions WHERE status = 'planned' AND transaction_date <= now() + interval '7 days'`.

---

## Verification Plan

### Automated Tests
- Run `bun run build` after all changes to confirm TypeScript compiles cleanly.
- Verify migration runs against a fresh Supabase local instance: `supabase db reset`.

### Manual Verification
1. Open each existing project's `/finances` tab — confirm all prior records are visible with correct amounts.
2. Create a new transaction from `/finance/transactions` — confirm it appears in the global ledger.
3. Add two allocations to that transaction splitting across two phases — confirm both project finance panels update.
4. Run a capture mentioning a payment — confirm AI proposes `finance.transaction` and `finance.allocate` actions.
5. Open a person detail page — confirm the Finances section shows correct totals.
6. Verify unallocated transactions show a badge and appear in a dedicated "Needs Allocation" view.
