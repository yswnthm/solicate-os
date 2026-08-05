import Link from "next/link";

import { getPhaseWorkspace } from "@/features/queries";
import { Section } from "@/components/shared/section";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PhaseHealthPill } from "@/components/shared/health-pill";
import { StatusPill } from "@/components/status-pill";
import { TaskRow } from "@/components/execution/task-row";
import { IssueRow } from "@/components/execution/issue-row";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PhaseDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const data = await getPhaseWorkspace(phaseId);
  const { phase, tasks, issues, entries, finance, users, phases } = data;

  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const openIssues = issues.filter((i) => !["resolved", "accepted", "closed"].includes(i.status));
  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "cancelled").length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const currency = finance.find((i) => i.currency_code)?.currency_code ?? "INR";
  const invoiceTotal = finance.filter((i) => i.kind === "invoice").reduce((acc, i) => acc + i.amount, 0);
  const paid = finance.filter((i) => i.kind === "payment").reduce((acc, i) => acc + i.amount, 0);

  const scopeSnippet = phase.scope_deliverables || phase.scope_requirements;

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── Hero Overview Card ─── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <StatusPill value={phase.status} />
              <PhaseHealthPill phase={phase} tasks={tasks} issues={issues} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>
              {phase.position}. {phase.name}
            </h3>
            {phase.description ? (
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14 }}>{phase.description}</p>
            ) : (
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>No description added for this phase yet.</p>
            )}
          </div>

          <div style={{ minWidth: 260, background: "var(--surface-2)", padding: 16, borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Phase Completion</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
            <div className="row-meta" style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>{doneTasks}/{tasks.length} tasks finished</span>
              {phase.started_on ? <span>Started {formatDate(phase.started_on)}</span> : <span>Not started</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metrics Bento Grid ─── */}
      <div className="grid four">
        <Link href={`/projects/${projectId}/phases/${phaseId}/tasks`} className="card hover-card" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="metric-label">Open Tasks</p>
          <div className="metric">{openTasks.length}</div>
          <p className="row-meta" style={{ marginTop: 4 }}>{tasks.length} total tasks in phase</p>
        </Link>

        <Link href={`/projects/${projectId}/phases/${phaseId}/issues`} className="card hover-card" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="metric-label">Open Issues & Risks</p>
          <div className="metric" style={{ color: openIssues.length > 0 ? "var(--danger)" : undefined }}>
            {openIssues.length}
          </div>
          <p className="row-meta" style={{ marginTop: 4 }}>{issues.length} total reported</p>
        </Link>

        <Link href={`/projects/${projectId}/phases/${phaseId}/finance`} className="card hover-card" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="metric-label">Invoiced Amount</p>
          <div className="metric" style={{ fontSize: 19 }}>
            {formatCurrency(invoiceTotal, currency)}
          </div>
          <p className="row-meta" style={{ marginTop: 4 }}>
            Paid: {formatCurrency(paid, currency)}
          </p>
        </Link>

        <Link href={`/projects/${projectId}/phases/${phaseId}/documents`} className="card hover-card" style={{ textDecoration: "none", color: "inherit" }}>
          <p className="metric-label">Documents & Records</p>
          <div className="metric">{entries.length}</div>
          <p className="row-meta" style={{ marginTop: 4 }}>Filed in phase repository</p>
        </Link>
      </div>

      {/* ─── Phase Deliverables / Scope Summary ─── */}
      {scopeSnippet && (
        <Section
          title="Phase Scope & Deliverables"
          action={
            <Link href={`/projects/${projectId}/phases/${phaseId}/documents?tag=scope`} className="button ghost small">
              View full scope →
            </Link>
          }
        >
          <div className="card" style={{ background: "var(--surface-2)", border: "none" }}>
            <div className="prose" style={{ fontSize: 14 }}>
              {scopeSnippet}
            </div>
          </div>
        </Section>
      )}

      {/* ─── Split Grid: Open Tasks & Open Issues ─── */}
      <div className="grid two" style={{ gap: 24 }}>
        <Section
          title="Open Phase Tasks"
          count={openTasks.length}
          action={
            <Link href={`/projects/${projectId}/phases/${phaseId}/tasks`} className="button ghost small">
              All tasks →
            </Link>
          }
        >
          {openTasks.length ? (
            <div className="list">
              {openTasks.slice(0, 4).map((task) => (
                <TaskRow key={task.id} task={task} projectId={projectId} phases={phases} users={users} />
              ))}
            </div>
          ) : (
            <div className="empty">All phase tasks are completed or cancelled.</div>
          )}
        </Section>

        <Section
          title="Open Phase Issues"
          count={openIssues.length}
          action={
            <Link href={`/projects/${projectId}/phases/${phaseId}/issues`} className="button ghost small">
              All issues →
            </Link>
          }
        >
          {openIssues.length ? (
            <div className="list">
              {openIssues.slice(0, 4).map((issue) => (
                <IssueRow key={issue.id} issue={issue} projectId={projectId} users={users} phases={phases} />
              ))}
            </div>
          ) : (
            <div className="empty">No active issues or risks flagged in this phase.</div>
          )}
        </Section>
      </div>
    </div>
  );
}
