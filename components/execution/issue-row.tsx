import { StatusPill } from "@/components/status-pill";
import { EditIssueButton } from "@/components/editing/edit-buttons";
import { ModalTrigger } from "@/components/modal-trigger";
import { resolveIssue } from "@/features/actions";

type Phase = { id: string; position: number; name: string };
type User = { id: string; display_name: string };

export function IssueRow({
  issue,
  projectId,
  users,
  phases,
}: {
  issue: any;
  projectId: string;
  users: User[];
  phases?: Phase[];
}) {
  const open = !["resolved", "accepted", "closed"].includes(issue.status);
  return (
    <div className="row">
      <StatusPill value={issue.severity} />
      <div className="row-main">
        <div className="row-title">{issue.title}</div>
        <div className="row-meta">
          {issue.resolution_summary || issue.description_md || "No detail"}
        </div>
      </div>
      <div className="row-actions-always">
        <StatusPill value={issue.status} />
        <EditIssueButton issue={issue} projectId={projectId} users={users} phases={phases} />
        {open && (
          <ModalTrigger buttonLabel="Resolve" title="Resolve issue" buttonClass="button small secondary">
            <form className="form" action={resolveIssue}>
              <input type="hidden" name="issue_id" value={issue.id} />
              <input type="hidden" name="project_id" value={projectId} />
              <div className="field">
                <label>Resolution outcome</label>
                <input name="resolution_summary" placeholder="What was done or decided" required />
              </div>
              <div className="field">
                <label>Close as</label>
                <select name="status">
                  <option value="resolved">Resolved</option>
                  <option value="accepted">Accepted (risk accepted)</option>
                  <option value="closed">Closed (won&apos;t fix)</option>
                </select>
              </div>
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Confirm
              </button>
            </form>
          </ModalTrigger>
        )}
      </div>
    </div>
  );
}
