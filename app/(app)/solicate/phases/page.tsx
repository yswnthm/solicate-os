import { getSolicatePhases } from "@/features/solicate";
import { SolicatePhaseCard } from "@/components/solicate-phase-card";

export const metadata = {
  title: "Agency Growth Phases | Solicate OS",
};

export default async function SolicatePhasesPage() {
  const phases = await getSolicatePhases();

  return (
    <div className="tab-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Growth Eras</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
        {phases.map((phase: any) => (
          <SolicatePhaseCard key={phase.id} phase={phase} />
        ))}
      </div>
    </div>
  );
}
