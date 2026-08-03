import { StatusPill } from "@/components/status-pill";
import { EditFinanceItemButton } from "@/components/editing/edit-buttons";
import { formatCurrency, formatDate } from "@/lib/utils";

type FinanceItem = {
  id: string;
  kind: string;
  title: string;
  amount: number;
  currency_code: string;
  occurred_on: string | null;
  notes: string | null;
  phase_id: string | null;
  phases?: { id: string; name: string } | { id: string; name: string }[] | null;
};

const phaseName = (item: FinanceItem) =>
  Array.isArray(item.phases) ? item.phases[0]?.name : item.phases?.name;

export function FinanceTable({
  items,
  projectId,
  phases,
}: {
  items: FinanceItem[];
  projectId: string;
  phases?: { id: string; position: number; name: string }[];
}) {
  const currency = items.find((i) => i.currency_code)?.currency_code ?? "INR";
  const totals = items.reduce(
    (acc, item) => {
      const sign = item.kind === "expense" ? -1 : 1;
      acc[item.kind] = (acc[item.kind] ?? 0) + item.amount;
      acc.flow += item.amount * sign;
      return acc;
    },
    { invoice: 0, payment: 0, expense: 0, flow: 0 } as Record<string, number>,
  );
  const outstanding = Math.max(0, totals.invoice - totals.payment);

  return (
    <div className="stack">
      <div className="grid four">
        <div className="card">
          <p className="metric-label">Invoiced</p>
          <div className="metric">{formatCurrency(totals.invoice, currency)}</div>
        </div>
        <div className="card">
          <p className="metric-label">Collected</p>
          <div className="metric">{formatCurrency(totals.payment, currency)}</div>
        </div>
        <div className="card">
          <p className="metric-label">Expenses</p>
          <div className="metric">{formatCurrency(totals.expense, currency)}</div>
        </div>
        <div className="card">
          <p className="metric-label">Outstanding</p>
          <div className="metric" style={{ color: outstanding > 0 ? "var(--warning)" : undefined }}>
            {formatCurrency(outstanding, currency)}
          </div>
        </div>
      </div>

      {items.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                {phases && phases.length > 0 ? <th>Phase</th> : null}
                <th>Type</th>
                <th className="num">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.occurred_on)}</td>
                  <td>
                    {item.title}
                    {item.notes ? <div className="row-meta">{item.notes}</div> : null}
                  </td>
                  {phases && phases.length > 0 ? (
                    <td>{item.phase_id ? phaseName(item) ?? "—" : "Project"}</td>
                  ) : null}
                  <td>
                    <StatusPill value={item.kind} />
                  </td>
                  <td className="num">{formatCurrency(item.amount, item.currency_code)}</td>
                  <td>
                    <EditFinanceItemButton item={item} projectId={projectId} phases={phases} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">No finance items yet.</div>
      )}
    </div>
  );
}
