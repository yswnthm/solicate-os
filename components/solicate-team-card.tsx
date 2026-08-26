"use client";

import { useRef, useTransition, useState } from "react";
import { updateSolicateTeam } from "@/features/actions-solicate";
import { StatusPill } from "@/components/status-pill";
import { Pen, User, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export function SolicateTeamCard({ member }: { member: any }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateSolicateTeam(member.id, formData);
      setIsEditing(false);
    });
  }

  const linkedRecordName = member.public_people?.name || member.public_app_users?.display_name;
  const linkHref = member.person_id ? `/people/${member.person_id}` : null;

  if (!isEditing) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}>
              <User size={20} />
            </div>
            <div>
              <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>{member.name}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <StatusPill value={member.status} />
                <span>•</span>
                <span>{member.role_type}</span>
                {member.joined_on && (
                  <>
                    <span>•</span>
                    <span>Joined {member.joined_on}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={() => setIsEditing(true)}
            title="Edit Member"
          >
            <Pen size={14} />
          </button>
        </div>
        
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>{member.role}</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {member.skills}
          </p>
        </div>

        {linkedRecordName && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <LinkIcon size={12} className="text-secondary" />
            <span className="text-secondary">Linked to:</span>
            {linkHref ? (
              <Link href={linkHref} className="interactive" style={{ textDecoration: 'underline' }}>{linkedRecordName}</Link>
            ) : (
              <span>{linkedRecordName} (App User)</span>
            )}
          </div>
        )}

        {member.notes && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
            <strong>Notes:</strong> {member.notes}
          </div>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card-header">
        <h3 className="card-title">Edit {member.name}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Role Title</label>
          <input name="role" type="text" className="form-input" defaultValue={member.role} />
        </div>
        <div className="form-group">
          <label className="form-label">Role Type</label>
          <select name="role_type" className="form-input" defaultValue={member.role_type}>
            <option value="founder">Founder</option>
            <option value="employee">Employee</option>
            <option value="partner">Partner</option>
            <option value="contractor">Contractor</option>
            <option value="advisor">Advisor</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select name="status" className="form-input" defaultValue={member.status}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="advisor">Advisor</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Skills</label>
        <textarea name="skills" className="form-textarea" rows={2} defaultValue={member.skills || ""} />
      </div>

      <div className="form-group">
        <label className="form-label">Notes (Internal)</label>
        <textarea name="notes" className="form-textarea" rows={2} defaultValue={member.notes || ""} />
      </div>
    </form>
  );
}
