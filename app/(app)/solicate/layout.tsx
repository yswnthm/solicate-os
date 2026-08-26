export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/page-header";
import { SolicateNav } from "@/components/solicate-nav";
import { getSolicateProfile } from "@/features/solicate";
import { EditSolicateProfileButton } from "@/components/editing/solicate-edit-modals";

export default async function SolicateLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSolicateProfile();

  return (
    <>
      <PageHeader
        title={profile?.name || "Solicate"}
        description={profile?.tagline || "Organic growth and digital presence for small businesses in Atlantic Canada and beyond"}
      >
        <EditSolicateProfileButton profile={profile} label="Edit Identity" />
      </PageHeader>

      <SolicateNav />
      {children}
    </>
  );
}
