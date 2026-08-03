"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/modal";
import { EntityEditModal, type FieldConfig, type Values } from "@/components/editing/entity-edit-modal";
import {
  getTaskEditContext,
  updateClient,
  updateConversation,
  updateEntry,
  updateFinanceItem,
  updateIssue,
  updateMessage,
  updatePerson,
  updatePhase,
  updateProject,
  updateProjectParticipant,
  updateRelationship,
  updateTask,
  type TaskEditContext,
} from "@/features/update-actions";

const label = (value: string) => value.replaceAll("_", " ");

const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"].map((v) => ({ value: v, label: label(v) }));
const TASK_STATUS_OPTIONS = ["todo", "in_progress", "blocked", "done", "cancelled"].map((v) => ({
  value: v,
  label: label(v),
}));
const ISSUE_STATUS_OPTIONS = ["open", "investigating", "waiting_external", "resolved", "accepted", "closed"].map((v) => ({
  value: v,
  label: label(v),
}));
const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"].map((v) => ({ value: v, label: label(v) }));
const ENTRY_TYPE_OPTIONS = ["note", "meeting", "decision", "document", "update", "milestone", "capture"].map((v) => ({
  value: v,
  label: label(v),
}));
const PROJECT_STATUS_OPTIONS = ["active", "paused", "completed", "archived"].map((v) => ({
  value: v,
  label: label(v),
}));
const PHASE_STATUS_OPTIONS = ["planned", "active", "on_hold", "completed", "cancelled"].map((v) => ({
  value: v,
  label: label(v),
}));
const CLIENT_STATUS_OPTIONS = ["active", "inactive", "archived"].map((v) => ({ value: v, label: label(v) }));
const CONVERSATION_KIND_OPTIONS = ["direct", "group"].map((v) => ({ value: v, label: label(v) }));
const CHANNEL_OPTIONS = ["whatsapp", "email", "manual", "other"].map((v) => ({ value: v, label: label(v) }));
const ROLE_OPTIONS = ["client_contact", "partner", "collaborator"].map((v) => ({ value: v, label: label(v) }));
const COMMUNICATION_MODE_OPTIONS = ["solicate_leads", "partner_leads", "shared", "advisory_only"].map((v) => ({
  value: v,
  label: label(v),
}));
const FINANCIAL_ARRANGEMENT_OPTIONS = ["none", "referral_commission", "revenue_share", "delivery_split", "fixed_fee"].map(
  (v) => ({ value: v, label: label(v) }),
);
const PAYMENT_STATUS_OPTIONS = ["not_applicable", "pending", "partially_paid", "paid", "disputed"].map((v) => ({
  value: v,
  label: label(v),
}));
const RELATIONSHIP_SOURCE_OPTIONS = ["referral_partner", "direct_outreach", "existing_client", "marketplace", "internal"].map(
  (v) => ({ value: v, label: label(v) }),
);
const RELATIONSHIP_STATUS_OPTIONS = ["active", "inactive", "archived"].map((v) => ({
  value: v,
  label: label(v),
}));
const FINANCE_KIND_OPTIONS = ["invoice", "payment", "expense"].map((v) => ({ value: v, label: label(v) }));

function toLocalDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export function EditClientModal({
  client,
  open,
  onOpenChange,
}: {
  client: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Client name", required: true, width: "half", autoFocus: true },
    { kind: "select", name: "kind", label: "Type", options: [{ value: "business", label: "Business" }, { value: "person", label: "Individual" }], width: "half" },
    { kind: "select", name: "status", label: "Status", options: CLIENT_STATUS_OPTIONS, width: "half" },
    { kind: "url", name: "website_url", label: "Website", placeholder: "https://", hint: "Optional", width: "half" },
    { kind: "textarea", name: "summary", label: "Relationship summary", minHeight: 110 },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit client"
      record={{ name: client.name, kind: client.kind, status: client.status, website_url: client.website_url ?? "", summary: client.summary }}
      fields={fields}
      successMessage="Client updated."
      onSave={async (values) => updateClient(client.id, values)}
    />
  );
}

