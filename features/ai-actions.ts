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

const kind = (value: unknown) => z.enum(["entry"]).parse(value);
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

async function inboxTriageContext(kindValue: "entry", itemId: string) {
  return { ...(await getInboxItemContext(itemId)), projects: await getProjectsForContext() };
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
  await requireActiveUser();
  const item = id(itemId);
  const parsed = triageDraftSchema.parse(draft);
  const projectId = parsed.project_id || null;

  const supabase = await createSupabaseServerClient();

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

  revalidatePath("/inbox");
  revalidateTag("inbox");
  revalidatePath("/today");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

const BATCH_LIMIT = 6;

export type BatchTriageItem = { id: string; kind: "entry"; draft: TriageDraft };

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
        kind: "entry",
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
 * embed recent entries/tasks/issues and upsert into semantic_chunks.
 * No-op friendly when no embedding provider is configured.
 */
export async function reindexSemanticMemoryAction(): Promise<string> {
  await requireActiveUser();
  if (!isEmbeddingsConfigured()) {
    throw new Error("Embeddings are not configured (GEMINI_API_KEY). Semantic memory is disabled.");
  }
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [entries, tasks, issues] = await Promise.all([
    supabase
      .from("entries")
      .select("id, project_id, type, title, body_md")
      .eq("triage_state", "filed")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
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
  [entries, tasks, issues].forEach((r) => throwOnError(r.error));

  let entryCount = 0;
  let taskCount = 0;
  let issueCount = 0;

  for (const e of entries.data ?? []) {
    await indexSemanticSource("entry", String(e.id), String(e.project_id), `Entry (${e.type ?? ""}): ${e.title ?? ""}`, String(e.body_md ?? ""));
    entryCount++;
  }
  for (const t of tasks.data ?? []) {
    await indexSemanticSource("task", String(t.id), String(t.project_id), `Task: ${t.title ?? ""}`, String(t.description_md ?? ""));
    taskCount++;
  }
  for (const i of issues.data ?? []) {
    await indexSemanticSource("issue", String(i.id), String(i.project_id), `Issue: ${i.title ?? ""}`, String(i.description_md ?? ""));
    issueCount++;
  }

  return `Semantic memory indexed: ${entryCount} entries, ${taskCount} tasks, ${issueCount} issues.`;
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
