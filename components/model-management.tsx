"use client";

import { useState } from "react";

import { createModel, deleteModel, setModelActive } from "@/features/ai-manage-actions";
import type { AiModelRow } from "@/lib/ai/types";

const PROVIDERS = ["groq", "gemini", "opencode"] as const;

export function ModelManagement({ models }: { models: AiModelRow[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<string>("groq");
  const [modelId, setModelId] = useState("");
  const [displayName, setDisplayName] = useState("");

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await createModel({
        provider: provider as (typeof PROVIDERS)[number],
        model_id: modelId.trim(),
        display_name: displayName.trim(),
        description: "",
        is_active: true,
        sort_order: 100,
      });
      setModelId("");
      setDisplayName("");
      setShowForm(false);
    }, "Model added.");
  };

  return (
    <div className="stack">
      {error && <div className="notice" style={{ margin: 0 }}>{error}</div>}
      {notice && <div className="notice" style={{ margin: 0 }}>{notice}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="button secondary" type="button" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add model"}
        </button>
      </div>

      {showForm && (
        <form className="card form" style={{ padding: 20 }} onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="model-provider">Provider</label>
              <select id="model-provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="model-id">Model ID</label>
              <input
                id="model-id"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="llama-3.3-70b-versatile"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="model-display">Display name</label>
              <input
                id="model-display"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Llama 3.3 70B"
                required
              />
            </div>
          </div>
          <button className="button" type="submit" disabled={busy}>
            Add model
          </button>
        </form>
      )}

      <section className="section">
        <div className="section-title">
          <h2>Model catalog</h2>
          <span>Order determines fallback priority</span>
        </div>
        <div className="list">
          {models.map((m) => (
            <div className="row" key={m.id}>
              <span className={`pill ${m.is_active ? "active" : ""}`}>{m.is_active ? "on" : "off"}</span>
              <div className="row-main">
                <div className="row-title">{m.display_name}</div>
                <div className="row-meta">
                  {m.provider} · {m.model_id}
                  {m.description ? ` · ${m.description}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="button ghost small"
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => setModelActive(m.id, !m.is_active), m.is_active ? "Disabled." : "Enabled.")}
                >
                  {m.is_active ? "Disable" : "Enable"}
                </button>
                <button
                  className="button ghost small danger"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`Delete ${m.display_name} from the catalog?`)) {
                      run(() => deleteModel(m.id), "Deleted.");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
