"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionSchema, type CaptureAction } from "@/lib/capture/actions-schema";
import {
  CLARIFICATION_CONFIDENCE,
  createCaptureSession,
  discardCaptureSession,
  loadCaptureState,
  markSessionExecuted,
  runCaptureAnalysis,
  runCaptureProposal,
  updateActionResult,
} from "@/lib/capture/engine";
import { applyAction } from "@/lib/capture/execute";
import type { CaptureSessionState, ClarificationAnswers } from "@/lib/capture/types";

const sessionIdOf = (value: unknown) => z.string().uuid().parse(value);

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ─── Submit / analyze / clarify / propose ─────────────────────────────────────

/**
 * Step 1. Submit a capture. The engine files the raw capture, understands it,
 * and — when confidence is high enough — proposes actions immediately. Low
 * confidence returns to the clarification step first.
 */
export async function submitCapture(input: unknown): Promise<CaptureSessionState> {
  const { user } = await requireActiveUser();
  const sessionId = await createCaptureSession(user.id, input);
  const { status, confidence } = await runCaptureAnalysis(sessionId);

  if (status === "proposals_ready" && confidence >= CLARIFICATION_CONFIDENCE) {
    return runCaptureProposal(sessionId);
  }
  return loadCaptureState(sessionId);
}

/** Step 2. Answer the clarifying questions; the engine proposes actions. */
export async function answerClarifications(sessionId: string, answers: ClarificationAnswers): Promise<CaptureSessionState> {
  await requireActiveUser();
  return runCaptureProposal(sessionIdOf(sessionId), answers);
}

/** Resume a session from its id (e.g. after refresh, or from the URL). */
export async function getCaptureState(sessionId: string): Promise<CaptureSessionState> {
  await requireActiveUser();
  return loadCaptureState(sessionIdOf(sessionId));
}

/** Abandon a session without executing anything. */
export async function discardCapture(sessionId: string): Promise<CaptureSessionState> {
  await requireActiveUser();
  await discardCaptureSession(sessionIdOf(sessionId));
  return loadCaptureState(sessionIdOf(sessionId));
}

// ─── Review / approve ─────────────────────────────────────────────────────────

export interface CaptureDecision {
  actionId: string;
  approved: boolean;
  /** Present when the operator edited the proposal before approving. */
  edited?: {
    kind: string;
    payload: Record<string, unknown>;
    project_id?: string | null;
    phase_id?: string | null;
    person_id?: string | null;
    ref_id?: string | null;
  };
}

const decisionSchema = z.object({
  actionId: z.string().uuid(),
  approved: z.boolean(),
  edited: z
    .object({
      kind: z.string(),
      payload: z.record(z.string(), z.unknown()),
      project_id: z.string().nullable().optional(),
      phase_id: z.string().nullable().optional(),
      person_id: z.string().nullable().optional(),
      ref_id: z.string().nullable().optional(),
    })
    .optional(),
});

/**
 * Step 3. The operator's verdicts. Approved actions execute in order (so
 * cross-action references resolve), each independently; results are recorded
 * on the action rows and the session finishes as executed.
 */
export async function approveCaptureActions(sessionId: string, decisions: unknown): Promise<CaptureSessionState> {
  const { user } = await requireActiveUser();
  const sid = sessionIdOf(sessionId);
  const parsedDecisions = z.array(decisionSchema).parse(decisions);
  const byActionId = new Map(parsedDecisions.map((d) => [d.actionId, d]));

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("capture_actions")
    .select("*")
    .eq("session_id", sid)
    .order("created_at");
  throwOnError(error);

  // local_id → created record id for "action:<localId>" references.
  const createdByLocalId = new Map<string, string>();
  const resolveRef = (localId: string) => createdByLocalId.get(localId) ?? null;

  const touchedProjects = new Set<string>();

  for (const row of rows ?? []) {
    const decision = byActionId.get(String(row.id));
    const actionId = String(row.id);

    if (!decision) {
      // Not reviewed — leave untouched for a later pass.
      continue;
    }

    if (!decision.approved) {
      const { error: rejectError } = await supabase
        .from("capture_actions")
        .update({ status: "rejected" })
        .eq("id", actionId);
      throwOnError(rejectError);
      continue;
    }

    let action: CaptureAction;
    if (decision.edited) {
      const parsed = actionSchema.safeParse({
        kind: decision.edited.kind,
        label: String(row.label),
        summary: String(row.summary),
        project_id: decision.edited.project_id ?? row.project_id,
        phase_id: decision.edited.phase_id ?? row.phase_id,
        person_id: decision.edited.person_id ?? row.person_id,
        ref_id: decision.edited.ref_id ?? row.ref_id,
        payload: decision.edited.payload,
      });
      if (!parsed.success) {
        await updateActionResult(actionId, "error", `Edited action failed validation: ${parsed.error.issues[0]?.message ?? "invalid"}`);
        continue;
      }
      action = parsed.data;
    } else {
      const parsed = actionSchema.safeParse({
        kind: row.kind,
        label: row.label,
        summary: row.summary,
        project_id: row.project_id,
        phase_id: row.phase_id,
        person_id: row.person_id,
        ref_id: row.ref_id,
        payload: row.payload,
      });
      if (!parsed.success) {
        await updateActionResult(actionId, "error", "Stored action failed validation.");
        continue;
      }
      action = parsed.data;
    }

    if (action.project_id && !/^action:/i.test(action.project_id)) touchedProjects.add(action.project_id);

    const result = await applyAction(user.id, action, resolveRef);

    if (result.ok) {
      await updateActionResult(actionId, "applied", result.error ?? "Applied.");
      if (result.createdId) createdByLocalId.set(String(row.local_id), result.createdId);
      if (result.createdKind === "project" && result.createdId) touchedProjects.add(result.createdId);
    } else {
      await updateActionResult(actionId, "error", result.error ?? "Failed to apply.");
    }
  }

  await markSessionExecuted(sid);

  // Revalidate everything the executed actions could have touched.
  revalidatePath("/today");
  revalidatePath("/projects");
  revalidatePath("/inbox");
  revalidatePath("/ai/drafter");
  revalidateTag("inbox");
  revalidateTag("projects");
  revalidateTag("clients");
  revalidateTag("people");
  for (const projectId of touchedProjects) revalidatePath(`/projects/${projectId}`);

  return loadCaptureState(sid);
}
