import { getSolicateTeam } from "@/features/solicate";
import { SolicateTeamCard } from "@/components/solicate-team-card";

export const metadata = {
  title: "Agency Team | Solicate OS",
};

export default async function SolicateTeamPage() {
  const team = await getSolicateTeam();

  return (
    <div className="tab-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Team & Partners</h2>
      </div>
      
      <div className="project-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
        {team.map((member: any) => (
          <SolicateTeamCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
