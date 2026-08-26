import { getSolicateProfile, getSolicatePhases, getSolicateServices, getSolicateTeam } from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { EditSolicateProfileButton } from "@/components/editing/solicate-edit-modals";
import Link from "next/link";

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

  const strategy = [
    {
      title: "North Star (10-Year Vision)",
      body: profile?.north_star,
      key: "north_star",
      hint: "The overarching long-term vision of Solicate",
    },
    {
      title: "Target Market",
      body: profile?.target_market,
      key: "target_market",
      hint: "Who Solicate serves and target client demographics",
    },
    {
      title: "Brand Voice (AI Context)",
      body: profile?.brand_voice,
      key: "brand_voice",
      hint: "Tone, voice, and guidelines used by AI agents to draft content and proposals",
    },
    {
      title: "Tagline & Positioning",
      body: profile?.tagline,
      key: "tagline",
      hint: "One-sentence market positioning",
    },
  ];

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── 1. Agency Vision & Strategy ─── */}
      <Section
        title="Agency Vision & Strategy"
        action={<EditSolicateProfileButton profile={profile} label="Edit strategy" />}
      >
        <div className="strategy-grid">
          {strategy.map((block) => (
            <div className="strategy-block" key={block.key}>
              <h4 style={{ margin: "0 0 6px" }}>{block.title}</h4>
              {block.body ? (
                <div className="prose">{block.body}</div>
              ) : (
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                  Not defined yet — {block.hint.toLowerCase()}.
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 2. Agency Vitals & Footprint ─── */}
      <Section title="Agency Vitals & Footprint">
        <div className="grid two" style={{ gap: 12 }}>
          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            <p className="metric-label" style={{ marginBottom: 4 }}>Website & Domain</p>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {profile?.website_url ? (
                <a href={profile.website_url} target="_blank" rel="noreferrer" style={{ color: "var(--ink)", textDecoration: "underline" }}>
                  {profile.website_url}
                </a>
              ) : (
                <span className="muted">https://solicate.in</span>
              )}
            </div>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            <p className="metric-label" style={{ marginBottom: 4 }}>Founded</p>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {profile?.founded_on ? new Date(profile.founded_on).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "January 2026"}
            </div>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            <p className="metric-label" style={{ marginBottom: 4 }}>Active Growth Era</p>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              <Link href="/solicate/phases" style={{ color: "var(--ink)", textDecoration: "underline" }}>
                {activePhase ? `${activePhase.name}` : "Phase 1 — Foundation"}
              </Link>
            </div>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            <p className="metric-label" style={{ marginBottom: 4 }}>Core Capabilities & Network</p>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              <Link href="/solicate/services" style={{ color: "var(--ink)", textDecoration: "underline" }}>
                {services.length} active services
              </Link>
              {" · "}
              <Link href="/solicate/team" style={{ color: "var(--ink)", textDecoration: "underline" }}>
                {team.length} team & partners
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
