"use client";

import { useState } from "react";

import { EditButton } from "@/components/editing/entity-edit-modal";
import {
  EditClientModal,
  EditEntryModal,
  EditParticipantModal,
  EditPersonModal,
  EditPhaseModal,
  EditProjectModal,
  EditProposalModal,
  EditRelationshipModal,
  EditScopeModal,
  EditTaskModal,
} from "@/components/editing/entity-edit-modals";
import type { TaskEditContext } from "@/features/update-actions";

export function EditClientButton({
  client,
  label = "Edit",
  className = "button ghost small",
}: {
  client: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit client" />
      <EditClientModal client={client} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditPersonButton({
  person,
  label = "Edit",
  className = "button ghost small",
}: {
  person: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit person" />
      <EditPersonModal person={person} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditProjectButton({
  project,
  clients,
  label = "Edit",
  className = "button ghost small",
}: {
  project: any;
  clients: { id: string; name: string }[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit project" />
      <EditProjectModal project={project} clients={clients} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditPhaseButton({
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
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit phase" />
      <EditPhaseModal phase={phase} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditScopeButton({
  phase,
  label = "Edit scope",
  className = "button ghost small",
}: {
  phase: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit scope" />
      <EditScopeModal phase={phase} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditProposalButton({
  phase,
  label = "Edit proposal",
  className = "button ghost small",
}: {
  phase: any;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit proposal" />
      <EditProposalModal phase={phase} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditTaskButton({
  task,
  projectId,
  phases,
  users,
  fetchContext,
  label = "Edit",
  className = "button ghost small",
}: {
  task: any;
  projectId: string;
  phases?: any[];
  users?: any[];
  fetchContext?: (taskId: string, projectId: string) => Promise<TaskEditContext>;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit task" />
      <EditTaskModal
        task={task}
        projectId={projectId}
        phases={phases}
        users={users}
        fetchContext={fetchContext}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}


export function EditEntryButton({
  entry,
  projects,
  phases,
  label = "Edit",
  className = "button ghost small",
}: {
  entry: any;
  projects?: { id: string; name: string }[];
  phases?: { id: string; position: number; name: string }[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit record" />
      <EditEntryModal entry={entry} projects={projects} phases={phases} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditRelationshipButton({
  relationship,
  clients,
  people,
  label = "Edit",
  className = "button ghost small",
}: {
  relationship: any;
  clients: { id: string; name: string }[];
  people?: { id: string; name: string; is_partner: boolean }[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit relationship" />
      <EditRelationshipModal
        relationship={relationship}
        clients={clients}
        people={people}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function EditParticipantButton({
  participant,
  projectId,
  label = "Edit",
  className = "button ghost small",
}: {
  participant: any;
  projectId: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit participant" />
      <EditParticipantModal participant={participant} projectId={projectId} open={open} onOpenChange={setOpen} />
    </>
  );
}
