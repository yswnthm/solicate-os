"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { approveWeeklySummary, draftWeeklySummaryForProject } from "@/features/ai-actions";
import { Modal } from "@/components/modal";

export function WeeklySummaryButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const onDraft = async () => {
    setBusy(true);
    setError(null);
    try {
      const summary = await draftWeeklySummaryForProject(projectId);
      setDraft(summary);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Weekly summary failed.");
      setOpen(true);
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
      <button className="button secondary small" type="button" onClick={onDraft} disabled={busy}>
        {busy ? "Drafting…" : "✨ Weekly summary"}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Weekly update draft">
        {error && <div className="notice" style={{ marginBottom: 16 }}>{error}</div>}
        {draft !== null && (
          <>
            <p className="muted" style={{ marginBottom: 16 }}>
              Drafted from the last 7 days of project activity. Edit freely — nothing is filed until you approve.
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
