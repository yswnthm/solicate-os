import { getSolicatePhases } from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { EditSolicatePhaseButton } from "@/components/editing/solicate-edit-modals";

export const metadata = {
  title: "Agency Growth Eras | Solicate OS",
};

export default async function SolicatePhasesPage() {
  const phases = await getSolicatePhases();

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Section
        title="Agency Growth Eras & Roadmaps"
        count={phases.length}
      >
        {phases.length ? (
          <div className="list">
            {phases.map((p: any) => (
              <div className="row" key={p.id} style={{ alignItems: "flex-start" }}>
                <div className="row-main">
                  <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                    <span>{p.name}</span>
                  </div>
                  <div className="row-meta" style={{ marginTop: 2 }}>
                    {p.started_on ? `Started ${new Date(p.started_on).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "Not started yet"}
                    {p.target_date ? ` · Target: ${new Date(p.target_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}
                  </div>
                  {p.description && (
                    <div className="prose" style={{ fontSize: 13, marginTop: 6 }}>
                      {p.description}
                    </div>
                  )}
                  {p.success_definition && (
                    <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
                      <p className="metric-label" style={{ marginBottom: 4, color: "var(--muted)", fontSize: 11 }}>
                        Success Definition & Milestone
                      </p>
                      <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.45 }}>
                        {p.success_definition}
                      </div>
                    </div>
                  )}
                </div>
                <div className="row-actions-always" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusPill value={p.status} />
                  <EditSolicatePhaseButton phase={p} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No growth eras recorded.</div>
        )}
      </Section>
    </div>
  );
}
