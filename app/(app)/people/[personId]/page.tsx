export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPersonDetail } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EditPersonButton } from "@/components/editing/edit-buttons";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const { person, participations, clientLinks, conversations, relationships } = await getPersonDetail(personId);
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
                <Link className="row" href={`/clients/${link.id}`} key={link.id}>
                  <div className="row-main">
                    <div className="row-title">{link.name}</div>
                    <div className="row-meta">
                      {link.kind === "business" ? "Business client" : "Individual client"}
                    </div>
                  </div>
                  <StatusPill value={link.kind} />
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
                      {p.projects?.people?.name ? ` · ${p.projects.people.name}` : ""}
                      {p.financial_arrangement !== "none"
                        ? ` · ${p.financial_arrangement.replace(/_/g, " ")}${p.financial_value ? ` ${formatCurrency(p.financial_value, p.currency_code ?? "INR")}` : ""}`
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
                      : `/clients/${person.organization_id ?? ""}`
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

        {relationships.length > 0 && (
          <section className="section">
            <div className="section-title">
              <h2>Relationships</h2>
              <span>{relationships.length}</span>
            </div>
            <div className="list">
              {relationships.map((r: any) => (
                <Link className="row" href={`/relationships/${r.id}`} key={r.id}>
                  <StatusPill value={r.source} />
                  <div className="row-main">
                    <div className="row-title">{r.client?.name}</div>
                    <div className="row-meta">
                      {r.summary || r.financial_arrangement.replaceAll("_", " ") || "Relationship record"}
                      {r.referral_commission != null
                        ? ` · ${formatCurrency(r.referral_commission, r.commission_currency ?? "INR")}`
                        : ""}
                    </div>
                  </div>
                  <StatusPill value={r.status} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {participations.length === 0 && clientLinks.length === 0 && conversations.length === 0 && relationships.length === 0 && (
          <div className="empty">
            No linked projects, clients, relationships, or conversations yet.
          </div>
        )}
      </div>
    </>
  );
}
