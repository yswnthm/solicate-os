import { requireActiveUser } from "@/lib/auth";
import { getFinanceDashboard, getFinanceCaptureOptions } from "@/features/queries";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { FinanceCaptureFlow } from "@/components/capture/finance-capture-flow";

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
      <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Finance Capture</h2>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>Log transactions, allocate funds, or update invoices in plain English.</p>
        <FinanceCaptureFlow options={options} />
      </div>
      <FinanceDashboard data={data} />
    </>
  );
}
