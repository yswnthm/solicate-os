import Link from "next/link";
import { notFound } from "next/navigation";

import { createPhase, createTask } from "@/features/actions";
import { getProjectWorkspace } from "@/features/queries";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditPhaseButton } from "@/components/editing/edit-buttons";
import { Section } from "@/components/shared/section";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PhaseHealthPill } from "@/components/shared/health-pill";
import { TaskRow } from "@/components/execution/task-row";
import { formatDate } from "@/lib/utils";
import { EntriesSection } from "@/components/entries/entries-section";
import { InboxList } from "@/components/inbox-list";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  const project: any = data.project;
  if (!project) notFound();

  const hasPhases = data.phases.length > 0;
  const openUnphasedTasks = data.tasks.filter(
    (t: any) => (hasPhases ? !t.phase_id : true) && t.status !== "done" && t.status !== "cancelled"
  );
  const completedTasks = data.tasks
    .filter((t: any) => t.status === "done")
    .sort((a: any, b: any) => {
      const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return timeB - timeA;
    });
  
  const inboxEntries = data.entries.filter((e: any) => e.triage_state === "inbox");
  const sortedCaptures = data.entries.filter((e: any) => e.triage_state === "filed" && e.type === "capture");

  return (
    <div className="stack">
      {/* Project Inbox */}
      <Section title="Project Inbox" count={inboxEntries.length}>
        <InboxList entries={inboxEntries} projects={[{ id: projectId, name: data.project?.name ?? "" }]} />
      </Section>

      {/* Phases */}
      <Section
        title="Phases"
        count={data.phases.length}
        action={
          <ModalTrigger buttonLabel="+ New phase" title="New phase" buttonClass="button ghost small">
            <form className="form" action={createPhase}>
              <input type="hidden" name="project_id" value={projectId} />
              <div className="field">
                <label>Phase name</label>
                <input name="name" placeholder="e.g. Phase 2 — WordPress trial" required />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea name="description" placeholder="What this phase covers" />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Position</label>
                  <input name="position" type="number" min="1" defaultValue={data.phases.length + 1} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select name="status">
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Start date</label>
                <input name="started_on" type="date" />
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Add phase
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {data.phases.length ? (
          <div className="list">
            {data.phases.map((phase: any) => {
              const phaseTasks = data.tasks.filter((t: any) => t.phase_id === phase.id);
              const phaseOpen = phaseTasks.filter(
                (t: any) => t.status !== "done" && t.status !== "cancelled",
              ).length;
              return (
                <div className="row" key={phase.id}>
                  <StatusPill value={phase.status} />
                  <div className="row-main">
                    <div className="row-title">
                      <Link href={`/projects/${projectId}/phases/${phase.id}`}>
                        {phase.position}. {phase.name}
                      </Link>
                    </div>
                    <div className="row-meta" style={{ marginBottom: 8 }}>
                      {phase.started_on ? `Started ${formatDate(phase.started_on)}` : "Not started"}
                      {phaseOpen > 0 ? ` · ${phaseOpen} open task${phaseOpen === 1 ? "" : "s"}` : ""}
                      {phase.description ? ` · ${phase.description.slice(0, 90)}` : ""}
                    </div>
                    <div style={{ maxWidth: 280 }}>
                      <ProgressBar value={phaseTasks.length ? Math.round((phaseTasks.filter((t: any) => t.status === "done" || t.status === "cancelled").length / phaseTasks.length) * 100) : 0} />
                    </div>
                  </div>
                  <div className="row-actions-always">
                    <PhaseHealthPill phase={phase} tasks={phaseTasks} />
                    <EditPhaseButton phase={phase} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">No phases yet — group work into phases as the engagement grows.</div>
        )}
      </Section>

      {/* Execution / Open Tasks */}
      <Section
        title={hasPhases ? "Ungrouped tasks" : "Tasks"}
        count={openUnphasedTasks.length}
        action={
          <ModalTrigger buttonLabel="+ New task" title="New task" buttonClass="button ghost small">
            <form className="form" action={createTask}>
              <input type="hidden" name="project_id" value={projectId} />
              <div className="field">
                <label>Task title</label>
                <input name="title" placeholder="What needs to happen" required />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Priority</label>
                  <select name="priority">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="field">
                  <label>Due date</label>
                  <input name="due_at" type="date" />
                </div>
              </div>
              {hasPhases && (
                <div className="field">
                  <label>Phase</label>
                  <select name="phase_id">
                    <option value="">No phase</option>
                    {data.phases.map((phase: any) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.position}. {phase.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label>Assignee</label>
                <select name="assignee_id">
                  <option value="">Unassigned</option>
                  {data.users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea name="description_md" placeholder="Optional context or links" />
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Add task
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {openUnphasedTasks.length ? (
          <div className="todo-list">
            {openUnphasedTasks.map((task: any) => (
              <TaskRow key={task.id} task={task} projectId={projectId} phases={data.phases} users={data.users} />
            ))}
          </div>
        ) : (
          <div className="empty">{hasPhases ? "No open tasks outside a phase." : "No open tasks."}</div>
        )}
      </Section>

      {/* Completed Tasks (Collapsible, Default Closed) */}
      {completedTasks.length > 0 && (
        <Section title="Completed tasks" count={completedTasks.length} defaultOpen={false}>
          <div className="todo-list">
            {completedTasks.map((task: any) => (
              <TaskRow key={task.id} task={task} projectId={projectId} phases={data.phases} users={data.users} />
            ))}
          </div>
        </Section>
      )}

      {/* Sorted Inbox (Filed Captures & Notes) */}
      <EntriesSection
        title="Sorted Inbox"
        entries={sortedCaptures}
        edit={{ projects: [{ id: projectId, name: data.project?.name ?? "" }], phases: data.phases }}
        defaultOpen={false}
        empty="No filed notes or captures yet."
      />
    </div>
  );
}
