"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveModels } from "@/lib/ai";
import {
  getBatchInboxContext,
  getInboxItemContext,
  getMorningBriefContext,
  getProjectsForContext,
} from "@/lib/ai/context";
import { runTemplate, prepareTemplate, formatPromptForChat } from "@/lib/ai/executor";
import {
  batchDraftsSchema,
  morningBriefSchema,
  triageDraftSchema,
  type TriageDraft,
} from "@/lib/ai/schemas";
import { getTemplateBySlug } from "@/lib/ai/template-store";
import { isEmbeddingsConfigured } from "@/lib/ai/embeddings";
import { indexSemanticSource } from "@/lib/ai/semantic";
import { getActiveProjectsForSelect, getPeople } from "@/features/queries";

const kind = (value: unknown) => z.enum(["entry", "message"]).parse(value);
const id = (value: unknown) => z.string().uuid().parse(value);

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ─── Inbox triage ────────────────────────────────────────────────────────────
// Step 1 of draft→approve: the model suggests a record; nothing is written.

export async function draftInboxTriage(kindValue: string, itemId: string, modelId?: string): Promise<TriageDraft> {
  await requireActiveUser();
  const kindParsed = kind(kindValue);
  const item = id(itemId);

  const result = await runTemplate({ slug: "inbox-triage", context: await inboxTriageContext(kindParsed, item), modelId });
  return triageDraftSchema.parse(result.data);
}

async function inboxTriageContext(kindValue: "entry" | "message", itemId: string) {
  return { ...(await getInboxItemContext(kindValue, itemId)), projects: await getProjectsForContext() };
}

// Build the exact prompt that would be sent to the model, for use in ChatGPT.
export async function getInboxTriagePrompt(kindValue: string, itemId: string): Promise<string> {
  await requireActiveUser();
  const kindParsed = kind(kindValue);
  const item = id(itemId);
  return formatPromptForChat(await prepareTemplate({ slug: "inbox-triage", context: await inboxTriageContext(kindParsed, item) }));
}

