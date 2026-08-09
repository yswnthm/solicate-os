"use client";

import { useState, useOptimistic, useTransition } from "react";
import { addSubtask, deleteSubtask, toggleSubtask } from "@/features/actions";

export type SubtaskItem = { id: string; title: string; done: boolean; notes?: string | null };

export function SubtaskList({
  taskId,
  projectId,
  initialSubtasks,
}: {
  taskId: string;
  projectId: string;
  initialSubtasks: SubtaskItem[];
}) {
  const [expanded, setExpanded] = useState(initialSubtasks.length > 0);
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(
    initialSubtasks,
    (state, next: SubtaskItem[]) => next
  );

  const doneCount = optimistic.filter((s) => s.done).length;

  return (
    <div className="subtask-list" style={{ opacity: isPending ? 0.7 : 1 }}>
      <button type="button" className="subtask-toggle" onClick={() => setExpanded((v) => !v)}>
        <span className="subtask-caret">{expanded ? "▾" : "▸"}</span>
        Subtasks <span className="subtask-count">{doneCount}/{optimistic.length}</span>
      </button>
      {expanded && (
        <>
          {optimistic.length > 0 && (
            <ul className="subtask-items">
              {optimistic.map((subtask) => (
                <li key={subtask.id} className={subtask.done ? "subtask-item done" : "subtask-item"}>
                  <form
                    action={async (formData) => {
                      addOptimistic(
                        optimistic.map((s) => (s.id === subtask.id ? { ...s, done: !s.done } : s)),
                      );
                      startTransition(async () => {
                        await toggleSubtask(formData);
                      });
                    }}
                  >
                    <input type="hidden" name="subtask_id" value={subtask.id} />
                    <input type="hidden" name="task_id" value={taskId} />
                    <input type="hidden" name="project_id" value={projectId} />
                    <button
                      type="submit"
                      className="subtask-check"
                      aria-label={subtask.done ? "Mark not done" : "Mark done"}
                    >
                      {subtask.done ? "✓" : ""}
                    </button>
                  </form>
                  {subtask.notes ? (
                    <button
                      type="button"
                      className="subtask-title"
                      onClick={() => setOpenNotes((cur) => (cur === subtask.id ? null : subtask.id))}
                      aria-expanded={openNotes === subtask.id}
                      title="Show notes"
                    >
                      {subtask.title}
                    </button>
                  ) : (
                    <span className="subtask-title">{subtask.title}</span>
                  )}
                  {openNotes === subtask.id && subtask.notes && (
                    <div className="subtask-notes">{subtask.notes}</div>
                  )}
                  <form
                    action={async (formData) => {
                      addOptimistic(optimistic.filter((s) => s.id !== subtask.id));
                      startTransition(async () => {
                        await deleteSubtask(formData);
                      });
                    }}
                  >
                    <input type="hidden" name="subtask_id" value={subtask.id} />
                    <input type="hidden" name="project_id" value={projectId} />
                    <button type="submit" className="subtask-delete" aria-label="Delete subtask">
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form
            className="subtask-add"
            action={async (formData) => {
              const title = String(formData.get("title") ?? "").trim();
              if (!title) return;
              const notes = String(formData.get("notes") ?? "").trim();
              addOptimistic([
                ...optimistic,
                { id: `new-${Date.now()}`, title, done: false, notes: notes || null },
              ]);
              startTransition(async () => {
                await addSubtask(formData);
              });
            }}
          >
            <input type="hidden" name="task_id" value={taskId} />
            <input type="hidden" name="project_id" value={projectId} />
            <input name="title" placeholder="Add a step…" aria-label="Add a subtask" required />
            <button className="subtask-add-btn" type="submit">
              + Add
            </button>
            <input
              name="notes"
              placeholder="Notes (how to do it)…"
              aria-label="Notes for the subtask"
            />
          </form>
        </>
      )}
    </div>
  );
}
