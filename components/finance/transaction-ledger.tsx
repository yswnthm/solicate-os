"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { TransactionPageQuery } from "@/features/finance-actions";
import type { TransactionPage } from "@/features/queries";

interface LedgerProps {
  initialRows: unknown[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  loadPage: (query: TransactionPageQuery) => Promise<TransactionPage>;
}

const FILTER_OPTIONS = {
  type: [
    { value: "", label: "All Types" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
    { value: "transfer", label: "Transfer" },
    { value: "refund", label: "Refund" },
    { value: "adjustment", label: "Adjustment" },
  ],
  status: [
    { value: "", label: "All Statuses" },
    { value: "planned", label: "Planned" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ],
};

export function TransactionLedger({ initialRows, initialNextCursor, initialHasMore, loadPage }: LedgerProps) {
  const [rows, setRows] = useState<unknown[]>(initialRows);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      setLoading(true);
      try {
        const page = await loadPage({ cursor, type: filterType, status: filterStatus });
        setRows(cursor ? (prev) => [...prev, ...page.rows] : page.rows);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } finally {
        setLoading(false);
      }
    },
    [loadPage, filterType, filterStatus],
  );

  const onFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    void fetchPage(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="transaction-ledger">
      <div className="filters" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <select
          value={filterType}
          onChange={(e) => onFilterChange(setFilterType)(e.target.value)}
          className="input"
          style={{ width: "auto" }}
          aria-label="Filter by type"
        >
          {FILTER_OPTIONS.type.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => onFilterChange(setFilterStatus)(e.target.value)}
          className="input"
          style={{ width: "auto" }}
          aria-label="Filter by status"
        >
          {FILTER_OPTIONS.status.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="list">
        {rows.length === 0 ? (
          <div className="empty">No transactions found.</div>
        ) : (
          rows.map((tx: any) => (
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

      {hasMore && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button className="button secondary" onClick={() => void fetchPage(nextCursor)} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
