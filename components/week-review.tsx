"use client";

import { useEffect, useState } from "react";

import { draftWeekReviewAction, getWeekReviewPrompt, saveWeekReview, getModelPickerOptions, type ModelPickerOptions } from "@/features/ai-actions";
import { Modal } from "@/components/modal";
import { PromptModal } from "@/components/prompt-viewer";
import { ModelPicker } from "@/components/model-picker";

export function WeekReviewButton() {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<string | null>(null);
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
    getModelPickerOptions("week-in-review")
      .then(setModelOptions)
      .catch(() => {});
  }, []);

  const onGetPrompt = async () => {
    setPromptBusy(true);
    setError(null);
    setPrompt(null);
    setPromptOpen(true);
    try {
      setPrompt(await getWeekReviewPrompt());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build the prompt.");
      setPromptOpen(false);
    } finally {
      setPromptBusy(false);
    }
  };

  const onDraft = async () => {
    setBusy(true);
    setError(null);
    setReview(null);
    setSaved(false);
    setOpen(true);
    try {
      const result = await draftWeekReviewAction(modelId || undefined);
      setReview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Week in review failed. Check GROQ_API_KEY.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!review) return;
    setBusy(true);
    try {
      await saveWeekReview(review);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!review) return;
    await navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {modelOptions.models.length > 0 && (
        <div style={{ maxWidth: 340, marginBottom: 12 }}>
          <ModelPicker
            models={modelOptions.models}
            value={modelId}
            onChange={setModelId}
            defaultModel={modelOptions.default_model}
            fieldId="week-review-model"
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="button secondary" type="button" onClick={onDraft} disabled={busy}>
          {busy ? "Drafting…" : "✨ Week in review"}
        </button>
        <button className="button secondary" type="button" onClick={onGetPrompt} disabled={promptBusy}>
          {promptBusy ? "Building…" : "Copy prompt"}
        </button>
      </div>

      <PromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Week in review prompt"
        prompt={prompt}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Week in review">
        {error && <div className="notice" style={{ marginBottom: 16 }}>{error}</div>}
        {!error && !review && (
          <div className="empty" style={{ marginTop: 0 }}>
            Reading every project&apos;s last 7 days: what moved, decisions, risks, momentum…
          </div>
        )}
        {review && (
          <div className="form">
            <div className="field">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                style={{ minHeight: 360, fontFamily: "inherit", lineHeight: 1.6 }}
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
                  setReview(null);
                  setError(null);
                }}
              >
                Close
              </button>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Read-only draft. Saving files it as a projectless note; nothing is written until then.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
