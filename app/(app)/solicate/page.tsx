import { getSolicateProfile, getSolicatePhases, getSolicateServices, getSolicateTeam } from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { EditSolicateProfileButton } from "@/components/editing/solicate-edit-modals";
import Link from "next/link";
import { ArrowRight, Compass, Users, Sparkles, Target, Layers } from "lucide-react";

export const metadata = {
  title: "Agency Overview | Solicate OS",
};

export default async function SolicateOverviewPage() {
  const [profile, phases, services, team] = await Promise.all([
    getSolicateProfile(),
    getSolicatePhases(),
    getSolicateServices(),
    getSolicateTeam(),
  ]);

  const activePhase = phases.find((p: any) => p.status === "active") || phases[0];

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* ─── 1. Executive Vitals & Snapshot ─── */}
      <div className="grid three" style={{ gap: 14 }}>
        {/* Active Phase Card */}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
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
              Validating service lines & serving initial client base.
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
            View growth roadmap <ArrowRight size={12} />
          </div>
        </Link>

        {/* Services Card */}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="metric-label" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                <Layers size={14} className="text-secondary" />
                Core Capabilities
              </span>
              <span className="pill" style={{ fontSize: 11 }}>{services.length} Active</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
              Organic, Ecomm & Web
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "4px 0 0", lineHeight: 1.4 }}>
              Outcome-focused packages from ₹5,000 to ₹20,000+.
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
            Explore service lines <ArrowRight size={12} />
          </div>
        </Link>

        {/* Team & Network Card */}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="metric-label" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                <Users size={14} className="text-secondary" />
                Team & Partners
              </span>
              <span className="pill" style={{ fontSize: 11 }}>{team.length} People</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
              Founder + Partner Network
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "4px 0 0", lineHeight: 1.4 }}>
              Yeswanth (Founder & Growth) · Sakshi (Design & Ops).
            </p>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
            Manage team & roles <ArrowRight size={12} />
          </div>
        </Link>
      </div>

      {/* ─── 2. North Star & Identity ─── */}
      <Section
        title="Positioning & North Star"
        action={<EditSolicateProfileButton profile={profile} label="Edit Identity" />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Mission Quote Banner */}
          <div
            style={{
              padding: "20px 24px",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-2)",
              borderLeft: "4px solid var(--accent, #e5ff44)",
              borderTop: "1px solid var(--line-2)",
              borderRight: "1px solid var(--line-2)",
              borderBottom: "1px solid var(--line-2)",
            }}
          >
            <div className="metric-label" style={{ marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              10-Year North Star Vision
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)", margin: 0, fontWeight: 500 }}>
              {profile?.north_star || "Become the most trusted growth partner for independent and small businesses in Atlantic Canada and beyond."}
            </p>
          </div>

          {/* Two-Column Detail Grid */}
          <div className="grid two" style={{ gap: 14 }}>
            {/* Target Market */}
            <div style={{ padding: "16px 18px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Target size={15} className="text-secondary" />
                <h4 style={{ margin: 0, fontSize: 14 }}>Target Market & Audience</h4>
              </div>
              <p className="prose" style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                {profile?.target_market || "Small and growing businesses — individual practitioners, healthcare providers, and local brands needing direct growth traction."}
              </p>
            </div>

            {/* AI Brand Voice */}
            <div style={{ padding: "16px 18px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Sparkles size={15} className="text-secondary" />
                <h4 style={{ margin: 0, fontSize: 14 }}>Brand Voice (AI Context)</h4>
              </div>
              {profile?.brand_voice ? (
                <p className="prose" style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                  {profile.brand_voice}
                </p>
              ) : (
                <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  Not populated yet. When added, AI agents will use these voice guidelines to draft proposals and public content.
                </p>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 3. Growth Eras Roadmap ─── */}
      <Section
        title="Agency Growth Eras"
        count={phases.length}
        action={
          <Link href="/solicate/phases" className="button ghost small">
            View All Eras
          </Link>
        }
      >
        <div className="list">
          {phases.map((p: any) => (
            <div className="row" key={p.id} style={{ alignItems: "center" }}>
              <div className="row-main">
                <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </div>
                <div className="row-meta" style={{ marginTop: 2 }}>
                  {p.started_on ? `Started ${new Date(p.started_on).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "Roadmap target"}
                  {p.description ? ` · ${p.description.slice(0, 100)}...` : ""}
                </div>
              </div>
              <div className="row-actions-always">
                <StatusPill value={p.status} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
