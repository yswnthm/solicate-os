import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runTemplate } from "@/lib/ai/executor";
import { getCaptureContext, getCaptureProposeContext } from "@/lib/capture/context";
import { validateActions, type CaptureAction } from "@/lib/capture/actions-schema";
import { captureAnalyzeSchema, captureInputSchema } from "@/lib/capture/schemas";
import type { CaptureInput, CaptureSessionState, ClarificationAnswers, ClarificationQuestion } from "@/lib/capture/types";

// The capture engine. It owns the Draft → Review → Approve pipeline for
// captures: persist a session, understand the statement, clarify when the
// model is unsure, propose actions, and expose state for the operator to
// review. Nothing is executed here — execution happens only for actions the
// operator explicitly approves (features/capture-actions.ts).

/** Above this confidence the engine skips clarification and proposes directly. */
export const CLARIFICATION_CONFIDENCE = 0.95;

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

interface SessionRow {
  id: string;
  capture_text: string;
  scope: string;
  project_id: string | null;
  phase_id: string | null;
  person_id: string | null;
  client_id: string | null;
  new_client_name: string;
  new_phase_name: string;
  status: string;
  title: string;
  understanding: string;
  confidence: number | null;
  clarifications: unknown;
  answers: unknown;
  invalid_actions: unknown;
  summary: string;
  error: string;
  executed_at: string | null;
}

export function toInput(row: SessionRow): CaptureInput {
  return {
    scope: row.scope as CaptureInput["scope"],
    project_id: row.project_id,
    phase_id: row.phase_id,
    person_id: row.person_id,
    client_id: row.client_id,
    new_client_name: row.new_client_name || null,
    new_phase_name: row.new_phase_name || null,
    text: row.capture_text,
  };
}

// ─── Session persistence ──────────────────────────────────────────────────────

/**
 * Create a capture session and file the raw capture as a project record
 * (entries, type=capture, triage_state=filed). Returns the session id.
 */
export async function createCaptureSession(userId: string, input: unknown): Promise<string> {
  const parsed = captureInputSchema.parse(input);

  const supabase = await createSupabaseServerClient();
  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .insert({
      project_id: parsed.scope === "existing_project" ? parsed.project_id : null,
      type: "capture",
      title: parsed.text.trim().slice(0, 90),
      body_md: parsed.text,
      occurred_at: new Date().toISOString(),
      triage_state: "filed",
      decision_outcome: null,
      decision_state: null,
      created_by_id: userId,
    })
    .select("id")
    .single();
  throwOnError(entryError);
  if (!entry) throw new Error("Failed to file the capture.");

  const { data: session, error } = await supabase
    .from("capture_sessions")
    .insert({
      created_by_id: userId,
      entry_id: entry.id,
      capture_text: parsed.text,
      scope: parsed.scope,
      project_id: parsed.scope === "existing_project" ? parsed.project_id : null,
      phase_id: parsed.phase_id,
      person_id: parsed.person_id,
      client_id: parsed.client_id,
      new_client_name: parsed.new_client_name,
      new_phase_name: parsed.new_phase_name,
      status: "processing",
    })
    .select("id")
    .single();
  throwOnError(error);
  if (!session) throw new Error("Failed to start the capture session.");
  return String(session.id);
}

async function loadSession(sessionId: string): Promise<SessionRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("capture_sessions")
    .select("id, capture_text, scope, project_id, phase_id, person_id, client_id, new_client_name, new_phase_name, status, title, understanding, confidence, clarifications, answers, invalid_actions, summary, error, executed_at")
    .eq("id", sessionId)
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error("Capture session not found.");
  return data as unknown as SessionRow;
}

// ─── Analysis + proposal ──────────────────────────────────────────────────────

/** Run the capture-analyze template. Stores the outcome on the session. */
export async function runCaptureAnalysis(sessionId: string) {
  const supabase = await createSupabaseServerClient();
  const session = await loadSession(sessionId);
  const input = toInput(session);

  const context = await getCaptureContext(input);
  const result = await runTemplate({
    slug: "capture-analyze",
    context,
    variables: { capture: input.text, scope: input.scope, answers: {} },
  });

  let analyze: ReturnType<typeof captureAnalyzeSchema.parse>;
  try {
    analyze = captureAnalyzeSchema.parse(result.data);
  } catch (cause) {
    await supabase.from("capture_sessions").update({ status: "error", error: String(cause) }).eq("id", sessionId);
    throw new Error("AI understanding failed validation.");
  }

  const questions: ClarificationQuestion[] =
    analyze.confidence >= CLARIFICATION_CONFIDENCE ? [] : analyze.clarifying_questions;

  const status = questions.length > 0 ? "awaiting_clarification" : "proposals_ready";

  const { error } = await supabase
    .from("capture_sessions")
    .update({
      status,
      title: analyze.title,
      understanding: analyze.understanding,
      confidence: analyze.confidence,
      clarifications: questions,
    })
    .eq("id", sessionId);
  throwOnError(error);

  return { sessionId, status, confidence: analyze.confidence, questions };
}

