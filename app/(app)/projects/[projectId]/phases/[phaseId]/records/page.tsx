import { getPhaseWorkspace } from "@/features/queries";
import { createEntry } from "@/features/actions";
import { ModalTrigger } from "@/components/modal-trigger";
import { Section } from "@/components/shared/section";
import { EntryList } from "@/components/entries/entry-list";

export default async function PhaseRecordsPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { phase, entries, phases, project } = await getPhaseWorkspace(phaseId);
  const edit = { projects: [{ id: projectId, name: project?.name ?? "" }], phases };

  return (
    <Section
      title="Records"
      count={entries.length}
      action={
        <ModalTrigger buttonLabel="+ Add record" title="Add phase record" buttonClass="button ghost small">
          <form className="form" action={createEntry}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="phase_id" value={phaseId} />
            <p className="muted" style={{ margin: 0 }}>
              Record will be scoped to {phase.position}. {phase.name}.
            </p>
            <div className="field">
              <label>Type</label>
              <select name="type">
                <option value="note">Note</option>
                <option value="meeting">Meeting</option>
                <option value="decision">Decision</option>
                <option value="document">Document</option>
                <option value="update">Update</option>
                <option value="milestone">Milestone</option>
                <option value="capture">Quick capture</option>
              </select>
            </div>
            <div className="field">
              <label>Title</label>
              <input name="title" placeholder="Subject of this record" required />
            </div>
            <div className="field">
              <label>Body</label>
              <textarea name="body_md" placeholder="Content, summary, or detail…" />
            </div>
            <div className="field">
              <label>Decision outcome (decisions only)</label>
              <input name="decision_outcome" placeholder="What was decided" />
            </div>
            <input type="hidden" name="occurred_at" value="" />
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Add record
            </button>
          </form>
        </ModalTrigger>
      }
    >
      {entries.length ? (
        <EntryList entries={entries} edit={edit} />
      ) : (
        <div className="empty">No records yet — capture notes, decisions, documents, and milestones here.</div>
      )}
    </Section>
  );
}
