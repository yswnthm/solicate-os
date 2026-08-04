"use client";

import Link from "next/link";
import { useState } from "react";

export function TransactionLedger({ transactions }: { transactions: any[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const filtered = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="transaction-ledger">
      <div className="filters" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input" style={{ width: "auto" }}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input" style={{ width: "auto" }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="list">
        {filtered.length === 0 ? (
          <div className="empty">No transactions found.</div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="row" style={{ alignItems: "center" }}>
              <div className="row-main">
                <Link href={`/finance/transactions/${tx.id}`} className="row-title hover-underline" style={{ textTransform: "capitalize" }}>
                  {tx.type} {tx.invoice_number ? `(${tx.invoice_number})` : ""}
                </Link>
                <div className="row-meta">
                  {tx.transaction_date} • {tx.type === "income" ? tx.from_person?.name : tx.to_person?.name}
                </div>
              </div>
              <div style={{ textAlign: "right", marginRight: "1rem" }}>
                {tx.transaction_allocations?.length ? (
                  <span className="badge muted">{tx.transaction_allocations.length} alloc</span>
                ) : (
                  <span className="muted" style={{ fontSize: "0.85rem" }}>Unallocated</span>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="fw-500" style={{ color: tx.type === "income" ? "var(--success)" : tx.type === "expense" ? "var(--danger)" : "inherit" }}>
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
    </div>
  );
}
