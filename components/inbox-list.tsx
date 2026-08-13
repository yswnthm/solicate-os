"use client";

import { useOptimistic, useTransition, useState, useEffect, useRef } from "react";
import { MoreHorizontal, Edit2, FolderPlus, Trash2 } from "lucide-react";

import { dismissInboxEntry, fileInboxEntryToProject } from "@/features/actions";
import { Modal } from "@/components/modal";
import { EditEntryModal } from "@/components/editing/entity-edit-modals";
import { formatDateTime } from "@/lib/utils";

type InboxState = { entries: any[] };
type Removed = { id: string };

type InboxProject = {
  id: string;
  name: string;
  people?: Array<{ name: string }> | { name: string } | null;
};

const clientName = (c: InboxProject["people"]) =>
  Array.isArray(c) ? c[0]?.name ?? null : c?.name ?? null;

export function InboxList({ entries, projects }: InboxState & { projects: InboxProject[] }) {
  const [optimistic, addOptimistic] = useOptimistic(
    { entries },
    (state: InboxState, removed: Removed): InboxState => ({
      entries: state.entries.filter((e) => e.id !== removed.id),
    }),
  );
  const [, startTransition] = useTransition();

  const [fileTo, setFileTo] = useState<any | null>(null);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const runDismiss = (entryId: string) => {
    addOptimistic({ id: entryId });
    setActiveMenuId(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("entry_id", entryId);
      await dismissInboxEntry(fd);
    });
  };

  const runFileTo = (formData: FormData) => {
    const entryId = String(formData.get("entry_id") ?? "");
    if (!fileTo) return;
    addOptimistic({ id: entryId });
    setFileTo(null);
    startTransition(async () => {
      await fileInboxEntryToProject(formData);
    });
  };

  const total = optimistic.entries.length;

  if (total === 0) {
    return (
      <div
        className="card"
        style={{
          marginTop: 0,
          padding: "36px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ✓
        </div>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Inbox is empty</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            No saved ideas or notes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="list">
        {optimistic.entries.map((entry: any) => (
          <RowItem
            key={entry.id}
            entry={entry}
            isMenuOpen={activeMenuId === entry.id}
            onToggleMenu={() => setActiveMenuId(activeMenuId === entry.id ? null : entry.id)}
            onCloseMenu={() => setActiveMenuId(null)}
            onEdit={() => {
              setActiveMenuId(null);
              setEditingEntry(entry);
            }}
            onFile={() => {
              setActiveMenuId(null);
              setFileTo(entry);
            }}
            onDismiss={() => runDismiss(entry.id)}
          />
        ))}
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          projects={projects}
          open={editingEntry !== null}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
        />
      )}

      {/* File To Project Modal */}
      <Modal
        isOpen={fileTo !== null}
        onClose={() => setFileTo(null)}
        title={fileTo ? `File — ${fileTo.title.slice(0, 48)}` : "File note"}
      >
        <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
          Move this note to a project.
        </p>
        <form className="form" action={runFileTo}>
          <input type="hidden" name="entry_id" value={fileTo?.id ?? ""} />
          <div className="field">
            <label style={{ fontSize: 12 }}>Destination project</label>
            <select name="project_id" defaultValue={fileTo?.project_id ?? ""}>
              <option value="">Unsorted (no project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {clientName(p.people) ? `${clientName(p.people)} / ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            File note
          </button>
        </form>
      </Modal>
    </>
  );
}

function RowItem({
  entry,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onFile,
  onDismiss,
}: {
  entry: any;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onFile: () => void;
  onDismiss: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, onCloseMenu]);

  return (
    <div className="row" style={{ padding: "14px 16px", position: "relative" }}>
      <div className="row-main">
        <div className="row-title" style={{ fontSize: 14, fontWeight: 500 }}>
          {entry.title}
        </div>
        <div className="row-meta" style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
          {entry.projects?.name ? `${entry.projects.name} · ` : ""}
          {formatDateTime(entry.occurred_at)}
        </div>
      </div>

      <div style={{ position: "relative" }} ref={menuRef}>
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="More actions"
          style={{
            background: "transparent",
            border: "1px solid var(--line)",
            borderRadius: 8,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            cursor: "pointer",
            transition: "all var(--transition)",
          }}
        >
          <MoreHorizontal size={16} />
        </button>

        {isMenuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 38,
              zIndex: 100,
              background: "var(--card-bg, #161616)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 6,
              width: 160,
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={onEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                fontSize: 13,
                color: "var(--ink)",
                background: "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Edit2 size={14} style={{ opacity: 0.7 }} />
              Edit note
            </button>

            <button
              type="button"
              onClick={onFile}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                fontSize: 13,
                color: "var(--ink)",
                background: "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <FolderPlus size={14} style={{ opacity: 0.7 }} />
              File to project…
            </button>

            <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />

            <button
              type="button"
              onClick={onDismiss}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                fontSize: 13,
                color: "var(--danger, #ef4444)",
                background: "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Trash2 size={14} style={{ opacity: 0.8 }} />
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
