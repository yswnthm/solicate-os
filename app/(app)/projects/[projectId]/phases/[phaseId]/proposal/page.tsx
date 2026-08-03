import { getPhaseWorkspace } from "@/features/queries";
import { Section } from "@/components/shared/section";
import { EditProposalButton } from "@/components/editing/edit-buttons";

export default async function PhaseProposalPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { phaseId } = await params;
  const { phase } = await getPhaseWorkspace(phaseId);

  const blocks = [
    { title: "Quotation", body: phase.proposal_quotation, key: "quotation" },
    { title: "Pricing", body: phase.proposal_pricing, key: "pricing" },
    { title: "Revisions", body: phase.proposal_revisions, key: "revisions" },
  ];

  return (
    <Section title="Proposal" action={<EditProposalButton phase={phase} />}>
      {blocks.some((b) => b.body) ? (
        <div className="strategy-grid">
          {blocks.map((block) => (
            <div className="strategy-block" key={block.key}>
              <h4>{block.title}</h4>
              {block.body ? <div className="prose">{block.body}</div> : <p className="muted">Not set yet.</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          No proposal recorded for this phase — capture the quotation, pricing, and any revisions here.
        </div>
      )}
    </Section>
  );
}
