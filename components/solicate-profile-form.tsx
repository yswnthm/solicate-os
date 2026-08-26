"use client";

import { useRef, useTransition } from "react";
import { updateSolicateProfile } from "@/features/actions-solicate";

export function SolicateProfileForm({ profile }: { profile: any }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateSolicateProfile(formData);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="project-grid" style={{ gridTemplateColumns: "1fr" }}>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Agency Identity</h3>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
        
        <div className="form-group">
          <label className="form-label">Tagline</label>
          <input
            name="tagline"
            type="text"
            className="form-input"
            defaultValue={profile?.tagline || ""}
            placeholder="e.g. organic growth and digital presence..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">North Star</label>
          <textarea
            name="north_star"
            className="form-textarea"
            rows={3}
            defaultValue={profile?.north_star || ""}
            placeholder="the 10-year vision"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Target Market</label>
          <textarea
            name="target_market"
            className="form-textarea"
            rows={3}
            defaultValue={profile?.target_market || ""}
            placeholder="who we serve"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Brand Voice (AI Context)</label>
          <textarea
            name="brand_voice"
            className="form-textarea"
            rows={5}
            defaultValue={profile?.brand_voice || ""}
            placeholder="Leave empty for now. Fill when ready for AI agents to use this for drafting."
          />
        </div>
      </div>
    </form>
  );
}
