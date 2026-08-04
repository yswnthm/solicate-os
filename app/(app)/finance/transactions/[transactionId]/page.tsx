import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getTransactionDetail, getFinanceSettings } from "@/features/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TransactionEditButton } from "@/components/finance/transaction-edit-button";
import { AllocationAddButton, AllocationEditButton } from "@/components/finance/allocation-buttons";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default async function TransactionDetailPage({ params }: { params: Promise<{ transactionId: string }> }) {
  await requireActiveUser();
  const { transactionId } = await params;
  const rawTx = await getTransactionDetail(transactionId);
  if (!rawTx) notFound();
  const tx = rawTx as any;

  const supabase = await createSupabaseServerClient();
  const [peopleRes, projectsRes, phasesRes, settings] = await Promise.all([
    supabase.from("people").select("id, name").order("name"),
    supabase.from("projects").select("id, name").neq("status", "archived").order("name"),
    supabase.from("phases").select("id, name, project_id").neq("status", "cancelled").order("position"),
    getFinanceSettings(),
  ]);

  const people = peopleRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const phases = phasesRes.data ?? [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const totalAllocated = (tx.transaction_allocations || []).reduce((sum: number, a: any) => sum + Number(a.amount), 0);
  const unallocated = Number(tx.amount) - totalAllocated;

  return (
    <div className="layout-content">
      <PageHeader
        title={`${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} • ${formatCurrency(tx.amount)}`}
        description={`Transaction ${tx.id.slice(0, 8)}`}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <TransactionEditButton
            transaction={tx}
            people={people}
            categories={settings.categories}
            paymentMethods={settings.paymentMethods}
          />
        </div>
      </PageHeader>

      <main className="page-main">
        <div className="two-col-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <section className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem", fontSize: "0.95rem" }}>
              <div className="muted">Status</div>
              <div style={{ textTransform: "capitalize" }}>{tx.status}</div>
              
              <div className="muted">Date</div>
              <div>{tx.transaction_date}</div>

              <div className="muted">Counterparty</div>
              <div>{tx.type === "income" ? (tx.from_person?.name || tx.from_person?.[0]?.name || "—") : (tx.to_person?.name || tx.to_person?.[0]?.name || "—")}</div>

              <div className="muted">Category</div>
              <div>{tx.finance_categories?.name || tx.finance_categories?.[0]?.name || "—"}</div>

              <div className="muted">Method</div>
              <div>{tx.payment_methods?.name || tx.payment_methods?.[0]?.name || "—"}</div>
              
              <div className="muted">Notes</div>
              <div>{tx.notes || "—"}</div>
            </div>

            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", marginTop: "2rem" }}>Invoice Info</h2>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem", fontSize: "0.95rem" }}>
              <div className="muted">Inv. Status</div>
              <div style={{ textTransform: "capitalize" }}>{tx.invoice_status || "—"}</div>
              
              <div className="muted">Inv. Number</div>
              <div>{tx.invoice_number || "—"}</div>

              <div className="muted">Sent At</div>
              <div>{tx.invoice_sent_at ? new Date(tx.invoice_sent_at).toLocaleDateString() : "—"}</div>

              <div className="muted">Cleared At</div>
              <div>{tx.invoice_cleared_at ? new Date(tx.invoice_cleared_at).toLocaleDateString() : "—"}</div>

              <div className="muted">Ref / UTR</div>
              <div>{tx.reference_number || "—"}</div>
            </div>
          </section>

          <section className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Allocations</h2>
              {unallocated > 0 && (
                <AllocationAddButton
                  transactionId={tx.id}
                  projects={projects}
                  phases={phases}
                />
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.9rem" }}>
              <div>Allocated: <strong>{formatCurrency(totalAllocated)}</strong></div>
              <div>Unallocated: <strong style={{ color: unallocated > 0 ? "var(--warning)" : "var(--success)" }}>{formatCurrency(unallocated)}</strong></div>
            </div>

            {tx.transaction_allocations && tx.transaction_allocations.length > 0 ? (
              <div className="list-group">
                {tx.transaction_allocations.map((alloc: any) => (
                  <div key={alloc.id} className="list-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      {alloc.projects ? (
                        <>
                          <Link href={`/projects/${alloc.project_id}`} className="fw-500 hover-underline">
                            {alloc.projects.name}
                          </Link>
                          {alloc.phases && (
                            <div className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                              Phase: {alloc.phases.name}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="fw-500">Overhead (No Project)</div>
                      )}
                      {alloc.notes && <div className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{alloc.notes}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="fw-500">{formatCurrency(alloc.amount)}</div>
                      <AllocationEditButton
                        transactionId={tx.id}
                        allocation={alloc}
                        projects={projects}
                        phases={phases}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No allocations yet.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
