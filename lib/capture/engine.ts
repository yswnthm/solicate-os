import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runTemplate, type RunTemplateResult } from "@/lib/ai/executor";
import { buildProposeDigest, getCaptureContext, getCaptureProposeContext, isCaptureContext } from "@/lib/capture/context";
import { validateActions, type CaptureAction } from "@/lib/capture/actions-schema";
import { captureAnalyzeSchema, captureInputSchema } from "@/lib/capture/schemas";
import { missingUpdateTypes, updateTypeLabel } from "@/lib/capture/update-types";
import type { CaptureInput, CaptureSessionState, ClarificationAnswers, ClarificationQuestion } from "@/lib/capture/types";

// The capture engine. It owns the Draft → Review → Approve pipeline for
// captures: persist a session, understand the statement, clarify when the
// model is unsure, propose actions, and expose state for the operator to
// review. Nothing is executed here — execution happens only for actions the
// operator explicitly approves (features/capture-actions.ts).

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
  update_types: string[];
  status: string;
  title: string;
  understanding: string;
  confidence: number | null;
  clarifications: unknown;
  answers: unknown;
  invalid_actions: unknown;
  summary: string;
  error: string;
  context: unknown;
  audit: unknown;
  executed_at: string | null;
}

/** Merge a per-run audit record into the session's stored audit object. */
function mergeAudit(existing: unknown, entry: Record<string, unknown>): Record<string, unknown> {
  const base = existing && typeof existing === "object" ? (existing as Record<string, unknown>) : {};
  return { ...base, ...entry };
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
    update_types: Array.isArray(row.update_types) ? row.update_types : [],
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
      new_client_name: parsed.new_client_name ?? "",
      new_phase_name: parsed.new_phase_name ?? "",
      update_types: parsed.update_types,
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
    .select("id, capture_text, scope, project_id, phase_id, person_id, client_id, new_client_name, new_phase_name, update_types, status, title, understanding, confidence, clarifications, answers, invalid_actions, summary, error, context, audit, executed_at")
    .eq("id", sessionId)
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error("Capture session not found.");
  return data as unknown as SessionRow;
}

// ─── Analysis + proposal ──────────────────────────────────────────────────────

