import { PageHeader } from "@/components/page-header";
import { SolicateNav } from "@/components/solicate-nav";
import { getSolicateProfile } from "@/features/solicate";

export default async function SolicateLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSolicateProfile();

  return (
    <div className="project-layout fade-in">
      <PageHeader 
        title={profile?.name || "Solicate Agency"} 
        description={profile?.tagline || "Internal Operations & Strategy"} 
      />
      
      <div className="content-container">
        <SolicateNav />
        {children}
      </div>
    </div>
  );
}
