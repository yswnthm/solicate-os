import { getPhaseWorkspace } from "@/features/queries";
import { EntriesSection } from "@/components/entries/entries-section";

export default async function PhaseDecisionsPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { entries, phases, project } = await getPhaseWorkspace(phaseId);
  const edit = { projects: [{ id: projectId, name: project?.name ?? "" }], phases };

  return (
    <EntriesSection
      title="Decisions"
      entries={entries}
      edit={edit}
      types={["decision"]}
      empty="No decisions recorded in this phase."
    />
  );
}
