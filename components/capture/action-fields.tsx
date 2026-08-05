"use client";

// Field descriptors for every capture action kind. They drive both the review
// display and the per-action edit form, so the operator always sees the exact
// values that would be written — and can change any of them before approving.

export interface ActionField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select";
  options?: string[];
  placeholder?: string;
}

export interface RefField {
  key: "project_id" | "phase_id" | "person_id" | "ref_id";
  label: string;
}

export const REF_LABELS: Record<RefField["key"], string> = {
  project_id: "Project",
  phase_id: "Phase",
  person_id: "Person",
  ref_id: "Existing record",
};

type KindSpec = { fields: ActionField[]; refs?: RefField[] };

const select = (key: string, label: string, options: string[]): ActionField => ({
  key,
  label,
  type: "select",
  options,
});

export const ACTION_SPECS: Record<string, KindSpec> = {
  "client.create": {
    fields: [
      { key: "name", label: "Name", type: "text" },
      select("kind", "Kind", ["business", "person"]),
      select("status", "Status", ["active", "inactive", "archived"]),
      { key: "website_url", label: "Website", type: "text", placeholder: "https://…" },
      { key: "summary", label: "Summary", type: "textarea" },
    ],
  },
  "project.create": {
    refs: [{ key: "project_id", label: "Project" }],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "code", label: "Code", type: "text", placeholder: "SOL-026" },
      select("status", "Status", ["active", "paused", "completed", "archived"]),
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "objective", label: "Objective", type: "textarea" },
      { key: "direction", label: "Direction", type: "textarea" },
      { key: "target_date", label: "Target date", type: "date" },
    ],
  },
  "project.update_status": {
    fields: [select("status", "Status", ["active", "paused", "completed", "archived"])],
  },
  "project.update": {
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "code", label: "Code", type: "text" },
      select("status", "Status", ["active", "paused", "completed", "archived"]),
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "objective", label: "Objective", type: "textarea" },
      { key: "direction", label: "Direction", type: "textarea" },
      { key: "started_on", label: "Started", type: "date" },
      { key: "target_date", label: "Target date", type: "date" },
    ],
  },
  "phase.create": {
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "position", label: "Position", type: "number" },
      select("status", "Status", ["planned", "active", "on_hold", "completed", "cancelled"]),
      { key: "started_on", label: "Started", type: "date" },
      { key: "target_date", label: "Target date", type: "date" },
    ],
  },
  "phase.complete": { fields: [] },
  "phase.pause": { fields: [] },
  "phase.update": {
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      select("status", "Status", ["planned", "active", "on_hold", "completed", "cancelled"]),
      { key: "started_on", label: "Started", type: "date" },
      { key: "target_date", label: "Target date", type: "date" },
    ],
  },
  "task.create": {
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description_md", label: "Description", type: "textarea" },
      select("priority", "Priority", ["low", "normal", "high", "urgent"]),
      select("status", "Status", ["todo", "in_progress", "blocked", "done", "cancelled"]),
      { key: "due_at", label: "Due date", type: "date" },
    ],
  },
  "task.complete": { fields: [] },
  "task.update_priority": {
    fields: [select("priority", "Priority", ["low", "normal", "high", "urgent"])],
  },
  "issue.create": {
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description_md", label: "Description", type: "textarea" },
      select("severity", "Severity", ["low", "medium", "high", "critical"]),
      select("status", "Status", ["open", "investigating", "waiting_external", "resolved", "accepted", "closed"]),
    ],
  },
  "issue.resolve": {
    fields: [
      { key: "resolution_summary", label: "Resolution", type: "textarea" },
      select("status", "Status", ["resolved", "accepted", "closed"]),
    ],
  },
  "entry.create": {
    fields: [
      { key: "title", label: "Title", type: "text" },
      select("type", "Type", ["note", "meeting", "decision", "document", "update", "milestone", "capture"]),
      { key: "body_md", label: "Details", type: "textarea" },
      { key: "occurred_at", label: "Occurred", type: "date" },
      { key: "decision_outcome", label: "Decision outcome", type: "text" },
    ],
  },
  "decision.supersede": { fields: [] },
  // ─── New finance ledger action specs ──────────────────────────────────────────
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
    refs: [{ key: "person_id", label: "Counterparty (person)" }],
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
    fields: [{ key: "invoice_sent_at", label: "Sent at", type: "date" }],
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
  "communication.draft": {
    fields: [
      { key: "intent", label: "Intent", type: "text" },
      select("length_label", "Length", ["very_short", "short", "medium", "detailed"]),
      { key: "content", label: "Message", type: "textarea" },
    ],
  },
};

export const KIND_LABELS: Record<string, string> = {
  "client.create": "New client",
  "project.create": "New project",
  "project.update_status": "Project status",
  "project.update": "Update project",
  "phase.create": "New phase",
  "phase.complete": "Complete phase",
  "phase.pause": "Pause phase",
  "phase.update": "Update phase",
  "task.create": "New task",
  "task.complete": "Complete task",
  "task.update_priority": "Task priority",
  "issue.create": "Log issue",
  "issue.resolve": "Resolve issue",
  "entry.create": "Record entry",
  "decision.supersede": "Supersede decision",
  "finance.transaction": "New transaction",
  "finance.allocate": "Allocate funds",
  "finance.invoice_sent": "Mark invoice sent",
  "finance.invoice_cleared": "Mark invoice cleared",
  "finance.mark_completed": "Mark completed",
  "communication.draft": "Message draft",
};
