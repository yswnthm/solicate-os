"use client";

import { useState } from "react";
import { EntityEditModal, EditButton, type FieldConfig } from "@/components/editing/entity-edit-modal";
import {
  updateSolicateProfile,
  updateSolicateService,
  createSolicateService,
  updateSolicatePhase,
  updateSolicateTeam,
  createSolicateTask,
  updateSolicateTask,
} from "@/features/actions-solicate";

// ─── 1. Solicate Profile Edit Modal & Button ────────────────────────────────

export function EditSolicateProfileButton({
  profile,
  label = "Edit",
  className = "button ghost small",
}: {
  profile: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit Agency Profile" />
      <EditSolicateProfileModal profile={profile} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditSolicateProfileModal({
  profile,
  open,
  onOpenChange,
}: {
  profile: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Agency Name", required: true, width: "half", autoFocus: true },
    { kind: "url", name: "website_url", label: "Website URL", width: "half", placeholder: "https://solicate.in" },
    { kind: "text", name: "tagline", label: "Tagline & Positioning", width: "full", placeholder: "organic growth and digital presence..." },
    { kind: "textarea", name: "north_star", label: "North Star (10-Year Vision)", minHeight: 90, width: "full" },
    { kind: "textarea", name: "target_market", label: "Target Market", minHeight: 90, width: "full" },
    { kind: "textarea", name: "brand_voice", label: "Brand Voice (AI Context)", minHeight: 120, width: "full", hint: "AI agents read this to draft messages and content in Solicate's authentic voice." },
  ];

  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Agency Profile"
      description="Update Solicate's identity, vision, market focus, and AI brand voice."
      record={{
        name: profile?.name ?? "Solicate",
        website_url: profile?.website_url ?? "",
        tagline: profile?.tagline ?? "",
        north_star: profile?.north_star ?? "",
        target_market: profile?.target_market ?? "",
        brand_voice: profile?.brand_voice ?? "",
      }}
      fields={fields}
      successMessage="Agency profile updated."
      onSave={async (values) => updateSolicateProfile(values)}
      fullWidth
    />
  );
}

// ─── 2. Solicate Service Edit & Add Modals ──────────────────────────────────

export function EditSolicateServiceButton({
  service,
  label = "Edit",
  className = "button ghost small",
}: {
  service: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit Service" />
      <EditSolicateServiceModal service={service} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditSolicateServiceModal({
  service,
  open,
  onOpenChange,
}: {
  service: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Service Name", required: true, width: "half", autoFocus: true },
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "experimental", label: "Experimental" },
        { value: "planned", label: "Planned" },
        { value: "deprecated", label: "Deprecated" },
      ],
      width: "half",
    },
    {
      kind: "select",
      name: "model",
      label: "Delivery Model",
      options: [
        { value: "phase_based", label: "Phase Based" },
        { value: "retainer", label: "Retainer" },
        { value: "project", label: "Project" },
        { value: "hybrid", label: "Hybrid" },
      ],
      width: "half",
    },
    { kind: "number", name: "pricing_from", label: "Starting Price", min: 0, width: "half" },
    { kind: "textarea", name: "description", label: "Service Description", minHeight: 90, width: "full" },
    { kind: "textarea", name: "notes", label: "Internal Delivery Notes", minHeight: 70, width: "full" },
  ];

  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${service.name}`}
      record={{
        name: service.name,
        status: service.status,
        model: service.model ?? "phase_based",
        pricing_from: service.pricing_from ?? "",
        description: service.description ?? "",
        notes: service.notes ?? "",
      }}
      fields={fields}
      successMessage="Service updated."
      onSave={async (values) => updateSolicateService(service.id, values)}
    />
  );
}

export function AddSolicateServiceButton({
  label = "+ Add Service",
  className = "button small",
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <AddSolicateServiceModal open={open} onOpenChange={setOpen} />
    </>
  );
}

export function AddSolicateServiceModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Service Name", required: true, width: "half", autoFocus: true },
    { kind: "text", name: "slug", label: "Slug (Identifier)", hint: "e.g. seo_growth", width: "half" },
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "experimental", label: "Experimental" },
        { value: "planned", label: "Planned" },
      ],
      width: "half",
    },
    {
      kind: "select",
      name: "model",
      label: "Delivery Model",
      options: [
        { value: "phase_based", label: "Phase Based" },
        { value: "retainer", label: "Retainer" },
        { value: "project", label: "Project" },
        { value: "hybrid", label: "Hybrid" },
      ],
      width: "half",
    },
    { kind: "number", name: "pricing_from", label: "Starting Price", min: 0, width: "half" },
    { kind: "textarea", name: "description", label: "Service Description", minHeight: 80, width: "full" },
  ];

  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add New Service Line"
      saveLabel="Create Service"
      record={{
        name: "",
        slug: "",
        status: "active",
        model: "phase_based",
        pricing_from: "",
        description: "",
      }}
      fields={fields}
      successMessage="New service created."
      onSave={async (values) => createSolicateService(values)}
    />
  );
}

// ─── 3. Solicate Phase Edit Modal ───────────────────────────────────────────

export function EditSolicatePhaseButton({
  phase,
  label = "Edit",
  className = "button ghost small",
}: {
  phase: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit Growth Era" />
      <EditSolicatePhaseModal phase={phase} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditSolicatePhaseModal({
  phase,
  open,
  onOpenChange,
}: {
  phase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Phase Title", required: true, width: "half", autoFocus: true },
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: [
        { value: "planned", label: "Planned" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ],
      width: "half",
    },
    { kind: "date", name: "started_on", label: "Started On", width: "half" },
    { kind: "date", name: "target_date", label: "Target Completion Date", width: "half" },
    { kind: "textarea", name: "description", label: "Phase Description", minHeight: 90, width: "full" },
    { kind: "textarea", name: "success_definition", label: "Success Definition & Milestone Thresholds", minHeight: 90, width: "full" },
  ];

  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${phase.name}`}
      record={{
        name: phase.name,
        status: phase.status,
        started_on: phase.started_on ?? "",
        target_date: phase.target_date ?? "",
        description: phase.description ?? "",
        success_definition: phase.success_definition ?? "",
      }}
      fields={fields}
      successMessage="Growth era updated."
      onSave={async (values) => updateSolicatePhase(phase.id, values)}
      fullWidth
    />
  );
}

