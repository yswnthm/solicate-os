import { getPhaseWorkspace } from "@/features/queries";
import { createTask } from "@/features/actions";
import { ModalTrigger } from "@/components/modal-trigger";
import { Section } from "@/components/shared/section";
import { TaskRow } from "@/components/execution/task-row";

export default async function PhaseTasksPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { phase, tasks, phases, users } = await getPhaseWorkspace(phaseId);

  return (
    <Section
      title="Tasks"
      count={tasks.length}
      action={
        <ModalTrigger buttonLabel="+ New task" title="New phase task" buttonClass="button ghost small">
          <form className="form" action={createTask}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="phase_id" value={phaseId} />
            <p className="muted" style={{ margin: 0 }}>
              Task will be scoped to {phase.position}. {phase.name}.
            </p>
            <div className="field">
              <label>Task title</label>
              <input name="title" placeholder="What needs to happen" required />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Priority</label>
                <select name="priority">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="field">
                <label>Due date</label>
                <input name="due_at" type="date" />
              </div>
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
            <div className="field">
              <label>Description</label>
              <textarea name="description_md" placeholder="Optional context or links" />
            </div>
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Add task
            </button>
          </form>
        </ModalTrigger>
      }
    >
      {tasks.length ? (
        <div className="list">
          {tasks.map((task: any) => (
            <TaskRow key={task.id} task={task} projectId={projectId} phases={phases} users={users} />
          ))}
        </div>
      ) : (
        <div className="empty">No tasks in this phase yet.</div>
      )}
    </Section>
  );
}
