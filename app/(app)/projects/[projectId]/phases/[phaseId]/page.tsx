import Link from "next/link";

import { getPhaseWorkspace } from "@/features/queries";
import { Section } from "@/components/shared/section";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PhaseHealthPill } from "@/components/shared/health-pill";
import { TimelineList } from "@/components/entries/entry-list";
import { formatCurrency } from "@/lib/utils";

export default async function PhaseDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const data = await getPhaseWorkspace(phaseId);

  const openTasks = data.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const openIssues = data.issues.filter((i) => !["resolved", "accepted", "closed"].includes(i.status));
  const done = data.tasks.filter((t) => t.status === "done" || t.status === "cancelled").length;
  const progress = data.tasks.length ? Math.round((done / data.tasks.length) * 100) : 0;

  const currency = data.finance.find((i) => i.currency_code)?.currency_code ?? "INR";
  const invoiceTotal = data.finance
    .filter((i) => i.kind === "invoice")
    .reduce((acc, i) => acc + i.amount, 0);
  const paid = data.finance
    .filter((i) => i.kind === "payment")
    .reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="stack">
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <PhaseHealthPill phase={data.phase} tasks={data.tasks} issues={data.issues} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <ProgressBar value={progress} />
          <div className="row-meta" style={{ marginTop: 6 }}>
            {done}/{data.tasks.length} tasks done
          </div>
        </div>
      </div>

      <div className="grid four" style={{ marginBottom: 8 }}>
        <div className="card">
          <p className="metric-label">Open tasks</p>
          <div className="metric">
            <Link href={`/projects/${projectId}/phases/${phaseId}/tasks`} style={{ color: "inherit" }}>
              {openTasks.length}
            </Link>
          </div>
        </div>
        <div className="card">
          <p className="metric-label">Open issues</p>
          <div
            className="metric"
            style={{ color: openIssues.length > 0 ? "var(--danger)" : undefined }}
          >
            {openIssues.length}
          </div>
        </div>
        <div className="card">
          <p className="metric-label">Invoiced</p>
          <div className="metric" style={{ fontSize: 19 }}>
            {formatCurrency(invoiceTotal, currency)}
          </div>
        </div>
        <div className="card">
          <p className="metric-label">Outstanding</p>
          <div className="metric" style={{ fontSize: 19, color: invoiceTotal - paid > 0 ? "var(--warning)" : undefined }}>
            {formatCurrency(Math.max(0, invoiceTotal - paid), currency)}
          </div>
        </div>
      </div>

      <Section title="Recent records" count={Math.min(data.entries.length, 5)}>
        {data.entries.length ? (
          <TimelineList entries={data.entries.slice(0, 5)} />
        ) : (
          <div className="empty">No records yet — notes, decisions, and milestones will appear here in order.</div>
        )}
      </Section>
    </div>
  );
}
