"use client";

import { useState, useOptimistic, useTransition } from "react";
import {
  createSolicateSubtask,
  toggleSolicateSubtask,
  deleteSolicateSubtask,
} from "@/features/actions-solicate";
import type { SolicateSubtask } from "@/features/solicate";

export function SolicateSubtaskList({
  taskId,
  initialSubtasks,
}: {
  taskId: string;
  initialSubtasks: SolicateSubtask[];
}) {
  const [expanded, setExpanded] = useState(initialSubtasks.length > 0);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(
    initialSubtasks,
    (state, next: SolicateSubtask[]) => next
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
                    action={async () => {
                      startTransition(async () => {
                        addOptimistic(
                          optimistic.map((s) => (s.id === subtask.id ? { ...s, done: !s.done } : s))
                        );
                        await toggleSolicateSubtask(subtask.id, !subtask.done);
                      });
                    }}
                  >
                    <button
                      type="submit"
                      className="subtask-check"
                      aria-label={subtask.done ? "Mark not done" : "Mark done"}
                    >
                      {subtask.done ? "✓" : ""}
                    </button>
                  </form>
                  <span className="subtask-title">{subtask.title}</span>
                  <form
                    action={async () => {
                      startTransition(async () => {
                        addOptimistic(optimistic.filter((s) => s.id !== subtask.id));
                        await deleteSolicateSubtask(subtask.id);
                      });
                    }}
                  >
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
            onSubmit={(e) => {
              e.preventDefault();
              const title = newTitle.trim();
              if (!title) return;
              setNewTitle("");
              startTransition(async () => {
                addOptimistic([
                  ...optimistic,
                  {
                    id: `temp-${Date.now()}`,
                    task_id: taskId,
                    title,
                    done: false,
                    position: optimistic.length + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ]);
                await createSolicateSubtask(taskId, title);
              });
            }}
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a step…"
              aria-label="Add a subtask"
              required
            />
            <button className="subtask-add-btn" type="submit">
              + Add
            </button>
          </form>
        </>
      )}
    </div>
  );
}
