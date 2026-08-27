import {
  getSolicateProfile,
  getSolicatePhases,
  getSolicateServices,
  getSolicateTeam,
  getSolicateAllTasks,
} from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { ProgressBar } from "@/components/shared/progress-bar";
import { EditSolicateProfileButton, EditSolicateTaskButton } from "@/components/editing/solicate-edit-modals";
import { SolicateTaskRow } from "@/components/execution/solicate-task-row";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Compass, Users, Sparkles, Target, Layers, Calendar, Globe } from "lucide-react";

export const metadata = {
  title: "Agency Overview | Solicate OS",
};

export default async function SolicateOverviewPage() {
  const [profile, phases, services, team, allTasks] = await Promise.all([
    getSolicateProfile(),
    getSolicatePhases(),
    getSolicateServices(),
    getSolicateTeam(),
    getSolicateAllTasks(),
  ]);

  const activePhase = phases.find((p) => p.status === "active") || phases[0];
  const hasPhases = phases.length > 0;

  // Filter tasks exactly like Project Overview
  const openUnphasedTasks = allTasks.filter(
    (t) => (hasPhases ? !t.phase_id : true) && t.status !== "done" && t.status !== "cancelled"
  );

  const completedTasks = allTasks
    .filter((t) => t.status === "done")
    .sort((a, b) => {
      const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return timeB - timeA;
    });

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── 1. Executive Snapshot Strip ─── */}
      <div className="grid three" style={{ gap: 12 }}>
        {/* Active Phase */}
        <Link
          href="/solicate/phases"
          style={{
            padding: "16px 18px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
            border: "1px solid var(--line-2)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textDecoration: "none",
            transition: "border-color 150ms ease, background 150ms ease",
          }}
          className="hover-card"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="metric-label" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                <Compass size={14} className="text-secondary" />
                Current Era
              </span>
              <StatusPill value={activePhase?.status || "active"} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
              {activePhase?.name || "Phase 1 — Foundation"}
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "4px 0 0", lineHeight: 1.4 }}>
              Validating service delivery & first 5 clients.
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
            Roadmap details <ArrowRight size={12} />
          </div>
        </Link>

        {/* Services Snapshot */}
        <Link
          href="/solicate/services"
          style={{
            padding: "16px 18px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
            border: "1px solid var(--line-2)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textDecoration: "none",
            transition: "border-color 150ms ease, background 150ms ease",
          }}
          className="hover-card"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="metric-label" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                <Layers size={14} className="text-secondary" />
                Capabilities
              </span>
              <span className="pill" style={{ fontSize: 11 }}>{services.length} Lines</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
              Growth, Web & Ops
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "4px 0 0", lineHeight: 1.4 }}>
              Packages starting from ₹10k to ₹20k+.
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
            View services <ArrowRight size={12} />
          </div>
        </Link>

        {/* Team Snapshot */}
        <Link
          href="/solicate/team"
          style={{
            padding: "16px 18px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
            border: "1px solid var(--line-2)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textDecoration: "none",
            transition: "border-color 150ms ease, background 150ms ease",
          }}
          className="hover-card"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="metric-label" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                <Users size={14} className="text-secondary" />
                Team & Network
              </span>
              <span className="pill" style={{ fontSize: 11 }}>{team.length} People</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
              Founder & Partner Network
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "4px 0 0", lineHeight: 1.4 }}>
              Yeswanth · Sakshi · Navi.
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
            Manage team <ArrowRight size={12} />
          </div>
        </Link>
      </div>

      {/* ─── 2. Agency North Star Banner ─── */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: "var(--radius-sm)",
          background: "var(--surface-2)",
          borderLeft: "4px solid var(--accent, #e5ff44)",
          borderTop: "1px solid var(--line-2)",
          borderRight: "1px solid var(--line-2)",
          borderBottom: "1px solid var(--line-2)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="metric-label" style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            10-Year North Star
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={12} /> Founded 02 January 2026
            </span>
            <span>·</span>
            <a
              href={profile?.website_url || "https://solicate.in"}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--ink)", display: "flex", alignItems: "center", gap: 4, textDecoration: "underline" }}
            >
              <Globe size={12} /> {profile?.website_url ? profile.website_url.replace("https://", "") : "solicate.in"}
            </a>
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)", margin: 0, fontWeight: 500 }}>
          {profile?.north_star || "Become the most trusted growth partner for independent and small businesses in Atlantic Canada and beyond."}
        </p>

        {profile?.tagline && (
          <div style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic", marginTop: 2 }}>
            "{profile.tagline}"
          </div>
        )}
      </div>

      {/* ─── 3. Phases Overview ─── */}
      <Section title="Phases" count={phases.length}>
        {phases.length ? (
          <div className="list">
            {phases.map((phase) => {
              const phaseTasks = allTasks.filter((t) => t.phase_id === phase.id);
              const phaseOpen = phaseTasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;
              const phaseDone = phaseTasks.filter((t) => t.status === "done" || t.status === "cancelled").length;
              const progress = phaseTasks.length ? Math.round((phaseDone / phaseTasks.length) * 100) : 0;

              return (
                <div className="row" key={phase.id}>
                  <StatusPill value={phase.status} />
                  <div className="row-main">
                    <div className="row-title">
                      <Link href="/solicate/phases">
                        {phase.position}. {phase.name}
                      </Link>
                    </div>
                    <div className="row-meta" style={{ marginBottom: 8 }}>
                      {phase.started_on ? `Started ${formatDate(phase.started_on)}` : "Not started"}
                      {phase.target_date ? ` · Target ${formatDate(phase.target_date)}` : ""}
                      {phaseOpen > 0 ? ` · ${phaseOpen} open task${phaseOpen === 1 ? "" : "s"}` : ""}
                      {phase.description ? ` · ${phase.description.slice(0, 90)}` : ""}
                    </div>
                    <div style={{ maxWidth: 280 }}>
                      <ProgressBar value={progress} />
                      <div className="row-meta" style={{ marginTop: 4 }}>
                        {phaseDone}/{phaseTasks.length} tasks done
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">No phases defined.</div>
        )}
      </Section>

      {/* ─── 4. Ungrouped Tasks (Open Tasks) ─── */}
      <Section
        title={hasPhases ? "Ungrouped tasks" : "Tasks"}
        count={openUnphasedTasks.length}
        action={
          <EditSolicateTaskButton
            phases={phases}
            team={team}
            label="+ New task"
            className="button ghost small"
          />
        }
      >
        {openUnphasedTasks.length ? (
          <div className="todo-list">
            {openUnphasedTasks.map((task) => (
              <SolicateTaskRow
                key={task.id}
                task={task}
                phases={phases}
                team={team}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            {hasPhases ? "No open tasks outside a phase." : "No open tasks."}
          </div>
        )}
      </Section>

      {/* ─── 5. Completed Tasks (Collapsible) ─── */}
      {completedTasks.length > 0 && (
        <Section title="Completed tasks" count={completedTasks.length} defaultOpen={false}>
          <div className="todo-list">
            {completedTasks.map((task) => (
              <SolicateTaskRow
                key={task.id}
                task={task}
                phases={phases}
                team={team}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ─── 6. Strategic Directives ─── */}
      <Section
        title="Strategy & AI Context"
        action={<EditSolicateProfileButton profile={profile} label="Edit Strategy" />}
      >
        <div className="grid two" style={{ gap: 12 }}>
          {/* Target Market */}
          <div style={{ padding: "16px 18px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Target size={15} className="text-secondary" />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Target Market & Clients</h4>
            </div>
            <p className="prose" style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>
              {profile?.target_market || "Small and growing businesses — individual practitioners, healthcare providers, and local brands needing direct growth traction."}
            </p>
          </div>

          {/* AI Brand Voice */}
          <div style={{ padding: "16px 18px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={15} className="text-secondary" />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Brand Voice & Guidelines</h4>
            </div>
            {profile?.brand_voice ? (
              <p className="prose" style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                {profile.brand_voice}
              </p>
            ) : (
              <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Currently unpopulated. Guidelines saved here are used by AI agents to draft proposals, strategy briefs, and content.
              </p>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
