import { getSolicateServices } from "@/features/solicate";
import { SolicateServiceCard } from "@/components/solicate-service-card";

export const metadata = {
  title: "Agency Services | Solicate OS",
};

export default async function SolicateServicesPage() {
  const services = await getSolicateServices();

  return (
    <div className="tab-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Service Lines</h2>
        {/* We can add a "New Service" modal button here later */}
      </div>
      
      <div className="project-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
        {services.map((service: any) => (
          <SolicateServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
