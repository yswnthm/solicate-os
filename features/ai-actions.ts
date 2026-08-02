"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { draftInboxRecord, triageDraftSchema, type TriageDraft } from "@/lib/ai";
import { getActiveProjectsForSelect } from "@/features/queries";

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
