import { getProjectWorkspace } from "@/features/queries";
import { EntriesSection } from "@/components/entries/entries-section";

export default async function ProjectTimelinePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  const edit = { projects: [{ id: projectId, name: data.project?.name ?? "" }], phases: data.phases };

  return (
    <EntriesSection
      title="Timeline"
      entries={data.entries}
      edit={edit}
      timeline
      empty="Nothing recorded yet — notes, meetings, decisions, and milestones land here in order."
    />
  );
}