// ─── 4. Solicate Team Edit Modal ────────────────────────────────────────────

export function EditSolicateTeamButton({
  member,
  label = "Edit",
  className = "button ghost small",
}: {
  member: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit Team Member" />
      <EditSolicateTeamModal member={member} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditSolicateTeamModal({
  member,
  open,
  onOpenChange,
}: {
  member: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: FieldConfig[] = [
    { kind: "text", name: "name", label: "Name", required: true, width: "half", autoFocus: true },
    { kind: "text", name: "role", label: "Role Title", required: true, width: "half" },
    {
      kind: "select",
      name: "role_type",
      label: "Role Type",
      options: [
        { value: "founder", label: "Founder" },
        { value: "partner", label: "Partner" },
        { value: "employee", label: "Employee" },
        { value: "contractor", label: "Contractor" },
        { value: "advisor", label: "Advisor" },
      ],
      width: "half",
    },
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "advisor", label: "Advisor" },
      ],
      width: "half",
    },
    { kind: "date", name: "joined_on", label: "Joined On", width: "half" },
    { kind: "textarea", name: "skills", label: "Core Skills & Strengths", minHeight: 70, width: "full" },
    { kind: "textarea", name: "notes", label: "Internal Notes & Arrangements", minHeight: 80, width: "full" },
  ];

  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${member.name}`}
      record={{
        name: member.name,
        role: member.role,
        role_type: member.role_type,
        status: member.status,
        joined_on: member.joined_on ?? "",
        skills: member.skills ?? "",
        notes: member.notes ?? "",
      }}
      fields={fields}
      successMessage="Team member updated."
      onSave={async (values) => updateSolicateTeam(member.id, values)}
    />
  );
}

export function EditSolicateTaskButton({
  phase,
  phases = [],
  team = [],
  task,
  label,
  className = "button ghost small",
}: {
  phase?: any;
  phases?: any[];
  team?: any[];
  task?: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const isNew = !task;
  return (
    <>
      <EditButton 
        onClick={() => setOpen(true)} 
        label={label || (isNew ? "+ New task" : "Edit")} 
        className={className} 
        title={isNew ? "New Task" : "Edit Task"} 
      />
      <EditSolicateTaskModal
        phase={phase}
        phases={phases}
        team={team}
        task={task}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function EditSolicateTaskModal({
  phase,
  phases = [],
  team = [],
  task,
  open,
  onOpenChange,
}: {
  phase?: any;
  phases?: any[];
  team?: any[];
  task?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isNew = !task;
  
  const phaseOptions = [
    { value: "", label: "No phase (Ungrouped)" },
    ...phases.map((p) => ({ value: p.id, label: `${p.position}. ${p.name}` })),
  ];

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...team.map((m) => ({ value: m.id, label: m.name })),
  ];

  const fields: FieldConfig[] = [
    { kind: "text", name: "title", label: "Task Title", required: true, width: "full", autoFocus: true },
    ...(phases.length > 0
      ? [
          {
            kind: "select" as const,
            name: "phase_id",
            label: "Phase",
            options: phaseOptions,
            width: "half" as const,
          },
        ]
      : []),
    ...(team.length > 0
      ? [
          {
            kind: "select" as const,
            name: "assignee_id",
            label: "Assignee",
            options: assigneeOptions,
            width: "half" as const,
          },
        ]
      : []),
    {
      kind: "select",
      name: "status",
      label: "Status",
      options: [
        { value: "todo", label: "To Do" },
        { value: "in_progress", label: "In Progress" },
        { value: "done", label: "Done" },
        { value: "blocked", label: "Blocked" },
        { value: "cancelled", label: "Cancelled" },
      ],
      width: "half",
    },
    {
      kind: "select",
      name: "priority",
      label: "Priority",
      options: [
        { value: "low", label: "Low" },
        { value: "normal", label: "Normal" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
      ],
      width: "half",
    },
    { kind: "date", name: "due_at", label: "Due Date", width: "half" },
    { kind: "textarea", name: "description_md", label: "Description / Notes", minHeight: 80, width: "full" },
  ];

  const defaultPhaseId = task?.phase_id ?? (phase?.id ?? "");
  const defaultAssigneeId = task?.assignee_id ?? "";

  return (
    <EntityEditModal
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? "New Task" : "Edit Task"}
      description={isNew ? "Add an operational or strategic task to Solicate." : "Update task details."}
      record={{
        title: task?.title ?? "",
        phase_id: defaultPhaseId,
        assignee_id: defaultAssigneeId,
        status: task?.status ?? "todo",
        priority: task?.priority ?? "normal",
        due_at: task?.due_at ? new Date(task.due_at).toISOString().split('T')[0] : "",
        description_md: task?.description_md ?? "",
      }}
      fields={fields}
      successMessage={isNew ? "Task added." : "Task updated."}
      onSave={async (values) => {
        if (isNew) {
          return createSolicateTask(values);
        } else {
          return updateSolicateTask(task.id, values);
        }
      }}
    />
  );
}
