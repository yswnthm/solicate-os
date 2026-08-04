import { requireActiveUser } from "@/lib/auth";
import { getFinanceDashboard, getFinanceCaptureOptions } from "@/features/queries";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { CollapsibleFinanceCapture } from "@/components/capture/collapsible-finance-capture";

export const metadata = {
  title: "Finance Dashboard — Solicate OS",
};

export default async function FinanceDashboardPage() {
  await requireActiveUser();
  const [data, options] = await Promise.all([
    getFinanceDashboard(),
    getFinanceCaptureOptions()
  ]);

  return (
    <>
      <CollapsibleFinanceCapture options={options} />
      <FinanceDashboard data={data} />
    </>
  );
}
