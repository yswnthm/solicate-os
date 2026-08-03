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
                <div className="row-title">People are external records</div>
                <div className="row-meta">
                  Client contacts, partners, referrers, and collaborators live in People. Marking someone a partner
                  does not create an account.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Inbox is the capture zone</div>
                <div className="row-meta">
                  Quick captures and untriaged messages land in Inbox. You read them, file them into a project, or
                  dismiss them — the inbox should reach zero.
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

        <Section title="Pages & shortcuts">
          <Table
            head={["Page", "Shortcut", "What it is for"]}
            rows={[
              ["Today", "G T", "Daily command center: overdue, upcoming, open issues, recent projects, inbox preview."],
              ["Inbox", "G I", "Triage untriaged captures and messages; file or dismiss."],
              ["Projects", "G P", "All delivery work with active/paused counts."],
              ["Clients", "G C", "Businesses and individuals Solicate serves."],
              ["Relationships", "—", "How each client came in, referrals, and relationship-level terms."],
              ["People", "G U", "Client contacts, partners, and referrers."],
              ["Search", "G S", "Find the original record, not a summary."],
              ["Settings", "—", "Account, sign out, and operational guidelines."],
              ["Guide", "G ?", "You are here."],
            ]}
          />
          <div className="prose" style={{ marginTop: 12 }}>
            <p>
              To navigate with the keyboard, press <Kbd>G</Kbd> then the letter within a second — e.g.{" "}
              <Kbd>G</Kbd> <Kbd>T</Kbd> opens Today. Shortcuts are ignored while you are typing in a field.
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
                  from Recents, Go to, and Create.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">
                  <Kbd>⌘⇧X</Kbd> → quick capture
                </div>
                <div className="row-meta">
                  Jump straight into capturing a thought. Assign a project or leave it unsorted to triage from Inbox.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">Contextual actions</div>
                <div className="row-meta">
                  On a project page the palette offers Add task, Log issue, Log record, and status changes pre-scoped
                  to that project. On a client page it offers New conversation.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="row-main">
                <div className="row-title">
                  <Kbd>/</Kbd> opens search
                </div>
                <div className="row-meta">
                  Same as the search bar in the top navigation.
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Capturing & the inbox flow">
          <div className="prose">
            <p>
              <strong>1. Capture first.</strong> Don&apos;t hold a thought in your head — use quick capture (
              <Kbd>⌘⇧X</Kbd> or the Today button) or drop a message in.
            </p>
            <p>
              <strong>2. Triage from Inbox.</strong> Read each item and either file it into a project as a record,
              or dismiss it. <Kbd>G I</Kbd> to get there.
            </p>
            <p>
              <strong>3. Let AI draft.</strong> Use ✨ Triage on a single item, or ✨ Triage all with AI for the
              whole inbox. It drafts a title, type, project, and body — you edit, then Approve &amp; file. Skipped
              items stay in the inbox.
            </p>
            <p>
              <strong>4. Records become searchable.</strong> Filed items land in the project&apos;s Knowledge Base
              and are indexed by Search.
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
              titles, record bodies, and message content.
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
            ]}
          />
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            AI actions are drafts only — nothing is written to the record until you approve or save.
          </p>
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
