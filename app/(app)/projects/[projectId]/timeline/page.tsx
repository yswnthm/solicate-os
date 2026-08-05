import { getProjectWorkspace } from "@/features/queries";
import { EntriesSection } from "@/components/entries/entries-section";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";

export default async function ProjectTimelinePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  const edit = { projects: [{ id: projectId, name: data.project?.name ?? "" }], phases: data.phases };

  return (
    <div className="stack">
      <EntriesSection
        title="Timeline"
        entries={data.entries}
        edit={edit}
        timeline
        empty="Nothing recorded yet — notes, meetings, decisions, and milestones land here in order."
      />

      <Section title="Activity" count={data.activity.length}>
        {data.activity.length ? (
          <div className="list">
            {data.activity.map((event: any) => (
              <div className="row" key={event.id}>
                <StatusPill value={event.event_type} />
                <div className="row-main">
                  <div className="row-title">{event.summary}</div>
                  <div className="row-meta">{formatDateTime(event.occurred_at)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Meaningful work changes will appear here as you operate the project.</div>
        )}
      </Section>
    </div>
  );
}
