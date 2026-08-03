import { getPhaseWorkspace } from "@/features/queries";
import { EntriesSection } from "@/components/entries/entries-section";

export default async function PhaseNotesPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { entries, phases, project } = await getPhaseWorkspace(phaseId);
  const edit = { projects: [{ id: projectId, name: project?.name ?? "" }], phases };

  return (
    <EntriesSection
      title="Notes"
      entries={entries}
      edit={edit}
      types={["note", "meeting", "update", "capture"]}
      empty="No notes or meeting records in this phase."
    />
  );
}
