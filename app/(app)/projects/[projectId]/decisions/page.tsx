import { getProjectWorkspace } from "@/features/queries";
import { EntriesSection } from "@/components/entries/entries-section";

export default async function ProjectDecisionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  const edit = { projects: [{ id: projectId, name: data.project?.name ?? "" }], phases: data.phases };

  return (
    <EntriesSection
      title="Decisions"
      entries={data.entries}
      edit={edit}
      types={["decision"]}
      empty="No decisions recorded yet — log decisions as records so outcomes stay findable."
    />
  );
}
