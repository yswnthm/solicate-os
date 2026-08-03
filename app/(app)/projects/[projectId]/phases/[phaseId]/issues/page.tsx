import { getPhaseWorkspace } from "@/features/queries";
import { createIssue } from "@/features/actions";
import { ModalTrigger } from "@/components/modal-trigger";
import { Section } from "@/components/shared/section";
import { IssueRow } from "@/components/execution/issue-row";

export default async function PhaseIssuesPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { phase, issues, phases, users } = await getPhaseWorkspace(phaseId);

  return (
    <Section
      title="Issues"
      count={issues.length}
      action={
        <ModalTrigger buttonLabel="+ New issue" title="New phase issue" buttonClass="button ghost small">
          <form className="form" action={createIssue}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="phase_id" value={phaseId} />
            <p className="muted" style={{ margin: 0 }}>
              Issue will be scoped to {phase.position}. {phase.name}.
            </p>
            <div className="field">
              <label>Issue</label>
              <input name="title" placeholder="What is the problem or risk" required />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Severity</label>
                <select name="severity">
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="field">
                <label>Assignee</label>
                <select name="assignee_id">
                  <option value="">Unassigned</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea name="description_md" placeholder="Evidence, risk context, or current state" />
            </div>
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Open issue
            </button>
          </form>
        </ModalTrigger>
      }
    >
      {issues.length ? (
        <div className="list">
          {issues.map((issue: any) => (
            <IssueRow key={issue.id} issue={issue} projectId={projectId} users={users} phases={phases} />
          ))}
        </div>
      ) : (
        <div className="empty">No issues in this phase. Good to proceed.</div>
      )}
    </Section>
  );
}
