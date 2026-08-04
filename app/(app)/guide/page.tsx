export const dynamic = "force-dynamic";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="Guide"
        description="How Solicate OS works — the mental model, every page, the command palette, and the workflows that keep the agency record accurate."
      />

      <div className="stack">
        <Section title="What this is">
          <div className="prose">
            <p>
              Solicate OS is the internal agency operating system for Solicate — a living record of clients,
              projects, decisions, and conversations. It is not a client portal or a public product; partners and
              client contacts are external records and never get login access.
            </p>
            <p>
              The point of the system is <strong>memory</strong>: capture things as they happen, file them into
              their project, and search the original record later instead of trusting a summary.
            </p>
          </div>
        </Section>

        <Section title="The mental model">
          <div className="list">
            <div className="row">
              <div className="row-main">
                <div className="row-title">Relationship → Client → Project → Phase → Work</div>
                <div className="row-meta">
                  A <em>relationship</em> records how a client entered Solicate and the terms attached. A{" "}
                  <em>client</em> is the business you serve. A <em>project</em> holds the strategy — the objective,
                  success definition, and direction. A <em>phase</em> owns the execution: scope, proposal, tasks,
                  issues, records, and finance.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Projects set direction, phases do the work</div>
                <div className="row-meta">
                  Projects answer &quot;what are we trying to achieve&quot; — never &quot;what are we doing
                  today.&quot; Daily work, records, decisions, and finance live inside phases. Project-level tasks
                  and issues only exist when they haven&apos;t been phased yet.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Money reality vs money intent</div>
                <div className="row-meta">
                  <strong>Transactions</strong> are what actually moved (income, expense, transfer, refund,
                  adjustment). <strong>Allocations</strong> map that money to projects and phases so you know what
                  each engagement actually cost or earned. Keep both current and the Finance pages stay truthful.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">People are external records</div>
                <div className="row-meta">
                  Client contacts, partners, referrers, and collaborators live in People. Marking someone a partner
                  does not create an account.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Inbox & Capture is the ingestion hub</div>
                <div className="row-meta">
                  Quick captures (notes, tasks, decisions, updates) and untriaged messages land in the unified Inbox &amp; Capture Hub.
                  Use the inline command bar for instant capture or switch tabs to AI Deep Capture for multi-update extraction.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Archive, don&apos;t delete</div>
                <div className="row-meta">
                  Completed and closed work stays searchable. Nothing important ever leaves the record.
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="A daily workflow">
          <div className="prose">
            <p>
              The fastest way to work in Solicate is one steady loop — <strong>plan → capture → triage →
              reflect</strong>. Everything below takes seconds because it starts from <Kbd>⌘K</Kbd> or a{" "}
              <Kbd>G</Kbd> shortcut.
            </p>
            <p>
              <strong>1. Start at Today.</strong> <Kbd>G</Kbd> <Kbd>T</Kbd>. Overdue work and open issues are the
              real agenda; ignore the rest until the inbox is done.
            </p>
            <p>
              <strong>2. Get the AI brief.</strong> <em>Morning brief</em> drafts a day plan from overdue items,
              upcoming tasks, open issues, inbox, and project pulse. <em>Week in review</em> reads the last 7 days
              across every project so you never start a week guessing what moved. Both are read-only until you save.
            </p>
            <p>
              <strong>3. Capture &amp; triage in one place.</strong> <Kbd>G</Kbd> <Kbd>I</Kbd>. Drop instant notes, tasks, or decisions using the top Quick Capture bar, or press <Kbd>⌘⇧X</Kbd> for AI Deep Capture. File each item into its project (or let ✨ Triage all draft everything with AI). Zero inbox = the record is complete.
            </p>
            <p>
              <strong>4. Close the loop weekly.</strong> On each active project use{" "}
              <em>✨ Weekly summary</em> to draft the week&apos;s update, approve it as a record, and archive nothing.
            </p>
          </div>
        </Section>

        <Section title="Pages & shortcuts">
          <Table
            head={["Page", "Shortcut", "What it is for"]}
            rows={[
              ["Today", "G T", "Daily command center: overdue, upcoming, open issues, recent projects, inbox preview."],
              ["Inbox & Capture", "G I", "Unified ingestion center: inline quick capture bar, untriaged queue filing, and AI Deep Capture mode."],
              ["AI Deep Capture", "⌘⇧X", "Describe what happened in plain English; AI proposes multi-table operational updates."],
              ["Projects", "G P", "All delivery work with active/paused counts."],
              ["Clients", "G C", "Businesses and individuals Solicate serves."],
              ["Relationships", "—", "How each client came in, referrals, and relationship-level terms."],
              ["People", "G U", "Client contacts, partners, and referrers."],
              ["Finance", "—", "Money reality: YTD income/expense/net, invoice pipeline, and the transaction ledger."],
              ["Search", "G S", "Find the original record, not a summary."],
              ["AI — Drafter", "—", "Draft a message to anyone on a project; mark sent to file it."],
              ["AI — Templates / Models", "—", "The versioned prompts and the model catalog behind every AI feature."],
              ["Settings", "—", "Account, sign out, and operational guidelines."],
              ["Guide", "G ?", "You are here."],
            ]}
          />
          <div className="prose" style={{ marginTop: 12 }}>
            <p>
              To navigate with the keyboard, press <Kbd>G</Kbd> then the letter within a second — e.g.{" "}
              <Kbd>G</Kbd> <Kbd>T</Kbd> opens Today. Shortcuts are ignored while you are typing in a field.
              Finance and the AI pages have no <Kbd>G</Kbd> shortcut — reach them from the sidebar or{" "}
              <Kbd>⌘K</Kbd>.
            </p>
          </div>
        </Section>

        <Section title="The command palette">
          <div className="list">
            <div className="row">
              <div className="row-main">
                <div className="row-title">
                  Press <Kbd>⌘K</Kbd> (or <Kbd>Ctrl+K</Kbd>)
                </div>
                <div className="row-meta">
                  Toggle the palette from anywhere. Type to search projects, people, records, and messages, or pick
                  from Recents, Go to, and Create. Type at least two characters and it searches live.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">
                  <Kbd>/</Kbd> opens the palette from any page
                </div>
                <div className="row-meta">
                  Same dialog as <Kbd>⌘K</Kbd> — the fastest way to jump without touching the mouse.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Go to</div>
                <div className="row-meta">
                  Today, Inbox, Projects, Clients, Relationships, People, Search, Message Drafter, AI templates, AI
                  models, Guide.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Create</div>
                <div className="row-meta">
                  Capture (AI), New project, New client, New relationship, New person — each opens an inline form
                  that files as soon as you submit.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Contextual actions</div>
                <div className="row-meta">
                  On a project page the palette offers Add task, Log issue, Log record, and the status transitions
                  (pause / complete / archive) pre-scoped to that project. On a client page it offers New
                  conversation.
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Capturing & the inbox flow">
          <div className="prose">
            <p>
              <strong>1. Instant Quick Capture.</strong> Don&apos;t hold a thought in your head — use the inline Command Bar at the top of Inbox &amp; Capture (<Kbd>G</Kbd> <Kbd>I</Kbd>). Type a note, task, decision, or update, select an optional project, and hit Enter. It drops into your queue with zero friction.
            </p>
            <p>
              <strong>2. AI Deep Capture.</strong> Switch to the ⚡ <em>AI Quick Capture</em> tab (or <Kbd>⌘⇧X</Kbd>) when you want to describe complex updates in plain English. The AI analyzes your text against project memory and proposes multi-table updates (phases, tasks, decisions, finance, milestones).
            </p>
            <p>
              <strong>3. Review, then apply.</strong> The AI proposes concrete updates. Review each one: approve or reject individually, edit any payload, regenerate, or extract more actions. <strong>Nothing is written until you apply.</strong>
            </p>
            <p>
              <strong>4. Triage &amp; Clear.</strong> Read untriaged items, file them into projects manually, or use ✨ <em>Triage all with AI</em> to draft titles, types, and projects for your whole queue at once. Aim for Inbox Zero.
            </p>
          </div>
        </Section>

        <Section title="Running a project">
          <div className="prose">
            <p>
              Open a project to its tabbed workspace: <strong>Overview</strong> (strategy, financials, counts,
              activity), <strong>Timeline</strong>, <strong>Documents</strong>, <strong>Decisions</strong>,{" "}
              <strong>Finances</strong>, <strong>Milestones</strong>, <strong>Participants</strong>, and{" "}
              <strong>Phases</strong>. Projects set strategy — the objective, success definition, and direction —
              while the day-to-day lives in phases.
            </p>
            <p>
              Each <strong>phase</strong> has its own workspace: Dashboard (health, progress, open work), Scope,
              Proposal, Finance, Timeline, Tasks, Issues, Decisions, Notes, Documents, Milestones, and Records.
              Move a project through its life — <em>active → paused / completed → archived</em> — from the header
              status controls or the command palette. Group tasks into phases as the engagement grows, and log risks
              as issues with a severity.
            </p>
            <p>
              On the project page, <Kbd>✨ Weekly summary</Kbd> drafts an update from the last 7 days of activity;
              edit and Approve &amp; file it as a record.
            </p>
          </div>
        </Section>

        <Section title="Finance">
          <div className="prose">
            <p>
              Finance has one job: keep the <strong>money reality</strong> in sync with the work. Reach it from the
              sidebar (Finance), where <strong>/finance/dashboard</strong> is the landing view.
            </p>
            <p>
              <strong>Dashboard.</strong> Year-to-date income, expense, and net profit at a glance, an invoice
              pipeline (what&apos;s being prepared vs sent and awaiting payment), open invoices, and recent ledger
              activity. Check this weekly — it should agree with your bank account and your invoice list.
            </p>
            <p>
              <strong>Ledger.</strong> <Link href="/finance/transactions">All transactions</Link>, newest first,
              filterable by type (income, expense, transfer, refund, adjustment) and status (planned, pending,
              completed, cancelled). Use <em>Load more</em> to page through history. Each row shows its allocations
              and where the money sits.
            </p>
            <p>
              <strong>Transaction detail.</strong> Open any transaction for the full picture: counterparty,
              category, payment method, notes, invoice info (number, sent/cleared dates, ref/UTR), and the
              <em> Allocations</em> panel. Allocate unallocated money to a project or phase (or leave it as
              overhead) with <em>Add allocation</em>; edit or re-target allocations freely. The amount you can
              allocate is capped by the transaction amount.
            </p>
            <p>
              <strong>Invoices.</strong> Income transactions carry an invoice lifecycle —{" "}
              <em>preparing → sent → cleared</em>. Advance it from the <Link href="/finance/invoices">Invoices</Link>{" "}
              page (Mark Sent / Mark Cleared) as real-world events happen, so the pipeline stays truthful.
            </p>
            <p>
              <strong>Finance Capture.</strong> The fastest way to log money. Pick a scope — income, expense,
              allocation, or invoice update — and type what happened in plain English, e.g.{" "}
              <em>&quot;The ₹15,000 final payment from Acme for Phase 2 cleared&quot;</em> or{" "}
              <em>&quot;Allocate ₹5,000 from the recent Acme transfer to the Design phase.&quot;</em> The AI
              cross-references open invoices, active projects, and recent transactions to propose the exact ledger
              entries, then you review and apply.
            </p>
            <p>
              <strong>Money intent.</strong> Once a transaction exists, keep it allocated to the projects and phases
              it belongs to — that is what makes project-level Finances, margins, and the dashboard trustworthy.
            </p>
          </div>
        </Section>

        <Section title="Status reference">
          <h3 style={{ margin: "0 0 8px" }}>Relationships</h3>
          <Table
            head={["Field", "Options"]}
            rows={[
              ["Source", "inbound, outbound, referral, existing, other"],
              ["Status", "active, dormant, churned"],
            ]}
          />
          <h3 style={{ margin: "20px 0 8px" }}>Projects &amp; phases</h3>
          <Table
            head={["Entity", "Statuses"]}
            rows={[
              ["Project", "active → paused / completed → archived"],
              ["Phase", "planned, active, on_hold, completed, cancelled"],
            ]}
          />
          <h3 style={{ margin: "20px 0 8px" }}>Tasks</h3>
          <Table
            head={["Field", "Options"]}
            rows={[
              ["Status", "todo → done (Mark done / Reopen); cancelled via edit"],
              ["Priority", "urgent, high, normal, low"],
            ]}
          />
          <h3 style={{ margin: "20px 0 8px" }}>Issues</h3>
          <Table
            head={["Field", "Options"]}
            rows={[
              ["Severity", "critical, high, medium, low"],
              ["Close as", "resolved, accepted (risk accepted), closed (won't fix)"],
            ]}
          />
          <h3 style={{ margin: "20px 0 8px" }}>Finance</h3>
          <Table
            head={["Field", "Options"]}
            rows={[
              ["Transaction type", "income, expense, transfer, refund, adjustment"],
              ["Transaction status", "planned, pending, completed, cancelled"],
              ["Invoice status", "preparing → sent → cleared (income only)"],
              ["Allocation", "transaction → project (optionally a phase), or overhead"],
            ]}
          />
          <h3 style={{ margin: "20px 0 8px" }}>Records &amp; conversations</h3>
          <Table
            head={["Entity", "Options"]}
            rows={[
              ["Record type", "note, meeting, decision, document, update, milestone, capture"],
              ["Conversation", "kind: group / direct · channel: whatsapp / email / manual"],
            ]}
          />
          <h3 style={{ margin: "20px 0 8px" }}>Participants &amp; terms</h3>
          <Table
            head={["Field", "Options"]}
            rows={[
              ["Role", "client_contact, partner, collaborator"],
              ["Communication", "solicate_leads, partner_leads, shared, advisory_only"],
              ["Financial", "none, referral_commission, revenue_share, delivery_split, fixed_fee"],
            ]}
          />
          <div className="notice" style={{ marginTop: 16 }}>
            <p style={{ margin: 0 }}>
              Record <strong>decisions</strong> with an outcome — the project page shows it next to the record so
              future-you knows what was decided and why.
            </p>
          </div>
        </Section>

        <Section title="Editing & history">
          <div className="prose">
            <p>
              Every row has an edit button that opens a reusable modal — relationships, clients, projects, people,
              phases, tasks, issues, records, participants, and conversations. Finance items in the Finance tab can
              be edited too. Edits record who made them, and the <strong>Activity</strong> section on each project
              keeps a readable trail of meaningful changes.
            </p>
            <p>
              Anything logged anywhere is reachable from <Link href="/search">Search</Link> — which covers record
              titles, record bodies, and message content (Postgres full-text search). From any page,{" "}
              <Kbd>⌘K</Kbd> and start typing to search before you even reach the Search page.
            </p>
          </div>
        </Section>

        <Section title="AI features">
          <Table
            head={["Where", "What it does"]}
            rows={[
              ["Today — Morning brief", "Drafts a day plan from overdue, upcoming, issues, inbox, and project pulse. Read-only until you save it as a note or copy it."],
              ["Today — Week in review", "Reads every project's last 7 days: what moved, decisions, risks, momentum. Save as a note or copy."],
              ["Project — Weekly summary", "Drafts a project update from 7 days of activity; Approve & file it as a record."],
              ["Inbox — AI triage", "Drafts title / type / project / body for inbox items; edit then approve & file, or skip."],
              ["Capture (AI)", "Turns a plain-English account of what happened into concrete updates — tasks, decisions, meetings, finance, milestones, even new projects and clients. Review each one before applying."],
              ["Finance Capture", "Logs income, expenses, allocations, and invoice updates from plain English, cross-referenced against your actual open invoices, projects, and transactions."],
              ["Message Drafter", "Drafts a message to anyone on a project; mark sent to file it as an outbound message."],
            ]}
          />
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            AI actions are drafts only — nothing is written to the record until you approve or save.
          </p>
        </Section>

        <Section title="AI & the message drafter">
          <div className="prose">
            <p>
              Every AI capability runs through the same engine: a <strong>template</strong> (prompt + output rules),
              automatically gathered <strong>context</strong>, and a <strong>model</strong> resolved from the catalog.
              This is why the Message Drafter works with zero setup — it reads the project, phase, person, conversation
              history, records, decisions, and financials by itself.
            </p>
          </div>
          <Table
            head={["Where", "What it does"]}
            rows={[
              ["AI — Message Drafter", "Drafts a message to anyone on a project. Pick project → person, say what it should do, choose length/style, draft. Mark sent to file it as an outbound message (creating the conversation if needed)."],
              ["AI — Templates", "The versioned prompts behind every AI feature. Editing appends a version — nothing is overwritten."],
              ["AI — Models", "The model catalog. Toggle models on/off; a template's default falls back to the first active model."],
              ["AI — Settings", "Provider key status (Groq, Gemini). Keys live in .env.local, never in the database."],
            ]}
          />
        </Section>

        <Section title="Common tasks — cheat sheet">
          <Table
            head={["I want to…", "Fastest path"]}
            rows={[
              ["Log a payment I received", "Sidebar → Finance → Finance Capture → Income, or ⌘⇧X and mention the payment"],
              ["Log an expense", "Finance Capture → Expense, or ⌘⇧X"],
              ["Mark an invoice sent / cleared", "Finance → Invoices → Mark Sent / Mark Cleared, or Finance Capture → Invoice Update"],
              ["Allocate money to a project", "Open the transaction → Add allocation, or Finance Capture → Allocation"],
              ["Record a client decision", "Phase → Decisions, or ⌘⇧X and mention the decision with an outcome"],
              ["File a meeting note", "Phase → Records → new record, or ⌘⇧X"],
              ["Draft a follow-up message", "⌘K → Message Drafter"],
              ["Capture a stray thought", "⌘⇧X from anywhere — leave it unsorted and triage from Inbox later"],
              ["Find something from months ago", "⌘K and type, or G S → search page"],
              ["Pause / complete a project", "Project header status controls, or ⌘K on the project page"],
              ["Start the day", "G T → Morning brief → drain the inbox (G I)"],
              ["Close the week", "G T → Week in review, then ✨ Weekly summary on each active project"],
            ]}
          />
        </Section>

        <Section title="Operational guidelines">
          <div className="prose">
            <p>
              <strong>Capture first, triage later.</strong> Don&apos;t leave things in your head.
            </p>
            <p>
              <strong>Relationship → Client → Project → Phase → Work.</strong> Track how clients came in and the
              terms attached, then work down the chain.
            </p>
            <p>
              <strong>Projects set direction, phases do the work.</strong> Strategy lives on the project; execution
              lives in phases.
            </p>
            <p>
              <strong>Tasks vs issues.</strong> A task is work to do. An issue is a problem, risk, or unresolved
              concern. Don&apos;t conflate them.
            </p>
            <p>
              <strong>Keep finance truthful.</strong> Log money when it actually moves, advance invoices when they
              actually go out or clear, and allocate every transaction to the work it belongs to.
            </p>
            <p>
              <strong>Archive, don&apos;t delete.</strong> Completed and closed projects remain searchable.
            </p>
            <p>
              <strong>Decisions need outcomes.</strong> When you record a decision, always add the decision outcome.
            </p>
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <div className="section-title">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        display: "inline-block",
        padding: "1px 6px",
        margin: "0 1px",
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 6,
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        color: "var(--ink-2)",
      }}
    >
      {children}
    </code>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "var(--surface-2)" }}>
            {head.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 14px",
                    color: j === 0 ? "var(--ink-2)" : "var(--muted)",
                    fontWeight: j === 0 ? 600 : 400,
                    verticalAlign: "top",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
