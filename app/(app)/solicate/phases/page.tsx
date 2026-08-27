import Link from "next/link";
import { getSolicatePhases, getSolicateAllTasks } from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PhaseHealthPill } from "@/components/shared/health-pill";
import { EditSolicatePhaseButton, NewSolicatePhaseButton } from "@/components/editing/solicate-edit-modals";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Agency Growth Eras | Solicate OS",
};

export default async function SolicatePhasesPage() {
  const [phases, allTasks] = await Promise.all([
    getSolicatePhases(),
    getSolicateAllTasks(),
  ]);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Section
        title="Phases"
        count={phases.length}
        action={<NewSolicatePhaseButton nextPosition={phases.length + 1} />}
      >
        {phases.length ? (
          <div className="list">
            {phases.map((phase) => {
              const phaseTasks = allTasks.filter((t) => t.phase_id === phase.id);
              const phaseOpen = phaseTasks.filter(
                (t) => t.status !== "done" && t.status !== "cancelled"
              ).length;
              const done = phaseTasks.filter((t) => t.status === "done" || t.status === "cancelled").length;
              const progress = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;

              return (
                <div className="row" key={phase.id}>
                  <StatusPill value={phase.status} />
                  <div className="row-main">
                    <div className="row-title">
                      <Link href={`/solicate/phases/${phase.id}`}>
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
                    <PhaseHealthPill phase={phase} tasks={phaseTasks} />
                    <EditSolicatePhaseButton phase={phase} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            No phases yet — create one to give Solicate's growth eras their own scope and timeline.
          </div>
        )}
      </Section>
    </div>
  );
}
