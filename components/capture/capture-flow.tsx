"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  answerClarifications,
  approveCaptureActions,
  discardCapture,
  extractMoreActions,
  regenerateProposal,
  submitCapture,
  type CaptureDecision,
} from "@/features/capture-actions";
import type { CaptureSessionState, ClarificationQuestion } from "@/lib/capture/types";
import { ACTION_SPECS, KIND_LABELS } from "@/components/capture/action-fields";
import { ModelPicker, type ModelPickerOption } from "@/components/model-picker";

export interface CaptureFormOptions {
  projects: { id: string; name: string; client: string | null; phases: { id: string; name: string; position: number; status: string }[] }[];
  clients: { id: string; name: string }[];
  people: { id: string; name: string }[];
  models: ModelPickerOption[];
  default_model: string;
}

type Step = "form" | "analyzing" | "clarify" | "review" | "done";

const SCOPES = [
  { value: "existing_project", title: "Existing project", hint: "This happened in a project you already track" },
  { value: "new_project", title: "New project", hint: "This starts a brand-new project" },
  { value: "projectless", title: "No project", hint: "Agency-level thought, file it without a project" },
] as const;

export function CaptureFlow({ options }: { options: CaptureFormOptions }) {
  const [step, setStep] = useState<Step>("form");
  const [state, setState] = useState<CaptureSessionState | null>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const [scope, setScope] = useState<"existing_project" | "new_project" | "projectless">("existing_project");
  const [projectId, setProjectId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [personId, setPersonId] = useState("");
  const [newPhaseName, setNewPhaseName] = useState("");
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [text, setText] = useState("");
  const [modelId, setModelId] = useState("");

  const run = (label: string, fn: () => Promise<CaptureSessionState>) => {
    setError("");
    startTransition(async () => {
      try {
        const next = await fn();
        setState(next);
        if (next.status === "awaiting_clarification") setStep("clarify");
        else if (next.status === "proposals_ready" || next.status === "approved" || next.status === "executed") setStep(next.actions.length ? "review" : "done");
        else if (next.status === "error") setStep("done");
        else setStep("review");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
        setStep("form");
      }
    });
  };

  const onSubmit = () => {
    run("submit", () =>
      submitCapture(
        {
          scope,
          project_id: scope === "existing_project" && projectId ? projectId : null,
          phase_id: phaseId || null,
          person_id: personId || null,
          client_id: clientId || null,
          new_client_name: newClientName || null,
          new_phase_name: newPhaseName || null,
          text,
        },
        modelId || undefined,
      ),
    );
  };

  const onAnswers = (answers: Record<string, string>) => {
    if (!state) return;
    run("propose", () => answerClarifications(state.sessionId, answers, modelId || undefined));
  };

  const onApprove = (decisions: CaptureDecision[]) => {
    if (!state) return;
    run("apply", () => approveCaptureActions(state.sessionId, decisions));
  };

  const onDiscard = () => {
    if (!state) return;
    run("discard", () => discardCapture(state.sessionId));
  };

  const onRegenerate = () => {
    if (!state) return;
    run("regenerate", () => regenerateProposal(state.sessionId, modelId || undefined));
  };

  const onExtractMore = () => {
    if (!state) return;
    run("extract-more", () => extractMoreActions(state.sessionId, modelId || undefined));
  };

  const reset = () => {
    setState(null);
    setText("");
    setNewPhaseName("");
    setNewClientName("");
    setStep("form");
  };

  return (
    <div className="capture-flow">
      {error && <div className="notice error">{error}</div>}

      {step === "form" && (
        <CaptureForm
          options={options}
          scope={scope}
          setScope={setScope}
          projectId={projectId}
          setProjectId={setProjectId}
          phaseId={phaseId}
          setPhaseId={setPhaseId}
          personId={personId}
          setPersonId={setPersonId}
          newPhaseName={newPhaseName}
          setNewPhaseName={setNewPhaseName}
          clientId={clientId}
          setClientId={setClientId}
          newClientName={newClientName}
          setNewClientName={setNewClientName}
          text={text}
          setText={setText}
          modelId={modelId}
          setModelId={setModelId}
          onSubmit={onSubmit}
        />
      )}

      {step === "analyzing" && <AnalyzingStep text={text} />}

      {step === "clarify" && state && (
        <ClarifyStep state={state} onAnswers={onAnswers} onCancel={reset} />
      )}

      {step === "review" && state && (
        <ReviewStep
          state={state}
          onApprove={onApprove}
          onDiscard={onDiscard}
          onRegenerate={onRegenerate}
          onExtractMore={onExtractMore}
        />
      )}

      {step === "done" && state && (
        <DoneStep state={state} onReset={reset} />
      )}
    </div>
  );
}

// ─── Step 1: the form ─────────────────────────────────────────────────────────

function CaptureForm(props: {
  options: CaptureFormOptions;
  scope: "existing_project" | "new_project" | "projectless";
  setScope: (v: "existing_project" | "new_project" | "projectless") => void;
  projectId: string;
  setProjectId: (v: string) => void;
  phaseId: string;
  setPhaseId: (v: string) => void;
  personId: string;
  setPersonId: (v: string) => void;
  newPhaseName: string;
  setNewPhaseName: (v: string) => void;
  clientId: string;
  setClientId: (v: string) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  text: string;
  setText: (v: string) => void;
  modelId: string;
  setModelId: (v: string) => void;
  onSubmit: () => void;
}) {
  const { options, scope } = props;
  const project = options.projects.find((p) => p.id === props.projectId);

  return (
    <div className="form">
      <section className="capture-section">
        <div className="capture-section-title">Where does this happen?</div>
        <div className="capture-scopes">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`capture-scope ${scope === s.value ? "selected" : ""}`}
              onClick={() => props.setScope(s.value)}
            >
              <span className="capture-scope-title">{s.title}</span>
              <span className="capture-scope-hint">{s.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {scope === "existing_project" && (
        <section className="capture-section">
          <div className="field">
            <label htmlFor="cap-project">Project</label>
            <select id="cap-project" value={props.projectId} onChange={(e) => { props.setProjectId(e.target.value); props.setPhaseId(""); }}>
              <option value="">Choose a project</option>
              {options.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.client ? `${p.client} / ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cap-phase">Phase (optional)</label>
              <select id="cap-phase" value={props.phaseId} onChange={(e) => props.setPhaseId(e.target.value)} disabled={!project}>
                <option value="">Whole project</option>
                {(project?.phases ?? []).map((ph) => (
                  <option key={ph.id} value={ph.id}>
                    {ph.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cap-new-phase">New phase (optional)</label>
              <input id="cap-new-phase" value={props.newPhaseName} onChange={(e) => props.setNewPhaseName(e.target.value)} placeholder="e.g. Phase 3 — Build" />
            </div>
          </div>
        </section>
      )}

      {scope === "new_project" && (
        <section className="capture-section">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cap-client">Client (optional)</label>
              <select id="cap-client" value={props.clientId} onChange={(e) => props.setClientId(e.target.value)}>
                <option value="">No client yet</option>
                {options.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cap-new-client">…or new client name</label>
              <input id="cap-new-client" value={props.newClientName} onChange={(e) => props.setNewClientName(e.target.value)} placeholder="e.g. Acme Inc." />
            </div>
          </div>
        </section>
      )}

      <section className="capture-section">
        <div className="field">
          <label htmlFor="cap-person">Person (optional)</label>
          <select id="cap-person" value={props.personId} onChange={(e) => props.setPersonId(e.target.value)}>
            <option value="">No specific person</option>
            {options.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="capture-section">
        <ModelPicker
          models={options.models}
          value={props.modelId}
          onChange={props.setModelId}
          defaultModel={options.default_model}
          fieldId="cap-model"
        />
      </section>

      <section className="capture-section">
        <div className="field">
          <label htmlFor="cap-text">What happened?</label>
          <textarea
            id="cap-text"
            className="capture-textarea"
            value={props.text}
            onChange={(e) => props.setText(e.target.value)}
            placeholder={"Describe what happened in plain language…\n\nExample: “Phase two is complete. Client approved the SEO plan. The ₹15,000 payment came in.”"}
            rows={8}
            autoFocus
          />
        </div>
        <button type="button" className="button" onClick={props.onSubmit} disabled={!props.text.trim()}>
          Understand & propose updates →
        </button>
        <p className="muted capture-hint">
          The AI proposes the operational updates. You review each one before anything is written.
        </p>
      </section>
    </div>
  );
}

// ─── Analyzing ────────────────────────────────────────────────────────────────

function AnalyzingStep({ text }: { text: string }) {
  return (
    <div className="capture-center">
      <div className="spinner" />
      <div className="capture-understanding">
        <span className="muted">Understanding your capture…</span>
        <blockquote>“{text.slice(0, 240)}{text.length > 240 ? "…" : ""}”</blockquote>
      </div>
    </div>
  );
}

// ─── Step 2: clarification ────────────────────────────────────────────────────

function ClarifyStep({
  state,
  onAnswers,
  onCancel,
}: {
  state: CaptureSessionState;
  onAnswers: (answers: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customs, setCustoms] = useState<Record<string, string>>({});

  return (
    <div className="capture-card">
      <div className="capture-card-head">
        <span className="pill">A few quick questions</span>
        <h2>{state.title}</h2>
        <p className="muted">{state.understanding}</p>
        <div className="confidence">Understanding: {Math.round(state.confidence * 100)}% confident</div>
      </div>

      <div className="form">
        {state.questions.map((q, qi) => (
          <QuestionField
            key={q.id}
            question={q}
            index={qi}
            value={answers[q.id]}
            custom={customs[q.id]}
            onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
            onCustom={(value) => {
              setCustoms((c) => ({ ...c, [q.id]: value }));
              setAnswers((a) => ({ ...a, [q.id]: value }));
            }}
          />
        ))}
        <button
          type="button"
          className="button"
          onClick={() => onAnswers(answers)}
          disabled={Object.keys(answers).length < state.questions.length}
        >
          Propose updates →
        </button>
        <button type="button" className="button ghost" onClick={onCancel}>
          Start over
        </button>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  index,
  value,
  custom,
  onChange,
  onCustom,
}: {
  question: ClarificationQuestion;
  index: number;
  value?: string;
  custom?: string;
  onChange: (value: string) => void;
  onCustom: (value: string) => void;
}) {
  const showCustom = question.allow_other && custom !== undefined;
  return (
    <div className="field">
      <label>
        {index + 1}. {question.question}
      </label>
      <div className="capture-options">
        {question.options.map((opt) => {
          const isCustomSelected = showCustom && value === custom;
          const selected = value === opt || (opt === "Other" && isCustomSelected);
          return (
            <button
              key={opt}
              type="button"
              className={`capture-option ${selected ? "selected" : ""}`}
              onClick={() => {
                if (opt === "Other" && question.allow_other) {
                  if (custom !== undefined) onChange(custom);
                  else onCustom("");
                } else {
                  onChange(opt);
                }
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {question.allow_other && showCustom && (
        <input
          autoFocus
          value={custom}
          onChange={(e) => onCustom(e.target.value)}
          placeholder="Type your answer…"
        />
      )}
    </div>
  );
}

// ─── Step 3: review ───────────────────────────────────────────────────────────

interface DecisionState {
  approved: boolean;
  editing: boolean;
  payload: Record<string, unknown>;
}

function ReviewStep({
  state,
  onApprove,
  onDiscard,
  onRegenerate,
  onExtractMore,
}: {
  state: CaptureSessionState;
  onApprove: (decisions: CaptureDecision[]) => void;
  onDiscard: () => void;
  onRegenerate: () => void;
  onExtractMore: () => void;
}) {
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});
  const [busy, setBusy] = useState(false);

  // A regenerate / extract-more replaces or appends actions; reset per-action
  // decisions so the fresh proposal is reviewed cleanly.
  useEffect(() => {
    setDecisions({});
    setBusy(false);
  }, [state.actions]);

  const all = state.actions.map((a) => decisions[a.id]?.approved ?? true);
  const approvedCount = all.filter(Boolean).length;

  const toggle = (actionId: string) =>
    setDecisions((d) => ({
      ...d,
      [actionId]: { ...(d[actionId] ?? { approved: true, editing: false, payload: {} }), approved: !(d[actionId]?.approved ?? true) },
    }));

  const setEditing = (actionId: string, editing: boolean) =>
    setDecisions((d) => ({
      ...d,
      [actionId]: { ...(d[actionId] ?? { approved: true, editing: false, payload: {} }), editing },
    }));

  const setPayload = (actionId: string, payload: Record<string, unknown>) =>
    setDecisions((d) => ({
      ...d,
      [actionId]: { ...(d[actionId] ?? { approved: true, editing: false, payload: {} }), payload },
    }));

  const submit = () => {
    setBusy(true);
    const list: CaptureDecision[] = state.actions.map((a) => {
      const d = decisions[a.id];
      const edited = d && (d.editing || Object.keys(d.payload).length > 0);
      return {
        actionId: a.id,
        approved: d?.approved ?? true,
        ...(edited && d
          ? {
              edited: {
                kind: a.kind,
                payload: d.payload,
                project_id: a.project_id,
                phase_id: a.phase_id,
                person_id: a.person_id,
                ref_id: a.ref_id,
              },
            }
          : {}),
      };
    });
    onApprove(list);
  };

  return (
    <div className="capture-card">
      <div className="capture-card-head">
        <span className="pill">{state.actions.length} proposed update{state.actions.length === 1 ? "" : "s"}</span>
        <h2>{state.title}</h2>
        <p className="muted">{state.understanding}</p>
        {state.errors.map((e) => (
          <p key={e} className="notice">{e}</p>
        ))}
      </div>

      <div className="capture-actions">
        {state.actions.map((action) => {
          const d = decisions[action.id];
          const approved = d?.approved ?? true;
          return (
            <div key={action.id} className={`capture-action ${approved ? "" : "rejected"}`}>
              <div className="capture-action-head">
                <label className="capture-action-approve">
                  <input
                    type="checkbox"
                    checked={approved}
                    onChange={() => toggle(action.id)}
                  />
                  <span className="pill kind">{KIND_LABELS[action.kind] ?? action.kind}</span>
                </label>
                <div className="capture-action-text">
                  <div className="capture-action-label">{action.label}</div>
                  <div className="capture-action-summary">{action.summary}</div>
                </div>
                <button type="button" className="button ghost small" onClick={() => setEditing(action.id, !(d?.editing ?? false))}>
                  {d?.editing ? "Done" : "Edit"}
                </button>
              </div>
              {(d?.editing ?? false) && (
                <ActionEditor action={action} payload={d?.payload ?? action.payload} onChange={(p) => setPayload(action.id, p)} />
              )}
              {!(d?.editing ?? false) && (
                <ActionSummary action={action} payload={d?.payload && Object.keys(d.payload).length ? d.payload : action.payload} />
              )}
            </div>
          );
        })}
      </div>

      <div className="capture-actions-foot">
        <button type="button" className="button" onClick={submit} disabled={busy || approvedCount === 0}>
          {busy ? "Applying…" : `Apply ${approvedCount} update${approvedCount === 1 ? "" : "s"}`}
        </button>
        <button type="button" className="button ghost" onClick={() => { setBusy(true); onRegenerate(); }} disabled={busy}>
          Regenerate
        </button>
        <button type="button" className="button ghost" onClick={() => { setBusy(true); onExtractMore(); }} disabled={busy}>
          Extract more
        </button>
        <button type="button" className="button ghost" onClick={onDiscard} disabled={busy}>
          Discard session
        </button>
      </div>
    </div>
  );
}

function ActionSummary({ action, payload }: { action: { kind: string }; payload: Record<string, unknown> }) {
  const fields = ACTION_SPECS[action.kind]?.fields ?? [];
  const shown = fields.filter((f) => {
    const v = payload[f.key];
    return v !== null && v !== undefined && v !== "";
  });
  if (shown.length === 0) return <div className="capture-action-detail muted">No additional details.</div>;
  return (
    <div className="capture-action-detail">
      {shown.map((f) => (
        <div key={f.key} className="capture-kv">
          <span className="capture-kv-key">{f.label}</span>
          <span className="capture-kv-value">
            {f.type === "number" && payload[f.key] !== null && payload[f.key] !== undefined
              ? Number(payload[f.key]).toLocaleString("en-IN", { maximumFractionDigits: 2 })
              : String(payload[f.key])}
          </span>
        </div>
      ))}
    </div>
  );
}

function ActionEditor({
  action,
  payload,
  onChange,
}: {
  action: { kind: string };
  payload: Record<string, unknown>;
  onChange: (payload: Record<string, unknown>) => void;
}) {
  const spec = ACTION_SPECS[action.kind];
  const fields = spec?.fields ?? [];
  return (
    <div className="capture-action-edit">
      <div className="form">
        {fields.length === 0 && <p className="muted">This action has no editable details.</p>}
        {fields.map((f) => {
          const raw = payload[f.key];
          const value = raw === null || raw === undefined ? "" : String(raw);
          return (
            <div className="field" key={f.key}>
              <label htmlFor={`edit-${f.key}`}>{f.label}</label>
              {f.type === "select" ? (
                <select
                  id={`edit-${f.key}`}
                  value={value}
                  onChange={(e) => onChange({ ...payload, [f.key]: e.target.value })}
                >
                  <option value="">— none —</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  id={`edit-${f.key}`}
                  value={value}
                  rows={3}
                  onChange={(e) => onChange({ ...payload, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  id={`edit-${f.key}`}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={value}
                  placeholder={f.placeholder}
                  onChange={(e) => onChange({ ...payload, [f.key]: e.target.value })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: done ─────────────────────────────────────────────────────────────

function DoneStep({ state, onReset }: { state: CaptureSessionState; onReset: () => void }) {
  const projectId = useMemo(() => {
    if (state.projectId) return state.projectId;
    const ref = state.actions.find((a) => a.project_id && !/^action:/.test(a.project_id));
    return ref?.project_id ?? null;
  }, [state]);

  return (
    <div className="capture-card">
      <div className="capture-card-head">
        <span className="pill success">Done</span>
        <h2>{state.title}</h2>
        <p className="muted">
          {state.status === "executed"
            ? "Your approved updates are applied. The capture itself is filed as a project record."
            : "This session is closed. No updates were written."}
        </p>
      </div>
      <div className="capture-actions">
        {state.actions.map((a) => (
          <div key={a.id} className="capture-action">
            <div className="capture-action-head">
              <span className="pill kind">{KIND_LABELS[a.kind] ?? a.kind}</span>
              <div className="capture-action-text">
                <div className="capture-action-label">{a.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="capture-actions-foot">
        <button type="button" className="button" onClick={onReset}>
          New capture
        </button>
        {projectId && (
          <Link className="button ghost" href={`/projects/${projectId}`}>
            Open project
          </Link>
        )}
      </div>
    </div>
  );
}
