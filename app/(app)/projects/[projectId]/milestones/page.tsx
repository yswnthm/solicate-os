import { getProjectWorkspace } from "@/features/queries";
import { EntriesSection } from "@/components/entries/entries-section";

export default async function ProjectMilestonesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  const edit = { projects: [{ id: projectId, name: data.project?.name ?? "" }], phases: data.phases };

  return (
    <EntriesSection
      title="Milestones"
      entries={data.entries}
      edit={edit}
      types={["milestone"]}
      empty="No milestones recorded yet."
    />
  );
}
