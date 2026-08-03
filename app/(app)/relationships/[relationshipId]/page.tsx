import Link from "next/link";
import { notFound } from "next/navigation";

import { getActiveClients, getPeople, getRelationshipDetail } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EditRelationshipButton } from "@/components/editing/edit-buttons";
import { Section } from "@/components/shared/section";
import { formatCurrency } from "@/lib/utils";

export default async function RelationshipDetailPage({
  params,
}: {
  params: Promise<{ relationshipId: string }>;
}) {
  const { relationshipId } = await params;
  const [data, clients, people] = await Promise.all([
    getRelationshipDetail(relationshipId),
    getActiveClients(),
    getPeople(),
  ]);
  if (!data.relationship) notFound();
  const relationship = data.relationship;

  const blocks = [
    { title: "Summary", body: relationship.summary, key: "summary" },
    {
      title: "Terms",
      body: relationship.terms_note,
      key: "terms",
    },
    {
      title: "Financial",
      body:
        relationship.financial_arrangement !== "none"
          ? [
              relationship.financial_arrangement.replaceAll("_", " "),
              relationship.referral_commission != null
                ? `${formatCurrency(relationship.referral_commission, relationship.commission_currency ?? "INR")}`
                : null,
              `Payment: ${relationship.payment_status.replaceAll("_", " ")}`,
            ]
              .filter(Boolean)
              .join(" · ")
          : "No financial arrangement attached.",
      key: "financial",
    },
  ];

  return (
    <>
      <PageHeader
        title={`${relationship.clients?.name ?? "Client"} relationship`}
        description={`${relationship.source.replaceAll("_", " ")} · ${relationship.people?.name ?? "No linked partner"} · ${relationship.clients?.summary || "No client summary."}`}
      >
        <StatusPill value={relationship.status} />
        <EditRelationshipButton relationship={relationship} clients={clients} people={people} />
      </PageHeader>

      <div className="stack">
        <div className="strategy-grid">
          {blocks.map((block) => (
            <div className="strategy-block" key={block.key}>
              <h4>{block.title}</h4>
              {block.body ? <div className="prose">{block.body}</div> : <p className="muted">Not set yet.</p>}
            </div>
          ))}
        </div>

        <Section
          title="Projects for this client"
          count={data.projects.length}
          action={
            <Link className="button ghost small" href={`/clients/${relationship.client_id}`}>
              Open client
            </Link>
          }
        >
          {data.projects.length ? (
            <div className="list">
              {data.projects.map((p: any) => (
                <div className="row" key={p.id}>
                  <StatusPill value={p.status} />
                  <div className="row-main">
                    <div className="row-title">
                      <Link href={`/projects/${p.id}`}>
                        {p.name}
                        {p.code ? ` · ${p.code}` : ""}
                      </Link>
                    </div>
                    <div className="row-meta">{p.summary || "No summary yet."}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No projects yet for this client.</div>
          )}
        </Section>
      </div>
    </>
  );
}
