"use server";

// Finance-specific capture actions. Mirrors the general capture-actions.ts
// pattern but uses the finance-capture-analyze / finance-capture-propose
// AI templates and the financial context builder.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveUser } from "@/lib/auth";
import { getFinanceCaptureOptions } from "@/features/queries";
import { buildFinanceContext } from "@/lib/capture/finance-context";
import { runTemplate } from "@/lib/ai/template-store";
import { validateActions } from "@/lib/capture/actions-schema";
import { applyAction } from "@/lib/capture/execute";
import type { CaptureSessionState, ClarificationAnswers } from "@/lib/capture/types";

const SESSION_KEY = "finance_capture_session";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Store a finance capture session in the DB (reuses capture_sessions table). */
async function saveSession(userId: string, state: CaptureSessionState): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("capture_sessions")
    .upsert(
      {
        user_id: userId,
        session_key: SESSION_KEY,
        state: state as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,session_key" }
    );
  throwOnError(error);
}

/** Retrieve the most recent finance capture session for the current user. */
export async function getFinanceResumeState(): Promise<CaptureSessionState | null> {
  const { user } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("capture_sessions")
    .select("state")
    .eq("user_id", user.id)
    .eq("session_key", SESSION_KEY)
    .maybeSingle();
  return (data?.state as CaptureSessionState | null) ?? null;
}

/** Submit a financial statement and run the analyze template. */
export async function submitFinanceCapture(formData: FormData): Promise<CaptureSessionState> {
  const { user } = await requireActiveUser();
  const text = String(formData.get("text") ?? "").trim();
  const scope = String(formData.get("scope") ?? "income");
  const modelId = String(formData.get("model_id") ?? "");
  if (!text) throw new Error("Please describe what happened financially.");

  const options = await getFinanceCaptureOptions();
  const context = await buildFinanceContext({ text, scope, options });

  const result = await runTemplate("finance-capture-analyze", {
    capture: text,
    scope,
    context,
    model_id_override: modelId || undefined,
  });

  const understanding: string = (result as { understanding?: string })?.understanding ?? "";
  const questions: Array<{ id: string; question: string }> =
    Array.isArray((result as { questions?: unknown })?.questions)
      ? ((result as { questions: Array<{ id: string; question: string }> }).questions)
      : [];

  const state: CaptureSessionState = {
    id: crypto.randomUUID(),
    status: questions.length > 0 ? "awaiting_clarification" : "proposing",
    input: { scope, text, new_phase_name: null, new_client_name: null },
    understanding,
    clarifications: questions.map((q) => ({ ...q, answer: "" })),
    answers: {},
    actions: [],
    model_id: modelId,
  };

  await saveSession(user.id, state);
  return state;
}

/** Submit answers to clarification questions and run the propose template. */
export async function answerFinanceClarifications(
  sessionId: string,
  answers: ClarificationAnswers
): Promise<CaptureSessionState> {
  const { user } = await requireActiveUser();
  const resume = await getFinanceResumeState();
  if (!resume || resume.id !== sessionId) throw new Error("Session not found.");

  const text = resume.input.text;
  const scope = resume.input.scope;
  const options = await getFinanceCaptureOptions();
  const context = await buildFinanceContext({ text, scope, options });

  const prefix = `fc${Date.now().toString(36)}`;
  const result = await runTemplate("finance-capture-propose", {
    capture: text,
    scope,
    context,
    understanding: resume.understanding,
    answers,
    action_id_prefix: prefix,
    model_id_override: resume.model_id || undefined,
  });

  const { valid, invalid } = validateActions(result);
  const state: CaptureSessionState = {
    ...resume,
    status: "awaiting_approval",
    answers,
    actions: valid,
    invalid_actions: invalid,
  };

  await saveSession(user.id, state);
  return state;
}

/** Run the propose template immediately (no clarifications needed). */
export async function proposeFinanceActions(sessionId: string): Promise<CaptureSessionState> {
  return answerFinanceClarifications(sessionId, {});
}

/** Approve and execute a set of finance actions. */
export async function approveFinanceCaptureActions(
  sessionId: string,
  approved: string[]
): Promise<CaptureSessionState> {
  const { user } = await requireActiveUser();
  const resume = await getFinanceResumeState();
  if (!resume || resume.id !== sessionId) throw new Error("Session not found.");

  const actionsToRun = resume.actions.filter((a) => approved.includes((a as { id?: string }).id ?? ""));
  const createdIds: Record<string, string> = {};

  for (const action of actionsToRun) {
    const localId = (action as { id?: string }).id ?? "";
    const resolve = (ref: string) => createdIds[ref] ?? null;
    const result = await applyAction(user.id, action, resolve);
    if (result.ok && result.createdId && localId) {
      createdIds[localId] = result.createdId;
    }
  }

  const state: CaptureSessionState = { ...resume, status: "executed" };
  await saveSession(user.id, state);
  return state;
}

/** Regenerate the proposal (if user wasn't happy with it). */
export async function regenerateFinanceProposal(sessionId: string, modelId?: string): Promise<CaptureSessionState> {
  const { user } = await requireActiveUser();
  const resume = await getFinanceResumeState();
  if (!resume || resume.id !== sessionId) throw new Error("Session not found.");
  const state: CaptureSessionState = { ...resume, model_id: modelId || resume.model_id };
  await saveSession(user.id, state);
  return answerFinanceClarifications(sessionId, state.answers);
}

/** Extract more actions from the same capture text. */
export async function extractMoreFinanceActions(sessionId: string, modelId?: string): Promise<CaptureSessionState> {
  return regenerateFinanceProposal(sessionId, modelId);
}

/** Discard the current finance capture session. */
export async function discardFinanceCapture(): Promise<void> {
  const { user } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("capture_sessions")
    .delete()
    .eq("user_id", user.id)
    .eq("session_key", SESSION_KEY);
}
