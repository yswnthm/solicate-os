import { StatusPill } from "@/components/status-pill";
import { EditSolicateTaskButton } from "@/components/editing/solicate-edit-modals";
import { SolicateSubtaskList } from "@/components/execution/solicate-subtask-list";
import { SolicateTaskCheck } from "@/components/execution/solicate-task-check";
import { formatDate } from "@/lib/utils";
import type { SolicateTask, SolicatePhase } from "@/features/solicate";

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  low: "Low",
};

export function SolicateTaskRow({
  task,
  phases = [],
  team = [],
}: {
  task: SolicateTask;
  phases?: SolicatePhase[];
  team?: any[];
}) {
  const isDone = task.status === "done";
  const isCancelled = task.status === "cancelled";
  const needsStatusPill = !["todo", "done", "cancelled"].includes(task.status);
  const phase = phases.find((p) => p.id === task.phase_id);

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
          <SolicateTaskCheck taskId={task.id} done={isDone} />
        )}
        <div className="todo-body">
          <div className="todo-title">{task.title}</div>
          <div className="todo-meta">
            {task.priority !== "normal" && (
              <span className={`meta-priority ${task.priority}`}>
                {PRIORITY_LABEL[task.priority] ?? task.priority}
              </span>
            )}
            {task.due_at && <span>{formatDate(task.due_at)}</span>}
            {task.assignee?.name && (
              <span className="badge" style={{ fontSize: 11, padding: "1px 6px" }}>
                {task.assignee.name}
              </span>
            )}
            {phase && (
              <span className="muted" style={{ fontSize: 11 }}>
                {phase.name}
              </span>
            )}
          </div>
        </div>
        <div className="todo-actions">
          {needsStatusPill && <StatusPill value={task.status} />}
          <EditSolicateTaskButton
            task={task}
            phases={phases}
            team={team}
            className="todo-edit"
          />
        </div>
      </div>
      {task.subtasks && (
        <SolicateSubtaskList
          taskId={task.id}
          initialSubtasks={task.subtasks}
        />
      )}
    </div>
  );
}
