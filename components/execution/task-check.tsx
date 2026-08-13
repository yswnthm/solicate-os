"use client";

import { useOptimistic, useTransition } from "react";
import { updateTaskStatus } from "@/features/actions";

export function TaskCheck({
  taskId,
  projectId,
  done,
}: {
  taskId: string;
  projectId: string;
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, addOptimistic] = useOptimistic(done, (state, next: boolean) => next);

  return (
    <form
      action={async (formData) => {
        startTransition(async () => {
          addOptimistic(!optimisticDone);
          await updateTaskStatus(formData);
        });
      }}
      style={{ opacity: isPending ? 0.6 : 1, display: "inline-flex" }}
    >
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="status" value={optimisticDone ? "todo" : "done"} />
      <button
        type="submit"
        className={optimisticDone ? "todo-check checked" : "todo-check"}
        aria-label={optimisticDone ? "Mark as not done" : "Mark as done"}
        aria-pressed={optimisticDone}
      >
        {optimisticDone ? "✓" : ""}
      </button>
    </form>
  );
}
