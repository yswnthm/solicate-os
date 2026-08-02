import Link from "next/link";

import { quickCapture } from "@/features/actions";
import { getActiveProjectsForSelect, getTodayData } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { requireActiveUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ModalTrigger } from "@/components/modal-trigger";

export default async function TodayPage() {
  const { user } = await requireActiveUser();
  const [data, projects] = await Promise.all([getTodayData(user.id), getActiveProjectsForSelect()]);
  const inboxCount = data.inboxMessages.length + data.inboxEntries.length;

  return (
    <>
      <PageHeader
        title="Today"
        description={`${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · Your work that needs attention now.`}
      >
        <ModalTrigger buttonLabel="+ Quick capture" title="Quick capture" buttonClass="button">
          <p className="muted" style={{ marginBottom: 16 }}>Grab a thought now, triage it from Inbox.</p>
          <form className="form" action={quickCapture}>
            <div className="field">
              <label htmlFor="capture-project">Project</label>
              <select id="capture-project" name="project_id" required>
                <option value="">Choose project…</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.clients?.name ? `${p.clients.name} / ` : ""}{p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="capture-title">What to capture</label>
              <input id="capture-title" name="title" placeholder="Client asked about…" required />
            </div>
            <div className="field">
              <label>Detail (optional)</label>
              <textarea name="body_md" placeholder="Context, links, or raw text" />
            </div>
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Capture → Inbox
            </button>
          </form>
        </ModalTrigger>
      </PageHeader>

      {/* Summary strip */}
      <div className="grid three" style={{ marginBottom: 32 }}>
        <div className="card">
          <p className="metric-label">Overdue</p>
          <div className="metric" style={{ color: data.overdue.length > 0 ? "var(--danger)" : undefined }}>
            {data.overdue.length}
          </div>
        </div>
        <div className="card">
          <p className="metric-label">Due in 7 days</p>
          <div className="metric">{data.upcoming.length}</div>
        </div>
        <Link className="card" href="/inbox">
          <p className="metric-label">Inbox to triage</p>
          <div className="metric">{inboxCount}</div>
        </Link>
      </div>

      <div className="stack">
        {/* Overdue */}
        <section className="section">
          <div className="section-title">
            <h2>Overdue</h2>
            <span>Assigned to you</span>
          </div>
          <TaskList tasks={data.overdue} empty="No overdue work. Nice." />
        </section>

        {/* Next 7 days */}
        <section className="section">
          <div className="section-title">
            <h2>Next seven days</h2>
            <span>Assigned to you</span>
          </div>
          <TaskList tasks={data.upcoming} empty="Nothing due in the next seven days." />
        </section>

        {/* Open issues */}
        <section className="section">
          <div className="section-title">
            <h2>Open issues</h2>
            <span>Across active projects</span>
          </div>
          {data.issues.length ? (
            <div className="list">
              {data.issues.map((issue: any) => (
                <Link className="row" href={`/projects/${issue.project_id}`} key={issue.id}>
                  <StatusPill value={issue.severity} />
                  <div className="row-main">
                    <div className="row-title">{issue.title}</div>
                    <div className="row-meta">{issue.projects?.name}</div>
                  </div>
                  <StatusPill value={issue.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">No open issues across active projects.</div>
          )}
        </section>

        {/* Recently changed projects */}
        <section className="section">
          <div className="section-title">
            <h2>Recent projects</h2>
            <Link href="/projects" style={{ fontSize: 12, color: "var(--accent)" }}>
              View all →
            </Link>
          </div>
          {data.changedProjects.length ? (
            <div className="list">
              {data.changedProjects.map((project: any) => (
                <Link className="row" href={`/projects/${project.id}`} key={project.id}>
                  <div className="row-main">
                    <div className="row-title">{project.name}</div>
                    <div className="row-meta">
                      {project.clients?.name} · {formatDateTime(project.updated_at)}
                    </div>
                  </div>
                  <StatusPill value={project.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">Create your first project to begin.</div>
          )}
        </section>

        {/* Inbox preview */}
        {inboxCount > 0 && (
          <section className="section">
            <div className="section-title">
              <h2>Inbox preview</h2>
              <Link href="/inbox" style={{ fontSize: 12, color: "var(--accent)" }}>
                Triage all →
              </Link>
            </div>
            <div className="list">
              {data.inboxEntries.slice(0, 4).map((entry: any) => (
                <div className="row" key={entry.id}>
                  <StatusPill value={entry.type} />
                  <div className="row-main">
                    <div className="row-title">{entry.title}</div>
                    <div className="row-meta">{entry.projects?.name} · {formatDateTime(entry.occurred_at)}</div>
                  </div>
                </div>
              ))}
              {data.inboxMessages.slice(0, 2).map((message: any) => (
                <div className="row" key={message.id}>
                  <StatusPill value="message" />
                  <div className="row-main">
                    <div className="row-title">{message.conversations?.title ?? "Message"}</div>
                    <div className="row-meta">{message.body_md.slice(0, 100)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function TaskList({ tasks, empty }: { tasks: any[]; empty: string }) {
  if (!tasks.length) return <div className="empty">{empty}</div>;
  return (
    <div className="list">
      {tasks.map((task) => (
        <Link className="row" href={`/projects/${task.project_id}`} key={task.id}>
          <StatusPill value={task.priority} />
          <div className="row-main">
            <div className="row-title">{task.title}</div>
            <div className="row-meta">
              {task.projects?.name} · due {formatDate(task.due_at)}
            </div>
          </div>
          <StatusPill value={task.status} />
        </Link>
      ))}
    </div>
  );
}
