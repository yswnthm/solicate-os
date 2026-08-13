import { requireActiveUser } from "@/lib/auth";
import { getFinanceDashboard } from "@/features/queries";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";

export const metadata = {
  title: "Finance Dashboard — Solicate OS",
};

export default async function FinanceDashboardPage() {
  await requireActiveUser();
  const data = await getFinanceDashboard();

  return <FinanceDashboard data={data} />;
}
