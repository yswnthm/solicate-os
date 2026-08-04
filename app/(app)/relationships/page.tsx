import Link from "next/link";

import { createRelationship } from "@/features/actions";
import { getActiveClients, getPeople, getRelationships } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditRelationshipButton } from "@/components/editing/edit-buttons";
import { Section } from "@/components/shared/section";
import { formatCurrency } from "@/lib/utils";

export default async function RelationshipsPage() {
  const [relationships, clients, people] = await Promise.all([
    getRelationships(),
    getActiveClients(),
    getPeople(),
  ]);

  return (
    <>
      <PageHeader
        title="Relationships"
        description="How clients entered Solicate and the terms attached to the relationship."
      />

      <Section
        title="All relationships"
        count={relationships.length}
        action={
          <ModalTrigger buttonLabel="+ New relationship" title="New relationship" buttonClass="button ghost small">
            <form className="form" action={createRelationship}>
              <div className="field">
                <label>Client</label>
                <select name="client_id" required>
                  <option value="">Choose client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Referral partner (optional)</label>
                <select name="person_id">
                  <option value="">No linked person</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.is_partner ? " (partner)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Source</label>
                  <select name="source">
                    <option value="direct_outreach">Direct outreach</option>
                    <option value="referral_partner">Referral partner</option>
                    <option value="existing_client">Existing client</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select name="status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Financial arrangement</label>
                  <select name="financial_arrangement">
                    <option value="none">None</option>
                    <option value="referral_commission">Referral commission</option>
                    <option value="revenue_share">Revenue share</option>
                    <option value="delivery_split">Delivery split</option>
                    <option value="fixed_fee">Fixed fee</option>
                  </select>
                </div>
                <div className="field">
                  <label>Commission</label>
                  <input name="referral_commission" type="number" min="0" step="0.01" />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Commission currency</label>
                  <input name="commission_currency" placeholder="INR" />
                </div>
                <div className="field">
                  <label>Payment status</label>
                  <select name="payment_status">
                    <option value="not_applicable">Not applicable</option>
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially paid</option>
                    <option value="paid">Paid</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Summary</label>
                <textarea name="summary" placeholder="How did this relationship start?" />
              </div>
              <div className="field">
                <label>Terms note</label>
                <textarea name="terms_note" placeholder="Plain-language agreement context" />
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Create relationship
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {relationships.length ? (
          <div className="list">
            {relationships.map((r: any) => (
              <div className="row" key={r.id}>
                <StatusPill value={r.source} />
                <div className="row-main">
                  <div className="row-title">
                    <Link href={`/relationships/${r.id}`}>{r.client?.name ?? "Client"}</Link>
                  </div>
                  <div className="row-meta">
                    {r.contact?.name
                      ? `${r.contact.name}${r.contact.is_partner ? " (partner)" : ""} · `
                      : ""}
                    {r.status.replaceAll("_", " ")}
                    {r.financial_arrangement !== "none"
                      ? ` · ${r.financial_arrangement.replaceAll("_", " ")}${r.referral_commission != null ? ` · ${formatCurrency(r.referral_commission, r.commission_currency ?? "INR")}` : ""}`
                      : ""}
                    {r.summary ? ` · ${r.summary.slice(0, 90)}` : ""}
                  </div>
                </div>
                <div className="row-actions-always">
                  <StatusPill value={r.status} />
                  <EditRelationshipButton relationship={r} clients={clients} people={people} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            No relationships yet — record how each client came in and the terms attached.
          </div>
        )}
      </Section>
    </>
  );
}
