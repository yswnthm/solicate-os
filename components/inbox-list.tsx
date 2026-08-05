"use client";

import { useEffect, useOptimistic, useTransition, useState } from "react";
import Link from "next/link";

import { dismissInboxEntry, fileInboxEntryToProject } from "@/features/actions";
import { approveInboxDraft, draftInboxTriage, getInboxTriagePrompt, getModelPickerOptions, type ModelPickerOptions } from "@/features/ai-actions";
import { StatusPill } from "@/components/status-pill";
import { Modal } from "@/components/modal";
import { PromptModal } from "@/components/prompt-viewer";
import { EditEntryButton } from "@/components/editing/edit-buttons";
import { ModelPicker } from "@/components/model-picker";
import { formatDateTime } from "@/lib/utils";
import type { TriageDraft } from "@/lib/ai/schemas";

type InboxState = { entries: any[] };
type Removed = { id: string };
type ReviewState = { id: string } | null;

const ENTRY_TYPES = ["note", "meeting", "decision", "document", "update", "milestone", "capture"];

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

  const [drafting, setDrafting] = useState<Removed | null>(null);
  const [review, setReview] = useState<ReviewState>(null);
  const [draft, setDraft] = useState<TriageDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [fileTo, setFileTo] = useState<any | null>(null);

  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);

  const [modelOptions, setModelOptions] = useState<ModelPickerOptions>({ models: [], default_model: "" });
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    getModelPickerOptions("inbox-triage")
      .then(setModelOptions)
      .catch(() => {});
  }, []);

  const onGetPrompt = async (itemId: string) => {
    setPromptBusy(true);
    setDraftError(null);
    setPrompt(null);
    setPromptOpen(true);
    try {
      setPrompt(await getInboxTriagePrompt("entry", itemId));
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "Failed to build the prompt.");
      setPromptOpen(false);
    } finally {
      setPromptBusy(false);
    }
  };

  const run = (removed: Removed, formData: FormData, action: (fd: FormData) => Promise<void>) => {
    addOptimistic(removed);
    startTransition(async () => {
      await action(formData);
    });
  };

  const onDraft = async (itemId: string) => {
    setDrafting({ id: itemId });
    setDraftError(null);
    try {
      const result = await draftInboxTriage("entry", itemId, modelId || undefined);
      setDraft({ ...result, project_id: result.project_id ?? "" });
      setReview({ id: itemId });
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
    addOptimistic({ id: review.id });
    startTransition(async () => {
      try {
        await approveInboxDraft("entry", review.id, payload);
      } catch (e) {
        setDraftError(e instanceof Error ? e.message : "Approve failed.");
      }
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
          gap: 16,
          background: "var(--glass-bg)",
          border: "1px stroke var(--glass-border)",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          ✓
        </div>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Inbox is clear</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
            All incoming captures and quick notes are triaged. Use the quick capture bar above or launch a workflow below.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
          <Link href="/inbox?tab=capture" className="button secondary small">
            ⚡ AI Deep Capture →
          </Link>
          <Link href="/projects" className="button secondary small">
            📁 View Projects →
          </Link>
        </div>
      </div>
    );
  }

  const runFileTo = (formData: FormData) => {
    const entryId = String(formData.get("entry_id") ?? "");
    if (!fileTo) return;
    addOptimistic({ id: entryId });
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
        onClick={() => onDraft(entry.id)}
        disabled={drafting?.id === entry.id}
        title="Draft a filed record with AI, then approve"
      >
        {drafting?.id === entry.id ? "Drafting…" : "✨ Draft"}
      </button>
      <button
        className="button ghost small"
        type="button"
        onClick={() => onGetPrompt(entry.id)}
        disabled={promptBusy}
        title="Copy the AI prompt for ChatGPT"
      >
        Prompt
      </button>
      <button
        className="button small"
        type="button"
        onClick={() => setFileTo(entry)}
        title="File and route to a project"
      >
        File to…
      </button>
      <form className="inline-form" action={(fd) => run({ id: entry.id }, fd, dismissInboxEntry)}>
        <input type="hidden" name="entry_id" value={entry.id} />
        <button className="button ghost small" type="submit" title="Dismiss">
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

      {/* Model Picker moved to Modal */}

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

      <Modal
        isOpen={drafting !== null || (review !== null && draft !== null)}
        onClose={() => {
          setReview(null);
          setDraft(null);
          setDrafting(null);
        }}
        title="Review AI draft"
      >
        {modelOptions.models.length > 0 && (
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <ModelPicker
              models={modelOptions.models}
              value={modelId}
              onChange={setModelId}
              defaultModel={modelOptions.default_model}
              fieldId="inbox-model"
            />
            {draft !== null && review !== null && (
              <button className="button ghost small" onClick={() => onDraft(review.id)} disabled={drafting !== null} style={{ marginTop: 8 }}>
                ↻ Redraft with selected model
              </button>
            )}
          </div>
        )}

        {drafting !== null && (
          <div className="empty" style={{ marginTop: 0 }}>Drafting record from inbox item...</div>
        )}
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
                        {clientName(p.people) ? `${clientName(p.people)} / ` : ""}
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
                  {clientName(p.people) ? `${clientName(p.people)} / ` : ""}
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
      <PromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Triage prompt"
        prompt={prompt}
      />
    </>
  );
}
