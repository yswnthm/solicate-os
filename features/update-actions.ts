"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectWorkspace } from "@/features/queries";
import {
  clientSchema,
  conversationSchema,
  entrySchema,
  issueSchema,
  messageSchema,
  participantSchema,
  personSchema,
  phaseSchema,
  projectSchema,
  taskSchema,
} from "@/lib/validation";

export type EditResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

type Mutator = () => Promise<EditResult | void>;

// Every update action returns the same shape so every modal treats success and
// failure identically. NEXT_REDIRECT/NEXT_NOT_FOUND errors are re-thrown so
// redirect() keeps working if an action ever uses it.
async function runMutation(fn: Mutator): Promise<EditResult> {
  try {
    const result = await fn();
    return result ?? { ok: true };
  } catch (err) {
    const marker = (err as { digest?: string })?.digest;
    if (marker?.startsWith("NEXT_")) throw err;
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

function validationResult(error: z.ZodError): EditResult {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  const message = error.issues[0]?.message ?? "Check the highlighted fields.";
  return { ok: false, error: message, fieldErrors };
}

function uniqueError(error: { code?: string; message: string }, friendly: string) {
  return { ok: false, error: error.code === "23505" ? friendly : error.message };
}

function refresh(paths: string[], tags: string[] = []) {
  for (const path of paths) revalidatePath(path);
  for (const tag of tags) revalidateTag(tag);
}

const nowIso = () => new Date().toISOString();

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function updateClient(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = clientSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh(["/clients", `/clients/${id}`], ["clients"]);
  });
}

// ─── People ──────────────────────────────────────────────────────────────────

export async function updatePerson(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = personSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("people").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh(["/people", `/people/${id}`], ["people"]);
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function updateProject(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("projects")
      .select("status, completed_at, archived_at")
      .eq("id", id)
      .maybeSingle();
    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === "completed" && !existing?.completed_at) {
      updates.completed_at = nowIso();
    } else if (parsed.data.status !== "completed" && existing?.completed_at) {
      updates.completed_at = null;
    }
    if (parsed.data.status === "archived" && !existing?.archived_at) {
      updates.archived_at = nowIso();
    } else if (parsed.data.status !== "archived" && existing?.archived_at) {
      updates.archived_at = null;
    }
    const { error } = await supabase.from("projects").update(updates).eq("id", id);
    if (error) return uniqueError(error, "That project code is already in use.");
    refresh(["/projects", `/projects/${id}`, "/today"], ["projects"]);
  });
}

// ─── Phases ──────────────────────────────────────────────────────────────────

export async function updatePhase(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = phaseSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("phases")
      .select("status, completed_at")
      .eq("id", id)
      .maybeSingle();
    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === "completed" && !existing?.completed_at) {
      updates.completed_at = nowIso();
    } else if (parsed.data.status !== "completed" && existing?.completed_at) {
      updates.completed_at = null;
    }
    const { error } = await supabase.from("phases").update(updates).eq("id", id);
    if (error) return uniqueError(error, "A phase with this name already exists in this project.");
    refresh([`/projects/${parsed.data.project_id}`, "/today"]);
  });
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function updateTask(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("tasks")
      .select("status, completed_at")
      .eq("id", id)
      .maybeSingle();
    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === "done" && !existing?.completed_at) {
      updates.completed_at = nowIso();
    } else if (parsed.data.status !== "done") {
      updates.completed_at = null;
    }
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh([`/projects/${parsed.data.project_id}`, "/today"]);
  });
}

// ─── Issues ──────────────────────────────────────────────────────────────────

export async function updateIssue(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = issueSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("issues")
      .select("status, resolved_at")
      .eq("id", id)
      .maybeSingle();
    const closed = ["resolved", "accepted", "closed"].includes(parsed.data.status);
    const updates: Record<string, unknown> = { ...parsed.data };
    if (closed) {
      updates.resolved_at = existing?.resolved_at ?? nowIso();
    } else {
      updates.resolved_at = null;
      updates.resolution_summary = null;
    }
    const { error } = await supabase.from("issues").update(updates).eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh([`/projects/${parsed.data.project_id}`, "/today"]);
  });
}

// ─── Entries (notes / meetings / decisions / documents / milestones) ─────────

export async function updateEntry(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = entrySchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("entries")
      .select("project_id, decision_state")
      .eq("id", id)
      .maybeSingle();
    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.type === "decision") {
      updates.decision_outcome = parsed.data.decision_outcome;
      updates.decision_state = existing?.decision_state ?? "active";
    } else {
      updates.decision_outcome = null;
      updates.decision_state = null;
    }
    const { error } = await supabase.from("entries").update(updates).eq("id", id);
    if (error) return { ok: false, error: error.message };
    const paths = ["/inbox", "/today"];
    if (parsed.data.project_id) paths.push(`/projects/${parsed.data.project_id}`);
    if (existing?.project_id && existing.project_id !== parsed.data.project_id) {
      paths.push(`/projects/${existing.project_id}`);
    }
    refresh(paths, ["inbox"]);
  });
}

// ─── Conversations ───────────────────────────────────────────────────────────

export async function updateConversation(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = conversationSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("conversations")
      .select("project_id, client_id")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase
      .from("conversations")
      .update({ title: parsed.data.title, kind: parsed.data.kind, channel: parsed.data.channel, project_id: parsed.data.project_id })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    const paths = [`/clients/${parsed.data.client_id}`];
    if (parsed.data.project_id) paths.push(`/projects/${parsed.data.project_id}`);
    if (existing?.project_id && existing.project_id !== parsed.data.project_id) {
      paths.push(`/projects/${existing.project_id}`);
    }
    refresh(paths);
  });
}

// ─── Messages (inbox corrections) ────────────────────────────────────────────

export async function updateMessage(id: string, input: unknown): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = messageSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("messages")
      .update({ body_md: parsed.data.body_md })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    const paths = ["/inbox", "/today"];
    if (parsed.data.project_id) paths.push(`/projects/${parsed.data.project_id}`);
    refresh(paths, ["inbox"]);
  });
}

// ─── Project participants ────────────────────────────────────────────────────

export async function updateProjectParticipant(
  projectId: string,
  personId: string,
  input: unknown,
): Promise<EditResult> {
  return runMutation(async () => {
    await requireActiveUser();
    const parsed = participantSchema.safeParse(input);
    if (!parsed.success) return validationResult(parsed.error);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("project_participants")
      .update(parsed.data)
      .eq("project_id", projectId)
      .eq("person_id", personId);
    if (error) return { ok: false, error: error.message };
    refresh([`/projects/${projectId}`, `/people/${personId}`]);
  });
}

// ─── Edit context for task rows outside the project page (Today) ─────────────

export type TaskEditContext = {
  task: Record<string, unknown> | null;
  phases: Record<string, unknown>[];
  users: Record<string, unknown>[];
  projectId: string;
};

export async function getTaskEditContext(taskId: string, projectId: string): Promise<TaskEditContext> {
  await requireActiveUser();
  const workspace = await getProjectWorkspace(projectId);
  const task = workspace.tasks.find((t) => t.id === taskId) ?? null;
  return { task, phases: workspace.phases, users: workspace.users, projectId };
}
