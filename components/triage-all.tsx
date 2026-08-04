"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { approveInboxDraft, draftBatchTriage, getBatchTriagePrompt, getModelPickerOptions, type BatchTriageItem, type ModelPickerOptions } from "@/features/ai-actions";
import { Modal } from "@/components/modal";
import { PromptModal } from "@/components/prompt-viewer";
import { ModelPicker } from "@/components/model-picker";
import type { TriageDraft } from "@/lib/ai/schemas";

const ENTRY_TYPES = ["note", "meeting", "decision", "document", "update", "milestone", "capture"];

type InboxProject = {
  id: string;
  name: string;
  clients?: Array<{ name: string }> | { name: string } | null;
};

const clientName = (c: InboxProject["clients"]) =>
  Array.isArray(c) ? c[0]?.name ?? null : c?.name ?? null;

export function TriageAllButton({ projects }: { projects: InboxProject[] }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BatchTriageItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, TriageDraft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);

  const [modelOptions, setModelOptions] = useState<ModelPickerOptions>({ models: [], default_model: "" });
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    getModelPickerOptions("inbox-triage")
      .then(setModelOptions)
      .catch(() => {});
  }, []);

  const onGetPrompt = async () => {
    setPromptBusy(true);
    setError(null);
    setPrompt(null);
    setPromptOpen(true);
    try {
      setPrompt(await getBatchTriagePrompt());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build the prompt.");
      setPromptOpen(false);
    } finally {
      setPromptBusy(false);
    }
  };

  const onDraft = async () => {
    setError(null);
    setItems([]);
    setOpen(true);
    try {
      const result = await draftBatchTriage(modelId || undefined);
      setItems(result);
      setDrafts(
        Object.fromEntries(
          result.map((item) => [item.id, { ...item.draft, project_id: item.draft.project_id ?? "" }]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch triage failed. Check GROQ_API_KEY.");
    }
  };

  const onApprove = async (item: BatchTriageItem) => {
    const draft = drafts[item.id];
    if (!draft) return;
    const payload: TriageDraft = {
      title: draft.title.trim(),
      type: draft.type,
      project_id: draft.project_id || null,
      body_md: draft.body_md.trim(),
    };
    if (!payload.title || !payload.body_md) return;
    setBusyId(item.id);
    try {
      await approveInboxDraft(item.kind, item.id, payload);
      const rest = items.filter((i) => i.id !== item.id);
      setItems(rest);
      if (rest.length === 0) {
        setOpen(false);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  };

  const onSkip = (item: BatchTriageItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (items.length === 1) setOpen(false);
  };

  return (
    <>
      <button className="button secondary" type="button" onClick={onDraft}>
        ✨ Triage all with AI
      </button>
      <button className="button secondary" type="button" onClick={onGetPrompt} disabled={promptBusy}>
        {promptBusy ? "Building…" : "Copy prompt"}
      </button>

      <PromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Triage all prompt"
        prompt={prompt}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Triage all with AI">
        {error && <div className="notice" style={{ marginBottom: 16 }}>{error}</div>}
        {modelOptions.models.length > 0 && (
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <ModelPicker
              models={modelOptions.models}
              value={modelId}
              onChange={setModelId}
              defaultModel={modelOptions.default_model}
              fieldId="triage-all-model"
            />
            {items.length > 0 && (
              <button className="button ghost small" onClick={onDraft} style={{ marginTop: 8 }}>
                ↻ Redraft with selected model
              </button>
            )}
          </div>
        )}
        {items.length === 0 && !error && (
          <div className="empty" style={{ marginTop: 0 }}>
            Drafting records for every inbox item…
          </div>
        )}
        <div className="stack" style={{ gap: 20 }}>
          {items.map((item, index) => {
            const draft = drafts[item.id];
            if (!draft) return null;
            return (
              <div key={item.id} className="card" style={{ padding: 16 }}>
                <div className="row-meta" style={{ marginBottom: 12 }}>
                  <strong>{index + 1}. {item.kind === "entry" ? "Capture" : "Message"}</strong> — approve to file, or skip to leave in inbox.
                </div>
                <div className="form" style={{ gap: 12 }}>
                  <div className="field">
                    <label>Title</label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDrafts({ ...drafts, [item.id]: { ...draft, title: e.target.value } })}
                    />
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>Type</label>
                      <select
                        value={draft.type}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [item.id]: { ...draft, type: e.target.value as TriageDraft["type"] } })
                        }
                      >
                        {ENTRY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Project (optional)</label>
                      <select
                        value={draft.project_id ?? ""}
                        onChange={(e) => setDrafts({ ...drafts, [item.id]: { ...draft, project_id: e.target.value } })}
                      >
                        <option value="">No project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {clientName(p.clients) ? `${clientName(p.clients)} / ` : ""}
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Body</label>
                    <textarea
                      value={draft.body_md}
                      onChange={(e) => setDrafts({ ...drafts, [item.id]: { ...draft, body_md: e.target.value } })}
                      style={{ minHeight: 80 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="button small"
                      type="button"
                      onClick={() => onApprove(item)}
                      disabled={busyId !== null}
                    >
                      {busyId === item.id ? "Filing…" : "Approve & file"}
                    </button>
                    <button className="button ghost small" type="button" onClick={() => onSkip(item)} disabled={busyId !== null}>
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length > 0 && (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Approving each item writes it immediately; skipped items stay in the inbox.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
