export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPersonDetail } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";
import { EditPersonButton } from "@/components/editing/edit-buttons";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const { person, participations, clientLinks, conversations } = await getPersonDetail(personId);
  if (!person) notFound();

  const contactMeta = [person.email, person.phone].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        title={person.name}
        description={
          contactMeta ||
          person.summary ||
          `${person.is_partner ? "Partner & referrer" : "Client contact"} record`
        }
      >
        <StatusPill value={person.is_partner ? "partner" : "person"} />
        <EditPersonButton person={person} />
      </PageHeader>

      <div className="stack">
        {person.summary && (
          <section className="section">
            <div className="section-title">
              <h2>Relationship context</h2>
            </div>
            <div className="prose">{person.summary}</div>
          </section>
        )}

        {clientLinks.length > 0 && (
          <section className="section">
            <div className="section-title">
              <h2>Clients</h2>
              <span>{clientLinks.length}</span>
            </div>
            <div className="list">
              {clientLinks.map((link: any) => (
                <Link className="row" href={`/clients/${link.clients?.id}`} key={link.clients?.id}>
                  <div className="row-main">
                    <div className="row-title">{link.clients?.name}</div>
                    <div className="row-meta">
                      {link.role_label || "Contact"}
                      {link.is_primary ? " · Primary" : ""}
                    </div>
                  </div>
                  <StatusPill value={link.clients?.status} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {participations.length > 0 && (
          <section className="section">
            <div className="section-title">
              <h2>Projects</h2>
              <span>{participations.length}</span>
            </div>
            <div className="list">
              {participations.map((p: any) => (
                <Link className="row" href={`/projects/${p.projects?.id}`} key={p.projects?.id}>
                  <StatusPill value={p.role} />
                  <div className="row-main">
                    <div className="row-title">{p.projects?.name}</div>
                    <div className="row-meta">
                      {p.role_label || p.role}
                      {p.projects?.clients?.name ? ` · ${p.projects.clients.name}` : ""}
                      {p.financial_arrangement !== "none"
                        ? ` · ${p.financial_arrangement.replace(/_/g, " ")}${p.financial_value ? ` ${p.financial_value} ${p.currency_code ?? ""}` : ""}`
                        : ""}
                    </div>
                  </div>
                  <StatusPill value={p.projects?.status} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {conversations.length > 0 && (
          <section className="section">
            <div className="section-title">
              <h2>Conversations</h2>
              <span>{conversations.length}</span>
            </div>
            <div className="list">
              {conversations.map((c: any) => (
                <Link
                  className="row"
                  href={
                    c.conversations?.project_id
                      ? `/projects/${c.conversations.project_id}`
                      : `/clients/${person.client_id ?? ""}`
                  }
                  key={c.conversations?.id}
                >
                  <StatusPill value={c.conversations?.channel ?? "other"} />
                  <div className="row-main">
                    <div className="row-title">{c.conversations?.title ?? "Conversation"}</div>
                    <div className="row-meta">
                      {c.conversations?.last_message_at
                        ? `Last activity ${formatDateTime(c.conversations.last_message_at)}`
                        : "No messages yet"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {participations.length === 0 && clientLinks.length === 0 && conversations.length === 0 && (
          <div className="empty">
            No linked projects, clients, or conversations yet.
          </div>
        )}
      </div>
    </>
  );
}
