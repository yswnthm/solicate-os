export const dynamic = "force-dynamic";
import Link from "next/link";

import { createClient } from "@/features/actions";
import { getActiveClients } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditClientButton } from "@/components/editing/edit-buttons";

export default async function ClientsPage() {
  const clients = await getActiveClients();
  const businesses = clients.filter((c: any) => c.kind === "business");
  const individuals = clients.filter((c: any) => c.kind === "person");

  return (
    <>
      <PageHeader
        title="Clients"
        description="Relationship context for the businesses and individuals Solicate serves. Not a sales pipeline."
      >
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
                <option value="person">Individual</option>
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
      </PageHeader>

      <div className="stack">
        <div className="grid two" style={{ marginBottom: 4 }}>
          <div className="card">
            <p className="metric-label">Businesses</p>
            <div className="metric">{businesses.length}</div>
          </div>
          <div className="card">
            <p className="metric-label">Individuals</p>
            <div className="metric">{individuals.length}</div>
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
                  <StatusPill value={client.status} />
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
      </div>
    </>
  );
}
