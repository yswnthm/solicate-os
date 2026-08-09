import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProjectsForSelect, getInboxData, getTodayData } from "@/features/queries";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// The context retrieval engine. Solicate builds a structured memory package
// automatically — the model never needs the operator to explain context.

// ─── Migrated feature contexts (identical payloads to the old prompts) ───────

export async function getMorningBriefContext(userId: string) {
  const data = await getTodayData(userId);
  const inbox = await getInboxData();

  return {
    dayLabel: new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    overdue: data.overdue.slice(0, 8).map((t: any) => `- ${t.title} (due ${new Date(t.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`),
    upcoming: data.upcoming.slice(0, 8).map((t: any) => `- ${t.title} (due ${new Date(t.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`),
    issues: data.issues.slice(0, 6).map((i: any) => `- ${i.title} [${i.priority}]`),
    inboxCount: inbox.entries.length,
    inboxTop: inbox.entries.slice(0, 5).map((x: any) => `- ${x.title ?? "capture"}`),
    projectPulse: data.changedProjects.slice(0, 5).map((p: any) => `- ${p.name} (${p.status})`),
  };
}

export async function getInboxItemContext(itemId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .select("title, body_md")
    .eq("id", itemId)
    .maybeSingle();
  throwOnError(error);
  const rawItem = `Capture: ${(data as any)?.title ?? ""}\n${(data as any)?.body_md ?? ""}`;
  return { raw_item: rawItem };
}

export async function getBatchInboxContext() {
  const inbox = await getInboxData();
  const entries = inbox.entries.map((e: any) => ({
    id: e.id,
    kind: "entry",
    content: `Capture: ${e.title ?? ""}\n${e.body_md ?? ""}`,
  }));
  return { items: entries };
}

export async function getProjectsForContext() {
  const projects = await getActiveProjectsForSelect();
  return projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    client: p.people?.name ?? null,
  }));
}
