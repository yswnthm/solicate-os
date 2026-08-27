import Link from "next/link";
import { notFound } from "next/navigation";
import { getSolicatePhase } from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PhaseHealthPill } from "@/components/shared/health-pill";
import { StatusPill } from "@/components/status-pill";
import { SolicateTaskRow } from "@/components/execution/solicate-task-row";
import { EditSolicatePhaseButton, EditSolicateTaskButton } from "@/components/editing/solicate-edit-modals";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Target } from "lucide-react";

export default async function SolicatePhaseDetailPage({
  params,
}: {
  params: Promise<{ phaseId: string }>;
}) {
  const { phaseId } = await params;
  const { phase, tasks, phases, team } = await getSolicatePhase(phaseId);
  if (!phase) notFound();

  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const closedTasks = tasks.filter((t) => t.status === "done" || t.status === "cancelled");
  const doneCount = closedTasks.length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* Breadcrumb back to phases list */}
      <div>
        <Link
          href="/solicate/phases"
          className="muted hover-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, textDecoration: "none" }}
        >
          <ArrowLeft size={14} /> Back to Phases
        </Link>
      </div>

      {/* ─── Hero Overview Card ─── */}
      <div className="card phase-hero-card" style={{ padding: 24 }}>
        <div className="phase-hero-grid">
          <div className="phase-hero-content">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <StatusPill value={phase.status} />
              <PhaseHealthPill phase={phase} tasks={tasks} />
              <EditSolicatePhaseButton phase={phase} label="Edit phase" />
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

          <div className="phase-hero-progress">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Phase Completion</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
            <div className="row-meta" style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>{doneCount}/{tasks.length} tasks finished</span>
              {phase.started_on ? <span>Started {formatDate(phase.started_on)}</span> : <span>Not started</span>}
            </div>
          </div>
        </div>

        {phase.success_definition && (
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Target size={13} className="text-secondary" />
              <span className="metric-label" style={{ margin: 0, fontSize: 11 }}>
                Success Definition & Milestone
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
              {phase.success_definition}
            </div>
          </div>
        )}
      </div>

      {/* ─── Tasks List ─── */}
      <Section
        title="Tasks"
        count={openTasks.length}
        action={
          <EditSolicateTaskButton
            phase={phase}
            phases={phases}
            team={team}
            label="+ New task"
            className="button ghost small"
          />
        }
      >
        {tasks.length ? (
          <div className="todo-list">
            {openTasks.map((task) => (
              <SolicateTaskRow
                key={task.id}
                task={task}
                phases={phases}
                team={team}
              />
            ))}
            {closedTasks.length > 0 && (
              <>
                <div className="todo-divider" style={{ marginTop: 16, marginBottom: 8 }}>
                  Completed <span>{closedTasks.length}</span>
                </div>
                {closedTasks.map((task) => (
                  <SolicateTaskRow
                    key={task.id}
                    task={task}
                    phases={phases}
                    team={team}
                  />
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="empty">No tasks in this phase yet. Click "+ New task" above to add one.</div>
        )}
      </Section>
    </div>
  );
}
