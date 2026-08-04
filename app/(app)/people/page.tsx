export const dynamic = "force-dynamic";
import Link from "next/link";

import { createClient, createPerson, createRelationship } from "@/features/actions";
import { getActiveClients, getPeople, getRelationships } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditClientButton, EditPersonButton, EditRelationshipButton } from "@/components/editing/edit-buttons";
import { Section } from "@/components/shared/section";
import { formatCurrency } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function PeoplePage({ searchParams }: Props) {
  const { tab = "clients" } = await searchParams;

  const [clients, relationships, people] = await Promise.all([
    getActiveClients(),
    getRelationships(),
    getPeople(),
  ]);

  const businesses = clients.filter((c: any) => c.kind === "business");
  const clientIndividuals = clients.filter((c: any) => c.kind === "individual");
  const partners = people.filter((p: any) => p.is_partner);
  const contacts = people.filter((p: any) => !p.is_partner);

  const clientStatus = (c: any) =>
    c.relationships?.some((r: any) => r.status === "active") ? "active" : "inactive";

  return (
    <>
      <PageHeader
        title="People & Relationships"
        description="Unified directory for clients, relationship contracts, referrers, contacts, and collaborators."
      >
        {tab === "clients" && (
          <ModalTrigger buttonLabel="+ New client" title="New client" buttonClass="button">
            <form className="form" action={createClient}>
              <div className="field">
                <label>Client name</label>
                <input name="name" placeholder="Stillness Collective" required />
              </div>
              <div className="field">
                <label>Type</label>
                <select name="kind">
                  <option value="business">Business</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
              <div className="field">
                <label>Website</label>
                <input name="website_url" type="url" placeholder="https://" />
              </div>
              <div className="field">
                <label>Relationship summary</label>
                <textarea
                  name="summary"
                  placeholder="Brief context — what they do, how you work together…"
                />
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Create client
              </button>
            </form>
          </ModalTrigger>
        )}

        {tab === "relationships" && (
          <ModalTrigger buttonLabel="+ New relationship" title="New relationship" buttonClass="button">
            <form className="form" action={createRelationship}>
              <div className="field">
                <label>Client</label>
                <select name="client_id" required>
                  <option value="">Choose client</option>
                  {clients.map((c: any) => (
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
                  {people.map((p: any) => (
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
        )}

        {(tab === "contacts" || tab === "all") && (
          <ModalTrigger buttonLabel="+ Add person" title="Add person" buttonClass="button">
            <p className="muted" style={{ marginBottom: 16 }}>
              Partners are external records. Checking the partner box does not create a login account.
            </p>
            <form className="form" action={createPerson}>
              <div className="field">
                <label>Full name</label>
                <input name="name" placeholder="Sakshi Mehta" required />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Email</label>
                  <input name="email" type="email" placeholder="optional" />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input name="phone" placeholder="optional" />
                </div>
              </div>
              <label className="checkbox">
                <input name="is_partner" type="checkbox" />
                This person is a partner or referrer
              </label>
              <div className="field">
                <label>Relationship context</label>
                <textarea
                  name="summary"
                  placeholder="How you know them, their specialisation, referral history…"
                />
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Add person
              </button>
            </form>
          </ModalTrigger>
        )}
      </PageHeader>

      <div className="tabs">
        <Link
          href="/people?tab=clients"
          className={`tab ${tab === "clients" ? "active" : ""}`}
        >
          Clients <span className="tab-count">{clients.length}</span>
        </Link>
        <Link
          href="/people?tab=relationships"
          className={`tab ${tab === "relationships" ? "active" : ""}`}
        >
          Relationships <span className="tab-count">{relationships.length}</span>
        </Link>
        <Link
          href="/people?tab=contacts"
          className={`tab ${tab === "contacts" ? "active" : ""}`}
        >
          Contacts & Referrers <span className="tab-count">{people.length}</span>
        </Link>
        <Link
          href="/people?tab=all"
          className={`tab ${tab === "all" ? "active" : ""}`}
        >
          All People <span className="tab-count">{people.length + clients.length}</span>
        </Link>
      </div>

      <div className="stack">
        {/* Tab 1: Clients */}
        {tab === "clients" && (
          <>
            <div className="grid two" style={{ marginBottom: 4 }}>
              <div className="card">
                <p className="metric-label">Businesses</p>
                <div className="metric">{businesses.length}</div>
              </div>
              <div className="card">
                <p className="metric-label">Individuals</p>
                <div className="metric">{clientIndividuals.length}</div>
              </div>
            </div>

            <section className="section">
              <div className="section-title">
                <h2>All clients</h2>
                <span>{clients.length} active</span>
              </div>
              {clients.length ? (
                <div className="list">
                  {clients.map((client: any) => (
                    <div className="row" key={client.id}>
                      <Link className="row-main" href={`/clients/${client.id}`}>
                        <div className="row-title">{client.name}</div>
                        <div className="row-meta">
                          {client.summary || client.kind}
                        </div>
                      </Link>
                      <StatusPill value={clientStatus(client)} />
                      <EditClientButton client={client} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  No client records yet. Create your first client to begin.
                </div>
              )}
            </section>
          </>
        )}

        {/* Tab 2: Relationships */}
        {tab === "relationships" && (
          <Section title="All relationships" count={relationships.length}>
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
        )}

        {/* Tab 3: Contacts & Referrers */}
        {tab === "contacts" && (
          <>
            {partners.length > 0 && (
              <section className="section">
                <div className="section-title">
                  <h2>Partners &amp; referrers</h2>
                  <span>{partners.length}</span>
                </div>
                <div className="list">
                  {partners.map((person: any) => (
                    <div className="row" key={person.id}>
                      <Link className="row-main" href={`/people/${person.id}`}>
                        <div className="row-title">{person.name}</div>
                        <div className="row-meta">
                          {[person.email, person.phone].filter(Boolean).join(" · ") ||
                            person.summary ||
                            "No contact details"}
                        </div>
                      </Link>
                      <StatusPill value="partner" />
                      <EditPersonButton person={person} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="section">
              <div className="section-title">
                <h2>Client contacts &amp; collaborators</h2>
                <span>{contacts.length} recorded</span>
              </div>
              {contacts.length ? (
                <div className="list">
                  {contacts.map((person: any) => (
                    <div className="row" key={person.id}>
                      <Link className="row-main" href={`/people/${person.id}`}>
                        <div className="row-title">{person.name}</div>
                        <div className="row-meta">
                          {[person.email, person.phone].filter(Boolean).join(" · ") ||
                            person.summary ||
                            "No contact details"}
                        </div>
                      </Link>
                      <EditPersonButton person={person} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  Add client contacts, referrers, and collaborators here.
                </div>
              )}
            </section>
          </>
        )}

        {/* Tab 4: All People */}
        {tab === "all" && (
          <section className="section">
            <div className="section-title">
              <h2>All people &amp; entities</h2>
              <span>{people.length + clients.length} total</span>
            </div>
            <div className="list">
              {clients.map((client: any) => (
                <div className="row" key={`client-${client.id}`}>
                  <Link className="row-main" href={`/clients/${client.id}`}>
                    <div className="row-title">{client.name}</div>
                    <div className="row-meta">Client ({client.kind}) {client.summary ? `· ${client.summary}` : ""}</div>
                  </Link>
                  <StatusPill value="client" />
                  <EditClientButton client={client} />
                </div>
              ))}
              {people.map((person: any) => (
                <div className="row" key={`person-${person.id}`}>
                  <Link className="row-main" href={`/people/${person.id}`}>
                    <div className="row-title">{person.name}</div>
                    <div className="row-meta">
                      {[person.email, person.phone].filter(Boolean).join(" · ") ||
                        person.summary ||
                        "No contact details"}
                    </div>
                  </Link>
                  {person.is_partner && <StatusPill value="partner" />}
                  <EditPersonButton person={person} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
