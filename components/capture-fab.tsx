"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { usePathname } from "next/navigation";
import { quickCapture } from "@/features/actions";

export function CaptureFAB({ projects = [] }: { projects?: any[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Mentions state
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const pathname = usePathname();
  
  const projectIdMatch = pathname.match(/\/projects\/([a-f0-9-]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;

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
        setSelectedProjectId(null);
        setMentionSearch(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const suggestions = projects
    ? projects.filter(p => p.name.toLowerCase().includes((mentionSearch ?? "").toLowerCase()))
    : [];

  const handleSelectMention = (project: any) => {
    if (mentionIndex === null) return;
    
    const before = title.slice(0, mentionIndex);
    const after = title.slice(textareaRef.current?.selectionStart ?? title.length);
    
    const newTitle = before + `@${project.name} ` + after;
    setTitle(newTitle);
    setSelectedProjectId(project.id);
    
    setMentionSearch(null);
    setMentionIndex(null);
    setActiveSuggestion(0);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = before.length + project.name.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleSave = () => {
    if (!title.trim() || isPending) return;
    setError(null);

    const finalProjectId = selectedProjectId || projectId;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("type", finalProjectId ? "note" : "capture");
    if (finalProjectId) formData.append("project_id", finalProjectId);

    startTransition(async () => {
      try {
        await quickCapture(formData);
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setOpen(false);
          setTitle("");
          setSelectedProjectId(null);
          setMentionSearch(null);
        }, 700);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSearch !== null && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion(s => Math.min(s + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion(s => Math.max(s - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectMention(suggestions[activeSuggestion]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionSearch(null);
        return;
      }
    }

    // Cmd/Ctrl + Enter to save
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    // Escape to close
    if (e.key === "Escape") {
      setOpen(false);
      setTitle("");
      setSelectedProjectId(null);
      setMentionSearch(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTitle(val);
    
    // Check if user is typing a mention
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([^@\s]*)$/);
    
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setMentionIndex(cursor - mentionMatch[1].length - 1);
      setActiveSuggestion(0);
    } else {
      setMentionSearch(null);
      setMentionIndex(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTitle("");
    setError(null);
    setSelectedProjectId(null);
    setMentionSearch(null);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="New capture (C)"
        title="New capture (C)"
        className="capture-fab-btn"
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
          className="capture-modal-backdrop"
        >
          <div className="capture-modal-card">
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
                {selectedProjectId || projectId ? "Log to Project" : "New Capture"}
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
                placeholder="What's on your mind? (Type @ to link a project)"
                value={title}
                onChange={handleChange}
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

              {mentionSearch !== null && suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "70px",
                    left: "22px",
                    right: "22px",
                    background: "rgba(20,20,20,0.9)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
                    overflow: "hidden",
                    maxHeight: 180,
                    overflowY: "auto",
                    zIndex: 20,
                  }}
                >
                  {suggestions.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectMention(p);
                      }}
                      onMouseEnter={() => setActiveSuggestion(i)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        background: i === activeSuggestion ? "rgba(255,255,255,0.05)" : "transparent",
                        border: "none",
                        borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                        color: i === activeSuggestion ? "#fff" : "var(--muted)",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "background 0.1s ease, color 0.1s ease"
                      }}
                    >
                      <span style={{ color: "var(--accent)", fontSize: 13, opacity: i === activeSuggestion ? 1 : 0.6 }}>#</span>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
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
