import { getSolicateTeam } from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { EditSolicateTeamButton } from "@/components/editing/solicate-edit-modals";
import Link from "next/link";

export const metadata = {
  title: "Agency Team & Partners | Solicate OS",
};

export default async function SolicateTeamPage() {
  const team = await getSolicateTeam();

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Section
        title="Team & Partner Network"
        count={team.length}
      >
        {team.length ? (
          <div className="list">
            {team.map((m: any) => {
              const linkedPersonName = m.public_people?.name;
              const linkedUserName = m.public_app_users?.display_name;
              return (
                <div className="row" key={m.id} style={{ alignItems: "flex-start" }}>
                  <div className="row-main">
                    <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      <span>{m.name}</span>
                      <span className="pill" style={{ fontSize: 11, background: "var(--surface-3)", color: "var(--muted)" }}>
                        {m.role_type}
                      </span>
                    </div>
                    <div className="row-meta" style={{ marginTop: 2 }}>
                      <span style={{ fontWeight: 500, color: "var(--ink)" }}>{m.role}</span>
                      {m.joined_on ? ` · Joined ${new Date(m.joined_on).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}
                      {linkedPersonName && m.person_id && (
                        <>
                          {" · Linked Person: "}
                          <Link href={`/people/${m.person_id}`} style={{ color: "var(--ink)", textDecoration: "underline" }}>
                            {linkedPersonName}
                          </Link>
                        </>
                      )}
                      {linkedUserName && ` · App User: ${linkedUserName}`}
                    </div>
                    {m.skills && (
                      <div style={{ fontSize: 13, marginTop: 6, color: "var(--muted)" }}>
                        <strong style={{ color: "var(--ink)" }}>Skills:</strong> {m.skills}
                      </div>
                    )}
                    {m.notes && (
                      <div className="prose" style={{ fontSize: 13, marginTop: 6 }}>
                        {m.notes}
                      </div>
                    )}
                  </div>
                  <div className="row-actions-always" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusPill value={m.status} />
                    <EditSolicateTeamButton member={m} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">No team members or partners registered.</div>
        )}
      </Section>
    </div>
  );
}
