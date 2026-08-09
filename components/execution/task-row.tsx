import { StatusPill } from "@/components/status-pill";
import { EditTaskButton } from "@/components/editing/edit-buttons";
import { SubtaskList } from "@/components/execution/subtask-list";
import { TaskCheck } from "@/components/execution/task-check";
import { formatDate } from "@/lib/utils";

type Phase = { id: string; position: number; name: string };
type User = { id: string; display_name: string };

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  low: "Low",
};

export function TaskRow({
  task,
  projectId,
  phases,
  users,
}: {
  task: any;
  projectId: string;
  phases: Phase[];
  users: User[];
}) {
  const isDone = task.status === "done";
  const isCancelled = task.status === "cancelled";
  const needsStatusPill = !["todo", "done", "cancelled"].includes(task.status);

  return (
    <div className="task-row">
      <div
        className={`todo-item${isDone ? " done" : ""}${isCancelled ? " cancelled" : ""} priority-${task.priority}`}
      >
        {isCancelled ? (
          <span className="todo-check cancelled" aria-hidden="true">
            ×
          </span>
        ) : (
          <TaskCheck taskId={task.id} projectId={projectId} done={isDone} />
        )}
        <div className="todo-body">
          <div className="todo-title">{task.title}</div>
          <div className="todo-meta">
            {task.priority !== "normal" && (
              <span className={`meta-priority ${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
            )}
            {task.due_at && <span>{formatDate(task.due_at)}</span>}
            {task.app_users?.display_name && <span>{task.app_users.display_name}</span>}
          </div>
        </div>
        <div className="todo-actions">
          {needsStatusPill && <StatusPill value={task.status} />}
          <EditTaskButton
            task={task}
            projectId={projectId}
            phases={phases}
            users={users}
            className="todo-edit"
            label="Edit"
          />
        </div>
      </div>
      <SubtaskList taskId={task.id} projectId={projectId} initialSubtasks={task.subtasks ?? []} />
    </div>
  );
}