// Step 2: the operator approves the reviewed draft. Only now do we write.
export async function approveInboxDraft(kindValue: string, itemId: string, draft: TriageDraft) {
  const { user } = await requireActiveUser();
  const kindParsed = kind(kindValue);
  const item = id(itemId);
  const parsed = triageDraftSchema.parse(draft);
  const projectId = parsed.project_id || null;

  const supabase = await createSupabaseServerClient();

  if (kindParsed === "entry") {
    const { error } = await supabase
      .from("entries")
      .update({
        title: parsed.title,
        type: parsed.type,
        project_id: projectId,
        body_md: parsed.body_md,
        triage_state: "filed",
      })
      .eq("id", item);
    throwOnError(error);
  } else {
    // A message becomes a filed project record; the raw message is retired.
    const [{ error: entryError }, { error: messageError }] = await Promise.all([
      supabase.from("entries").insert({
        project_id: projectId,
        type: parsed.type,
        title: parsed.title,
        body_md: parsed.body_md,
        occurred_at: new Date().toISOString(),
        triage_state: "filed",
        decision_outcome: null,
        decision_state: null,
        created_by_id: user.id,
      }),
      supabase.from("messages").update({ triage_state: "filed" }).eq("id", item),
    ]);
    throwOnError(entryError ?? messageError);
  }

  revalidatePath("/inbox");
  revalidateTag("inbox");
  revalidatePath("/today");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

const BATCH_LIMIT = 6;

export type BatchTriageItem = { id: string; kind: "entry" | "message"; draft: TriageDraft };

// One call drafts records for every inbox item. Nothing is written.
export async function draftBatchTriage(modelId?: string): Promise<BatchTriageItem[]> {
  await requireActiveUser();
  const context = await batchTriageContext();

  const items = (context.items as { id: string; kind: string }[]).slice(0, BATCH_LIMIT);
  if (items.length === 0) return [];

  // Slice the context itself so the model only sees the items we keep — it
  // should never process the whole inbox for a 6-item result set.
  const result = await runTemplate({ slug: "inbox-triage-batch", context: { ...context, items }, modelId });
  const drafts = batchDraftsSchema.parse({ drafts: result.data });
  const byId = new Map(drafts.drafts.map((d) => [d.id, d]));
  return items
    .map((i) => {
      const draft = byId.get(i.id);
      if (!draft) return null;
      return {
        id: i.id,
        kind: i.kind as "entry" | "message",
        draft: {
          title: draft.title,
          type: draft.type,
          project_id: draft.project_id,
          body_md: draft.body_md,
        },
      };
    })
    .filter((x): x is BatchTriageItem => x !== null);
}

async function batchTriageContext() {
  return { ...(await getBatchInboxContext()), projects: await getProjectsForContext() };
}

// Build the exact prompt that would be sent to the model, for use in ChatGPT.
export async function getBatchTriagePrompt(): Promise<string> {
  await requireActiveUser();
  return formatPromptForChat(await prepareTemplate({ slug: "inbox-triage-batch", context: await batchTriageContext() }));
}

// ─── Semantic memory maintenance ──────────────────────────────────────────────

/**
 * Rebuild the semantic index for recent records. On-demand maintenance: chunk +
 * embed recent entries/messages/tasks/issues and upsert into semantic_chunks.
 * No-op friendly when no embedding provider is configured.
 */
export async function reindexSemanticMemoryAction(): Promise<string> {
  await requireActiveUser();
  if (!isEmbeddingsConfigured()) {
    throw new Error("Embeddings are not configured (GEMINI_API_KEY). Semantic memory is disabled.");
  }
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [entries, messages, tasks, issues] = await Promise.all([
    supabase
      .from("entries")
      .select("id, project_id, type, title, body_md")
      .eq("triage_state", "filed")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(500),
    supabase
      .from("messages")
      .select("id, body_md, conversations!inner(project_id, title)")
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(500),
    supabase
      .from("tasks")
      .select("id, project_id, title, description_md")
      .not("status", "eq", "cancelled")
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase
      .from("issues")
      .select("id, project_id, title, description_md")
      .not("status", "eq", "closed")
      .order("updated_at", { ascending: false })
      .limit(300),
  ]);
  [entries, messages, tasks, issues].forEach((r) => throwOnError(r.error));

  let entryCount = 0;
  let messageCount = 0;
  let taskCount = 0;
  let issueCount = 0;

  for (const e of entries.data ?? []) {
    await indexSemanticSource("entry", String(e.id), String(e.project_id), `Entry (${e.type ?? ""}): ${e.title ?? ""}`, String(e.body_md ?? ""));
    entryCount++;
  }
  for (const m of messages.data ?? []) {
    const conv = (m.conversations as { project_id?: string | null; title?: string | null } | undefined) ?? {};
    await indexSemanticSource("message", String(m.id), conv.project_id ?? null, `Message (${conv.title ?? ""}):`, String(m.body_md ?? ""));
    messageCount++;
  }
  for (const t of tasks.data ?? []) {
    await indexSemanticSource("task", String(t.id), String(t.project_id), `Task: ${t.title ?? ""}`, String(t.description_md ?? ""));
    taskCount++;
  }
  for (const i of issues.data ?? []) {
    await indexSemanticSource("issue", String(i.id), String(i.project_id), `Issue: ${i.title ?? ""}`, String(i.description_md ?? ""));
    issueCount++;
  }

  return `Semantic memory indexed: ${entryCount} entries, ${messageCount} messages, ${taskCount} tasks, ${issueCount} issues.`;
}

// ─── Morning brief ───────────────────────────────────────────────────────────

export async function draftMorningBriefAction(modelId?: string): Promise<string> {
  const { user } = await requireActiveUser();
  const context = await getMorningBriefContext(user.id);
  const result = await runTemplate({ slug: "morning-brief", context, modelId });
  return morningBriefSchema.parse({ brief: result.data }).brief;
}

// Build the exact prompt that would be sent to the model, for use in ChatGPT.
export async function getMorningBriefPrompt(): Promise<string> {
  const { user } = await requireActiveUser();
  const context = await getMorningBriefContext(user.id);
  return formatPromptForChat(await prepareTemplate({ slug: "morning-brief", context }));
}

// Optional: file the reviewed brief as a projectless note record.
export async function saveMorningBrief(brief: string) {
  const { user } = await requireActiveUser();
  const body = brief.trim();
  if (!body) throw new Error("Brief cannot be empty.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").insert({
    project_id: null,
    type: "note",
    title: `Morning brief · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`,
    body_md: body,
    occurred_at: new Date().toISOString(),
    triage_state: "filed",
    decision_outcome: null,
    decision_state: null,
    created_by_id: user.id,
  });
  throwOnError(error);
  revalidatePath("/today");
}

// ─── Unified model picker ─────────────────────────────────────────────────────
// Shared across every AI surface so the same models are usable everywhere.
// The picker shows the catalog plus the template's configured default; the
// chosen model_id is forwarded to runTemplate by the calling action.

export interface ModelPickerOptions {
  models: { id: string; provider: string; display_name: string }[];
  default_model: string;
}

export async function getModelPickerOptions(templateSlug?: string): Promise<ModelPickerOptions> {
  await requireActiveUser();
  const [models, template] = await Promise.all([
    getActiveModels(),
    templateSlug ? getTemplateBySlug(templateSlug) : Promise.resolve(null),
  ]);
  return {
    models: models.map((m) => ({ id: m.model_id, provider: m.provider, display_name: m.display_name })),
    default_model: template?.active.default_model ?? "",
  };
}

// ─── Message Drafter ─────────────────────────────────────────────────────────

export interface DraftFormOptions {
  projects: { id: string; name: string; client?: string | null }[];
  people: { id: string; name: string }[];
  models: { id: string; provider: string; model_id: string; display_name: string }[];
  template: {
    name: string;
    default_model: string;
    lengths: { id: string; label: string; hint: string }[];
    styles: string[];
    enabled_variables: string[];
  } | null;
}

export async function getDraftFormOptions(): Promise<DraftFormOptions> {
  await requireActiveUser();
  const [projects, people, models, template] = await Promise.all([
    getActiveProjectsForSelect(),
    getPeople(),
    getActiveModels(),
    getTemplateBySlug("message-drafter"),
  ]);

  const config = (template?.active.config ?? {}) as { lengths?: { id: string; label: string; hint: string }[]; styles?: string[] };

  return {
    projects: projects.map((p: any) => ({ id: p.id, name: p.name, client: p.people?.name ?? null })),
    people: people.map((p: any) => ({ id: p.id, name: p.name })),
    models: models.map((m) => ({ id: m.model_id, provider: m.provider, model_id: m.model_id, display_name: m.display_name })),
    template: template
      ? {
          name: template.active.name,
          default_model: template.active.default_model,
          lengths: config.lengths ?? [],
          styles: config.styles ?? [],
          enabled_variables: template.active.enabled_variables,
        }
      : null,
  };
}

export interface DraftRecipient {
  person_id: string;
  name: string;
  role: string | null;
}

export async function getDraftRecipients(projectId: string): Promise<{ participants: DraftRecipient[]; phases: { id: string; name: string; position: number; status: string }[] }> {
  await requireActiveUser();
  const project = id(projectId);
  const supabase = await createSupabaseServerClient();
  const [participants, phases] = await Promise.all([
    supabase
      .from("project_participants")
      .select("person_id, role, role_label, people(id, name)")
      .eq("project_id", project),
    supabase
      .from("phases")
      .select("id, name, position, status")
      .eq("project_id", project)
      .order("position"),
  ]);
  throwOnError(participants.error ?? phases.error);

  return {
    participants: (participants.data ?? []).map((p) => ({
      person_id: p.person_id,
      name: (p.people as any)?.name ?? "",
      role: (p.role_label as string) || (p.role as string) || null,
    })),
    phases: (phases.data ?? []).map((p) => ({ id: p.id, name: p.name, position: p.position, status: p.status })),
  };
}

export interface DraftMessageInput {
  projectId: string;
  personId: string;
  phaseId?: string | null;
  intent: string;
  length: string;
  styles: string[];
  additionalContext: string;
  direction: string;
  modelId?: string;
}

export interface DraftMessageResult {
  content: string;
  modelId: string;
  modelName: string;
  conversationId: string | null;
}

export async function draftMessage(input: DraftMessageInput): Promise<DraftMessageResult> {
  await requireActiveUser();
  const parsed = z
    .object({
      projectId: z.string().uuid(),
      personId: z.string().uuid(),
      phaseId: z.string().uuid().nullable().optional(),
      intent: z.string().trim(),
      length: z.string().trim(),
      styles: z.array(z.string()),
      additionalContext: z.string().trim(),
      direction: z.string().trim(),
      modelId: z.string().trim().optional(),
    })
    .parse(input);

  const variables = buildDrafterVariables(parsed);

  const [result, conversationId] = await Promise.all([
    runTemplate({ slug: "message-drafter", variables, modelId: parsed.modelId }),
    findConversationFor(parsed.projectId, parsed.personId),
  ]);

  return {
    content: String(result.data ?? "").trim(),
    modelId: result.model?.model_id ?? parsed.modelId ?? "",
    modelName: result.model?.display_name ?? "",
    conversationId,
  };
}

// Build the exact prompt that would be sent to the model, for use in ChatGPT.
export async function getDraftPrompt(input: DraftMessageInput): Promise<string> {
  await requireActiveUser();
  const parsed = z
    .object({
      projectId: z.string().uuid(),
      personId: z.string().uuid(),
      phaseId: z.string().uuid().nullable().optional(),
      intent: z.string().trim(),
      length: z.string().trim(),
      styles: z.array(z.string()),
      additionalContext: z.string().trim(),
      direction: z.string().trim(),
      modelId: z.string().trim().optional(),
    })
    .parse(input);

  return formatPromptForChat(await prepareTemplate({ slug: "message-drafter", variables: buildDrafterVariables(parsed), modelId: parsed.modelId }));
}

function buildDrafterVariables(parsed: {
  projectId: string;
  personId: string;
  phaseId?: string | null;
  intent: string;
  length: string;
  styles: string[];
  additionalContext: string;
  direction: string;
}) {
  return {
    projectId: parsed.projectId,
    personId: parsed.personId,
    phaseId: parsed.phaseId ?? null,
    intent: parsed.intent || "Draft a natural, useful message.",
    length: parsed.length || "short",
    styles: parsed.styles.length ? parsed.styles : ["Professional"],
    additional_context: parsed.additionalContext,
    direction: parsed.direction,
  };
}

async function findConversationFor(projectId: string, personId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, conversation_participants!inner(person_id)")
    .eq("project_id", projectId)
    .eq("conversation_participants.person_id", personId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  throwOnError(error);
  return data ? String(data.id) : null;
}

export async function saveMessageDraft(input: DraftMessageInput, content: string): Promise<string> {
  const { user } = await requireActiveUser();
  const parsed = z
    .object({
      projectId: z.string().uuid(),
      personId: z.string().uuid(),
      phaseId: z.string().uuid().nullable().optional(),
      intent: z.string().trim(),
      length: z.string().trim(),
      styles: z.array(z.string()),
      additionalContext: z.string().trim(),
      direction: z.string().trim(),
      modelId: z.string().trim().optional(),
    })
    .parse(input);
  const body = content.trim();
  if (!body) throw new Error("Cannot save an empty message.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("message_drafts")
    .insert({
      project_id: parsed.projectId,
      person_id: parsed.personId,
      phase_id: parsed.phaseId ?? null,
      content: body,
      intent: parsed.intent,
      length_label: parsed.length,
      styles: parsed.styles,
      additional_context: parsed.additionalContext,
      direction: parsed.direction,
      model_id: parsed.modelId ?? "",
      status: "draft",
      created_by_id: user.id,
    })
    .select("id")
    .single();
  throwOnError(error);
  if (!data) throw new Error("Failed to save the draft.");
  return String(data.id);
}

export async function sendMessageDraft(draftId: string): Promise<string> {
  const { user } = await requireActiveUser();
  const idValue = id(draftId);
  const supabase = await createSupabaseServerClient();

  const { data: draft, error: draftError } = await supabase
    .from("message_drafts")
    .select("id, project_id, person_id, content, status, conversation_id")
    .eq("id", idValue)
    .maybeSingle();
  throwOnError(draftError);
  if (!draft) throw new Error("Draft not found.");
  if (draft.status === "sent") throw new Error("This draft is already marked as sent.");

  let conversationId = draft.conversation_id ?? (await findConversationFor(draft.project_id, draft.person_id));
  if (!conversationId) {
    conversationId = await createConversationForDraft(draft.project_id, draft.person_id, user.id);
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    direction: "outbound",
    body_md: draft.content,
    sent_at: new Date().toISOString(),
    triage_state: "filed",
    created_by_id: user.id,
  });
  throwOnError(messageError);

  const { error: updateError } = await supabase
    .from("message_drafts")
    .update({ status: "sent", sent_at: new Date().toISOString(), conversation_id: conversationId })
    .eq("id", idValue);
  throwOnError(updateError);

  revalidatePath(`/projects/${draft.project_id}`);
  revalidatePath("/today");
  revalidatePath("/inbox");
  revalidateTag("inbox");
  return conversationId;
}

async function createConversationForDraft(projectId: string, personId: string, userId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const [project, person] = await Promise.all([
    supabase.from("projects").select("client_id, name").eq("id", projectId).maybeSingle(),
    supabase.from("people").select("name").eq("id", personId).maybeSingle(),
  ]);
  throwOnError(project.error ?? person.error);

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      client_id: (project.data as any)?.client_id,
      project_id: projectId,
      kind: "direct",
      channel: "manual",
      title: `${(person.data as any)?.name ?? "Contact"} · ${(project.data as any)?.name ?? "Project"}`,
      created_by_id: userId,
    })
    .select("id")
    .single();
  throwOnError(error);
  if (!data) throw new Error("Failed to create the conversation.");

  const { error: participantError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: data.id, person_id: personId, created_at: new Date().toISOString() });
  throwOnError(participantError);

  return String(data.id);
}

export async function discardMessageDraft(draftId: string) {
  await requireActiveUser();
  const idValue = id(draftId);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("message_drafts")
    .update({ status: "discarded" })
    .eq("id", idValue);
  throwOnError(error);
}

export async function listMessageDrafts() {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("message_drafts")
    .select("id, content, intent, length_label, direction, model_id, status, sent_at, created_at, projects(id, name), people(id, name)")
    .in("status", ["draft", "sent"])
    .order("created_at", { ascending: false })
    .limit(20);
  throwOnError(error);
  return data ?? [];
}
