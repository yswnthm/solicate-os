export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createRelationship, linkPersonToClient } from "@/features/actions";
import { getClientDetail } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditClientButton, EditRelationshipButton } from "@/components/editing/edit-buttons";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { client, contacts, projects, people, relationships } = await getClientDetail(clientId);
  if (!client) notFound();

  const activeProjects = projects.filter((p: any) => p.status === "active");
  const otherProjects = projects.filter((p: any) => p.status !== "active");

  return (
    <>
      <PageHeader
        title={(client as any).name}
        description={(client as any).summary || "Client relationship record."}
      >
        <StatusPill value={(client as any).kind} />
        {(client as any).website_url && (
          <a
            href={(client as any).website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="button secondary small"
          >
            Website ↗
          </a>
        )}
        <EditClientButton client={client} />
      </PageHeader>

      <div className="stack">
        {/* Active projects */}
        <section className="section">
          <div className="section-title">
            <h2>Active projects</h2>
            <Link href="/projects" style={{ fontSize: 12, color: "var(--accent)" }}>
              All projects →
            </Link>
          </div>
          {activeProjects.length ? (
            <div className="list">
              {activeProjects.map((project: any) => (
                <Link
                  className="row"
                  href={`/projects/${project.id}`}
                  key={project.id}
                >
                  <div className="row-main">
                    <div className="row-title">{project.name}</div>
                    <div className="row-meta">
                      {project.code ?? "No code"}
                      {project.target_date ? ` · target ${formatDate(project.target_date)}` : ""}
                    </div>
                  </div>
                  <StatusPill value={project.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">No active projects for this client.</div>
          )}
        </section>

        {/* Other projects */}
        {otherProjects.length > 0 && (
          <section className="section">
            <div className="section-title">
              <h2>Past projects</h2>
              <span>{otherProjects.length}</span>
            </div>
            <div className="list">
              {otherProjects.map((project: any) => (
                <Link
                  className="row"
                  href={`/projects/${project.id}`}
                  key={project.id}
                >
                  <div className="row-main">
                    <div className="row-title">{project.name}</div>
                    <div className="row-meta">{project.code ?? ""}</div>
                  </div>
                  <StatusPill value={project.status} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Relationships */}
        <section className="section">
          <div className="section-title">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2>Relationships</h2>
              <span>{relationships.length}</span>
            </div>
            <ModalTrigger buttonLabel="+ New relationship" title="New relationship" buttonClass="button ghost small">
              <form className="form" action={createRelationship}>
                <input type="hidden" name="client_id" value={clientId} />
                <div className="field">
                  <label>Referral partner (optional)</label>
                  <select name="person_id">
                    <option value="">No linked person</option>
                    {people.map((person: any) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                        {person.is_partner ? " (partner)" : ""}
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
                    <label>Financial arrangement</label>
                    <select name="financial_arrangement">
                      <option value="none">None</option>
                      <option value="referral_commission">Referral commission</option>
                      <option value="revenue_share">Revenue share</option>
                      <option value="delivery_split">Delivery split</option>
                      <option value="fixed_fee">Fixed fee</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Summary</label>
                  <textarea name="summary" placeholder="How did this relationship start?" />
                </div>
                <button className="button" type="submit" style={{ marginTop: 8 }}>
                  Create relationship
                </button>
              </form>
            </ModalTrigger>
          </div>
          {relationships.length ? (
            <div className="list">
              {relationships.map((relationship: any) => (
                <div className="row" key={relationship.id}>
                  <StatusPill value={relationship.source} />
                  <div className="row-main">
                    <div className="row-title">
                      <Link href={`/relationships/${relationship.id}`}>
                        {relationship.contact?.name ?? "Relationship"} · {relationship.source.replaceAll("_", " ")}
                      </Link>
                    </div>
                    <div className="row-meta">
                      {relationship.financial_arrangement !== "none"
                        ? `${relationship.financial_arrangement.replaceAll("_", " ")}${relationship.referral_commission != null ? ` · ${formatCurrency(relationship.referral_commission, relationship.commission_currency ?? "INR")}` : ""}`
                        : ""}
                      {relationship.terms_note ? ` · ${relationship.terms_note.slice(0, 80)}` : ""}
                      {relationship.summary ? ` · ${relationship.summary.slice(0, 80)}` : ""}
                    </div>
                  </div>
                  <div className="row-actions-always">
                    <StatusPill value={relationship.status} />
                    <EditRelationshipButton
                      relationship={relationship}
                      clients={[{ id: clientId, name: (client as any).name }]}
                      people={people}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No relationship recorded — add how this client came in.</div>
          )}
        </section>

        {/* Client contacts */}
        <section className="section">
          <div className="section-title">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2>Client contacts</h2>
              <span>{contacts.length}</span>
            </div>
            <ModalTrigger buttonLabel="+ Link contact" title="Link contact" buttonClass="button ghost small">
              <form className="form" action={linkPersonToClient}>
                <input type="hidden" name="client_id" value={clientId} />
                <div className="field">
                  <label>Link existing person</label>
                  <select name="person_id" required>
                    <option value="">Choose person</option>
                    {people.map((person: any) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="button" type="submit" style={{ marginTop: 8 }}>
                  Link contact
                </button>
              </form>
            </ModalTrigger>
          </div>
          {contacts.length ? (
            <div className="list">
              {contacts.map((contact: any) => (
                <div className="row" key={contact.id}>
                  <div className="row-main">
                    <div className="row-title">{contact.name}</div>
                    <div className="row-meta">
                      {contact.kind === "business" ? "Business" : "Individual"}
                      {contact.email ? ` · ${contact.email}` : ""}
                      {contact.phone ? ` · ${contact.phone}` : ""}
                    </div>
                  </div>
                  {contact.is_partner ? (
                    <StatusPill value="partner" />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No contacts linked yet.</div>
          )}
        </section>
      </div>
    </>
  );
}