// ─── People ──────────────────────────────────────────────────────────────────

export function EditPersonModal({
  person,
  open,
  onOpenChange,
}: {
  person: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Full name", required: true, width: "half", autoFocus: true },
    { kind: "checkbox", name: "is_partner", label: "This person is a partner or referrer" },
    { kind: "email", name: "email", label: "Email", placeholder: "optional", width: "half" },
    { kind: "text", name: "phone", label: "Phone", placeholder: "optional", width: "half" },
    { kind: "textarea", name: "summary", label: "Relationship context", minHeight: 110 },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit person"
      record={{ name: person.name, email: person.email ?? "", phone: person.phone ?? "", is_partner: Boolean(person.is_partner), summary: person.summary }}
      fields={fields}
      successMessage="Person updated."
      onSave={async (values) => updatePerson(person.id, values)}
    />
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function EditProjectModal({
  project,
  clients,
  open,
  onOpenChange,
}: {
  project: any;
  clients: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "select", name: "client_id", label: "Client", options: clients.map((c) => ({ value: c.id, label: c.name })), placeholder: "Choose client", required: true, width: "half", autoFocus: true },
    { kind: "text", name: "name", label: "Project name", required: true, width: "half" },
    { kind: "text", name: "code", label: "Code", hint: "Must be unique", width: "half" },
    { kind: "select", name: "status", label: "Status", options: PROJECT_STATUS_OPTIONS, width: "half" },
    { kind: "date", name: "started_on", label: "Start date", width: "half" },
    { kind: "date", name: "target_date", label: "Target date", width: "half" },
    {
      kind: "textarea",
      name: "objective",
      label: "Objective",
      hint: "What this project is trying to achieve.",
      minHeight: 100,
    },
    {
      kind: "textarea",
      name: "success_definition",
      label: "Success definition",
      hint: "How we know this worked.",
      minHeight: 100,
    },
    {
      kind: "textarea",
      name: "direction",
      label: "Direction",
      hint: "Strategy, positioning, or guardrails for this engagement.",
      minHeight: 100,
    },
    { kind: "textarea", name: "summary", label: "Working summary", minHeight: 120 },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit project"
      record={{
        client_id: project.client_id,
        name: project.name,
        code: project.code ?? "",
        status: project.status,
        started_on: project.started_on ?? "",
        target_date: project.target_date ?? "",
        summary: project.summary ?? "",
        objective: project.objective ?? "",
        success_definition: project.success_definition ?? "",
        direction: project.direction ?? "",
      }}
      fields={fields}
      successMessage="Project updated."
      onSave={async (values) => updateProject(project.id, values)}
    />
  );
}

// ─── Phases ──────────────────────────────────────────────────────────────────

export function EditPhaseModal({
  phase,
  open,
  onOpenChange,
}: {
  phase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Phase name", required: true, width: "half", autoFocus: true },
    { kind: "number", name: "position", label: "Position", min: 1, width: "half" },
    { kind: "select", name: "status", label: "Status", options: PHASE_STATUS_OPTIONS, width: "half" },
    { kind: "date", name: "started_on", label: "Start date", width: "half" },
    { kind: "date", name: "target_date", label: "Target date", width: "half" },
    { kind: "textarea", name: "description", label: "Description", minHeight: 110 },
    {
      kind: "textarea",
      name: "scope_deliverables",
      label: "Scope · deliverables",
      hint: "What this phase produces.",
      minHeight: 90,
    },
    {
      kind: "textarea",
      name: "scope_requirements",
      label: "Scope · requirements",
      hint: "Constraints and requirements in scope.",
      minHeight: 90,
    },
    {
      kind: "textarea",
      name: "scope_acceptance",
      label: "Scope · acceptance",
      hint: "How the phase is accepted / signed off.",
      minHeight: 90,
    },
    {
      kind: "textarea",
      name: "proposal_quotation",
      label: "Proposal · quotation",
      hint: "What was quoted for this phase.",
      minHeight: 90,
    },
    {
      kind: "textarea",
      name: "proposal_pricing",
      label: "Proposal · pricing",
      hint: "Pricing structure and amount.",
      minHeight: 90,
    },
    {
      kind: "textarea",
      name: "proposal_revisions",
      label: "Proposal · revisions",
      hint: "Quotation history / change log.",
      minHeight: 90,
    },
  ];
  const record = {
    project_id: phase.project_id,
    name: phase.name,
    description: phase.description ?? "",
    position: phase.position ?? 1,
    status: phase.status,
    started_on: phase.started_on ?? "",
    target_date: phase.target_date ?? "",
    scope_deliverables: phase.scope_deliverables ?? "",
    scope_requirements: phase.scope_requirements ?? "",
    scope_acceptance: phase.scope_acceptance ?? "",
    proposal_quotation: phase.proposal_quotation ?? "",
    proposal_pricing: phase.proposal_pricing ?? "",
    proposal_revisions: phase.proposal_revisions ?? "",
  };
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit phase"
      record={record}
      fields={fields}
      successMessage="Phase updated."
      onSave={async (values) => updatePhase(phase.id, values)}
    />
  );
}

