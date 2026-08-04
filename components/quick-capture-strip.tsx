"use client";

import { useState, useTransition } from "react";
import { quickCapture } from "@/features/actions";

interface QuickCaptureProject {
  id: string;
  name: string;
}

const TYPE_OPTIONS = [
  { value: "capture", label: "⚡ Capture", hint: "Raw untriaged note" },
  { value: "note", label: "📝 Note", hint: "General note" },
  { value: "decision", label: "🎯 Decision", hint: "Key decision" },
  { value: "meeting", label: "🤝 Meeting", hint: "Call or discussion" },
  { value: "update", label: "📌 Update", hint: "Progress update" },
] as const;

export function QuickCaptureStrip({ projects }: { projects: QuickCaptureProject[] }) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<string>("capture");
  const [bodyMd, setBodyMd] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("type", type);
    if (projectId) formData.append("project_id", projectId);
    if (bodyMd.trim()) formData.append("body_md", bodyMd.trim());
    if (type === "decision") formData.append("decision_outcome", title.trim());

    startTransition(async () => {
      try {
        await quickCapture(formData);
        setTitle("");
        setBodyMd("");
        setExpanded(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save quick capture.");
      }
    });
  };

  return (
    <div
      style={{
        marginBottom: 24,
        padding: "16px 20px",
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-glass)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "all var(--transition)",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Command Input Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ⚡
          </div>

          <input
            type="text"
            className="field-input"
            placeholder="Quick capture a note, task, decision, or update..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: 14,
              borderRadius: 10,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          />

          <select
            className="field-input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={isPending}
            style={{
              width: 170,
              padding: "10px 12px",
              fontSize: 13,
              borderRadius: 10,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            <option value="">(Untriaged Inbox)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="button primary"
            disabled={isPending || !title.trim()}
            style={{ padding: "9px 20px", fontSize: 13, flexShrink: 0 }}
          >
            {isPending ? "Saving..." : "Quick Capture"}
          </button>
        </div>

        {/* Type selector pills & expandable details */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginRight: 4 }}>Type:</span>
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`pill ${type === opt.value ? "active" : ""}`}
                onClick={() => setType(opt.value)}
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: "1px solid var(--line)",
                  background: type === opt.value ? "var(--accent-soft)" : "transparent",
                  color: type === opt.value ? "var(--accent)" : "var(--muted)",
                  borderColor: type === opt.value ? "var(--accent)" : "var(--line)",
                  fontWeight: type === opt.value ? 600 : 400,
                  transition: "all var(--transition)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="button ghost"
            onClick={() => setExpanded(!expanded)}
            style={{ fontSize: 12, padding: "4px 8px", border: "none", color: "var(--muted)", cursor: "pointer" }}
          >
            {expanded ? "▲ Hide Details" : "▼ Add Notes"}
          </button>
        </div>

        {/* Expanded textarea for markdown notes */}
        {expanded && (
          <textarea
            className="field-input"
            placeholder="Add extra details, context, or markdown notes (optional)..."
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            disabled={isPending}
            rows={3}
            style={{
              padding: "10px 14px",
              fontSize: 13,
              borderRadius: 10,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              resize: "vertical",
            }}
          />
        )}

        {/* Feedback indicators */}
        {success && (
          <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            ✓ Quick capture saved to Inbox!
          </div>
        )}
        {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
      </form>
    </div>
  );
}
