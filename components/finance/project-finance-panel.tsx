"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { AllocationForm } from "@/components/finance/allocation-form";
import { TransactionForm } from "@/components/finance/transaction-form";

export function ProjectFinancePanel({
  allocations,
  projectId,
  phases,
  people,
  categories,
  paymentMethods,
}: {
  allocations: any[];
  projectId: string;
  phases: any[];
  people: any[];
  categories: any[];
  paymentMethods: any[];
}) {
  const [filterPhase, setFilterPhase] = useState<string>("all");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const filtered = allocations.filter((a) => {
    if (filterPhase !== "all" && a.phase_id !== filterPhase) return false;
    return true;
  });

  const incomeAllocations = filtered.filter((a) => a.transactions?.type === "income");
  const expenseAllocations = filtered.filter((a) => a.transactions?.type === "expense");

  const totalIncome = incomeAllocations.reduce((sum, a) => sum + Number(a.amount), 0);
  const totalExpense = expenseAllocations.reduce((sum, a) => sum + Number(a.amount), 0);
  const margin = totalIncome - totalExpense;

  return (
    <div className="project-finance-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div className="stats-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <div className="stat-card">
            <div className="stat-label">Allocated Income</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{formatCurrency(totalIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Allocated Expense</div>
            <div className="stat-value" style={{ color: "var(--danger)" }}>{formatCurrency(totalExpense)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Margin</div>
            <div className="stat-value">{formatCurrency(margin)}</div>
          </div>
        </div>
        
        <div style={{ marginLeft: "2rem", display: "flex", gap: "0.5rem" }}>
          <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)} className="input" style={{ width: "auto" }}>
            <option value="all">All Phases</option>
            {phases.map(ph => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
          </select>
          
          <Modal trigger={<button className="button primary">Log Transaction</button>}>
            {/* The user can log a transaction globally, but maybe they want to allocate to this project immediately?
                We'll just show the generic transaction form, and they can allocate it later or in a split view. 
                For now, generic form is fine. */}
            <TransactionForm
              people={people}
              categories={categories}
              paymentMethods={paymentMethods}
              onClose={() => {}}
            />
          </Modal>
        </div>
      </div>

      <div className="list">
        {filtered.length === 0 ? (
          <div className="empty">No funds allocated to this project yet.</div>
        ) : (
          filtered.map((alloc) => {
            const tx = alloc.transactions;
            return (
              <div key={alloc.id} className="row" style={{ alignItems: "center" }}>
                <div className="row-main">
                  <Link href={`/finance/transactions/${tx.id}`} className="row-title hover-underline" style={{ textTransform: "capitalize" }}>
                    {tx.type} {tx.invoice_number ? `(${tx.invoice_number})` : ""}
                  </Link>
                  <div className="row-meta">
                    {tx?.transaction_date || "—"} • {alloc.phases ? alloc.phases.name : "Project-level"}
                    {alloc.notes && ` • ${alloc.notes}`}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontWeight: 500, color: tx.type === "income" ? "var(--success)" : tx.type === "expense" ? "var(--danger)" : "inherit" }}>
                  {tx.type === "expense" ? "-" : "+"}{formatCurrency(alloc.amount)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