// Focused variants: scope and proposal each get their own edit surface so the
// phase workspace tabs don't force users through the whole phase form.
const SCOPE_FIELDS: FieldConfig[] = [
  {
    kind: "textarea",
    name: "scope_deliverables",
    label: "Deliverables",
    hint: "What this phase produces.",
    minHeight: 120,
  },
  {
    kind: "textarea",
    name: "scope_requirements",
    label: "Requirements",
    hint: "Constraints and requirements in scope.",
    minHeight: 120,
  },
  {
    kind: "textarea",
    name: "scope_acceptance",
    label: "Acceptance criteria",
    hint: "How the phase is accepted / signed off.",
    minHeight: 120,
  },
];

const PROPOSAL_FIELDS: FieldConfig[] = [
  {
    kind: "textarea",
    name: "proposal_quotation",
    label: "Quotation",
    hint: "What was quoted for this phase.",
    minHeight: 120,
  },
  {
    kind: "textarea",
    name: "proposal_pricing",
    label: "Pricing",
    hint: "Pricing structure and amount.",
    minHeight: 120,
  },
  {
    kind: "textarea",
    name: "proposal_revisions",
    label: "Revisions",
    hint: "Quotation history / change log.",
    minHeight: 120,
  },
];

function PhaseFieldsModal({
  phase,
  fields,
  open,
  onOpenChange,
  title,
  successMessage,
}: {
  phase: any;
  fields: FieldConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  successMessage: string;
}) {
  const record = {
    project_id: phase.project_id,
    scope_deliverables: phase.scope_deliverables ?? "",
    scope_requirements: phase.scope_requirements ?? "",
    scope_acceptance: phase.scope_acceptance ?? "",
    proposal_quotation: phase.proposal_quotation ?? "",
    proposal_pricing: phase.proposal_pricing ?? "",
    proposal_revisions: phase.proposal_revisions ?? "",
  };
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      record={record}
      fields={fields}
      successMessage={successMessage}
      onSave={async (values) => updatePhase(phase.id, values)}
    />
  );
}

export function EditScopeModal({
  phase,
  open,
  onOpenChange,
}: {
  phase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PhaseFieldsModal
      phase={phase}
      fields={SCOPE_FIELDS}
      open={open}
      onOpenChange={onOpenChange}
      title="Edit scope"
      successMessage="Scope updated."
    />
  );
}

