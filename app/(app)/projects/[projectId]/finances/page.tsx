import { getProjectWorkspace } from "@/features/queries";
import { createFinanceItem } from "@/features/actions";
import { ModalTrigger } from "@/components/modal-trigger";
import { Section } from "@/components/shared/section";
import { FinanceTable } from "@/components/finance/finance-table";

export default async function ProjectFinancesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);

  return (
    <Section
      title="Finances"
      count={data.finance.length}
      action={
        <ModalTrigger buttonLabel="+ Log item" title="Log finance item" buttonClass="button ghost small">
          <form className="form" action={createFinanceItem}>
            <input type="hidden" name="project_id" value={projectId} />
            <div className="field">
              <label>Type</label>
              <select name="kind">
                <option value="invoice">Invoice</option>
                <option value="payment">Payment</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="field">
              <label>Title</label>
              <input name="title" placeholder="e.g. Phase 1 invoice, hosting expense…" required />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Amount</label>
                <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" required />
              </div>
              <div className="field">
                <label>Currency</label>
                <input name="currency_code" placeholder="INR" defaultValue="INR" />
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Date</label>
                <input name="occurred_on" type="date" />
              </div>
              <div className="field">
                <label>Phase</label>
                <select name="phase_id">
                  <option value="">Project-level</option>
                  {data.phases.map((phase: any) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.position}. {phase.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea name="notes" placeholder="Optional context" />
            </div>
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Log item
            </button>
          </form>
        </ModalTrigger>
      }
    >
      <FinanceTable items={data.finance} projectId={projectId} phases={data.phases} />
    </Section>
  );
}
