import { getPhaseWorkspace } from "@/features/queries";
import { createFinanceItem } from "@/features/actions";
import { ModalTrigger } from "@/components/modal-trigger";
import { Section } from "@/components/shared/section";
import { FinanceTable } from "@/components/finance/finance-table";

export default async function PhaseFinancePage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { phase, finance, phases } = await getPhaseWorkspace(phaseId);

  return (
    <Section
      title="Finance"
      count={finance.length}
      action={
        <ModalTrigger buttonLabel="+ Log item" title="Log phase finance item" buttonClass="button ghost small">
          <form className="form" action={createFinanceItem}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="phase_id" value={phaseId} />
            <p className="muted" style={{ margin: 0 }}>
              Item will be scoped to {phase.position}. {phase.name}.
            </p>
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
              <input name="title" placeholder="e.g. Phase invoice, tooling cost…" required />
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
            <div className="field">
              <label>Date</label>
              <input name="occurred_on" type="date" />
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
      <FinanceTable items={finance} projectId={projectId} phases={phases} />
    </Section>
  );
}