export function EditProposalModal({
  phase,
  open,
  onOpenChange,
}: {
  phase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PhaseFieldsModal
      phase={phase}
      fields={PROPOSAL_FIELDS}
      open={open}
      onOpenChange={onOpenChange}
      title="Edit proposal"
      successMessage="Proposal updated."
    />
  );
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function EditTaskModal({
  task,
  projectId,
  phases,
  users,
  fetchContext,
  open,
  onOpenChange,
}: {
  task: any;
  projectId: string;
  phases?: any[];
  users?: any[];
  fetchContext?: (taskId: string, projectId: string) => Promise<TaskEditContext>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const needsFetch = Boolean(fetchContext && !phases && !users);
  const [context, setContext] = useState<TaskEditContext | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && needsFetch && fetchContext) {
      let cancelled = false;
      setLoading(true);
      fetchContext(task.id, projectId)
        .then((ctx) => {
          if (!cancelled) setContext(ctx);
        })
        .catch(() => {
          if (!cancelled) setContext({ task: null, phases: [], users: [], projectId });
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
    if (!open) setContext(null);
  }, [open, needsFetch, task.id, projectId, fetchContext]);

  if (open && needsFetch && loading) {
    return (
      <Modal isOpen onClose={() => onOpenChange(false)} title="Edit task">
        <div className="empty" style={{ padding: "32px 24px" }}>Loading task…</div>
      </Modal>
    );
  }

  const record = needsFetch ? context?.task : task;
  if (!record) return null;

  const phaseOptions = (needsFetch ? context?.phases : phases) ?? [];
  const userOptions = (needsFetch ? context?.users : users) ?? [];

  const fields: FieldConfig[] = [
    { kind: "text", name: "title", label: "Task title", required: true, autoFocus: true },
    {
      kind: "select",
      name: "priority",
      label: "Priority",
      options: PRIORITY_OPTIONS,
      width: "half",
    },
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: TASK_STATUS_OPTIONS,
      width: "half",
    },
    {
      kind: "select",
      name: "assignee_id",
      label: "Assignee",
      options: userOptions.map((u: any) => ({ value: u.id, label: u.display_name })),
      placeholder: "Unassigned",
      width: "half",
    },
    { kind: "date", name: "due_at", label: "Due date", width: "half" },
    ...(phaseOptions.length > 0
      ? [
          {
            kind: "select",
            name: "phase_id",
            label: "Phase",
            options: phaseOptions.map((p: any) => ({ value: p.id, label: `${p.position}. ${p.name}` })),
            placeholder: "No phase",
          } as FieldConfig,
        ]
      : []),
    { kind: "textarea", name: "description_md", label: "Description", minHeight: 120 },
  ];

  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit task"
      record={{
        project_id: projectId,
        title: record.title,
        description_md: record.description_md ?? "",
        priority: record.priority,
        status: record.status,
        assignee_id: record.assignee_id ?? "",
        due_at: record.due_at ? String(record.due_at).slice(0, 10) : "",
        phase_id: record.phase_id ?? "",
      }}
      fields={fields}
      successMessage="Task updated."
      onSave={async (values) => updateTask(record.id, values)}
    />
  );
}

// ─── Issues ──────────────────────────────────────────────────────────────────

export function EditIssueModal({
  issue,
  projectId,
  users,
  phases,
  open,
  onOpenChange,
}: {
  issue: any;
  projectId: string;
  users?: any[];
  phases?: { id: string; position: number; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "title", label: "Issue title", required: true, autoFocus: true },
    {
      kind: "select",
      name: "severity",
      label: "Severity",
      options: SEVERITY_OPTIONS,
      width: "half",
    },
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: ISSUE_STATUS_OPTIONS,
      width: "half",
    },
    ...(users && users.length > 0
      ? [
          {
            kind: "select",
            name: "assignee_id",
            label: "Assignee",
            options: users.map((u: any) => ({ value: u.id, label: u.display_name })),
            placeholder: "Unassigned",
            width: "half",
          } as FieldConfig,
        ]
      : []),
    ...(phases && phases.length > 0
      ? [
          {
            kind: "select",
            name: "phase_id",
            label: "Phase",
            options: phases.map((p) => ({ value: p.id, label: `${p.position}. ${p.name}` })),
            placeholder: "Project-level (no phase)",
            width: "half",
          } as FieldConfig,
        ]
      : []),
    { kind: "textarea", name: "description_md", label: "Description", minHeight: 110 },
    {
      kind: "textarea",
      name: "resolution_summary",
      label: "Resolution outcome",
      hint: "Required when the issue is resolved, accepted, or closed.",
      minHeight: 90,
    },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit issue"
      record={{
        project_id: projectId,
        title: issue.title,
        description_md: issue.description_md ?? "",
        severity: issue.severity,
        status: issue.status,
        assignee_id: issue.assignee_id ?? "",
        phase_id: issue.phase_id ?? "",
        resolution_summary: issue.resolution_summary ?? "",
      }}
      fields={fields}
      successMessage="Issue updated."
      onSave={async (values) => updateIssue(issue.id, values)}
    />
  );
}

