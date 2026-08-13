"use client";

import { useTransition, useState, useEffect } from "react";
import { createAllocation } from "@/features/actions";
import { updateAllocation } from "@/features/update-actions";

export function AllocationForm({
  transactionId,
  allocation,
  projects,
  phases,
  onClose,
}: {
  transactionId: string;
  allocation?: any;
  projects: { id: string; name: string }[];
  phases: { id: string; name: string; project_id: string }[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState(allocation?.project_id || "");
  const [phaseId, setPhaseId] = useState(allocation?.phase_id || "");

  const isEditing = !!allocation;

  useEffect(() => {
    if (projectId) {
      // If phase belongs to another project, reset phase
      const phase = phases.find((p) => p.id === phaseId);
      if (phase && phase.project_id !== projectId) {
        setPhaseId("");
      }
    } else {
      setPhaseId("");
    }
  }, [projectId, phaseId, phases]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("transaction_id", transactionId);
    startTransition(async () => {
      if (isEditing) {
        await updateAllocation(allocation.id, formData);
      } else {
        await createAllocation(formData);
      }
      onClose();
    });
  };

  const projectPhases = phases.filter((p) => p.project_id === projectId);

  return (
    <form className="form finance-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="alloc-amount">Amount (₹)</label>
        <input
          id="alloc-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={allocation?.amount}
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="alloc-proj">Project (Optional)</label>
        <select
          id="alloc-proj"
          name="project_id"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="input"
        >
          <option value="">None (Overhead)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {projectId && (
        <div className="field">
          <label htmlFor="alloc-phase">Phase (Optional)</label>
          <select
            id="alloc-phase"
            name="phase_id"
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
            className="input"
          >
            <option value="">Whole Project</option>
            {projectPhases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="alloc-notes">Notes</label>
        <textarea id="alloc-notes" name="notes" defaultValue={allocation?.notes} className="input" rows={2} />
      </div>

      <div className="actions" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Allocate Funds"}
        </button>
        <button type="button" className="button muted" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
      </div>
    </form>
  );
}
