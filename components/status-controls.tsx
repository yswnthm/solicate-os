"use client";

import { useOptimistic, useTransition } from "react";
import { updateProjectStatus, updateTaskStatus } from "@/features/actions";

export function ProjectStatusControl({
  projectId,
  initialStatus,
}: {
  projectId: string;
  initialStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    initialStatus,
    (state, newStatus: string) => newStatus
  );

  const transitions: Record<string, { label: string; next: string; style?: string }[]> = {
    active: [
      { label: "Pause", next: "paused" },
      { label: "Complete", next: "completed" },
      { label: "Archive", next: "archived", style: "danger" },
    ],
    paused: [
      { label: "Reactivate", next: "active" },
      { label: "Archive", next: "archived", style: "danger" },
    ],
    completed: [{ label: "Archive", next: "archived", style: "danger" }],
  };
  const options = transitions[optimisticStatus];
  if (!options) return null;

  return (
    <div style={{ display: "flex", gap: 8, opacity: isPending ? 0.7 : 1 }}>
      {options.map((opt) => (
        <form
          key={opt.next}
          action={async (formData) => {
            addOptimisticStatus(opt.next);
            startTransition(async () => {
              await updateProjectStatus(formData);
            });
          }}
        >
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="status" value={opt.next} />
          <button
            className={`button secondary small${opt.style ? ` ${opt.style}` : ""}`}
            type="submit"
          >
            {opt.label}
          </button>
        </form>
      ))}
    </div>
  );
}

export function TaskStatusControl({
  taskId,
  projectId,
  initialStatus,
}: {
  taskId: string;
  projectId: string;
  initialStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    initialStatus,
    (state, newStatus: string) => newStatus
  );

  const nextStatus = optimisticStatus === "done" ? "todo" : "done";

  return (
    <form
      action={async (formData) => {
        addOptimisticStatus(nextStatus);
        startTransition(async () => {
          await updateTaskStatus(formData);
        });
      }}
      style={{ opacity: isPending ? 0.7 : 1 }}
    >
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="status" value={nextStatus} />
      <button
        type="submit"
        className={`button small ${optimisticStatus === "done" ? "secondary" : ""}`}
      >
        {optimisticStatus === "done" ? "Reopen" : "Mark done"}
      </button>
    </form>
  );
}