// ─── Entries (notes / meetings / decisions / documents / milestones) ─────────

export function EditEntryModal({
  entry,
  projects,
  phases,
  open,
  onOpenChange,
}: {
  entry: any;
  projects?: { id: string; name: string }[];
  phases?: { id: string; position: number; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    {
      kind: "select",
      name: "type",
      label: "Type",
      options: ENTRY_TYPE_OPTIONS,
      width: "half",
    },
    { kind: "datetime", name: "occurred_at", label: "When", width: "half" },
    { kind: "text", name: "title", label: "Title", required: true },
    ...(projects && projects.length > 0
      ? [
          {
            kind: "select",
            name: "project_id",
            label: "Project",
            options: projects.map((p) => ({ value: p.id, label: p.name })),
            placeholder: "Unsorted (no project)",
          } as FieldConfig,
        ]
      : []),
    ...(phases && phases.length > 0
      ? [
          {
            kind: "select",
            name: "phase_id",
            label: "Phase",
            options: phases.map((p) => ({ value: p.id, label: `${p.position}. ${p.name}` })),
            placeholder: "Project-level (no phase)",
          } as FieldConfig,
        ]
      : []),
    { kind: "textarea", name: "body_md", label: "Body", minHeight: 130 },
    {
      kind: "custom",
      name: "decision_outcome",
      render: ({ value, setValue, values }) =>
        values.type === "decision" ? (
          <>
            <label>Decision outcome</label>
            <input value={String(value ?? "")} onChange={(e) => setValue(e.target.value)} placeholder="What was decided" />
            <p className="field-hint">A decision record requires an outcome.</p>
          </>
        ) : null,
    },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit record"
      record={{
        project_id: entry.project_id ?? "",
        phase_id: entry.phase_id ?? "",
        title: entry.title,
        type: entry.type,
        body_md: entry.body_md ?? "",
        occurred_at: toLocalDateTimeInput(entry.occurred_at),
        decision_outcome: entry.decision_outcome ?? "",
      }}
      fields={fields}
      successMessage="Record updated."
      onSave={async (values) => updateEntry(entry.id, values)}
    />
  );
}

// ─── Conversations ───────────────────────────────────────────────────────────

export function EditConversationModal({
  conversation,
  clientId,
  projects,
  open,
  onOpenChange,
}: {
  conversation: any;
  clientId: string;
  projects?: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "title", label: "Title", required: true, autoFocus: true },
    { kind: "select", name: "kind", label: "Type", options: CONVERSATION_KIND_OPTIONS, width: "half" },
    { kind: "select", name: "channel", label: "Channel", options: CHANNEL_OPTIONS, width: "half" },
    ...(projects && projects.length > 0
      ? [
          {
            kind: "select",
            name: "project_id",
            label: "Project",
            options: projects.map((p) => ({ value: p.id, label: p.name })),
            placeholder: "No project",
          } as FieldConfig,
        ]
      : []),
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit conversation"
      record={{
        client_id: clientId,
        project_id: conversation.project_id ?? "",
        title: conversation.title,
        kind: conversation.kind,
        channel: conversation.channel,
      }}
      fields={fields}
      successMessage="Conversation updated."
      onSave={async (values) => updateConversation(conversation.id, values)}
    />
  );
}

