"use client";

import { useState } from "react";

import { Modal } from "@/components/modal";

// Shared prompt viewer: shows the exact prompt that would be sent to the model
// so the operator can paste it into an external model like ChatGPT. Nothing is
// sent anywhere by this component.
export function PromptModal({
  open,
  onClose,
  title,
  prompt,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  prompt: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="lg">
      {prompt === null ? (
        <div className="empty" style={{ marginTop: 0 }}>
          Assembling the prompt from your project memory…
        </div>
      ) : (
        <div className="form">
          <div className="field">
            <textarea
              readOnly
              value={prompt}
              style={{ minHeight: 420, fontFamily: "monospace", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="button" type="button" onClick={onCopy}>
              {copied ? "Copied ✓" : "Copy prompt"}
            </button>
            <button className="button ghost" type="button" onClick={onClose}>
              Close
            </button>
          </div>
          <p className="field-hint" style={{ marginTop: 10, marginBottom: 0 }}>
            Paste this into ChatGPT or any model. It includes your full project memory — notes, conversations, and
            financials — so treat it as confidential. Nothing is written or sent to any API by this action.
          </p>
        </div>
      )}
    </Modal>
  );
}
