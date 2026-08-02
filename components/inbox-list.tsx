"use client";

import { useOptimistic, useTransition, useState } from "react";
import Link from "next/link";

import { dismissInboxEntry, dismissInboxMessage, fileInboxEntryToProject, fileInboxMessage } from "@/features/actions";
import { approveInboxDraft, draftInboxTriage } from "@/features/ai-actions";
import { StatusPill } from "@/components/status-pill";
import { Modal } from "@/components/modal";
import { EditEntryButton, EditMessageButton } from "@/components/editing/edit-buttons";
import { formatDateTime } from "@/lib/utils";
import type { TriageDraft } from "@/lib/ai";

type InboxState = { entries: any[]; messages: any[] };
type Removed = { kind: "entry" | "message"; id: string };
type ReviewState = { kind: "entry" | "message"; id: string } | null;

const ENTRY_TYPES = ["note", "meeting", "decision", "document", "update", "milestone", "capture"];

type InboxProject = {
  id: string;
  name: string;
  clients?: Array<{ name: string }> | { name: string } | null;
};

const clientName = (c: InboxProject["clients"]) =>
  Array.isArray(c) ? c[0]?.name ?? null : c?.name ?? null;

export function InboxList({
  entries,
  messages,
  projects,
}: InboxState & { projects: InboxProject[] }) {
  const [optimistic, addOptimistic] = useOptimistic(
    { entries, messages },
    (state: InboxState, removed: Removed): InboxState => ({
      entries: removed.kind === "entry" ? state.entries.filter((e) => e.id !== removed.id) : state.entries,
      messages: removed.kind === "message" ? state.messages.filter((m) => m.id !== removed.id) : state.messages,
    }),
  );
  const [, startTransition] = useTransition();

  const [drafting, setDrafting] = useState<Removed | null>(null);
  const [review, setReview] = useState<ReviewState>(null);
  const [draft, setDraft] = useState<TriageDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [fileTo, setFileTo] = useState<any | null>(null);

  const run = (removed: Removed, formData: FormData, action: (fd: FormData) => Promise<void>) => {
    addOptimistic(removed);
    startTransition(async () => {
      await action(formData);
    });
  };

  const onDraft = async (kind: "entry" | "message", itemId: string) => {
    setDrafting({ kind, id: itemId });
    setDraftError(null);
    try {
      const result = await draftInboxTriage(kind, itemId);
      setDraft({ ...result, project_id: result.project_id ?? "" });
      setReview({ kind, id: itemId });
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "AI draft failed. Check GROQ_API_KEY.");
    } finally {
      setDrafting(null);
    }
  };

  const approve = () => {
    if (!review || !draft) return;
    const payload: TriageDraft = {
      title: draft.title.trim(),
      type: draft.type,
      project_id: draft.project_id || null,
      body_md: draft.body_md.trim(),
    };
    if (!payload.title || !payload.body_md) return;
    setReview(null);
    setDraft(null);
    addOptimistic({ kind: review.kind, id: review.id });
    startTransition(async () => {
      try {
        await approveInboxDraft(review.kind, review.id, payload);
      } catch (e) {
        setDraftError(e instanceof Error ? e.message : "Approve failed.");
      }
    });
  };

  const total = optimistic.entries.length + optimistic.messages.length;

  if (total === 0) {
    return (
      <div className="empty" style={{ marginTop: 0 }}>
        Inbox is clear. Nothing needs triage right now.
      </div>
    );
  }

  const runFileTo = (formData: FormData) => {
    const entryId = String(formData.get("entry_id") ?? "");
    if (!fileTo) return;
    addOptimistic({ kind: "entry", id: entryId });
    setFileTo(null);
    startTransition(async () => {
      await fileInboxEntryToProject(formData);
    });
  };

  const entryRowActions = (entry: any) => (
    <div className="row-actions-always">
      {entry.project_id && (
        <Link className="button secondary small" href={`/projects/${entry.project_id}`}>
          Open project
        </Link>
      )}
      <EditEntryButton entry={entry} projects={projects} />
      <button
        className="button ghost small"
        type="button"
        onClick={() => onDraft("entry", entry.id)}
        disabled={drafting?.id === entry.id}
        title="Draft a filed record with AI, then approve"
      >
        {drafting?.id === entry.id && drafting?.kind === "entry" ? "Drafting…" : "✨ Draft"}
      </button>
      <button
        className="button small"
        type="button"
        onClick={() => setFileTo(entry)}
        title="File and route to a project"
      >
        File to…
      </button>
      <form className="inline-form" action={(fd) => run({ kind: "entry", id: entry.id }, fd, dismissInboxEntry)}>
        <input type="hidden" name="entry_id" value={entry.id} />
        <button className="button ghost small" type="submit" title="Dismiss">
          Dismiss
        </button>
      </form>
    </div>
  );

  const messageRowActions = (message: any) => (
    <div className="row-actions-always">
      {message.conversations?.project_id && (
        <Link
          className="button secondary small"
          href={`/projects/${message.conversations.project_id}?thread=${message.conversation_id}`}
          title="Open the conversation thread on the project"
        >
          Open thread
        </Link>
      )}
      <EditMessageButton
        message={message}
        conversationId={message.conversation_id}
        projectId={message.conversations?.project_id ?? null}
      />
      <button
        className="button ghost small"
        type="button"
        onClick={() => onDraft("message", message.id)}
        disabled={drafting?.id === message.id}
        title="Draft a filed record with AI, then approve"
      >
        {drafting?.id === message.id && drafting?.kind === "message" ? "Drafting…" : "✨ Draft"}
      </button>
      <form className="inline-form" action={(fd) => run({ kind: "message", id: message.id }, fd, fileInboxMessage)}>
        <input type="hidden" name="message_id" value={message.id} />
        <button className="button small" type="submit">
          File
        </button>
      </form>
      <form className="inline-form" action={(fd) => run({ kind: "message", id: message.id }, fd, dismissInboxMessage)}>
        <input type="hidden" name="message_id" value={message.id} />
        <button className="button ghost small" type="submit">
          Dismiss
        </button>
      </form>
    </div>
  );

  return (
    <>
      {draftError && (
        <div className="notice" style={{ marginBottom: 16 }}>
          {draftError}
        </div>
      )}

      {optimistic.entries.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Captures</h2>
            <span>{optimistic.entries.length} untriaged</span>
          </div>
          <div className="list">
            {optimistic.entries.map((entry: any) => (
              <div className="row" key={entry.id}>
                <StatusPill value={entry.type} />
                <div className="row-main">
                  <div className="row-title">{entry.title}</div>
                  <div className="row-meta">
                    {entry.projects?.name ?? "No project"} · {formatDateTime(entry.occurred_at)}
                  </div>
                </div>
                {entryRowActions(entry)}
              </div>
            ))}
          </div>
        </section>
      )}

      {optimistic.messages.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Messages</h2>
            <span>{optimistic.messages.length} untriaged</span>
          </div>
          <div className="list">
            {optimistic.messages.map((message: any) => (
              <div className="row" key={message.id}>
                <StatusPill value="message" />
                <div className="row-main">
                  <div className="row-title">{message.conversations?.title ?? "Conversation"}</div>
                  <div className="row-meta">
                    {formatDateTime(message.sent_at)} · {message.body_md.slice(0, 140)}
                  </div>
                </div>
                {messageRowActions(message)}
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal
        isOpen={review !== null && draft !== null}
        onClose={() => {
          setReview(null);
          setDraft(null);
        }}
        title="Review AI draft"
      >
        {draft && (
          <>
            <p className="muted" style={{ marginBottom: 16 }}>
              Drafted from the raw item. Edit anything — nothing is saved until you approve.
            </p>
            <div className="form">
              <div className="field">
                <label>Title</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Type</label>
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as TriageDraft["type"] })}
                  >
                    {ENTRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Project (optional)</label>
                  <select
                    value={draft.project_id ?? ""}
                    onChange={(e) => setDraft({ ...draft, project_id: e.target.value })}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {clientName(p.clients) ? `${clientName(p.clients)} / ` : ""}
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Record body</label>
                <textarea
                  value={draft.body_md}
                  onChange={(e) => setDraft({ ...draft, body_md: e.target.value })}
                  style={{ minHeight: 120 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="button" type="button" onClick={approve}>
                  Approve &amp; file
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setReview(null);
                    setDraft(null);
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
      <Modal
        isOpen={fileTo !== null}
        onClose={() => setFileTo(null)}
        title={fileTo ? `File — ${fileTo.title.slice(0, 48)}` : "File capture"}
      >
        <p className="muted" style={{ marginBottom: 16 }}>
          Route this capture to a project, or leave it unsorted. Either way it leaves the inbox.
        </p>
        <form className="form" action={runFileTo}>
          <input type="hidden" name="entry_id" value={fileTo?.id ?? ""} />
          <div className="field">
            <label>Destination project</label>
            <select name="project_id" defaultValue={fileTo?.project_id ?? ""}>
              <option value="">Unsorted (no project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {clientName(p.clients) ? `${clientName(p.clients)} / ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            File capture
          </button>
        </form>
      </Modal>
    </>
  );
}
