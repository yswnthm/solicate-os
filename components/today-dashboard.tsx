"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EditTaskButton } from "@/components/editing/edit-buttons";
import { getTaskEditContext } from "@/features/update-actions";
import { AlertCircle, Calendar, Inbox, Sparkles } from "lucide-react";

interface TodayDashboardProps {
  data: {
    overdue: any[];
    upcoming: any[];
    issues: any[];
    inboxEntries: any[];
    changedProjects: any[];
    stalled: any[];
    weekDecisions: any[];
    weekRecords: any[];
  };
  displayName: string;
}

export function TodayDashboard({ data, displayName }: TodayDashboardProps) {
  const [activeMobileTab, setActiveMobileTab] = useState<"focus" | "upcoming" | "inbox" | "activity">("focus");

  const overdueCount = data.overdue.length;
  const upcomingCount = data.upcoming.length;
  const urgentCount = data.issues.length;
  const inboxCount = data.inboxEntries.length;
  const activityCount = data.weekDecisions.length + data.weekRecords.length;

  const firstName = displayName?.split(" ")[0] || "there";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="today-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Good morning, {firstName}</h1>
          <p>{dateStr} · Your agency command center.</p>
        </div>
      </div>

      {/* Glanceable Quick Metric Chips */}
      <div className="today-summary-bar">
        {overdueCount > 0 && (
          <button
            type="button"
            className="today-chip danger"
            onClick={() => setActiveMobileTab("focus")}
          >
            <AlertCircle size={14} />
            <span>{overdueCount} Overdue</span>
          </button>
        )}

        {urgentCount > 0 && (
          <button
            type="button"
            className="today-chip warning"
            onClick={() => setActiveMobileTab("focus")}
          >
            <Sparkles size={14} />
            <span>{urgentCount} Urgent</span>
          </button>
        )}

        {inboxCount > 0 && (
          <button
            type="button"
            className="today-chip orange"
            onClick={() => setActiveMobileTab("inbox")}
          >
            <Inbox size={14} />
            <span>{inboxCount} Inbox</span>
          </button>
        )}

        <button
          type="button"
          className="today-chip neutral"
          onClick={() => setActiveMobileTab("upcoming")}
        >
          <Calendar size={14} />
          <span>{upcomingCount} Due This Week</span>
        </button>
      </div>

      {/* ─── Mobile View (Segmented Tabs) ─── */}
      <div className="today-mobile-view">
        <div className="today-segmented-tabs">
          <button
            type="button"
            className={`today-tab-btn ${activeMobileTab === "focus" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("focus")}
          >
            Focus {overdueCount + urgentCount > 0 ? `(${overdueCount + urgentCount})` : ""}
          </button>
          <button
            type="button"
            className={`today-tab-btn ${activeMobileTab === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("upcoming")}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            className={`today-tab-btn ${activeMobileTab === "inbox" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("inbox")}
          >
            Inbox {inboxCount > 0 ? `(${inboxCount})` : ""}
          </button>
          <button
            type="button"
            className={`today-tab-btn ${activeMobileTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("activity")}
          >
            Updates
          </button>
        </div>

        <div className="today-tab-content">
          {activeMobileTab === "focus" && (
            <div className="stack" style={{ gap: 16 }}>
              {/* Overdue Section */}
              {overdueCount > 0 ? (
                <section className="card card-primary" style={{ margin: 0 }}>
                  <div className="section-title">
                    <h2>Action Required</h2>
                    <span style={{ color: "var(--danger)" }}>{overdueCount} Overdue</span>
                  </div>
                  <TaskList tasks={data.overdue} empty="No overdue items." />
                </section>
              ) : null}

              {/* Urgent Tasks */}
              {urgentCount > 0 ? (
                <section className="card card-indigo" style={{ margin: 0 }}>
                  <div className="section-title">
                    <h2>Urgent & Blocked</h2>
                    <span>{urgentCount} items</span>
                  </div>
                  <div className="list">
                    {data.issues.map((task: any) => (
                      <Link className="row" href={`/projects/${task.project_id}`} key={task.id}>
                        <StatusPill value={task.priority ?? "urgent"} />
                        <div className="row-main">
                          <div className="row-title">{task.title}</div>
                          <div className="row-meta">{task.projects?.name}</div>
                        </div>
                        <StatusPill value={task.status} />
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {overdueCount === 0 && urgentCount === 0 && (
                <div className="empty" style={{ padding: "32px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>You are all caught up!</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    No overdue or urgent items demanding attention right now.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMobileTab === "upcoming" && (
            <section className="card card-secondary" style={{ margin: 0 }}>
              <div className="section-title">
                <h2>Due Next 7 Days</h2>
                <span>{upcomingCount} items</span>
              </div>
              <TaskList tasks={data.upcoming} empty="Nothing due in the next seven days." />
            </section>
          )}

          {activeMobileTab === "inbox" && (
            <section className="card card-orange" style={{ margin: 0 }}>
              <div className="section-title">
                <h2>Inbox Items</h2>
                <Link
                  href="/inbox"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "var(--island-bg)",
                    color: "var(--island-ink)",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Triage all →
                </Link>
              </div>
              {inboxCount > 0 ? (
                <div className="list" style={{ marginTop: "12px" }}>
                  {data.inboxEntries.map((entry: any) => (
                    <div className="row" key={entry.id}>
                      <StatusPill value={entry.type} />
                      <div className="row-main">
                        <div className="row-title">{entry.title}</div>
                        <div className="row-meta">
                          {entry.projects?.name || "Unfiled"} ·{" "}
                          <span suppressHydrationWarning>{formatDateTime(entry.occurred_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">Inbox zero! No unfiled captures.</div>
              )}
            </section>
          )}

          {activeMobileTab === "activity" && (
            <div className="stack" style={{ gap: 16 }}>
              {/* Decisions & Records */}
              <section className="card card-primary" style={{ margin: 0 }}>
                <div className="section-title">
                  <h2>This Week</h2>
                  <span>{activityCount} recorded</span>
                </div>
                {activityCount > 0 ? (
                  <div className="list">
                    {data.weekDecisions.map((d: any) => (
                      <Link className="row" href={`/projects/${d.project_id}`} key={`d-${d.id}`}>
                        <StatusPill value="decision" />
                        <div className="row-main">
                          <div className="row-title">{d.title}</div>
                          <div className="row-meta">
                            {d.projects?.name} ·{" "}
                            {d.decision_outcome ? `Outcome: ${d.decision_outcome}` : formatDate(d.occurred_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {data.weekRecords.map((r: any) => (
                      <Link className="row" href={`/projects/${r.project_id}`} key={`r-${r.id}`}>
                        <StatusPill value={r.type} />
                        <div className="row-main">
                          <div className="row-title">{r.title}</div>
                          <div className="row-meta">
                            {r.projects?.name} · {formatDate(r.occurred_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="empty">Nothing recorded this week yet.</div>
                )}
              </section>

              {/* Recent Projects */}
              <section className="card card-secondary" style={{ margin: 0 }}>
                <div className="section-title">
                  <h2>Recent Projects</h2>
                  <Link
                    href="/projects"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "var(--island-bg)",
                      color: "var(--island-ink)",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
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
                            {project.people?.name} ·{" "}
                            <span suppressHydrationWarning>{formatDateTime(project.updated_at)}</span>
                          </div>
                        </div>
                        <StatusPill value={project.status} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="empty">No active projects yet.</div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* ─── Desktop View (2-Column Bento Layout) ─── */}
      <div className="today-desktop-view">
        <div className="bento-grid">
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
                <span>Across active projects</span>
              </div>
              <TaskList tasks={data.upcoming} empty="Nothing due in the next seven days." />
            </section>
          </div>

          <div className="col-span-4" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {inboxCount > 0 && (
              <section className="section card card-orange" style={{ margin: 0 }}>
                <div className="section-title" style={{ borderBottom: "none", paddingBottom: 0 }}>
                  <h2>Inbox Preview</h2>
                  <Link
                    href="/inbox"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "var(--island-bg)",
                      color: "var(--island-ink)",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Triage all →
                  </Link>
                </div>
                <div className="list" style={{ marginTop: "16px" }}>
                  {data.inboxEntries.slice(0, 4).map((entry: any) => (
                    <div
                      className="row"
                      key={entry.id}
                      style={{ background: "transparent", border: "none", boxShadow: "none", padding: "8px 0" }}
                    >
                      <StatusPill value={entry.type} />
                      <div className="row-main">
                        <div className="row-title">{entry.title}</div>
                        <div className="row-meta">
                          {entry.projects?.name} ·{" "}
                          <span suppressHydrationWarning>{formatDateTime(entry.occurred_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="section card card-indigo" style={{ margin: 0 }}>
              <div className="section-title">
                <h2>Urgent Tasks</h2>
                <span>High priority & urgent work</span>
              </div>
              {data.issues.length ? (
                <div className="list">
                  {data.issues.map((task: any) => (
                    <Link className="row" href={`/projects/${task.project_id}`} key={task.id}>
                      <StatusPill value={task.priority ?? "urgent"} />
                      <div className="row-main">
                        <div className="row-title">{task.title}</div>
                        <div className="row-meta">{task.projects?.name}</div>
                      </div>
                      <StatusPill value={task.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty">No urgent tasks across active projects.</div>
              )}
            </section>

            {data.stalled.length > 0 && (
              <section className="section card card-dark" style={{ margin: 0 }}>
                <div className="section-title">
                  <h2>Stalled Projects</h2>
                  <span>No activity in 7+ days</span>
                </div>
                <div className="list">
                  {data.stalled.map((project: any) => (
                    <Link className="row" href={`/projects/${project.id}`} key={project.id}>
                      <StatusPill value="project" />
                      <div className="row-main">
                        <div className="row-title">{project.name}</div>
                        <div className="row-meta">{project.people?.name}</div>
                      </div>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {project.daysSince}d quiet
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="section card card-primary" style={{ margin: 0 }}>
              <div className="section-title">
                <h2>This Week</h2>
                <span>Decisions & records</span>
              </div>
              {activityCount > 0 ? (
                <div className="list">
                  {data.weekDecisions.map((d: any) => (
                    <Link className="row" href={`/projects/${d.project_id}`} key={`d-${d.id}`}>
                      <StatusPill value="decision" />
                      <div className="row-main">
                        <div className="row-title">{d.title}</div>
                        <div className="row-meta">
                          {d.projects?.name} ·{" "}
                          {d.decision_outcome ? `Outcome: ${d.decision_outcome}` : formatDate(d.occurred_at)}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {data.weekRecords.map((r: any) => (
                    <Link className="row" href={`/projects/${r.project_id}`} key={`r-${r.id}`}>
                      <StatusPill value={r.type} />
                      <div className="row-main">
                        <div className="row-title">{r.title}</div>
                        <div className="row-meta">
                          {r.projects?.name} · {formatDate(r.occurred_at)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty">Nothing recorded this week yet.</div>
              )}
            </section>

            <section className="section card card-secondary" style={{ margin: 0 }}>
              <div className="section-title">
                <h2>Recent Projects</h2>
                <Link
                  href="/projects"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "var(--island-bg)",
                    color: "var(--island-ink)",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
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
                          {project.people?.name} ·{" "}
                          <span suppressHydrationWarning>{formatDateTime(project.updated_at)}</span>
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
          </div>
        </div>
      </div>
    </div>
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
              {task.projects?.name} ·{" "}
              {task.app_users?.display_name ? `assigned to ${task.app_users.display_name}` : "unassigned"} · due{" "}
              {task.due_at ? formatDate(task.due_at) : "no due date"}
            </div>
          </Link>
          <StatusPill value={task.status} />
          <EditTaskButton task={task} projectId={task.project_id} fetchContext={getTaskEditContext} />
        </div>
      ))}
    </div>
  );
}
