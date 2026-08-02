"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  draftBatchRecords,
  draftInboxRecord,
  draftWeeklySummary,
  triageDraftSchema,
  type BatchDraft,
  type TriageDraft,
} from "@/lib/ai";
import { getActiveProjectsForSelect, getInboxData, getProjectWorkspace } from "@/features/queries";

const kind = (value: unknown) => z.enum(["entry", "message"]).parse(value);
const id = (value: unknown) => z.string().uuid().parse(value);

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// Step 1 of draft→approve: the model suggests a record; nothing is written.
export async function draftInboxTriage(kindValue: string, itemId: string): Promise<TriageDraft> {
  await requireActiveUser();
  const kindParsed = kind(kindValue);
  const item = id(itemId);
  const supabase = await createSupabaseServerClient();

  let rawItem: string;
  if (kindParsed === "entry") {
    const { data, error } = await supabase
      .from("entries")
      .select("title, body_md")
      .eq("id", item)
      .maybeSingle();
    throwOnError(error);
    rawItem = `Capture: ${(data as any)?.title ?? ""}\n${(data as any)?.body_md ?? ""}`;
  } else {
    const { data, error } = await supabase
      .from("messages")
      .select("body_md, conversations(title)")
      .eq("id", item)
      .maybeSingle();
    throwOnError(error);
    rawItem = `Message (${(data as any)?.conversations?.title ?? "conversation"}): ${(data as any)?.body_md ?? ""}`;
  }

  const projects = await getActiveProjectsForSelect();
  const options = projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    client: p.clients?.name ?? null,
  }));

  return draftInboxRecord(rawItem, options);
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

// One Groq call drafts records for every inbox item. Nothing is written.
export async function draftBatchTriage(): Promise<BatchTriageItem[]> {
  await requireActiveUser();
  const [inbox, projects] = await Promise.all([getInboxData(), getActiveProjectsForSelect()]);

  const entries = inbox.entries.map((e: any) => ({
    id: e.id,
    kind: "entry",
    content: `Capture: ${e.title ?? ""}\n${e.body_md ?? ""}`,
  }));
  const messages = inbox.messages.map((m: any) => ({
    id: m.id,
    kind: "message",
    content: `Message (${m.conversations?.title ?? "conversation"}): ${m.body_md ?? ""}`,
  }));
  const items = [...entries, ...messages].slice(0, BATCH_LIMIT);
  if (items.length === 0) return [];

  const options = projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    client: p.clients?.name ?? null,
  }));

  const drafts = await draftBatchRecords(items, options);
  const byId = new Map(drafts.map((d) => [d.id, d]));
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

// Weekly update: AI drafts from the last 7 days of project activity.
export async function draftWeeklySummaryForProject(projectId: string): Promise<string> {
  await requireActiveUser();
  const workspace = await getProjectWorkspace(projectId);
  if (!workspace.project) throw new Error("Project not found.");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent = (list: any[], key = "occurred_at") =>
    (list ?? [])
      .filter((x: any) => new Date(x[key] ?? 0) >= new Date(weekAgo))
      .map((x: any) => `- ${x.title ?? x.summary ?? ""}`)
      .slice(0, 20);

  const data = {
    projectName: workspace.project.name,
    clientName: (workspace.project as any).clients?.name ?? null,
    entries: recent(workspace.entries),
    tasks: workspace.tasks
      .filter((t: any) => t.status === "done")
      .slice(0, 20)
      .map((t: any) => `- ${t.title}`),
    issues: workspace.issues
      .filter((i: any) => i.status !== "resolved")
      .slice(0, 10)
      .map((i: any) => `- ${i.title}`),
    messages: recent(workspace.recentMessages, "sent_at").slice(0, 10),
    activity: recent(workspace.activity).slice(0, 20),
  };

  return draftWeeklySummary(data);
}

// Files the approved weekly summary as a project update record.
export async function approveWeeklySummary(projectId: string, summary: string) {
  const { user } = await requireActiveUser();
  const project = id(projectId);
  const body = summary.trim();
  if (!body) throw new Error("Summary cannot be empty.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").insert({
    project_id: project,
    type: "update",
    title: `Weekly update · ${new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric" })}`,
    body_md: body,
    occurred_at: new Date().toISOString(),
    triage_state: "filed",
    decision_outcome: null,
    decision_state: null,
    created_by_id: user.id,
  });
  throwOnError(error);
  revalidatePath(`/projects/${project}`);
  revalidatePath("/today");
}
