import Link from "next/link";
import { notFound } from "next/navigation";

import { createConversation, createEntry, createIssue, createPhase, createTask } from "@/features/actions";
import { getProjectWorkspace } from "@/features/queries";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditPhaseButton } from "@/components/editing/edit-buttons";
import { ConversationThread } from "@/components/conversation-thread";
import { Section } from "@/components/shared/section";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PhaseHealthPill } from "@/components/shared/health-pill";
import { TaskRow } from "@/components/execution/task-row";
import { IssueRow } from "@/components/execution/issue-row";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ thread?: string }>;
}) {
  const { projectId } = await params;
  const { thread } = await searchParams;
  const data = await getProjectWorkspace(projectId);
  const project: any = data.project;
  if (!project) notFound();

  const openTasks = data.tasks.filter(
    (t: any) => t.status !== "done" && t.status !== "cancelled",
  );
  const openIssues = data.issues.filter(
    (i: any) => !["resolved", "accepted", "closed"].includes(i.status),
  );

  const hasPhases = data.phases.length > 0;
  const unphasedTasks = data.tasks.filter((t: any) => (hasPhases ? !t.phase_id : true));
  const unphasedIssues = data.issues.filter((i: any) => (hasPhases ? !i.phase_id : true));

  const strategy = [
    { title: "Objective", body: project.objective, key: "objective" },
    { title: "Success definition", body: project.success_definition, key: "success_definition" },
    { title: "Direction", body: project.direction, key: "direction" },
  ].filter((b) => b.body);

  return (
    <div className="stack">
      {strategy.length > 0 && (
        <div className="strategy-grid">
          {strategy.map((block) => (
            <div className="strategy-block" key={block.key}>
              <h4>{block.title}</h4>
              <div className="prose">{block.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="grid three" style={{ marginBottom: 8 }}>
        <div className="card">
          <p className="metric-label">Target date</p>
          <div className="metric" style={{ fontSize: 19 }}>
            {formatDate(project.target_date)}
          </div>
        </div>
        <div className="card">
          <p className="metric-label">Open tasks</p>
          <div className="metric">{openTasks.length}</div>
        </div>
        <div className="card">
          <p className="metric-label">Open issues</p>
          <div
            className="metric"
            style={{ color: openIssues.length > 0 ? "var(--danger)" : undefined }}
          >
            {openIssues.length}
          </div>
        </div>
      </div>

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
              const phaseIssues = data.issues.filter((i: any) => i.phase_id === phase.id);
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
                    <PhaseHealthPill phase={phase} tasks={phaseTasks} issues={phaseIssues} />
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

      {/* Ungrouped execution */}
      <Section
        title={hasPhases ? "Ungrouped execution" : "Tasks"}
        count={unphasedTasks.length}
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
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
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
        {unphasedTasks.length ? (
          <div className="list">
            {unphasedTasks.map((task: any) => (
              <TaskRow key={task.id} task={task} projectId={projectId} phases={data.phases} users={data.users} />
            ))}
          </div>
        ) : (
          <div className="empty">No tasks outside a phase — phase them so execution stays scoped.</div>
        )}
      </Section>

      <Section
        title={hasPhases ? "Issues" : "Issues"}
        count={unphasedIssues.length}
        action={
          <ModalTrigger buttonLabel="+ New issue" title="New issue" buttonClass="button ghost small">
            <form className="form" action={createIssue}>
              <input type="hidden" name="project_id" value={projectId} />
              <div className="field">
                <label>Issue</label>
                <input name="title" placeholder="What is the problem or risk" required />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Severity</label>
                  <select name="severity">
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                    <option value="low">Low</option>
                  </select>
                </div>
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
              </div>
              {hasPhases && (
                <div className="field">
                  <label>Phase</label>
                  <select name="phase_id">
                    <option value="">Project-level (no phase)</option>
                    {data.phases.map((phase: any) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.position}. {phase.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label>Description</label>
                <textarea name="description_md" placeholder="Evidence, risk context, or current state" />
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Open issue
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {unphasedIssues.length ? (
          <div className="list">
            {unphasedIssues.map((issue: any) => (
              <IssueRow key={issue.id} issue={issue} projectId={projectId} users={data.users} phases={data.phases} />
            ))}
          </div>
        ) : (
          <div className="empty">No project-level issues. Issues inside phases live on each phase tab.</div>
        )}
      </Section>

      {/* Conversations */}
      <Section
        title="Conversations"
        count={data.conversations.length}
        action={
          <ModalTrigger buttonLabel="+ New conversation" title="Create conversation" buttonClass="button ghost small">
            <form className="form" action={createConversation}>
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="client_id" value={project.client_id} />
              <div className="field">
                <label>New conversation</label>
                <input name="title" placeholder="Client + Sakshi WhatsApp" required />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Type</label>
                  <select name="kind">
                    <option value="group">Group</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>
                <div className="field">
                  <label>Channel</label>
                  <select name="channel">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Create conversation
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {data.conversations.length ? (
          <div className="stack">
            {data.conversations.map((conversation: any) => (
              <details key={conversation.id} open={thread === conversation.id}>
                <summary
                  className="row"
                  style={{ cursor: "pointer", listStyle: "none", border: "1px solid var(--line)", background: "var(--surface)" }}
                >
                  <div className="row-main">
                    <div className="row-title">{conversation.title}</div>
                    <div className="row-meta">
                      {conversation.kind} · {conversation.channel} ·{" "}
                      {(conversation.conversation_participants ?? [])
                        .map((p: any) => p.people?.name)
                        .filter(Boolean)
                        .join(", ") || "No participants"}
                    </div>
                  </div>
                  <div className="row-actions-always">
                    <StatusPill value={conversation.channel} />
                  </div>
                </summary>
                <ConversationThread
                  conversationId={conversation.id}
                  projectId={projectId}
                  initialMessages={conversation.messages ?? []}
                  people={data.people}
                />
              </details>
            ))}
          </div>
        ) : (
          <div className="empty">No conversations on this project.</div>
        )}
      </Section>

      {/* Activity */}
      <Section title="Activity" count={data.activity.length}>
        {data.activity.length ? (
          <div className="list">
            {data.activity.map((event: any) => (
              <div className="row" key={event.id}>
                <StatusPill value={event.event_type} />
                <div className="row-main">
                  <div className="row-title">{event.summary}</div>
                  <div className="row-meta">{formatDateTime(event.occurred_at)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Meaningful work changes will appear here as you operate the project.</div>
        )}
      </Section>
    </div>
  );
}
