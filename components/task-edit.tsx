"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { updateTask } from "@/features/actions";

export function TaskEditButton({ task, projectId }: { task: any; projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="button ghost small" onClick={() => setIsOpen(true)} title="Edit task">
        Edit
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit task">
        <form className="form" action={updateTask} onSubmit={() => setIsOpen(false)}>
          <input type="hidden" name="task_id" value={task.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <div className="field">
            <label>Task title</label>
            <input name="title" defaultValue={task.title} required />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Priority</label>
              <select name="priority" defaultValue={task.priority}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="field">
              <label>Due date</label>
              <input name="due_at" type="date" defaultValue={task.due_at?.slice(0, 10)} />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea name="description_md" defaultValue={task.description_md ?? ""} />
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Save changes
          </button>
        </form>
      </Modal>
    </>
  );
}
