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

// Activity events are written by DB triggers
// (supabase/migrations/0003_activity_triggers.sql), so mutations are a single
// atomic round trip.

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
  const kind = z.enum(["business", "individual"]).parse(text(formData.get("kind")) || "business");
  const { data, error } = await supabase
    .from("people")
    .insert({
      name: z.string().min(1).parse(text(formData.get("name"))),
      kind,
      website_url: optional(formData.get("website_url")),
      summary: text(formData.get("summary")),
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  // A client is a person + a client relationship.
  const { error: relError } = await supabase.from("relationships").insert({
    client_id: data.id,
    type: "client",
    created_by_id: user.id,
  });
  if (relError) throw new Error(relError.message);
  revalidatePath("/clients");
  revalidateTag("clients");
  revalidatePath("/people");
  revalidateTag("people");
  revalidatePath("/relationships");
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

export async function createUnifiedPerson(formData: FormData) {
  const { user } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  
  const kind = z.enum(["business", "individual"]).parse(text(formData.get("kind")) || "individual");
  const is_client = formData.get("is_client") === "on";

  const { data, error } = await supabase.from("people").insert({
    name: z.string().min(1).parse(text(formData.get("name"))),
    kind,
    email: optional(formData.get("email")),
    phone: optional(formData.get("phone")),
    website_url: optional(formData.get("website_url")),
    is_partner: formData.get("is_partner") === "on",
    summary: text(formData.get("summary")),
    created_by_id: user.id,
  }).select("id").single();

  if (error) throw new Error(error.message);

  if (is_client) {
    const { error: relError } = await supabase.from("relationships").insert({
      client_id: data.id,
      type: "client",
      created_by_id: user.id,
    });
    if (relError) throw new Error(relError.message);
  }

  revalidatePath("/people");
  revalidateTag("people");
  revalidatePath("/clients");
  revalidateTag("clients");
  revalidatePath("/relationships");
  
  if (is_client || kind === "business") {
    redirect(`/clients/${data.id}`);
  } else {
    redirect(`/people/${data.id}`);
  }
}

export async function linkPersonToClient(formData: FormData) {
  await requireActiveUser();
  const clientId = id(formData.get("client_id"));
  const personId = id(formData.get("person_id"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("people").update({ organization_id: clientId }).eq("id", personId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/people/${personId}`);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function createProject(formData: FormData) {
  const { user } = await requireActiveUser();
  const personId = id(formData.get("person_id"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      person_id: personId,
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
  await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const status = z.enum(["active", "paused", "completed", "archived"]).parse(text(formData.get("status")));
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();
  if (status === "archived") updates.archived_at = new Date().toISOString();
  const { error } = await supabase.from("projects").update(updates).eq("id", projectId);
  if (error) throw new Error(error.message);
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
    phase_id: optional(formData.get("phase_id")),
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

export async function updateTaskStatus(formData: FormData) {
  await requireActiveUser();
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
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

// ─── Subtasks ────────────────────────────────────────────────────────────────

export async function addSubtask(formData: FormData) {
  const { user } = await requireActiveUser();
  const taskId = id(formData.get("task_id"));
  const projectId = id(formData.get("project_id"));
  const title = z.string().min(1).parse(text(formData.get("title")));
  const notes = text(formData.get("notes"));
  const supabase = await createSupabaseServerClient();
  const { data: last } = await supabase
    .from("task_subtasks")
    .select("position")
    .eq("task_id", taskId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("task_subtasks").insert({
    task_id: taskId,
    title,
    notes: notes || null,
    position: (last?.position ?? 0) + 1,
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId));
}

export async function toggleSubtask(formData: FormData) {
  await requireActiveUser();
  const subtaskId = id(formData.get("subtask_id"));
  const taskId = id(formData.get("task_id"));
  const projectId = id(formData.get("project_id"));
  const supabase = await createSupabaseServerClient();
  const { data: subtask, error: fetchError } = await supabase
    .from("task_subtasks")
    .select("done")
    .eq("id", subtaskId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  const nowDone = !subtask?.done;
  const { error } = await supabase.from("task_subtasks").update({ done: nowDone }).eq("id", subtaskId);
  if (error) throw new Error(error.message);

  if (nowDone) {
    // Completing the last open subtask also completes the parent task.
    const { data: remaining } = await supabase
      .from("task_subtasks")
      .select("id")
      .eq("task_id", taskId)
      .eq("done", false)
      .limit(1);
    if (!remaining || remaining.length === 0) {
      const { data: task } = await supabase.from("tasks").select("status").eq("id", taskId).maybeSingle();
      if (task && task.status !== "done") {
        const { error: taskError } = await supabase
          .from("tasks")
          .update({ status: "done", completed_at: new Date().toISOString() })
          .eq("id", taskId);
        if (taskError) throw new Error(taskError.message);
      }
    }
  }
  revalidatePath(projectPath(projectId));
  revalidatePath("/today");
}

export async function deleteSubtask(formData: FormData) {
  await requireActiveUser();
  const subtaskId = id(formData.get("subtask_id"));
  const projectId = id(formData.get("project_id"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("task_subtasks").delete().eq("id", subtaskId);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId));
}

// ─── Phases ───────────────────────────────────────────────────────────────────

export async function createPhase(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = id(formData.get("project_id"));
  const name = z.string().min(1).parse(text(formData.get("name")));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("phases").insert({
    project_id: projectId,
    name,
    description: text(formData.get("description")),
    position: z.coerce.number().int().min(1).parse(formData.get("position") ?? 1),
    status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]).parse(
      text(formData.get("status")) || "planned",
    ),
    started_on: optional(formData.get("started_on")),
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId));
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
    phase_id: optional(formData.get("phase_id")),
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
  revalidatePath(projectPath(projectId));
  revalidatePath("/inbox");
  revalidateTag("inbox");
  revalidatePath("/today");
}

// Quick capture from Today or the command palette (always capture type → inbox).
// Project is optional once 0004_optional_entry_project.sql is applied.
export async function quickCapture(formData: FormData) {
  const { user } = await requireActiveUser();
  const projectId = optional(formData.get("project_id"));
  const title = z.string().min(1).parse(text(formData.get("title")));
  const rawType = optional(formData.get("type")) ?? "capture";
  const type = ["note", "meeting", "decision", "document", "update", "milestone", "capture"].includes(rawType)
    ? rawType
    : "capture";
  const outcome = optional(formData.get("decision_outcome"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").insert({
    project_id: projectId,
    type: type as any,
    title,
    body_md: text(formData.get("body_md")),
    occurred_at: new Date().toISOString(),
    triage_state: "inbox",
    decision_outcome: type === "decision" ? (outcome || title) : null,
    decision_state: type === "decision" ? "active" : null,
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidateTag("inbox");
  revalidatePath("/today");
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function addProjectParticipant(formData: FormData) {
  await requireActiveUser();
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
  revalidatePath(projectPath(projectId));
}

// ─── Inbox ────────────────────────────────────────────────────────────────────

export async function fileInboxEntry(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").update({ triage_state: "filed" }).eq("id", id(formData.get("entry_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidateTag("inbox");
  revalidatePath("/today");
}

// File a capture AND route it to a destination project in one step.
export async function fileInboxEntryToProject(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const projectId = optional(formData.get("project_id"));
  const { error } = await supabase
    .from("entries")
    .update({ triage_state: "filed", project_id: projectId })
    .eq("id", id(formData.get("entry_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidateTag("inbox");
  revalidatePath("/today");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function dismissInboxEntry(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").update({ triage_state: "dismissed" }).eq("id", id(formData.get("entry_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/inbox");
  revalidateTag("inbox");
  revalidatePath("/today");
}

// ─── Relationships (Level 1) ─────────────────────────────────────────────────

export async function createRelationship(formData: FormData) {
  const { user } = await requireActiveUser();
  const clientId = id(formData.get("client_id"));
  const personId = optional(formData.get("person_id"));
  const commission = optional(formData.get("referral_commission"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("relationships")
    .insert({
      client_id: clientId,
      person_id: personId,
      type: z.enum(["client", "lead", "partner", "team", "internal"]).parse(
        text(formData.get("type")) || "client",
      ),
      source: z.enum(["referral_partner", "direct_outreach", "existing_client", "marketplace", "internal"]).parse(
        text(formData.get("source")) || "direct_outreach",
      ),
      status: z.enum(["active", "inactive", "archived"]).parse(text(formData.get("status")) || "active"),
      summary: text(formData.get("summary")),
      communication_mode: optional(formData.get("communication_mode")),
      financial_arrangement: z.enum(["none", "referral_commission", "revenue_share", "delivery_split", "fixed_fee"]).parse(
        text(formData.get("financial_arrangement")) || "none",
      ),
      referral_commission: commission ? z.coerce.number().nonnegative().parse(commission) : null,
      commission_currency: optional(formData.get("commission_currency")),
      payment_status: z.enum(["not_applicable", "pending", "partially_paid", "paid", "disputed"]).parse(
        text(formData.get("payment_status")) || "not_applicable",
      ),
      terms_note: text(formData.get("terms_note")),
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/relationships");
  revalidatePath(`/clients/${clientId}`);
  if (personId) revalidatePath(`/people/${personId}`);
  redirect(`/relationships/${data.id}`);
}

// ─── Finance ─────────────────────────────────────────────

export async function createTransaction(formData: FormData) {
  const { user } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const type = z.enum(["income", "expense", "transfer", "refund", "adjustment"]).parse(text(formData.get("type")));
  const invoiceStatusRaw = optional(formData.get("invoice_status"));
  const invoiceStatus = invoiceStatusRaw
    ? z.enum(["preparing", "sent", "cleared"]).parse(invoiceStatusRaw)
    : null;
  const { error } = await supabase.from("transactions").insert({
    type,
    amount: z.coerce.number().positive().finite().parse(formData.get("amount")),
    currency_code: "INR",
    transaction_date: optional(formData.get("transaction_date")) ?? new Date().toISOString().slice(0, 10),
    status: type === "expense" ? "completed" : "pending",
    invoice_status: invoiceStatus,
    invoice_number: text(formData.get("invoice_number")),
    reference_number: text(formData.get("reference_number")),
    notes: text(formData.get("notes")),
    category_id: optional(formData.get("category_id")),
    payment_method_id: optional(formData.get("payment_method_id")),
    from_person_id: optional(formData.get("from_person_id")),
    to_person_id: optional(formData.get("to_person_id")),
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  revalidatePath("/finance/transactions");
  revalidatePath("/today");
}

export async function createAllocation(formData: FormData) {
  const { user } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const projectId = optional(formData.get("project_id"));
  const phaseId = optional(formData.get("phase_id"));
  const target = phaseId ? "phase" : projectId ? "project" : "overhead";
  const transactionId = id(formData.get("transaction_id"));
  const { error } = await supabase.from("transaction_allocations").insert({
    transaction_id: transactionId,
    target,
    project_id: projectId,
    phase_id: phaseId,
    amount: z.coerce.number().positive().finite().parse(formData.get("amount")),
    notes: text(formData.get("notes")),
    created_by_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  revalidatePath(`/finance/transactions/${transactionId}`);
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function advanceInvoiceStatus(formData: FormData) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const transactionId = id(formData.get("transaction_id"));
  const newStatus = z.enum(["preparing", "sent", "cleared"]).parse(text(formData.get("invoice_status")));
  const updates: Record<string, unknown> = { invoice_status: newStatus };
  if (newStatus === "sent") updates.invoice_sent_at = new Date().toISOString();
  if (newStatus === "cleared") {
    updates.invoice_cleared_at = new Date().toISOString();
    updates.status = "completed";
    const ref = text(formData.get("reference_number"));
    if (ref) updates.reference_number = ref;
  }
  const { error } = await supabase.from("transactions").update(updates).eq("id", transactionId);
  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  revalidatePath(`/finance/transactions/${transactionId}`);
  revalidatePath("/finance/invoices");
}


