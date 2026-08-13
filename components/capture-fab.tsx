"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { quickCapture } from "@/features/actions";

export function CaptureFAB() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 340)}px`;
    }
  }, [title]);

  // Global keyboard shortcut: C, N, or ⌘N to open (when not typing in an input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Cmd+N / Ctrl+N
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Standalone C or N key
      if (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "n") {
        e.preventDefault();
        setOpen(true);
      }

      if (e.key === "Escape") {
        setOpen(false);
        setTitle("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSave = () => {
    if (!title.trim() || isPending) return;
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("type", "capture");

    startTransition(async () => {
      try {
        await quickCapture(formData);
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setOpen(false);
          setTitle("");
        }, 700);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to save
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    // Escape to close
    if (e.key === "Escape") {
      setOpen(false);
      setTitle("");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTitle("");
    setError(null);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="New capture (C)"
        title="New capture  (C)"
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#000",
          border: "none",
          cursor: "pointer",
          fontSize: 28,
          fontWeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
          zIndex: 9998,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)";
        }}
      >
        +
      </button>

      {/* Modal Backdrop */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            style={{
              background: "var(--card-bg, #111)",
              borderRadius: 22,
              width: "100%",
              maxWidth: 540,
              boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
              border: "1px solid var(--glass-border)",
              overflow: "hidden",
              animation: "slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Top bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px 14px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                New Capture
              </span>
              {/* Keyboard shortcut hint */}
              <span style={{ fontSize: 11, color: "var(--muted)", opacity: 0.5, letterSpacing: "0.03em" }}>
                ⌘↵ save
              </span>
            </div>

            {/* Textarea */}
            <div style={{ padding: "20px 22px 12px" }}>
              <textarea
                ref={textareaRef}
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending || saved}
                rows={3}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--ink)",
                  fontSize: 16,
                  lineHeight: 1.65,
                  resize: "none",
                  fontFamily: "inherit",
                  minHeight: 80,
                  maxHeight: 340,
                  overflowY: "auto",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  margin: "0 22px 12px",
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10,
                  color: "#f87171",
                  fontSize: 13,
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "12px 20px 18px",
                gap: 10,
              }}
            >
              <button
                onClick={handleSave}
                disabled={isPending || !title.trim() || saved}
                className="button"
                style={{
                  fontSize: 14,
                  padding: "9px 24px",
                  borderRadius: 999,
                  opacity: !title.trim() ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {saved ? "Saved ✓" : isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
