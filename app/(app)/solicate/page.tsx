import { getSolicateProfile } from "@/features/solicate";
import { SolicateProfileForm } from "@/components/solicate-profile-form";

export const metadata = {
  title: "Agency Overview | Solicate OS",
};

export default async function SolicateOverviewPage() {
  const profile = await getSolicateProfile();

  return (
    <div className="tab-content fade-in">
      <SolicateProfileForm profile={profile} />
    </div>
  );
}
