"use client";

import { useEffect, useState, useTransition } from "react";

import {
  answerFinanceClarifications,
  approveFinanceCaptureActions,
  discardFinanceCapture,
  extractMoreFinanceActions,
  getFinanceResumeState,
  regenerateFinanceProposal,
  submitFinanceCapture,
} from "@/features/finance-capture-actions";
import type { CaptureSessionState } from "@/lib/capture/types";
import { ModelPicker, type ModelPickerOption } from "@/components/model-picker";
import { AnalyzingStep, ClarifyStep, DoneStep, ReviewStep } from "@/components/capture/capture-flow";
import type { CaptureDecision } from "@/features/capture-actions";

export interface FinanceCaptureFormOptions {
  models: ModelPickerOption[];
  default_model: string;
  // Note: the backend uses projects, phases, people, categories etc.
  // to build the context for the LLM. The frontend doesn't need to display
  // them since the user just types in plain English.
}

type Step = "loading" | "form" | "analyzing" | "clarify" | "review" | "done";

const SCOPES = [
  { value: "income", title: "Income", hint: "Client payments, royalties" },
  { value: "expense", title: "Expense", hint: "Software, contractors, overhead" },
  { value: "allocation", title: "Allocation", hint: "Assign funds to a project" },
  { value: "invoice_update", title: "Invoice Update", hint: "Mark sent or cleared" },
] as const;

export function FinanceCaptureFlow({ options }: { options: FinanceCaptureFormOptions }) {
  const [step, setStep] = useState<Step>("loading");
  const [state, setState] = useState<CaptureSessionState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getFinanceResumeState()
      .then((next) => {
        if (cancelled) return;
        if (!next || next.status === "executed") {
          setStep("form");
          return;
        }
        setState(next);
        if (next.status === "awaiting_clarification") setStep("clarify");
        else setStep(next.actions.length ? "review" : "form");
      })
      .catch(() => {
        if (!cancelled) setStep("form");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [scope, setScope] = useState<string>("income");
  const [text, setText] = useState("");
  const [modelId, setModelId] = useState("");

  const run = (label: string, fn: () => Promise<CaptureSessionState>) => {
    if (busy) return;
    setError("");
    setBusy(true);
    if (label === "submit") setStep("analyzing");
    startTransition(async () => {
      try {
        const next = await fn();
        setState(next);
        if (next.status === "awaiting_clarification") setStep("clarify");
        else if (next.status === "executed") setStep("done");
        else if (next.status === "proposals_ready" || next.status === "approved") setStep(next.actions.length ? "review" : "done");
        else if (next.status === "error") setStep("done");
        else setStep("review");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
        setStep("form");
      } finally {
        setBusy(false);
      }
    });
  };

  const onSubmit = () => {
    const formData = new FormData();
    formData.set("scope", scope);
    formData.set("text", text);
    if (modelId) formData.set("model_id", modelId);
    run("submit", () => submitFinanceCapture(formData));
  };

  const onAnswers = (answers: Record<string, string>) => {
    if (!state) return;
    run("propose", () => answerFinanceClarifications(state.sessionId, answers));
  };

  const onApprove = (decisions: CaptureDecision[]) => {
    if (!state) return;
    const approved = decisions.filter(d => d.approved).map(d => d.actionId);
    run("apply", () => approveFinanceCaptureActions(state.sessionId, approved));
  };

  const onDiscard = () => {
    if (!state) return;
    run("discard", async () => {
      await discardFinanceCapture();
      return { ...state, status: "executed", actions: [] } as any;
    }).then(() => reset());
  };

  const onRegenerate = () => {
    if (!state) return;
    run("regenerate", () => regenerateFinanceProposal(state.sessionId, modelId || undefined));
  };

  const onExtractMore = () => {
    if (!state) return;
    run("extract-more", () => extractMoreFinanceActions(state.sessionId, modelId || undefined));
  };

  const reset = () => {
    setState(null);
    setText("");
    setStep("form");
  };

  return (
    <div className="capture-flow">
      {error && <div className="notice error">{error}</div>}

      {step === "loading" && <div className="capture-center"><div className="spinner" /></div>}

      {step === "form" && (
        <FinanceCaptureForm
          options={options}
          scope={scope}
          setScope={setScope}
          text={text}
          setText={setText}
          modelId={modelId}
          setModelId={setModelId}
          busy={busy}
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

function FinanceCaptureForm(props: {
  options: FinanceCaptureFormOptions;
  scope: string;
  setScope: (v: string) => void;
  text: string;
  setText: (v: string) => void;
  modelId: string;
  setModelId: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  const { options, scope } = props;

  return (
    <div className="form">
      <section className="capture-section">
        <div className="capture-section-title">What kind of financial event?</div>
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

      <details className="capture-section" style={{ border: "none", padding: 0 }}>
        <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13, fontWeight: 500, listStyle: "none" }}>
          ⚙️ Advanced model settings
        </summary>
        <div style={{ marginTop: 16 }}>
          <ModelPicker
            models={options.models}
            value={props.modelId}
            onChange={props.setModelId}
            defaultModel={options.default_model}
            fieldId="cap-model"
          />
        </div>
      </details>

      <section className="capture-section">
        <div className="field">
          <label htmlFor="cap-text">What happened?</label>
          <textarea
            id="cap-text"
            className="capture-textarea"
            value={props.text}
            onChange={(e) => props.setText(e.target.value)}
            placeholder={
              scope === "income"
                ? "Example: The ₹15,000 final payment from Acme Inc for Phase 2 just cleared my HDFC account."
                : scope === "expense"
                ? "Example: Paid ₹1,200 for Figma subscription using the corporate card."
                : scope === "allocation"
                ? "Example: Allocate ₹5,000 from the recent Acme transfer to the 'Design' phase."
                : "Example: Sent invoice INV-042 for ₹10,000 to John Doe."
            }
            rows={8}
          />
        </div>
        <button type="button" className="button" onClick={props.onSubmit} disabled={props.busy || !props.text.trim()}>
          {props.busy ? "Understanding…" : "Understand & propose updates →"}
        </button>
        <p className="muted capture-hint">
          The AI will cross-reference your open invoices, active projects, and recent transactions to propose the exact ledger entries.
        </p>
      </section>
    </div>
  );
}
