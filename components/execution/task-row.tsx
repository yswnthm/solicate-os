import { StatusPill } from "@/components/status-pill";
import { TaskStatusControl } from "@/components/status-controls";
import { EditTaskButton } from "@/components/editing/edit-buttons";
import { formatDate } from "@/lib/utils";

type Phase = { id: string; position: number; name: string };
type User = { id: string; display_name: string };

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
  return (
    <div className="row">
      <StatusPill value={task.priority} />
      <div className="row-main">
        <div className="row-title">{task.title}</div>
        <div className="row-meta">
          {task.due_at ? `Due ${formatDate(task.due_at)}` : "No due date"}
          {task.description_md ? ` · ${task.description_md.slice(0, 80)}` : ""}
        </div>
      </div>
      <div className="row-actions-always">
        <StatusPill value={task.status} />
        {task.status !== "done" && task.status !== "cancelled" && (
          <TaskStatusControl taskId={task.id} projectId={projectId} initialStatus={task.status} />
        )}
        <EditTaskButton task={task} projectId={projectId} phases={phases} users={users} />
      </div>
    </div>
  );
}
