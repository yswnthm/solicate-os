"use client";

import { useState } from "react";

import {
  deleteTemplate,
  duplicateTemplateAction,
  restoreTemplateVersionAction,
  setTemplateActiveVersionAction,
  toggleTemplateActive,
} from "@/features/ai-manage-actions";
import type { TemplateVersion } from "@/lib/ai/types";

export function TemplateVersionActions({
  templateId,
  slug,
  isActive,
  versions,
  currentVersion,
}: {
  templateId: string;
  slug: string;
  isActive: boolean;
  versions: TemplateVersion[];
  currentVersion: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      {error && <div className="notice" style={{ margin: 0 }}>{error}</div>}
      {notice && <div className="notice" style={{ margin: 0 }}>{notice}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="button secondary"
          type="button"
          disabled={busy}
          onClick={() => run(() => duplicateTemplateAction(templateId), "Duplicated.")}
        >
          Duplicate
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={busy}
          onClick={() => run(() => toggleTemplateActive(templateId, !isActive), isActive ? "Deactivated." : "Activated.")}
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          className="button ghost danger"
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`Deactivate template "${slug}"? It will no longer load.`)) {
              run(() => deleteTemplate(templateId), "Deactivated.");
            }
          }}
        >
          Delete
        </button>
      </div>

      <section className="section">
        <div className="section-title">
          <h2>Version history</h2>
          <span>Newest first</span>
        </div>
        <div className="list">
          {versions.map((v) => (
            <div className="row" key={v.id}>
              <span className={`pill ${v.version === currentVersion ? "active" : ""}`}>v{v.version}</span>
              <div className="row-main">
                <div className="row-title">
                  {v.version === currentVersion ? "Current" : ""} {v.change_note || "Version"}
                </div>
                <div className="row-meta">
                  {v.name} · {v.default_model} · {v.response_format}
                  {v.output_field ? ` → ${v.output_field}` : ""} · {v.max_tokens} tokens · temp {v.temperature}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {v.version !== currentVersion && (
                  <>
                    <button
                      className="button ghost small"
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => setTemplateActiveVersionAction(templateId, v.version), `v${v.version} is now current.`)}
                    >
                      Set current
                    </button>
                    <button
                      className="button ghost small"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Copy v${v.version} as a new version?`)) {
                          run(() => restoreTemplateVersionAction(templateId, v.version), `v${v.version} restored as a new version.`);
                        }
                      }}
                    >
                      Restore
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
