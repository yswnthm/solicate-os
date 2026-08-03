"use client";

import { useCallback, useEffect, useState } from "react";

import {
  discardMessageDraft,
  draftMessage,
  getDraftFormOptions,
  getDraftPrompt,
  getDraftRecipients,
  listMessageDrafts,
  saveMessageDraft,
  sendMessageDraft,
  type DraftFormOptions,
} from "@/features/ai-actions";
import { PromptModal } from "@/components/prompt-viewer";

type Recipients = Awaited<ReturnType<typeof getDraftRecipients>>;
type DraftListEntry = Awaited<ReturnType<typeof listMessageDrafts>>[number];

const FALLBACK_OPTIONS: DraftFormOptions = {
  projects: [],
  people: [],
  models: [],
  template: null,
};

export function MessageDrafter() {
  const [options, setOptions] = useState<DraftFormOptions>(FALLBACK_OPTIONS);
  const [recipients, setRecipients] = useState<Recipients>({ participants: [], phases: [] });

  const [projectId, setProjectId] = useState("");
  const [personId, setPersonId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [intent, setIntent] = useState("");
  const [lengthId, setLengthId] = useState("short");
  const [styles, setStyles] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [direction, setDirection] = useState("");
  const [modelId, setModelId] = useState("");

  const [content, setContent] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);

  const [drafts, setDrafts] = useState<DraftListEntry[]>([]);

  useEffect(() => {
    getDraftFormOptions()
      .then((opts) => {
        setOptions(opts);
        setModelId(opts.template?.default_model ?? "");
        setLengthId(opts.template?.lengths?.[0]?.id ?? "short");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load the drafter."));
    refreshDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshDrafts = useCallback(async () => {
    try {
      setDrafts(await listMessageDrafts());
    } catch {
      setDrafts([]);
    }
  }, []);

  const loadRecipients = useCallback(async (project: string) => {
    setRecipients({ participants: [], phases: [] });
    setPersonId("");
    setPhaseId("");
    if (!project) return;
    try {
      setRecipients(await getDraftRecipients(project));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load people for this project.");
    }
  }, []);

  const onProjectChange = (value: string) => {
    setProjectId(value);
    loadRecipients(value);
  };

  const toggleStyle = (style: string) => {
    setStyles((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]));
  };

  const onDraft = async () => {
    if (!projectId || !personId) {
      setError("Pick a project and a person to write to.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await draftMessage({
        projectId,
        personId,
        phaseId: phaseId || null,
        intent,
        length: lengthId,
        styles,
        additionalContext,
        direction,
        modelId: modelId || undefined,
      });
      setContent(result.content);
      setDraftId(null);
      if (result.conversationId) {
        setNotice(`Drafted for an existing conversation${result.modelName ? ` (${result.modelName})` : ""}.`);
      } else if (result.modelName) {
        setNotice(`No conversation found yet — Mark sent will create one. (${result.modelName})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Drafting failed. Check your model provider keys.");
    } finally {
      setBusy(false);
    }
  };

  const onGetPrompt = async () => {
    if (!projectId || !personId) {
      setError("Pick a project and a person to write to.");
      return;
    }
    setPromptBusy(true);
    setError(null);
    setPrompt(null);
    setPromptOpen(true);
    try {
      setPrompt(
        await getDraftPrompt({
          projectId,
          personId,
          phaseId: phaseId || null,
          intent,
          length: lengthId,
          styles,
          additionalContext,
          direction,
          modelId: modelId || undefined,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build the prompt.");
      setPromptOpen(false);
    } finally {
      setPromptBusy(false);
    }
  };

  const persistCurrent = async (): Promise<string> => {
    const body = content.trim();
    if (!body) throw new Error("The message is empty.");
    return saveMessageDraft(
      {
        projectId,
        personId,
        phaseId: phaseId || null,
        intent,
        length: lengthId,
        styles,
        additionalContext,
        direction,
        modelId: modelId || undefined,
      },
      body,
    );
  };

  const onSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const savedId = draftId ?? (await persistCurrent());
      setDraftId(savedId);
      setNotice("Draft saved. Nothing is sent until you mark it sent.");
      await refreshDrafts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    setBusy(true);
    setError(null);
    try {
      const savedId = draftId ?? (await persistCurrent());
      await sendMessageDraft(savedId);
      setDraftId(null);
      setContent("");
      setNotice("Marked sent — logged as an outbound message on the conversation.");
      await refreshDrafts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Marking sent failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDiscard = async () => {
    setBusy(true);
    setError(null);
    try {
      if (draftId) await discardMessageDraft(draftId);
      setDraftId(null);
      setContent("");
      setNotice("Draft discarded.");
      await refreshDrafts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discard failed.");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadDraft = (d: DraftListEntry) => {
    const rel = (v: unknown) => (Array.isArray(v) ? v[0] : v) as { id?: string; name?: string } | undefined;
    setProjectId(String(rel(d.projects)?.id ?? ""));
    setPersonId(String(rel(d.people)?.id ?? ""));
    setPhaseId("");
    setContent(d.content);
    setDraftId(d.id);
    setLengthId(d.length_label || "short");
    setDirection(String(d.direction ?? ""));
    setNotice(`Loaded a ${d.status} draft. Edit it, then save or mark sent.`);
    loadRecipients(String(rel(d.projects)?.id ?? ""));
  };

  const length = options.template?.lengths?.find((l) => l.id === lengthId);
  const styleOptions = options.template?.styles ?? [];
  const canDraft = Boolean(projectId && personId);

  return (
    <div className="stack">
      <div className="card" style={{ padding: 20 }}>
        <div className="form">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="drafter-project">Project</label>
              <select id="drafter-project" value={projectId} onChange={(e) => onProjectChange(e.target.value)}>
                <option value="">Choose project</option>
                {options.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.client ? `${p.client} / ` : ""}
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="drafter-person">Write to</label>
              <select
                id="drafter-person"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                disabled={!projectId}
              >
                <option value="">{projectId ? "Choose person" : "Pick a project first"}</option>
                {recipients.participants.map((p) => (
                  <option key={p.person_id} value={p.person_id}>
                    {p.name}
                    {p.role ? ` — ${p.role}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="drafter-phase">Phase (optional)</label>
              <select id="drafter-phase" value={phaseId} onChange={(e) => setPhaseId(e.target.value)} disabled={!projectId}>
                <option value="">No phase</option>
                {recipients.phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.position}. {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="drafter-intent">What should the message do?</label>
            <input
              id="drafter-intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Confirm the revised timeline and ask them to approve the proposal"
            />
          </div>

          <div className="field">
            <label htmlFor="drafter-direction">Message flow (optional)</label>
            <input
              id="drafter-direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              placeholder="e.g. Acknowledge the delay first, recap what's confirmed, then ask them to approve"
            />
            <p className="field-hint">The order and progression of the message — what leads, what closes. Not the tone.</p>
          </div>

          {length && (
            <div className="field">
              <label>Length</label>
              <div className="chip-group">
                {options.template?.lengths?.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`chip ${l.id === lengthId ? "active" : ""}`}
                    onClick={() => setLengthId(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="field-hint">{length.hint}</p>
            </div>
          )}

          {styleOptions.length > 0 && (
            <div className="field">
              <label>Style {styles.length > 0 ? `(${styles.length} selected)` : ""}</label>
              <div className="chip-group">
                {styleOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${styles.includes(s) ? "active" : ""}`}
                    onClick={() => toggleStyle(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="field-hint">Optional. Pick none for the template&apos;s default tone.</p>
            </div>
          )}

          <div className="field">
            <label htmlFor="drafter-context">Extra context (optional)</label>
            <textarea
              id="drafter-context"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Anything the model can't know from Solicate: recent call details, tone preferences, specifics…"
              style={{ minHeight: 72 }}
            />
          </div>

          <div className="field">
            <label htmlFor="drafter-model">Model (advanced)</label>
            <select id="drafter-model" value={modelId} onChange={(e) => setModelId(e.target.value)}>
              <option value="">Template default</option>
              {options.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </select>
            <p className="field-hint">Default: {options.template?.default_model ?? "unset"}.</p>
          </div>

          <button className="button" type="button" onClick={onDraft} disabled={busy || !canDraft} style={{ marginTop: 4 }}>
            {busy ? "Drafting…" : "Draft message"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={onGetPrompt}
            disabled={promptBusy || !canDraft}
            style={{ marginTop: 4 }}
          >
            {promptBusy ? "Building…" : "Copy prompt for ChatGPT"}
          </button>
          <p className="field-hint" style={{ marginTop: 8, marginBottom: 0 }}>
            Solicate gathers the project, phase, person, conversation history, records, and financials automatically.
            Only the message comes back — nothing is written until you save or mark sent.
          </p>
        </div>
      </div>

      {error && <div className="notice" style={{ margin: 0 }}>{error}</div>}
      {notice && <div className="notice" style={{ margin: 0 }}>{notice}</div>}

      {content && (
        <div className="card" style={{ padding: 20 }}>
          <div className="field">
            <label htmlFor="drafter-content">Draft message</label>
            <textarea
              id="drafter-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ minHeight: 260, fontFamily: "inherit", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="button" type="button" onClick={onSend} disabled={busy}>
              {busy ? "Working…" : "Mark sent"}
            </button>
            <button className="button secondary" type="button" onClick={onSave} disabled={busy}>
              {draftId ? "Save changes" : "Save draft"}
            </button>
            <button className="button secondary" type="button" onClick={onCopy} disabled={busy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button className="button ghost" type="button" onClick={onDraft} disabled={busy}>
              Regenerate
            </button>
            {content && (
              <button className="button ghost danger" type="button" onClick={onDiscard} disabled={busy}>
                Discard
              </button>
            )}
          </div>
          <p className="field-hint" style={{ marginTop: 10, marginBottom: 0 }}>
            Nothing is written to the system until you press Mark sent. Marking sent files it as an outbound message
            on the project&apos;s conversation with this person — creating the conversation if it doesn&apos;t exist.
          </p>
        </div>
      )}

      <section className="section">
        <div className="section-title">
          <h2>Recent drafts</h2>
          <span>Saved and sent</span>
        </div>
        {drafts.length === 0 ? (
          <div className="empty">No saved drafts yet. Draft your first message above.</div>
        ) : (
          <div className="list">
            {drafts.map((d) => {
              const rel = (v: unknown) => (Array.isArray(v) ? v[0] : v) as { id?: string; name?: string } | undefined;
              return (
                <div className="row" key={d.id}>
                  <span className={`pill ${d.status === "sent" ? "" : "active"}`}>{d.status}</span>
                  <div className="row-main">
                    <div className="row-title">{rel(d.people)?.name ?? "Contact"} · {rel(d.projects)?.name ?? "Project"}</div>
                    <div className="row-meta">{d.content.slice(0, 100)}{d.content.length > 100 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {d.status === "draft" && (
                      <>
                        <button className="button ghost small" type="button" onClick={() => loadDraft(d)}>
                          Load
                        </button>
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={async () => {
                            try {
                              await sendMessageDraft(d.id);
                              await refreshDrafts();
                              setNotice("Marked sent.");
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Failed to mark sent.");
                            }
                          }}
                        >
                          Mark sent
                        </button>
                      </>
                    )}
                    <button
                      className="button ghost small"
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(d.content);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <PromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Message drafter prompt"
        prompt={prompt}
      />
    </div>
  );
}
