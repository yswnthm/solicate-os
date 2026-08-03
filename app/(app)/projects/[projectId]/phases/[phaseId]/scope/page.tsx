import { getPhaseWorkspace } from "@/features/queries";
import { Section } from "@/components/shared/section";
import { EditScopeButton } from "@/components/editing/edit-buttons";

export default async function PhaseScopePage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { phaseId } = await params;
  const { phase } = await getPhaseWorkspace(phaseId);

  const blocks = [
    { title: "Deliverables", body: phase.scope_deliverables, key: "deliverables" },
    { title: "Requirements", body: phase.scope_requirements, key: "requirements" },
    { title: "Acceptance criteria", body: phase.scope_acceptance, key: "acceptance" },
  ];

  return (
    <Section title="Scope" action={<EditScopeButton phase={phase} />}>
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
          Scope hasn&apos;t been defined for this phase — add deliverables, requirements, and acceptance criteria.
        </div>
      )}
    </Section>
  );
}
