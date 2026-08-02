"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const id = (value: FormDataEntryValue | null) => z.string().uuid().parse(value);
const text = (value: FormDataEntryValue | null) => z.string().trim().parse(value ?? "");
const optional = (value: FormDataEntryValue | null) => text(value) || null;
const projectPath = (projectId: string) => `/projects/${projectId}`;

async function activity(
  projectId: string,
  actorId: string,
  recordType: string,
  eventType: "created" | "updated" | "completed" | "cancelled" | "resolved" | "accepted" | "archived" | "restored",
  summary: string,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("activity_events").insert({
    project_id: projectId,
    actor_id: actorId,
    record_type: recordType,
    record_id: crypto.randomUUID(),
    event_type: eventType,
    summary,
  });
  if (error) throw new Error(error.message);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signIn(formData: FormData) {
  const email = z.string().email().parse(formData.get("email"));
  const password = z.string().min(8).parse(formData.get("password"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/today");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function createClient(formData: FormData) {
  const { user } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: z.string().min(1).parse(text(formData.get("name"))),
      kind: z.enum(["business", "person"]).parse(text(formData.get("kind")) || "business"),
      website_url: optional(formData.get("website_url")),
      summary: text(formData.get("summary")),
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
  revalidateTag("clients");
  redirect(`/clients/${data.id}`);
}

// ─── People ───────────────────────────────────────────────────────────────────

export async function createPerson(formData: FormData) {
  const { user } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("people").insert({
    name: z.string().min(1).parse(text(formData.get("name"))),
    email: optional(formData.get("email")),
    phone: optional(formData.get("phone")),
    is_partner: formData.get("is_partner") === "on",
    summary: text(formData.get("summary")),
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/people");
  revalidateTag("people");
  redirect("/people");
}

export async function linkPersonToClient(formData: FormData) {
  await requireActiveUser();
  const clientId = id(formData.get("client_id"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("client_people").insert({
    client_id: clientId,
    person_id: id(formData.get("person_id")),
    role_label: text(formData.get("role_label")),
    is_primary: formData.get("is_primary") === "on",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function createProject(formData: FormData) {
  const { user } = await requireActiveUser();
  const clientId = id(formData.get("client_id"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      owner_id: user.id,
      name: z.string().min(1).parse(text(formData.get("name"))),
      code: optional(formData.get("code")),
      summary: text(formData.get("summary")),
      target_date: optional(formData.get("target_date")),
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
  revalidateTag("projects");
  redirect(projectPath(data.id));
}

export async function updateProjectStatus(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const status = z.enum(["active", "paused", "completed", "archived"]).parse(text(formData.get("status")));
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();
  if (status === "archived") updates.archived_at = new Date().toISOString();
  const { error } = await supabase.from("projects").update(updates).eq("id", projectId);
  if (error) throw new Error(error.message);
  const eventType = status === "archived" ? "archived" : status === "completed" ? "completed" : "updated";
  await activity(projectId, user.id, "project", eventType, `Project marked ${status}`);
  revalidatePath(projectPath(projectId));
  revalidatePath("/projects");
  revalidatePath("/today");
  revalidateTag("projects");
  if (status === "archived") redirect("/projects");
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function createTask(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const title = z.string().min(1).parse(text(formData.get("title")));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    description_md: text(formData.get("description_md")),
    priority: z.enum(["low", "normal", "high", "urgent"]).parse(text(formData.get("priority")) || "normal"),
    assignee_id: optional(formData.get("assignee_id")),
    due_at: optional(formData.get("due_at")),
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  await activity(projectId, user.id, "task", "created", `Created task: ${title}`);
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

export async function updateTaskStatus(formData: FormData) {
  const { user } = await requireActiveUser();
  const taskId = id(formData.get("task_id"));
  const projectId = id(formData.get("project_id"));
  const status = z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]).parse(
    text(formData.get("status")),
  );
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = { status };
  if (status === "done") {
    updates.completed_at = new Date().toISOString();
  } else {
    // Clear completed_at if moving back from done
    updates.completed_at = null;
  }
  const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
  if (error) throw new Error(error.message);
  const eventType = status === "done" ? "completed" : status === "cancelled" ? "cancelled" : "updated";
  await activity(projectId, user.id, "task", eventType, `Task ${status.replace("_", " ")}`);
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

export async function updateTask(formData: FormData) {
  const { user } = await requireActiveUser();
  const taskId = id(formData.get("task_id"));
  const projectId = id(formData.get("project_id"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").update({
    title: z.string().min(1).parse(text(formData.get("title"))),
    description_md: text(formData.get("description_md")),
    priority: z.enum(["low", "normal", "high", "urgent"]).parse(text(formData.get("priority")) || "normal"),
    assignee_id: optional(formData.get("assignee_id")),
    due_at: optional(formData.get("due_at")),
  }).eq("id", taskId);
  if (error) throw new Error(error.message);
  await activity(projectId, user.id, "task", "updated", "Updated task details");
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export async function createIssue(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const title = z.string().min(1).parse(text(formData.get("title")));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("issues").insert({
    project_id: projectId,
    title,
    description_md: text(formData.get("description_md")),
    severity: z.enum(["low", "medium", "high", "critical"]).parse(text(formData.get("severity")) || "medium"),
    assignee_id: optional(formData.get("assignee_id")),
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  await activity(projectId, user.id, "issue", "created", `Opened issue: ${title}`);
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

export async function resolveIssue(formData: FormData) {
  const { user } = await requireActiveUser();
  const issueId = id(formData.get("issue_id"));
  const projectId = id(formData.get("project_id"));
  const resolution = z.string().min(1).parse(text(formData.get("resolution_summary")));
  const status = z.enum(["resolved", "accepted", "closed"]).parse(text(formData.get("status")) || "resolved");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("issues").update({
    status,
    resolved_at: new Date().toISOString(),
    resolution_summary: resolution,
  }).eq("id", issueId);
  if (error) throw new Error(error.message);
  const eventType = status === "resolved" ? "resolved" : "accepted";
  await activity(projectId, user.id, "issue", eventType, `Issue ${status}: ${resolution.slice(0, 80)}`);
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

// ─── Entries ──────────────────────────────────────────────────────────────────

export async function createEntry(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const type = z.enum(["note", "meeting", "decision", "document", "update", "milestone", "capture"]).parse(
    text(formData.get("type")),
  );
  const title = z.string().min(1).parse(text(formData.get("title")));
  const outcome = optional(formData.get("decision_outcome"));
  if (type === "decision" && !outcome) throw new Error("A decision entry requires an outcome.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").insert({
    project_id: projectId,
    type,
    title,
    body_md: text(formData.get("body_md")),
    occurred_at: optional(formData.get("occurred_at")) ?? new Date().toISOString(),
    triage_state: type === "capture" ? "inbox" : "filed",
    decision_outcome: type === "decision" ? outcome : null,
    decision_state: type === "decision" ? "active" : null,
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  await activity(projectId, user.id, "entry", "created", `Added ${type}: ${title}`);
  revalidatePath(projectPath(projectId));
  revalidatePath("/inbox");
  revalidatePath("/today");
}

// Quick capture from Today (always capture type → inbox)
export async function quickCapture(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const title = z.string().min(1).parse(text(formData.get("title")));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").insert({
    project_id: projectId,
    type: "capture",
    title,
    body_md: text(formData.get("body_md")),
    occurred_at: new Date().toISOString(),
    triage_state: "inbox",
    decision_outcome: null,
    decision_state: null,
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath("/today");
}

// ─── Participants & conversations ─────────────────────────────────────────────

export async function addProjectParticipant(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const value = optional(formData.get("financial_value"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_participants").insert({
    project_id: projectId,
    person_id: id(formData.get("person_id")),
    role: z.enum(["client_contact", "partner", "collaborator"]).parse(text(formData.get("role"))),
    role_label: text(formData.get("role_label")),
    is_referral_source: formData.get("is_referral_source") === "on",
    communication_mode: optional(formData.get("communication_mode")),
    financial_arrangement: z.enum(["none", "referral_commission", "revenue_share", "delivery_split", "fixed_fee"]).parse(
      text(formData.get("financial_arrangement")) || "none",
    ),
    financial_value: value ? z.coerce.number().nonnegative().parse(value) : null,
    currency_code: optional(formData.get("currency_code")),
    payment_status: z.enum(["not_applicable", "pending", "partially_paid", "paid", "disputed"]).parse(
      text(formData.get("payment_status")) || "not_applicable",
    ),
    terms_note: text(formData.get("terms_note")),
  });
  if (error) throw new Error(error.message);
  await activity(projectId, user.id, "participant", "created", "Added project participant");
  revalidatePath(projectPath(projectId));
}

export async function createConversation(formData: FormData) {
  const { user } = await requireActiveUser();
  const clientId = id(formData.get("client_id"));
  const projectId = optional(formData.get("project_id"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      client_id: clientId,
      project_id: projectId,
      kind: z.enum(["direct", "group"]).parse(text(formData.get("kind")) || "direct"),
      channel: z.enum(["whatsapp", "email", "manual", "other"]).parse(text(formData.get("channel")) || "manual"),
      title: z.string().min(1).parse(text(formData.get("title"))),
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (projectId) {
    await activity(projectId, user.id, "conversation", "created", "Created conversation");
    revalidatePath(projectPath(projectId));
  }
  redirect(projectId ? projectPath(projectId) : `/clients/${clientId}`);
}

export async function addConversationParticipant(formData: FormData) {
  await requireActiveUser();
  const conversationId = id(formData.get("conversation_id"));
  const projectId = optional(formData.get("project_id"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("conversation_participants").insert({
    conversation_id: conversationId,
    person_id: id(formData.get("person_id")),
  });
  if (error) throw new Error(error.message);
  if (projectId) revalidatePath(projectPath(projectId));
}

export async function createMessage(formData: FormData) {
  const { user } = await requireActiveUser();
  const conversationId = id(formData.get("conversation_id"));
  const projectId = optional(formData.get("project_id"));
  const direction = z.enum(["inbound", "outbound"]).parse(text(formData.get("direction")) || "inbound");
  const sentAt = optional(formData.get("sent_at")) ?? new Date().toISOString();
  const senderPersonId = direction === "inbound" ? optional(formData.get("sender_person_id")) : null;
  if (direction === "inbound" && !senderPersonId) throw new Error("Inbound messages require an external sender.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_person_id: senderPersonId,
    sender_user_id: direction === "outbound" ? user.id : null,
    direction,
    body_md: z.string().min(1).parse(text(formData.get("body_md"))),
    sent_at: sentAt,
    triage_state: direction === "inbound" ? "inbox" : "filed",
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  const { error: updateError } = await supabase
    .from("conversations")
    .update({ last_message_at: sentAt })
    .eq("id", conversationId);
  if (updateError) throw new Error(updateError.message);
  if (projectId) revalidatePath(projectPath(projectId));
  revalidatePath("/inbox");
  revalidatePath("/today");
}

// ─── Inbox ────────────────────────────────────────────────────────────────────

export async function fileInboxMessage(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("messages").update({ triage_state: "filed" }).eq("id", id(formData.get("message_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath("/today");
}

export async function dismissInboxMessage(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("messages").update({ triage_state: "dismissed" }).eq("id", id(formData.get("message_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath("/today");
}

export async function fileInboxEntry(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").update({ triage_state: "filed" }).eq("id", id(formData.get("entry_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath("/today");
}

export async function dismissInboxEntry(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").update({ triage_state: "dismissed" }).eq("id", id(formData.get("entry_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidatePath("/today");
}