// ─── Messages (inbox corrections) ────────────────────────────────────────────

export function EditMessageModal({
  message,
  conversationId,
  projectId,
  open,
  onOpenChange,
}: {
  message: any;
  conversationId: string;
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    {
      kind: "textarea",
      name: "body_md",
      label: "Message body",
      required: true,
      minHeight: 140,
      autoFocus: true,
    },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit message"
      description="Correct a transcription or wording error. The message stays in its conversation."
      record={{ conversation_id: conversationId, project_id: projectId ?? "", body_md: message.body_md }}
      fields={fields}
      successMessage="Message updated."
      onSave={async (values) => updateMessage(message.id, values)}
    />
  );
}

// ─── Project participants ────────────────────────────────────────────────────

export function EditParticipantModal({
  participant,
  projectId,
  open,
  onOpenChange,
}: {
  participant: any;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "select", name: "role", label: "Role", options: ROLE_OPTIONS, width: "half" },
    { kind: "text", name: "role_label", label: "Role detail", placeholder: "Owner, operations…", width: "half" },
    {
      kind: "select",
      name: "communication_mode",
      label: "Communication",
      options: COMMUNICATION_MODE_OPTIONS,
      placeholder: "Not set",
      width: "half",
    },
    { kind: "checkbox", name: "is_referral_source", label: "Introduced this project" },
    {
      kind: "select",
      name: "financial_arrangement",
      label: "Financial arrangement",
      options: FINANCIAL_ARRANGEMENT_OPTIONS,
      width: "half",
    },
    { kind: "number", name: "financial_value", label: "Value", min: 0, step: "0.01", width: "half" },
    { kind: "text", name: "currency_code", label: "Currency", placeholder: "INR", hint: "Required for fixed-fee arrangements", width: "half" },
    {
      kind: "select",
      name: "payment_status",
      label: "Payment status",
      options: PAYMENT_STATUS_OPTIONS,
      width: "half",
    },
    { kind: "textarea", name: "terms_note", label: "Terms note", minHeight: 100 },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit participant"
      record={{
        project_id: projectId,
        person_id: participant.person_id,
        role: participant.role,
        role_label: participant.role_label ?? "",
        is_referral_source: Boolean(participant.is_referral_source),
        communication_mode: participant.communication_mode ?? "",
        financial_arrangement: participant.financial_arrangement ?? "none",
        financial_value: participant.financial_value ?? "",
        currency_code: participant.currency_code ?? "",
        payment_status: participant.payment_status ?? "not_applicable",
        terms_note: participant.terms_note ?? "",
      }}
      fields={fields}
      successMessage="Participant updated."
      onSave={async (values) => updateProjectParticipant(projectId, participant.person_id, values)}
    />
  );
}

// ─── Relationships (Level 1) ─────────────────────────────────────────────────

