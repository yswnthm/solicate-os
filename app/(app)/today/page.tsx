export const dynamic = "force-dynamic";
import Link from "next/link";

import { getTodayData } from "@/features/queries";
import { getTaskEditContext } from "@/features/update-actions";
import { StatusPill } from "@/components/status-pill";
import { requireActiveUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";
import { MorningBriefButton } from "@/components/morning-brief";
import { WeekReviewButton } from "@/components/week-review";
import { EditTaskButton } from "@/components/editing/edit-buttons";

export default async function TodayPage() {
  const { user, profile } = await requireActiveUser();
  const data = await getTodayData(user.id);
  const inboxCount = data.inboxMessages.length + data.inboxEntries.length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Good morning, {profile.display_name?.split(" ")[0] || "there"}</h1>
          <p>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · Your agency command center.</p>
        </div>
        <div className="page-header-actions">
          <MorningBriefButton />
          <WeekReviewButton />
          <Link href="/capture" className="button secondary">
            + Capture
          </Link>
        </div>
      </div>

      {/* Main dashboard */}
      <div className="bento-grid">
        {/* Due & Overdue Items (Spans 8 columns) */}
        <div className="col-span-8" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <section className="section card card-primary" style={{ margin: 0 }}>
            <div className="section-title">
              <h2>Action Required</h2>
              <span>Overdue items</span>
            </div>
            <TaskList tasks={data.overdue} empty="No overdue work. Nice." />
          </section>

          <section className="section card card-secondary" style={{ margin: 0 }}>
            <div className="section-title">
              <h2>Upcoming (Next 7 days)</h2>
              <span>Assigned to you</span>
            </div>
            <TaskList tasks={data.upcoming} empty="Nothing due in the next seven days." />
          </section>

          <section className="section card card-indigo" style={{ margin: 0 }}>
            <div className="section-title">
              <h2>Open Issues</h2>
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

        </div>

        {/* Right sidebar style in bento (Spans 4 columns) */}
        <div className="col-span-4" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Recent Projects */}
          <section className="section card card-dark" style={{ margin: 0 }}>
            <div className="section-title">
              <h2>Recent Projects</h2>
              <Link href="/projects" style={{ fontSize: 11, fontWeight: 700, background: "var(--island-bg)", color: "var(--island-ink)", padding: "4px 10px", borderRadius: "999px", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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

          {/* Inbox Preview Widget */}
          {inboxCount > 0 && (
            <section className="section card card-orange" style={{ margin: 0 }}>
              <div className="section-title" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <h2>Inbox Preview</h2>
                <Link href="/inbox" style={{ fontSize: 11, fontWeight: 700, background: "var(--island-bg)", color: "var(--island-ink)", padding: "4px 10px", borderRadius: "999px", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Triage all →
                </Link>
              </div>
              <div className="list" style={{ marginTop: "16px" }}>
                {data.inboxEntries.slice(0, 4).map((entry: any) => (
                  <div className="row" key={entry.id} style={{ background: "transparent", border: "none", boxShadow: "none", padding: "8px 0" }}>
                    <StatusPill value={entry.type} />
                    <div className="row-main">
                      <div className="row-title">{entry.title}</div>
                      <div className="row-meta">{entry.projects?.name} · {formatDateTime(entry.occurred_at)}</div>
                    </div>
                  </div>
                ))}
                {data.inboxMessages.slice(0, 2).map((message: any) => (
                  <div className="row" key={message.id} style={{ background: "transparent", border: "none", boxShadow: "none", padding: "8px 0" }}>
                    <StatusPill value="message" />
                    <div className="row-main">
                      <div className="row-title">{message.conversations?.title ?? "Message"}</div>
                      <div className="row-meta">{message.body_md.slice(0, 60)}...</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}

function TaskList({ tasks, empty }: { tasks: any[]; empty: string }) {
  if (!tasks.length) return <div className="empty">{empty}</div>;
  return (
    <div className="list">
      {tasks.map((task) => (
        <div className="row" key={task.id}>
          <StatusPill value={task.priority} />
          <Link className="row-main" href={`/projects/${task.project_id}`}>
            <div className="row-title">{task.title}</div>
            <div className="row-meta">
              {task.phases?.name ? `${task.phases.name} · ` : ""}
              {task.projects?.name} · due {formatDate(task.due_at)}
            </div>
          </Link>
          <StatusPill value={task.status} />
          <EditTaskButton task={task} projectId={task.project_id} fetchContext={getTaskEditContext} />
        </div>
      ))}
    </div>
  );
}
