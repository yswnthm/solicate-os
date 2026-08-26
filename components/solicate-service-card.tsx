"use client";

import { useRef, useTransition, useState } from "react";
import { updateSolicateService } from "@/features/actions-solicate";
import { StatusPill } from "@/components/status-pill";
import { Pen } from "lucide-react";

export function SolicateServiceCard({ service }: { service: any }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateSolicateService(service.id, formData);
      setIsEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>{service.name}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <StatusPill value={service.status} />
              <span>•</span>
              <span>{service.model}</span>
              <span>•</span>
              <span>{service.pricing_currency} {service.pricing_from?.toLocaleString()} from</span>
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={() => setIsEditing(true)}
            title="Edit Service"
          >
            <Pen size={14} />
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {service.description}
        </p>
        {service.notes && (
          <div style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
            <strong>Notes:</strong> {service.notes}
          </div>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card-header">
        <h3 className="card-title">Edit {service.name}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Name</label>
        <input name="name" type="text" className="form-input" defaultValue={service.name} />
      </div>

      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select name="status" className="form-input" defaultValue={service.status}>
            <option value="active">Active</option>
            <option value="experimental">Experimental</option>
            <option value="planned">Planned</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Model</label>
          <select name="model" className="form-input" defaultValue={service.model}>
            <option value="retainer">Retainer</option>
            <option value="project">Project</option>
            <option value="phase_based">Phase Based</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Pricing From</label>
          <input name="pricing_from" type="number" className="form-input" defaultValue={service.pricing_from || ""} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea name="description" className="form-textarea" rows={3} defaultValue={service.description || ""} />
      </div>

      <div className="form-group">
        <label className="form-label">Notes (Internal)</label>
        <textarea name="notes" className="form-textarea" rows={2} defaultValue={service.notes || ""} />
      </div>
    </form>
  );
}
