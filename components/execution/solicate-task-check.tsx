"use client";

import { useOptimistic, useTransition } from "react";
import { toggleSolicateTaskStatus } from "@/features/actions-solicate";

export function SolicateTaskCheck({
  taskId,
  done,
}: {
  taskId: string;
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, addOptimistic] = useOptimistic(done, (state, next: boolean) => next);

  return (
    <form
      action={async () => {
        startTransition(async () => {
          const next = !optimisticDone;
          addOptimistic(next);
          await toggleSolicateTaskStatus(taskId, next ? "done" : "todo");
        });
      }}
      style={{ opacity: isPending ? 0.6 : 1, display: "inline-flex" }}
    >
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
