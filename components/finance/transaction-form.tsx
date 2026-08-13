"use client";

import { useTransition } from "react";
import { createTransaction } from "@/features/actions";
import { updateTransaction } from "@/features/update-actions";

export function TransactionForm({
  transaction,
  people,
  categories,
  paymentMethods,
  onClose,
}: {
  transaction?: any;
  people: { id: string; name: string }[];
  categories: { id: string; name: string; transaction_type: string }[];
  paymentMethods: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const isEditing = !!transaction;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (isEditing) {
        await updateTransaction(transaction.id, formData);
      } else {
        await createTransaction(formData);
      }
      onClose();
    });
  };

  return (
    <form className="form finance-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="tx-type">Type</label>
          <select id="tx-type" name="type" defaultValue={transaction?.type || "income"} className="input">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
            <option value="refund">Refund</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="tx-amount">Amount (₹)</label>
          <input
            id="tx-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={transaction?.amount}
            className="input"
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="tx-date">Date</label>
          <input
            id="tx-date"
            name="transaction_date"
            type="date"
            defaultValue={transaction?.transaction_date || new Date().toISOString().slice(0, 10)}
            className="input"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tx-status">Status</label>
          <select id="tx-status" name="status" defaultValue={transaction?.status || "pending"} className="input">
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="tx-person">Counterparty</label>
        <select id="tx-person" name="from_person_id" defaultValue={transaction?.from_person?.id || transaction?.to_person?.id || ""} className="input">
          <option value="">None</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="muted capture-hint">For income, this is who paid you. For expense, who you paid.</div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="tx-cat">Category</label>
          <select id="tx-cat" name="category_id" defaultValue={transaction?.finance_categories?.id || ""} className="input">
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tx-pm">Payment Method</label>
          <select id="tx-pm" name="payment_method_id" defaultValue={transaction?.payment_methods?.id || ""} className="input">
            <option value="">None</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="card" style={{ padding: "1rem", marginTop: "1rem", border: "1px solid var(--border)" }}>
        <legend style={{ padding: "0 0.5rem", fontWeight: 500 }}>Invoice Details (Optional)</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="tx-inv-status">Invoice Status</label>
            <select id="tx-inv-status" name="invoice_status" defaultValue={transaction?.invoice_status || ""} className="input">
              <option value="">None</option>
              <option value="preparing">Preparing</option>
              <option value="sent">Sent</option>
              <option value="cleared">Cleared</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="tx-inv-num">Invoice Number</label>
            <input id="tx-inv-num" name="invoice_number" defaultValue={transaction?.invoice_number} className="input" placeholder="INV-..." />
          </div>
        </div>
      </fieldset>

      <div className="field" style={{ marginTop: "1rem" }}>
        <label htmlFor="tx-ref">Reference Number / UTR</label>
        <input id="tx-ref" name="reference_number" defaultValue={transaction?.reference_number} className="input" />
      </div>

      <div className="field">
        <label htmlFor="tx-notes">Notes</label>
        <textarea id="tx-notes" name="notes" defaultValue={transaction?.notes} className="input" rows={3} />
      </div>

      <div className="actions" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Transaction"}
        </button>
        <button type="button" className="button muted" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
      </div>
    </form>
  );
}