export function EditRelationshipModal({
  relationship,
  clients,
  people,
  open,
  onOpenChange,
}: {
  relationship: any;
  clients: { id: string; name: string }[];
  people?: { id: string; name: string; is_partner: boolean }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    {
      kind: "select",
      name: "client_id",
      label: "Client",
      options: clients.map((c) => ({ value: c.id, label: c.name })),
      required: true,
      width: "half",
      autoFocus: true,
    },
    {
      kind: "select",
      name: "person_id",
      label: "Referral partner",
      options: (people ?? []).map((p) => ({ value: p.id, label: `${p.name}${p.is_partner ? " (partner)" : ""}` })),
      placeholder: "No linked person",
      width: "half",
    },
    {
      kind: "select",
      name: "source",
      label: "Source",
      options: RELATIONSHIP_SOURCE_OPTIONS,
      width: "half",
    },
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: RELATIONSHIP_STATUS_OPTIONS,
      width: "half",
    },
    {
      kind: "select",
      name: "communication_mode",
      label: "Communication",
      options: COMMUNICATION_MODE_OPTIONS,
      placeholder: "Not set",
      width: "half",
    },
    {
      kind: "select",
      name: "financial_arrangement",
      label: "Financial arrangement",
      options: FINANCIAL_ARRANGEMENT_OPTIONS,
      width: "half",
    },
    {
      kind: "number",
      name: "referral_commission",
      label: "Referral commission",
      min: 0,
      step: "0.01",
      width: "half",
    },
    {
      kind: "text",
      name: "commission_currency",
      label: "Commission currency",
      placeholder: "INR",
      hint: "Required for fixed-fee arrangements",
      width: "half",
    },
    {
      kind: "select",
      name: "payment_status",
      label: "Payment status",
      options: PAYMENT_STATUS_OPTIONS,
      width: "half",
    },
    { kind: "textarea", name: "summary", label: "Relationship summary", minHeight: 90 },
    { kind: "textarea", name: "terms_note", label: "Terms note", minHeight: 90 },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit relationship"
      record={{
        client_id: relationship.client_id,
        person_id: relationship.person_id ?? "",
        source: relationship.source,
        status: relationship.status,
        summary: relationship.summary ?? "",
        communication_mode: relationship.communication_mode ?? "",
        financial_arrangement: relationship.financial_arrangement ?? "none",
        referral_commission: relationship.referral_commission ?? "",
        commission_currency: relationship.commission_currency ?? "",
        payment_status: relationship.payment_status ?? "not_applicable",
        terms_note: relationship.terms_note ?? "",
      }}
      fields={fields}
      successMessage="Relationship updated."
      onSave={async (values) => updateRelationship(relationship.id, values)}
    />
  );
}

// ─── Finance items (invoices / payments / expenses) ─────────────────────────

export function EditFinanceItemModal({
  item,
  projectId,
  phases,
  open,
  onOpenChange,
}: {
  item: any;
  projectId: string;
  phases?: { id: string; position: number; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    {
      kind: "select",
      name: "kind",
      label: "Type",
      options: FINANCE_KIND_OPTIONS,
      width: "half",
    },
    { kind: "date", name: "occurred_on", label: "Date", width: "half" },
    { kind: "text", name: "title", label: "Title", required: true, autoFocus: true },
    {
      kind: "number",
      name: "amount",
      label: "Amount",
      min: 0,
      step: "0.01",
      width: "half",
      required: true,
    },
    {
      kind: "text",
      name: "currency_code",
      label: "Currency",
      placeholder: "INR",
      hint: "3-letter code",
      width: "half",
    },
    ...(phases && phases.length > 0
      ? [
          {
            kind: "select",
            name: "phase_id",
            label: "Phase",
            options: phases.map((p) => ({ value: p.id, label: `${p.position}. ${p.name}` })),
            placeholder: "Project-level",
            width: "half",
          } as FieldConfig,
        ]
      : []),
    { kind: "textarea", name: "notes", label: "Notes", minHeight: 80 },
  ];
  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit finance item"
      record={{
        project_id: projectId,
        phase_id: item.phase_id ?? "",
        kind: item.kind,
        title: item.title,
        amount: item.amount ?? "",
        currency_code: item.currency_code ?? "INR",
        occurred_on: item.occurred_on ? String(item.occurred_on).slice(0, 10) : "",
        notes: item.notes ?? "",
      }}
      fields={fields}
      successMessage="Finance item updated."
      onSave={async (values) => updateFinanceItem(item.id, values)}
    />
  );
}

export type EditTaskModalProps = Parameters<typeof EditTaskModal>[0];
export type EditEntryModalProps = Parameters<typeof EditEntryModal>[0];
export type EditConversationModalProps = Parameters<typeof EditConversationModal>[0];
export type EditParticipantModalProps = Parameters<typeof EditParticipantModal>[0];
export type EditIssueModalProps = Parameters<typeof EditIssueModal>[0];
export type EditProjectModalProps = Parameters<typeof EditProjectModal>[0];
export type { Values };
