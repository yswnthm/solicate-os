import { getProjectWorkspace } from "@/features/queries";
import { EntriesSection } from "@/components/entries/entries-section";

export default async function ProjectDocumentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  const edit = { projects: [{ id: projectId, name: data.project?.name ?? "" }], phases: data.phases };

  return (
    <EntriesSection
      title="Documents"
      entries={data.entries}
      edit={edit}
      types={["document"]}
      empty="No documents filed yet."
    />
  );
}
