import Link from "next/link";

import { createPhase } from "@/features/actions";
import { getProjectWorkspace } from "@/features/queries";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditPhaseButton } from "@/components/editing/edit-buttons";
import { Section } from "@/components/shared/section";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PhaseHealthPill } from "@/components/shared/health-pill";
import { formatDate } from "@/lib/utils";

export default async function ProjectPhasesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);

  return (
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
            const done = phaseTasks.filter((t: any) => t.status === "done" || t.status === "cancelled").length;
            const progress = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;
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
                    {phase.target_date ? ` · Target ${formatDate(phase.target_date)}` : ""}
                    {phaseOpen > 0 ? ` · ${phaseOpen} open task${phaseOpen === 1 ? "" : "s"}` : ""}
                    {phase.description ? ` · ${phase.description.slice(0, 90)}` : ""}
                  </div>
                  <div style={{ maxWidth: 320 }}>
                    <ProgressBar value={progress} />
                    <div className="row-meta" style={{ marginTop: 4 }}>
                      {done}/{phaseTasks.length} tasks done
                    </div>
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
        <div className="empty">
          No phases yet — create one to give the work its own scope, proposal, and timeline.
        </div>
      )}
    </Section>
  );
}
