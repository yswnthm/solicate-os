export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addProjectParticipant,
  createConversation,
  createEntry,
  createIssue,
  createTask,
  resolveIssue,
} from "@/features/actions";
import { getProjectWorkspace } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ProjectStatusControl, TaskStatusControl } from "@/components/status-controls";
import { TaskEditButton } from "@/components/task-edit";
import { ConversationThread } from "@/components/conversation-thread";
import { WeeklySummaryButton } from "@/components/weekly-summary";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ModalTrigger } from "@/components/modal-trigger";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  if (!data.project) notFound();
  const project: any = data.project;

  const openTasks = data.tasks.filter(
    (t: any) => t.status !== "done" && t.status !== "cancelled",
  );
  const openIssues = data.issues.filter(
    (i: any) => !["resolved", "accepted", "closed"].includes(i.status),
  );

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${project.clients?.name ?? "Client"} ${project.code ? `· ${project.code}` : ""} · ${project.summary || "No working summary yet."}`}
      >
        <StatusPill value={project.status} />
        <WeeklySummaryButton projectId={projectId} />
        <ProjectStatusControl projectId={projectId} initialStatus={project.status} />
      </PageHeader>

      {/* Metrics */}
      <div className="grid three" style={{ marginBottom: 40 }}>
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

      {/* Main seamless edge-to-edge layout */}
      <div className="stack">
        {/* Tasks */}
        <Section 
          title="Tasks" 
          count={data.tasks.length}
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
          {data.tasks.length ? (
            <div className="list">
              {data.tasks.map((task: any) => (
                <div className="row" key={task.id}>
                  <StatusPill value={task.priority} />
                  <div className="row-main">
                    <div className="row-title">{task.title}</div>
                    <div className="row-meta">
                      {task.due_at ? `Due ${formatDate(task.due_at)}` : "No due date"}
                      {task.description_md ? ` · ${task.description_md.slice(0, 80)}` : ""}
                    </div>
                  </div>
                  <div className="row-actions-always">
                    <StatusPill value={task.status} />
                    {task.status !== "done" && task.status !== "cancelled" && (
                      <TaskStatusControl taskId={task.id} projectId={projectId} initialStatus={task.status} />
                    )}
                    <TaskEditButton task={task} projectId={projectId} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No tasks yet.</div>
          )}
        </Section>

        {/* Issues */}
        <Section 
          title="Issues" 
          count={data.issues.length}
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
          {data.issues.length ? (
            <div className="list">
              {data.issues.map((issue: any) => (
                <div className="row" key={issue.id}>
                  <StatusPill value={issue.severity} />
                  <div className="row-main">
                    <div className="row-title">{issue.title}</div>
                    <div className="row-meta">
                      {issue.resolution_summary || issue.description_md || "No detail"}
                    </div>
                  </div>
                  <div className="row-actions-always">
                    <StatusPill value={issue.status} />
                    {!["resolved", "accepted", "closed"].includes(issue.status) && (
                      <ModalTrigger buttonLabel="Resolve" title="Resolve issue" buttonClass="button small secondary">
                        <form className="form" action={resolveIssue}>
                          <input type="hidden" name="issue_id" value={issue.id} />
                          <input type="hidden" name="project_id" value={projectId} />
                          <div className="field">
                            <label>Resolution outcome</label>
                            <input name="resolution_summary" placeholder="What was done or decided" required />
                          </div>
                          <div className="field">
                            <label>Close as</label>
                            <select name="status">
                              <option value="resolved">Resolved</option>
                              <option value="accepted">Accepted (risk accepted)</option>
                              <option value="closed">Closed (won't fix)</option>
                            </select>
                          </div>
                          <button className="button" type="submit" style={{ marginTop: 8 }}>
                            Confirm
                          </button>
                        </form>
                      </ModalTrigger>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No open issues. Good to proceed.</div>
          )}
        </Section>

        {/* Knowledge */}
        <Section 
          title="Knowledge Base" 
          count={data.entries.length}
          action={
            <ModalTrigger buttonLabel="+ Add record" title="Add project record" buttonClass="button ghost small">
              <form className="form" action={createEntry}>
                <input type="hidden" name="project_id" value={projectId} />
                <div className="field">
                  <label>Type</label>
                  <select name="type">
                    <option value="note">Note</option>
                    <option value="meeting">Meeting</option>
                    <option value="decision">Decision</option>
                    <option value="document">Document</option>
                    <option value="update">Update</option>
                    <option value="milestone">Milestone</option>
                    <option value="capture">Quick capture</option>
                  </select>
                </div>
                <div className="field">
                  <label>Title</label>
                  <input name="title" placeholder="Subject of this record" required />
                </div>
                <div className="field">
                  <label>Body</label>
                  <textarea name="body_md" placeholder="Content, summary, or detail…" />
                </div>
                <div className="field">
                  <label>Decision outcome (decisions only)</label>
                  <input name="decision_outcome" placeholder="What was decided" />
                </div>
                <input type="hidden" name="occurred_at" value="" />
                <button className="button" type="submit" style={{ marginTop: 8 }}>
                  Add record
                </button>
              </form>
            </ModalTrigger>
          }
        >
          {data.entries.length ? (
            <div className="list">
              {data.entries.map((entry: any) => (
                <article className="card" key={entry.id}>
                  <div className="section-title" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                    <h3 style={{ margin: 0 }}>{entry.title}</h3>
                    <StatusPill value={entry.type} />
                  </div>
                  <div className="row-meta" style={{ marginTop: 4 }}>
                    {formatDateTime(entry.occurred_at)}
                    {entry.decision_outcome ? ` · Outcome: ${entry.decision_outcome}` : ""}
                  </div>
                  {entry.body_md ? <div className="prose">{entry.body_md}</div> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              No notes, meetings, or decisions recorded.
            </div>
          )}
        </Section>

        {/* Participants and terms */}
        <Section 
          title="Participants & Terms" 
          count={data.participants.length}
          action={
            <ModalTrigger buttonLabel="+ Add participant" title="Add participant" buttonClass="button ghost small">
              <form className="form" action={addProjectParticipant}>
                <input type="hidden" name="project_id" value={projectId} />
                <div className="field">
                  <label>Person</label>
                  <select name="person_id" required>
                    <option value="">Choose person</option>
                    {data.people.map((person: any) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                        {person.is_partner ? " (partner)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label>Role</label>
                    <select name="role">
                      <option value="client_contact">Client contact</option>
                      <option value="partner">Partner</option>
                      <option value="collaborator">Collaborator</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Communication</label>
                    <select name="communication_mode">
                      <option value="">Not set</option>
                      <option value="solicate_leads">Solicate leads</option>
                      <option value="partner_leads">Partner leads</option>
                      <option value="shared">Shared</option>
                      <option value="advisory_only">Advisory only</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Role detail</label>
                  <input name="role_label" placeholder="Referrer, operations…" />
                </div>
                <label className="checkbox">
                  <input name="is_referral_source" type="checkbox" />
                  Introduced this project
                </label>
                <div className="form-grid">
                  <div className="field">
                    <label>Financial arrangement</label>
                    <select name="financial_arrangement">
                      <option value="none">None</option>
                      <option value="referral_commission">Referral commission</option>
                      <option value="revenue_share">Revenue share</option>
                      <option value="delivery_split">Delivery split</option>
                      <option value="fixed_fee">Fixed fee</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Value</label>
                    <input name="financial_value" type="number" min="0" step="0.01" />
                  </div>
                </div>
                <div className="field">
                  <label>Terms note</label>
                  <textarea name="terms_note" placeholder="Plain-language agreement context" />
                </div>
                <input type="hidden" name="currency_code" value="INR" />
                <input type="hidden" name="payment_status" value="pending" />
                <button className="button" type="submit" style={{ marginTop: 8 }}>
                  Add participant
                </button>
              </form>
            </ModalTrigger>
          }
        >
          {data.participants.length ? (
            <div className="list">
              {data.participants.map((p: any) => (
                <div className="row" key={p.person_id}>
                  <div className="row-main">
                    <div className="row-title">{p.people?.name}</div>
                    <div className="row-meta">
                      {p.role_label || p.role}
                      {p.communication_mode ? ` · ${p.communication_mode.replace(/_/g, " ")}` : ""}
                      {p.financial_arrangement !== "none"
                        ? ` · ${p.financial_arrangement.replace(/_/g, " ")} ${p.financial_value ?? ""}`
                        : ""}
                    </div>
                  </div>
                  <StatusPill value={p.role} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No participants linked.</div>
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
                <details key={conversation.id}>
                  <summary className="row" style={{ cursor: "pointer", listStyle: "none", border: "1px solid var(--line)", background: "var(--surface)" }}>
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
                    <StatusPill value={conversation.channel} />
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
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-title">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2>{title}</h2>
          <span>{count}</span>
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}
