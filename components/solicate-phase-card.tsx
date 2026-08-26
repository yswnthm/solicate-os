"use client";

import { useRef, useTransition, useState } from "react";
import { updateSolicatePhase } from "@/features/actions-solicate";
import { StatusPill } from "@/components/status-pill";
import { Pen } from "lucide-react";

export function SolicatePhaseCard({ phase }: { phase: any }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateSolicatePhase(phase.id, formData);
      setIsEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phase {phase.position}
            </div>
            <h3 className="card-title" style={{ marginBottom: '0.25rem', marginTop: '0.25rem' }}>{phase.name}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <StatusPill value={phase.status} />
              {phase.started_on && (
                <>
                  <span>•</span>
                  <span>Started {phase.started_on}</span>
                </>
              )}
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={() => setIsEditing(true)}
            title="Edit Phase"
          >
            <Pen size={14} />
          </button>
        </div>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {phase.description}
        </p>
        
        {phase.success_definition && (
          <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-blue)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Success Definition</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {phase.success_definition}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card-header">
        <h3 className="card-title">Edit Phase {phase.position}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Name</label>
        <input name="name" type="text" className="form-input" defaultValue={phase.name} />
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select name="status" className="form-input" defaultValue={phase.status}>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea name="description" className="form-textarea" rows={3} defaultValue={phase.description || ""} />
      </div>

      <div className="form-group">
        <label className="form-label">Success Definition</label>
        <textarea name="success_definition" className="form-textarea" rows={3} defaultValue={phase.success_definition || ""} />
      </div>
    </form>
  );
}
