export const dynamic = "force-dynamic";

import { getTodayData } from "@/features/queries";
import { requireActiveUser } from "@/lib/auth";
import { TodayDashboard } from "@/components/today-dashboard";

export default async function TodayPage() {
  const { user, profile } = await requireActiveUser();
  const data = await getTodayData(user.id);

  return <TodayDashboard data={data} displayName={profile.display_name} />;
}