/**
 * Run the capture-propose template and persist every valid action as a
 * proposed row. Invalid model output is preserved on the session for audit
 * and surfaced to the reviewer.
 */
export async function runCaptureProposal(sessionId: string, answers: ClarificationAnswers = {}) {
  const supabase = await createSupabaseServerClient();
  const session = await loadSession(sessionId);
  const input = toInput(session);

  const context = await getCaptureProposeContext(input, answers);
  const result = await runTemplate({
    slug: "capture-propose",
    context,
    variables: {
      capture: input.text,
      scope: input.scope,
      understanding: session.understanding,
      answers,
      action_id_prefix: `${sessionId.slice(0, 4)}-`,
    },
  });

  const raw = result.data;
  const { valid, invalid } = validateActions(raw);

  const rows = valid.map((a) => ({
    session_id: sessionId,
    local_id: String((a as unknown as { id?: unknown }).id ?? a.label),
    kind: a.kind,
    label: a.label,
    summary: a.summary,
    project_id: a.project_id,
    phase_id: a.phase_id,
    person_id: a.person_id,
    ref_id: a.ref_id,
    payload: a.payload as unknown as Record<string, unknown>,
    status: "proposed",
  }));

  const [{ error: updateError }, { error: actionsError }] = await Promise.all([
    supabase
      .from("capture_sessions")
      .update({
        status: "proposals_ready",
        answers,
        invalid_actions: invalid,
        error: "",
      })
      .eq("id", sessionId),
    rows.length > 0
      ? supabase.from("capture_actions").insert(rows)
      : { error: null },
  ]);
  throwOnError(updateError ?? actionsError);

  return loadCaptureState(sessionId);
}

// ─── State for the review UI ──────────────────────────────────────────────────

/** Full snapshot of a session plus its actions, as the UI renders it. */
export async function loadCaptureState(sessionId: string): Promise<CaptureSessionState> {
  const supabase = await createSupabaseServerClient();
  const [session, actions] = await Promise.all([
    loadSession(sessionId),
    supabase.from("capture_actions").select("*").eq("session_id", sessionId).order("created_at"),
  ]);
  throwOnError(actions.error);

  const questions = Array.isArray(session.clarifications) ? (session.clarifications as ClarificationQuestion[]) : [];
  const invalid = Array.isArray(session.invalid_actions) ? session.invalid_actions : [];

  return {
    sessionId: session.id,
    status: session.status as CaptureSessionState["status"],
    title: session.title,
    understanding: session.understanding,
    confidence: session.confidence ?? 0,
    questions,
    actions: (actions.data ?? []).map((a) => ({
      id: String(a.id),
      kind: String(a.kind),
      label: String(a.label),
      summary: String(a.summary),
      project_id: a.project_id,
      phase_id: a.phase_id,
      person_id: a.person_id,
      ref_id: a.ref_id,
      payload: (a.payload ?? {}) as Record<string, unknown>,
    })),
    projectId: session.project_id,
    phaseId: session.phase_id,
    personId: session.person_id,
    summary: session.summary,
    errors: invalid.length > 0 ? [`${invalid.length} proposed action${invalid.length === 1 ? "" : "s"} could not be parsed and were not added.`] : [],
    error: session.error || undefined,
  };
}

/** Mark a session discarded. Its proposed actions remain for the audit trail. */
export async function discardCaptureSession(sessionId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("capture_sessions")
    .update({ status: "discarded" })
    .eq("id", sessionId);
  throwOnError(error);
}

/** Store a capture_actions row's outcome after execution. */
export async function updateActionResult(actionId: string, status: "applied" | "error", result: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("capture_actions")
    .update({ status, result })
    .eq("id", actionId);
  throwOnError(error);
}

/** Mark the session executed once every approved action has been processed. */
export async function markSessionExecuted(sessionId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("capture_sessions")
    .update({ status: "executed", executed_at: new Date().toISOString() })
    .eq("id", sessionId);
  throwOnError(error);
}

export type { CaptureAction };
