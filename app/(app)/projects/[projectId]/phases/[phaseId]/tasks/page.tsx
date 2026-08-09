import { getPhaseWorkspace } from "@/features/queries";
import { createTask } from "@/features/actions";
import { Section } from "@/components/shared/section";
import { TaskRow } from "@/components/execution/task-row";

export default async function PhaseTasksPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { phase, tasks, phases, users } = await getPhaseWorkspace(phaseId);

  const openTasks = tasks.filter((t: any) => t.status !== "done" && t.status !== "cancelled");
  const closedTasks = tasks.filter((t: any) => t.status === "done" || t.status === "cancelled");

  return (
    <Section title="Tasks" count={openTasks.length}>
      <form className="todo-add" action={createTask}>
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="phase_id" value={phaseId} />
        <span className="todo-add-plus">＋</span>
        <input name="title" placeholder={`Add a task to ${phase.position}. ${phase.name}…`} required />
        <select name="priority" aria-label="Priority">
          <option value="normal">Priority</option>
          <option value="low">Low</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <input name="due_at" type="date" aria-label="Due date" />
        <button className="todo-add-submit" type="submit">
          Add
        </button>
      </form>

      {tasks.length ? (
        <div className="todo-list">
          {openTasks.map((task: any) => (
            <TaskRow key={task.id} task={task} projectId={projectId} phases={phases} users={users} />
          ))}
          {closedTasks.length > 0 && (
            <>
              <div className="todo-divider">
                Completed <span>{closedTasks.length}</span>
              </div>
              {closedTasks.map((task: any) => (
                <TaskRow key={task.id} task={task} projectId={projectId} phases={phases} users={users} />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="empty">No tasks in this phase yet.</div>
      )}
    </Section>
  );
}
