import Link from "next/link";
import { notFound } from "next/navigation";

import { createConversation, linkPersonToClient } from "@/features/actions";
import { getClientDetail } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ModalTrigger } from "@/components/modal-trigger";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { client, contacts, projects, conversations, people } = await getClientDetail(clientId);
  if (!client) notFound();

  const activeProjects = projects.filter((p: any) => p.status === "active");
  const otherProjects = projects.filter((p: any) => p.status !== "active");

  return (
    <>
      <PageHeader
        title={(client as any).name}
        description={(client as any).summary || "Client relationship record."}
      >
        <StatusPill value={(client as any).status} />
        <span className="muted" style={{ fontSize: 12 }}>
          {(client as any).kind}
        </span>
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
                <div className="field">
                  <label>Role at this client</label>
                  <input name="role_label" placeholder="Owner, operations, finance…" />
                </div>
                <label className="checkbox">
                  <input type="checkbox" name="is_primary" />
                  Primary contact
                </label>
                <button className="button" type="submit" style={{ marginTop: 8 }}>
                  Link contact
                </button>
              </form>
            </ModalTrigger>
          </div>
          {contacts.length ? (
            <div className="list">
              {contacts.map((contact: any) => (
                <div className="row" key={contact.people?.id}>
                  <div className="row-main">
                    <div className="row-title">{contact.people?.name}</div>
                    <div className="row-meta">
                      {contact.role_label || "Contact"}
                      {contact.is_primary ? " · primary" : ""}
                      {contact.people?.email ? ` · ${contact.people.email}` : ""}
                    </div>
                  </div>
                  {contact.people?.is_partner ? (
                    <StatusPill value="partner" />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No contacts linked yet.</div>
          )}
        </section>

        {/* Conversations */}
        <section className="section">
          <div className="section-title">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2>Conversations</h2>
              <span>{conversations.length}</span>
            </div>
            <ModalTrigger buttonLabel="+ New conversation" title="New conversation" buttonClass="button ghost small">
              <form className="form" action={createConversation}>
                <input type="hidden" name="client_id" value={clientId} />
                <div className="field">
                  <label>New conversation</label>
                  <input
                    name="title"
                    placeholder="Komal + Sakshi WhatsApp"
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label>Type</label>
                    <select name="kind">
                      <option value="direct">Direct</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Channel</label>
                    <select name="channel">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                </div>
                <button className="button" type="submit" style={{ marginTop: 8 }}>
                  Create conversation
                </button>
              </form>
            </ModalTrigger>
          </div>
          {conversations.length ? (
            <div className="list">
              {conversations.map((conversation: any) => (
                <Link
                  className="row"
                  href={
                    conversation.project_id
                      ? `/projects/${conversation.project_id}`
                      : "/inbox"
                  }
                  key={conversation.id}
                >
                  <StatusPill value={conversation.kind} />
                  <div className="row-main">
                    <div className="row-title">{conversation.title}</div>
                    <div className="row-meta">
                      {conversation.channel} · {formatDateTime(conversation.last_message_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">No conversations recorded for this client.</div>
          )}
        </section>
      </div>
    </>
  );
}
