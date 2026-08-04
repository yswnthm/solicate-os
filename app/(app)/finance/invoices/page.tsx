import { requireActiveUser } from "@/lib/auth";
import { getFinanceDashboard } from "@/features/queries";
import Link from "next/link";
import { advanceInvoiceStatus } from "@/features/actions";

export const metadata = {
  title: "Invoices — Solicate OS",
};

export default async function InvoicesPage() {
  await requireActiveUser();
  const data = await getFinanceDashboard(); // This gives us openInvoices
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="invoices-page">
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Open Invoices</h2>
        {data.openInvoices.length === 0 ? (
          <div className="empty">No open invoices.</div>
        ) : (
          <div className="list">
            {data.openInvoices.map((inv) => (
              <div key={inv.id} className="row" style={{ alignItems: "center" }}>
                <div className="row-main">
                  <Link href={`/finance/transactions/${inv.id}`} className="row-title hover-underline">
                    {inv.invoice_number || `Invoice (Transaction ${inv.id.slice(0, 8)})`}
                  </Link>
                  <div className="row-meta">
                    {(inv as any).from_person?.name || "Unknown client"} • {inv.transaction_date}
                  </div>
                </div>
                <div style={{ textAlign: "right", marginRight: "1rem" }}>
                  <div className="fw-500">{formatCurrency(inv.amount)}</div>
                  <span className={`badge ${inv.invoice_status === "sent" ? "warning" : "muted"}`} style={{ marginTop: "0.25rem", display: "inline-block" }}>
                    {inv.invoice_status}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  {inv.invoice_status === "preparing" && (
                    <form action={advanceInvoiceStatus} style={{ display: "inline-block" }}>
                      <input type="hidden" name="transaction_id" value={inv.id} />
                      <input type="hidden" name="invoice_status" value="sent" />
                      <button type="submit" className="button small ghost">Mark Sent</button>
                    </form>
                  )}
                  {inv.invoice_status === "sent" && (
                    <form action={advanceInvoiceStatus} style={{ display: "inline-block" }}>
                      <input type="hidden" name="transaction_id" value={inv.id} />
                      <input type="hidden" name="invoice_status" value="cleared" />
                      <button type="submit" className="button small primary">Mark Cleared</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
