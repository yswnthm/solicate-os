"use client";

import { useState } from "react";

import { EditButton } from "@/components/editing/entity-edit-modal";
import {
  EditClientModal,
  EditConversationModal,
  EditEntryModal,
  EditIssueModal,
  EditMessageModal,
  EditParticipantModal,
  EditPersonModal,
  EditPhaseModal,
  EditProjectModal,
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

export function EditIssueButton({
  issue,
  projectId,
  users,
  label = "Edit",
  className = "button ghost small",
}: {
  issue: any;
  projectId: string;
  users?: any[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit issue" />
      <EditIssueModal issue={issue} projectId={projectId} users={users} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditEntryButton({
  entry,
  projects,
  label = "Edit",
  className = "button ghost small",
}: {
  entry: any;
  projects?: { id: string; name: string }[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit record" />
      <EditEntryModal entry={entry} projects={projects} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditConversationButton({
  conversation,
  clientId,
  projects,
  label = "Edit",
  className = "button ghost small",
}: {
  conversation: any;
  clientId: string;
  projects?: { id: string; name: string }[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit conversation" />
      <EditConversationModal
        conversation={conversation}
        clientId={clientId}
        projects={projects}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function EditMessageButton({
  message,
  conversationId,
  projectId,
  label = "Edit",
  className = "button ghost small",
}: {
  message: any;
  conversationId: string;
  projectId: string | null;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <EditButton onClick={() => setOpen(true)} label={label} className={className} title="Edit message" />
      <EditMessageModal
        message={message}
        conversationId={conversationId}
        projectId={projectId}
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
