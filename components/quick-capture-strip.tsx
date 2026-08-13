"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { quickCapture } from "@/features/actions";

export function QuickCaptureStrip() {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [title]);

  const handleSubmit = () => {
    if (!title.trim() || isPending) return;
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("type", "capture");

    startTransition(async () => {
      try {
        await quickCapture(formData);
        setTitle("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save idea.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits, Shift+Enter creates a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="card" style={{ padding: "12px 16px", marginBottom: 24, marginTop: 0, borderRadius: 14 }}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <textarea
          ref={textareaRef}
          placeholder="Write an idea or note... (Shift + Enter for new lines)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--ink)",
            fontSize: 14,
            lineHeight: "1.5",
            padding: "4px 0",
            resize: "none",
            fontFamily: "inherit",
            overflowY: "auto",
            maxHeight: 240,
          }}
        />

        <button
          type="submit"
          className="button small"
          disabled={isPending || !title.trim()}
          style={{ flexShrink: 0, marginBottom: 2 }}
        >
          {isPending ? "Saving..." : "+ Add"}
        </button>
      </form>

      {success && (
        <div style={{ color: "var(--accent)", fontSize: 12, marginTop: 6 }}>
          Saved to Inbox ✓
        </div>
      )}
      {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