/** Run the capture-analyze template. Stores the outcome on the session. */
export async function runCaptureAnalysis(sessionId: string, modelId?: string) {
  const supabase = await createSupabaseServerClient();
  const session = await loadSession(sessionId);
  const input = toInput(session);

  const context = await getCaptureContext(input);
  const result = await runTemplate({
    slug: "capture-analyze",
    context,
    variables: { capture: input.text, scope: input.scope, answers: {} },
    modelId,
  });

  let analyze: ReturnType<typeof captureAnalyzeSchema.parse>;
  try {
    analyze = captureAnalyzeSchema.parse(result.data);
  } catch (cause) {
    await supabase.from("capture_sessions").update({ status: "error", error: String(cause) }).eq("id", sessionId);
    throw new Error("AI understanding failed validation.");
  }

  // Trust the model's questions: the v2 template asks a separate question for
  // every missing fact that would change an action, even at high confidence.
  const questions: ClarificationQuestion[] = analyze.clarifying_questions ?? [];

  const status = questions.length > 0 ? "awaiting_clarification" : "proposals_ready";

  const { error } = await supabase
    .from("capture_sessions")
    .update({
      status,
      title: analyze.title,
      understanding: analyze.understanding,
      confidence: analyze.confidence,
      clarifications: questions,
      // H1: persist the analyzed context package so the propose step (and any
      // later step) reuses it instead of re-querying the project per call.
      context,
      audit: mergeAudit(session.audit, {
        analyze: {
          model: result.model?.model_id ?? "",
          template_version: result.template.version,
          at: new Date().toISOString(),
        },
      }),
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
export async function runCaptureProposal(
  sessionId: string,
  answers: ClarificationAnswers = {},
  modelId?: string,
  instructions?: string,
  actionIdPrefix?: string,
) {
  const supabase = await createSupabaseServerClient();
  const session = await loadSession(sessionId);
  const input = toInput(session);
  const requiredTypes = input.update_types ?? [];

  // H1 + H2: reuse the context persisted at analysis time and shrink it into
  // the compact propose digest (ids + titles + statuses, no bodies). Legacy
  // sessions without a persisted context fall back to a fresh fetch, which is
  // then digested the same way — the model only ever sees the digest.
  const proposeContextPromise = isCaptureContext(session.context)
    ? Promise.resolve(buildProposeDigest(session.context))
    : getCaptureContext(input).then(buildProposeDigest);

  const propose = (withInstructions: string | undefined, prefix: string | undefined) =>
    proposeContextPromise
      .then((ctx) => getCaptureProposeContext(ctx, answers))
      .then((context) =>
        runTemplate({
          slug: "capture-propose",
          context,
          variables: {
            capture: input.text,
            scope: input.scope,
            understanding: session.understanding,
            answers,
            action_id_prefix: prefix ?? `${sessionId.slice(0, 4)}-`,
            instructions: withInstructions ?? "",
            update_types: requiredTypes,
          },
          modelId,
        }),
      );

  const runs: RunTemplateResult[] = [];
  const runOnce = async (withInstructions: string | undefined, prefix: string | undefined) => {
    const result = await propose(withInstructions, prefix);
    runs.push(result);
    return result.data;
  };

  // Mandatory update types: if a required category is missing, retry ONCE with
  // a corrective instruction before persisting anything.
  let raw = await runOnce(instructions, actionIdPrefix);
  let { valid, invalid } = validateActions(raw);
  const missing = missingUpdateTypes(requiredTypes, valid);

  if (missing.length > 0 && !(instructions ?? "").toLowerCase().includes("retry")) {
    const corrective = `RETRY — MANDATORY. The operator required these update types and you MISSED them: ${missing.join(", ")}. You MUST propose at least one action for each. Re-propose the FULL action list including the required ones. Do not drop or rename them.${instructions ? `\n\n${instructions}` : ""}`;
    raw = await runOnce(corrective, actionIdPrefix);
    const retry = validateActions(raw);
    valid = retry.valid;
    invalid = [...invalid, ...retry.invalid];
  }

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

  const existingInvalid = Array.isArray(session.invalid_actions) ? session.invalid_actions : [];

  const prevAudit = session.audit && typeof session.audit === "object" ? (session.audit as Record<string, unknown>) : {};
  const prevPropose = Array.isArray(prevAudit.propose) ? (prevAudit.propose as unknown[]) : [];
  const proposeRuns = runs.map((r) => ({
    model: r.model?.model_id ?? "",
    template_version: r.template.version,
    at: new Date().toISOString(),
  }));

  const [{ error: updateError }, { error: actionsError }] = await Promise.all([
    supabase
      .from("capture_sessions")
      .update({
        status: "proposals_ready",
        answers,
        invalid_actions: [...existingInvalid, ...invalid],
        error: "",
        audit: mergeAudit(session.audit, { propose: [...prevPropose, ...proposeRuns] }),
      })
      .eq("id", sessionId),
    rows.length > 0
      ? supabase.from("capture_actions").insert(rows)
      : { error: null },
  ]);
  throwOnError(updateError ?? actionsError);

  return loadCaptureState(sessionId);
}

const toAnswers = (session: SessionRow): ClarificationAnswers =>
  session.answers && typeof session.answers === "object"
    ? (session.answers as ClarificationAnswers)
    : {};

/**
 * Re-run the proposer from scratch. Previously proposed rows are dropped so
 * the session's actions reflect only the fresh proposal.
 */
export async function regenerateCaptureProposal(sessionId: string, modelId?: string) {
  const supabase = await createSupabaseServerClient();
  const session = await loadSession(sessionId);
  const { error: deleteError } = await supabase
    .from("capture_actions")
    .delete()
    .eq("session_id", sessionId)
    .in("status", ["proposed"]);
  throwOnError(deleteError);

  return runCaptureProposal(sessionId, toAnswers(session), modelId);
}

/**
 * Run the proposer again asking for MORE actions, keeping the current
 * proposals. The already-proposed actions are listed in the instructions so
 * the model adds only what is clearly implied but not yet covered.
 */
export async function extractMoreCaptureActions(sessionId: string, modelId?: string) {
  const supabase = await createSupabaseServerClient();
  const session = await loadSession(sessionId);
  const { data: existing, error: existingError } = await supabase
    .from("capture_actions")
    .select("kind, label")
    .eq("session_id", sessionId)
    .in("status", ["proposed"]);
  throwOnError(existingError);

  const already = ((existing ?? []) as { kind: string; label: string }[]).map((a) => `${a.kind}: ${a.label}`);
  const instructions =
    already.length > 0
      ? `EXTRACT MORE. The following actions are ALREADY PROPOSED. Propose ONLY additional actions that are clearly implied by the capture but not yet covered. Do NOT repeat, rename, or re-propose any listed action. Look for what a deeper review surfaces: exact amounts, milestones, follow-ups, next steps, timeline implications, and communication drafts.\n\nAlready proposed:\n${already.map((a) => `- ${a}`).join("\n")}`
      : "EXTRACT MORE. Propose every additional action clearly implied by the capture that a first pass might have missed.";

  return runCaptureProposal(sessionId, toAnswers(session), modelId, instructions, `${sessionId.slice(0, 4)}x-`);
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

  const requiredTypes = Array.isArray(session.update_types) ? session.update_types : [];
  const proposalRows = (actions.data ?? []).map((a) => ({
    kind: String(a.kind),
    payload: (a.payload ?? {}) as Record<string, unknown>,
  }));
  const missingTypes = missingUpdateTypes(requiredTypes, proposalRows);

  const errors: string[] = [];
  if (invalid.length > 0) {
    errors.push(`${invalid.length} proposed action${invalid.length === 1 ? "" : "s"} could not be parsed and were not added.`);
  }
  if (missingTypes.length > 0) {
    errors.push(`You asked for: ${missingTypes.map(updateTypeLabel).join(", ")} — but none was proposed. Click Extract more or Regenerate.`);
  }

  return {
    sessionId: session.id,
    status: session.status as CaptureSessionState["status"],
    title: session.title,
    understanding: session.understanding,
    confidence: session.confidence ?? 0,
    questions,
    requiredTypes,
    missingTypes,
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
    errors,
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
