// The update categories the operator can explicitly request in the capture
// form. Selecting a category makes it MANDATORY: the proposer must propose at
// least one satisfying action. The same mapping is mirrored in the
// capture-propose template prompt (supabase/migrations/0016_capture_update_types.sql);
// keep both in sync.

export interface UpdateTypeDef {
  value: string;
  label: string;
  description: string;
  /** Action kinds that satisfy this category. */
  kinds: string[];
  /** For entry.create kinds: only these payload types satisfy the category. */
  entryTypes?: string[];
  /** When set, the category is only offered for this capture scope. */
  scope?: "new_project";
}

export const UPDATE_TYPES: UpdateTypeDef[] = [
  { value: "phase", label: "Phase", description: "Create, complete, pause, or update a phase", kinds: ["phase.create", "phase.complete", "phase.pause", "phase.update"] },
  { value: "task", label: "Task", description: "Create, complete, or reprioritize tasks", kinds: ["task.create", "task.complete", "task.update_priority"] },
  { value: "issue", label: "Issue", description: "Log or resolve issues", kinds: ["issue.create", "issue.resolve"] },
  { value: "meeting", label: "Meeting", description: "File a meeting record", kinds: ["entry.create"], entryTypes: ["meeting"] },
  { value: "document", label: "Document", description: "File a document record", kinds: ["entry.create"], entryTypes: ["document"] },
  { value: "note", label: "Note", description: "File a plain note", kinds: ["entry.create"], entryTypes: ["note"] },
  { value: "update", label: "Update", description: "Log a progress update or change the project status", kinds: ["entry.create", "project.update", "project.update_status"], entryTypes: ["update"] },
  { value: "decision", label: "Decision", description: "Record a decision or supersede an old one", kinds: ["entry.create", "decision.supersede"], entryTypes: ["decision"] },
  { value: "timeline", label: "Timeline", description: "Milestones and schedule changes", kinds: ["entry.create", "phase.create", "phase.update", "project.update"], entryTypes: ["milestone"] },
  { value: "finance", label: "Finance", description: "Invoice, payment, or mark an invoice paid", kinds: ["finance.invoice", "finance.payment", "finance.mark_paid"] },
  { value: "message", label: "Message", description: "Draft a follow-up message", kinds: ["communication.draft"] },
  { value: "client", label: "Client", description: "Create a new client", kinds: ["client.create"], scope: "new_project" },
  { value: "project", label: "Project", description: "Create a project or change its status/details", kinds: ["project.create", "project.update", "project.update_status"] },
];

export type UpdateTypeValue = (typeof UPDATE_TYPES)[number]["value"];

export function updateTypeLabel(value: string): string {
  return UPDATE_TYPES.find((t) => t.value === value)?.label ?? value;
}

interface MinimalAction {
  kind: string;
  payload?: Record<string, unknown>;
}

/**
 * The selected categories that have NO satisfying action among the proposed
 * ones. Accepts both validated actions and raw stored rows (loose shape).
 */
export function missingUpdateTypes(selected: string[], actions: MinimalAction[]): string[] {
  if (!selected || selected.length === 0) return [];
  return selected.filter((value) => {
    const def = UPDATE_TYPES.find((t) => t.value === value);
    if (!def) return true;
    const satisfied = actions.some((a) => {
      if (!def.kinds.includes(a.kind)) return false;
      if (a.kind === "entry.create" && def.entryTypes) {
        const type = a.payload && "type" in a.payload ? String(a.payload.type) : "";
        return def.entryTypes.includes(type);
      }
      return true;
    });
    return !satisfied;
  });
}
