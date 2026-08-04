"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { draftMorningBriefAction, getMorningBriefPrompt, saveMorningBrief, getModelPickerOptions, type ModelPickerOptions } from "@/features/ai-actions";
import { Modal } from "@/components/modal";
import { PromptModal } from "@/components/prompt-viewer";
import { ModelPicker } from "@/components/model-picker";

export function MorningBriefButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);

  const [modelOptions, setModelOptions] = useState<ModelPickerOptions>({ models: [], default_model: "" });
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    getModelPickerOptions("morning-brief")
      .then(setModelOptions)
      .catch(() => {});
  }, []);

  const onGetPrompt = async () => {
    setPromptBusy(true);
    setError(null);
    setPrompt(null);
    setPromptOpen(true);
    try {
      setPrompt(await getMorningBriefPrompt());
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
    setBrief(null);
    try {
      const result = await draftMorningBriefAction(modelId || undefined);
      setBrief(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Morning brief failed. Check GROQ_API_KEY.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!brief) return;
    setBusy(true);
    try {
      await saveMorningBrief(brief);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="button" type="button" onClick={onDraft} disabled={busy}>
          {busy ? "Drafting…" : "✨ Morning brief"}
        </button>
        <button className="button secondary" type="button" onClick={onGetPrompt} disabled={promptBusy}>
          {promptBusy ? "Building…" : "Copy prompt"}
        </button>
      </div>

      <PromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Morning brief prompt"
        prompt={prompt}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Morning brief">
        {modelOptions.models.length > 0 && (
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <ModelPicker
              models={modelOptions.models}
              value={modelId}
              onChange={setModelId}
              defaultModel={modelOptions.default_model}
              fieldId="morning-brief-model"
            />
            {brief !== null && (
              <button className="button ghost small" onClick={onDraft} disabled={busy} style={{ marginTop: 8 }}>
                ↻ Redraft with selected model
              </button>
            )}
          </div>
        )}

        {error && <div className="notice" style={{ marginBottom: 16 }}>{error}</div>}
        {busy && (
          <div className="empty" style={{ marginTop: 0 }}>
            Reading today: overdue, upcoming, issues, inbox, and project pulse…
          </div>
        )}
        {brief && (
          <div className="form">
            <div className="field">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                style={{ minHeight: 320, fontFamily: "inherit", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="button" type="button" onClick={onSave} disabled={busy}>
                {saved ? "Saved ✓" : busy ? "Saving…" : "Save as note"}
              </button>
              <button className="button secondary" type="button" onClick={onCopy} disabled={busy}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  setOpen(false);
                  setBrief(null);
                  setError(null);
                }}
              >
                Close
              </button>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              This is a read-only draft. Saving files it as a projectless note; nothing is written until then.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
