"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { approveWeeklySummary, draftWeeklySummaryForProject, getWeeklySummaryPrompt, getModelPickerOptions, type ModelPickerOptions } from "@/features/ai-actions";
import { Modal } from "@/components/modal";
import { PromptModal } from "@/components/prompt-viewer";
import { ModelPicker } from "@/components/model-picker";

export function WeeklySummaryButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);

  const [modelOptions, setModelOptions] = useState<ModelPickerOptions>({ models: [], default_model: "" });
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    getModelPickerOptions("weekly-summary")
      .then(setModelOptions)
      .catch(() => {});
  }, []);

  const onGetPrompt = async () => {
    setPromptBusy(true);
    setError(null);
    setPrompt(null);
    setPromptOpen(true);
    try {
      setPrompt(await getWeeklySummaryPrompt(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build the prompt.");
      setPromptOpen(false);
    } finally {
      setPromptBusy(false);
    }
  };

  const onDraft = async () => {
    setOpen(true);
    setBusy(true);
    setError(null);
    try {
      const summary = await draftWeeklySummaryForProject(projectId, modelId || undefined);
      setDraft(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Weekly summary failed.");
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await approveWeeklySummary(projectId, draft);
      setOpen(false);
      setDraft(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="button secondary small" type="button" onClick={onDraft} disabled={busy}>
          {busy ? "Drafting…" : "✨ Weekly summary"}
        </button>
        <button className="button ghost small" type="button" onClick={onGetPrompt} disabled={promptBusy}>
          {promptBusy ? "Building…" : "Copy prompt"}
        </button>
      </div>

      <PromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Weekly summary prompt"
        prompt={prompt}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Weekly update draft">
        {modelOptions.models.length > 0 && (
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <ModelPicker
              models={modelOptions.models}
              value={modelId}
              onChange={setModelId}
              defaultModel={modelOptions.default_model}
              fieldId="weekly-summary-model"
            />
            {draft !== null && (
              <button className="button ghost small" onClick={onDraft} disabled={busy} style={{ marginTop: 8 }}>
                ↻ Redraft with selected model
              </button>
            )}
          </div>
        )}

        {busy && <div className="empty">Drafting summary from the last 7 days of activity...</div>}
        {error && <div className="notice" style={{ marginBottom: 16 }}>{error}</div>}
        {draft !== null && !busy && (
          <>
            <p className="muted" style={{ marginBottom: 16 }}>
              Drafted from project activity. Edit freely — nothing is filed until you approve.
            </p>
            <div className="form">
              <div className="field">
                <label>Summary</label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{ minHeight: 260, fontFamily: "inherit", lineHeight: 1.6 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="button" type="button" onClick={onApprove} disabled={busy}>
                  {busy ? "Filing…" : "Approve & file"}
                </button>
                <button className="button secondary" type="button" onClick={onCopy} disabled={busy}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDraft(null);
                    setError(null);
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
