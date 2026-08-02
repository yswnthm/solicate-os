"use client";

import { useState } from "react";

import { draftMorningBriefAction, saveMorningBrief } from "@/features/ai-actions";
import { Modal } from "@/components/modal";

export function MorningBriefButton() {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const onDraft = async () => {
    setBusy(true);
    setError(null);
    setBrief(null);
    setSaved(false);
    setOpen(true);
    try {
      const result = await draftMorningBriefAction();
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
      <button className="button" type="button" onClick={onDraft} disabled={busy}>
        {busy ? "Drafting…" : "✨ Morning brief"}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Morning brief">
        {error && <div className="notice" style={{ marginBottom: 16 }}>{error}</div>}
        {!error && !brief && (
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
