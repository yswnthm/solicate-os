"use client";

import Link from "next/link";

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  preparingCount: number;
  preparingTotal: number;
  sentCount: number;
  sentTotal: number;
  openInvoices: any[];
  recentTransactions: any[];
  startOfYear?: string;
}

export function FinanceDashboard({ data }: { data: DashboardData }) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="finance-dashboard">
      <div className="bento-grid" style={{ marginBottom: "2rem" }}>
        {/* YTD Income (Purple) */}
        <div className="col-span-4 card hover-lift" style={{ padding: "1.5rem", backgroundColor: "var(--card-purple)", border: "none", boxShadow: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--surface)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>YTD Income</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <div suppressHydrationWarning style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)" }}>{formatCurrency(data.totalIncome)}</div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-2)" }}>+14% vs last year</div>
          </div>
        </div>

        {/* YTD Expense (Orange) */}
        <div className="col-span-4 card hover-lift" style={{ padding: "1.5rem", backgroundColor: "var(--card-orange)", border: "none", boxShadow: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--surface)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>YTD Expense</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <div suppressHydrationWarning style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)" }}>{formatCurrency(data.totalExpense)}</div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-2)" }}>-2% vs last year</div>
          </div>
        </div>

        {/* YTD Net Profit (Blue) */}
        <div className="col-span-4 card hover-lift" style={{ padding: "1.5rem", backgroundColor: "var(--card-blue)", border: "none", boxShadow: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--surface)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>Net Profit</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <div suppressHydrationWarning style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)" }}>{formatCurrency(data.netProfit)}</div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-2)" }}>+22% vs last year</div>
          </div>
        </div>
      </div>

      <div className="bento-grid" style={{ marginTop: "2rem" }}>
        
        {/* Invoice Pipeline */}
        <section className="dashboard-section col-span-6 card" style={{ margin: 0, padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Invoice Pipeline</h2>
          
          <div className="pipeline-stages" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <div className="pipeline-stage" style={{ flex: 1, padding: "1rem", background: "var(--bg-inset)", borderRadius: "8px" }}>
              <div className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>Preparing</div>
              <div suppressHydrationWarning style={{ fontSize: "1.5rem", fontWeight: "600", marginTop: "0.25rem" }}>
                {formatCurrency(data.preparingTotal)}
              </div>
              <div className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {data.preparingCount} invoice{data.preparingCount !== 1 ? "s" : ""}
              </div>
            </div>
            
            <div className="pipeline-stage" style={{ flex: 1, padding: "1rem", background: "var(--bg-inset)", borderRadius: "8px" }}>
              <div className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>Sent (Awaiting)</div>
              <div suppressHydrationWarning style={{ fontSize: "1.5rem", fontWeight: "600", marginTop: "0.25rem", color: "var(--warning)" }}>
                {formatCurrency(data.sentTotal)}
              </div>
              <div className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {data.sentCount} invoice{data.sentCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="list">
            {data.openInvoices.length === 0 ? (
              <div className="empty">No open invoices.</div>
            ) : (
              data.openInvoices.map((inv) => (
                <div key={inv.id} className="row" style={{ alignItems: "center" }}>
                  <div className="row-main">
                    <Link href={`/finance/transactions/${inv.id}`} className="row-title hover-underline">
                      {inv.invoice_number || `Invoice (Transaction ${inv.id.slice(0, 8)})`}
                    </Link>
                    <div className="row-meta">
                      {inv.from_person?.name || "Unknown client"} • {inv.transaction_date}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: "1rem" }}>
                    <div suppressHydrationWarning className="fw-500">{formatCurrency(inv.amount)}</div>
                    <span className={`badge ${inv.invoice_status === "sent" ? "warning" : "muted"}`} style={{ marginTop: "0.25rem", display: "inline-block" }}>
                      {inv.invoice_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="dashboard-section col-span-6 card" style={{ margin: 0, padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Recent Ledger Activity</h2>
            <Link href="/finance/transactions" className="muted hover-underline" style={{ fontSize: "0.85rem" }}>View all →</Link>
          </div>
          
          <div className="list">
            {data.recentTransactions.length === 0 ? (
              <div className="empty">No recent activity.</div>
            ) : (
              data.recentTransactions.map((tx) => (
                <div key={tx.id} className="row" style={{ alignItems: "center" }}>
                  <div className="row-main">
                    <Link href={`/finance/transactions/${tx.id}`} className="row-title hover-underline" style={{ textTransform: "capitalize" }}>
                      {tx.type} {tx.invoice_number ? `(${tx.invoice_number})` : ""}
                    </Link>
                    <div className="row-meta">
                      {tx.type === "income" ? tx.from_person?.name : tx.to_person?.name} • {tx.transaction_date}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div suppressHydrationWarning className="fw-500" style={{ color: tx.type === "income" ? "var(--success)" : tx.type === "expense" ? "var(--danger)" : "inherit" }}>
                      {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount)}
                    </div>
                    <span className={`badge ${tx.status === "completed" ? "success" : "muted"}`} style={{ marginTop: "0.25rem", display: "inline-block" }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        
      </div>
    </div>
  );
}
