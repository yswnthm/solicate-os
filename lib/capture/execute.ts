import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CaptureAction } from "@/lib/capture/actions-schema";

// Execution of one approved capture action. Every mutation mirrors the
// equivalent manual flow in features/actions.ts / features/update-actions.ts
// (same status transitions, same timestamps, same ownership), so an AI-applied
// action is indistinguishable from a hand-entered one. Execution is strictly
// opt-in: only actions the operator approved on the review screen reach here.

export interface ApplyResult {
  ok: boolean;
  error?: string;
  /** The created record id for reference-tracking across the batch. */
  createdId?: string;
  createdKind?: string;
}

/** Resolves "action:<localId>" references to real ids from earlier actions. */
export type RefResolver = (localId: string) => string | null;

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function resolveRef(value: string | null | undefined, resolve: RefResolver): string | null {
  if (!value) return null;
  if (/^action:/i.test(value)) return resolve(value.replace(/^action:/i, ""));
  return value;
}

const nowIso = () => new Date().toISOString();
const todayIso = () => nowIso().slice(0, 10);

export async function applyAction(userId: string, action: CaptureAction, resolve: RefResolver): Promise<ApplyResult> {
  const supabase = await createSupabaseServerClient();

  const projectId = resolveRef(action.project_id, resolve);
  const phaseId = resolveRef(action.phase_id, resolve);
  const personId = resolveRef(action.person_id, resolve);
  const refId = resolveRef(action.ref_id, resolve);

  switch (action.kind) {
    case "client.create": {
      const p = action.payload;
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: p.name,
          kind: p.kind,
          status: p.status ?? "active",
          website_url: p.website_url,
          summary: p.summary ?? "",
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "client" } : { ok: true };
    }

    case "project.create": {
      const p = action.payload;
      const client = resolveRef(p.client_id, resolve);
      if (!client) return { ok: false, error: "project.create needs a client reference." };
      const { data, error } = await supabase
        .from("projects")
        .insert({
          client_id: client,
          owner_id: userId,
          name: p.name,
          code: p.code,
          summary: p.summary ?? "",
          status: p.status ?? "active",
          started_on: p.started_on,
          target_date: p.target_date,
          objective: p.objective ?? "",
          success_definition: p.success_definition ?? "",
          direction: p.direction ?? "",
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "project" } : { ok: true };
    }

    case "project.update_status": {
      const p = action.payload;
      if (!projectId) return { ok: false, error: "project.update_status needs a project." };
      const updates: Record<string, unknown> = { status: p.status };
      if (p.status === "completed") updates.completed_at = nowIso();
      if (p.status === "archived") updates.archived_at = nowIso();
      const { error } = await supabase.from("projects").update(updates).eq("id", projectId);
      throwOnError(error);
      return { ok: true };
    }

    case "project.update": {
      const p = action.payload;
      if (!projectId) return { ok: false, error: "project.update needs a project." };
      const { error } = await supabase
        .from("projects")
        .update({
          ...(p.name ? { name: p.name } : {}),
          ...(p.code ? { code: p.code } : {}),
          ...(p.summary !== null && p.summary !== undefined ? { summary: p.summary } : {}),
          ...(p.objective !== null && p.objective !== undefined ? { objective: p.objective } : {}),
          ...(p.success_definition !== null && p.success_definition !== undefined ? { success_definition: p.success_definition } : {}),
          ...(p.direction !== null && p.direction !== undefined ? { direction: p.direction } : {}),
          ...(p.target_date !== null && p.target_date !== undefined ? { target_date: p.target_date } : {}),
          ...(p.started_on !== null && p.started_on !== undefined ? { started_on: p.started_on } : {}),
        })
        .eq("id", projectId);
      throwOnError(error);
      return { ok: true };
    }

    case "phase.create": {
      const p = action.payload;
      if (!projectId) return { ok: false, error: "phase.create needs a project." };
      const { data: max } = await supabase
        .from("phases")
        .select("position")
        .eq("project_id", projectId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      const position = p.position ?? (max ? Number(max.position) + 1 : 1);
      const status = p.status ?? "planned";
      const { data, error } = await supabase
        .from("phases")
        .insert({
          project_id: projectId,
          name: p.name,
          description: p.description ?? "",
          position,
          status,
          started_on: p.started_on,
          target_date: p.target_date,
          completed_at: status === "completed" ? nowIso() : null,
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "phase" } : { ok: true };
    }

    case "phase.complete": {
      if (!phaseId) return { ok: false, error: "phase.complete needs a phase." };
      const { error } = await supabase
        .from("phases")
        .update({ status: "completed", completed_at: nowIso() })
        .eq("id", phaseId);
      throwOnError(error);
      return { ok: true };
    }

    case "phase.pause": {
      if (!phaseId) return { ok: false, error: "phase.pause needs a phase." };
      const { error } = await supabase.from("phases").update({ status: "on_hold" }).eq("id", phaseId);
      throwOnError(error);
      return { ok: true };
    }

    case "phase.update": {
      const p = action.payload;
      if (!phaseId) return { ok: false, error: "phase.update needs a phase." };
      const { error } = await supabase
        .from("phases")
        .update({
          ...(p.name ? { name: p.name } : {}),
          ...(p.description !== null && p.description !== undefined ? { description: p.description } : {}),
          ...(p.started_on !== null && p.started_on !== undefined ? { started_on: p.started_on } : {}),
          ...(p.target_date !== null && p.target_date !== undefined ? { target_date: p.target_date } : {}),
          ...(p.status ? { status: p.status, completed_at: p.status === "completed" ? nowIso() : null } : {}),
        })
        .eq("id", phaseId);
      throwOnError(error);
      return { ok: true };
    }

    case "task.create": {
      const p = action.payload;
      if (!projectId) return { ok: false, error: "task.create needs a project." };
      const status = p.status ?? "todo";
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: p.title,
          description_md: p.description_md ?? "",
          priority: p.priority ?? "normal",
          status,
          assignee_id: userId,
          due_at: p.due_at,
          phase_id: phaseId,
          completed_at: status === "done" ? nowIso() : null,
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "task" } : { ok: true };
    }

    case "task.complete": {
      if (!refId) return { ok: false, error: "task.complete needs a task reference." };
      const { error } = await supabase
        .from("tasks")
        .update({ status: "done", completed_at: nowIso() })
        .eq("id", refId);
      throwOnError(error);
      return { ok: true };
    }

    case "task.update_priority": {
      const p = action.payload;
      if (!refId) return { ok: false, error: "task.update_priority needs a task reference." };
      const { error } = await supabase.from("tasks").update({ priority: p.priority }).eq("id", refId);
      throwOnError(error);
      return { ok: true };
    }

    case "issue.create": {
      const p = action.payload;
      if (!projectId) return { ok: false, error: "issue.create needs a project." };
      const { data, error } = await supabase
        .from("issues")
        .insert({
          project_id: projectId,
          title: p.title,
          description_md: p.description_md ?? "",
          severity: p.severity ?? "medium",
          status: p.status ?? "open",
          assignee_id: userId,
          phase_id: phaseId,
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "issue" } : { ok: true };
    }

    case "issue.resolve": {
      const p = action.payload;
      if (!refId) return { ok: false, error: "issue.resolve needs an issue reference." };
      const { error } = await supabase
        .from("issues")
        .update({
          status: p.status ?? "resolved",
          resolved_at: nowIso(),
          resolution_summary: p.resolution_summary,
        })
        .eq("id", refId);
      throwOnError(error);
      return { ok: true };
    }

    case "entry.create": {
      const p = action.payload;
      const type = p.type;
      if (type === "decision" && !p.decision_outcome) {
        return { ok: false, error: "A decision record requires a decision outcome." };
      }
      const { data, error } = await supabase
        .from("entries")
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          type,
          title: p.title,
          body_md: p.body_md ?? "",
          occurred_at: p.occurred_at ?? nowIso(),
          triage_state: "filed",
          decision_outcome: type === "decision" ? p.decision_outcome : null,
          decision_state: type === "decision" ? "active" : null,
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "entry" } : { ok: true };
    }

    case "decision.supersede": {
      if (!refId) return { ok: false, error: "decision.supersede needs a decision entry reference." };
      const { error } = await supabase
        .from("entries")
        .update({ decision_state: "superseded" })
        .eq("id", refId)
        .eq("type", "decision");
      throwOnError(error);
      return { ok: true };
    }

    case "finance.invoice":
    case "finance.payment": {
      // Legacy: kept for backward compat with old capture sessions.
      const p = action.payload;
      if (!projectId) return { ok: false, error: `${action.kind} needs a project.` };
      const { data, error } = await supabase
        .from("finance_items_legacy")
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          kind: action.kind === "finance.invoice" ? "invoice" : "payment",
          title: p.title,
          amount: p.amount,
          currency_code: (p.currency_code ?? "INR").toUpperCase(),
          occurred_on: p.occurred_on ?? todayIso(),
          notes: p.notes ?? "",
          payment_status: "pending",
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "finance" } : { ok: true };
    }

    case "finance.mark_paid": {
      // Legacy: kept for backward compat with old capture sessions.
      const p = action.payload;
      if (!refId) return { ok: false, error: "finance.mark_paid needs an invoice reference." };
      const { error } = await supabase
        .from("finance_items_legacy")
        .update({
          payment_status: p.payment_status ?? "paid",
          paid_at: p.paid_at ? new Date(p.paid_at).toISOString() : nowIso(),
        })
        .eq("id", refId)
        .eq("kind", "invoice");
      throwOnError(error);
      return { ok: true };
    }

    // ─── New Finance Ledger actions ───────────────────────────────────────────────────

    case "finance.transaction": {
      const p = action.payload;
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          type: p.type,
          amount: p.amount,
          currency_code: "INR",
          transaction_date: p.transaction_date ?? todayIso(),
          status: p.type === "expense" ? "completed" : "pending",
          invoice_status: p.invoice_status ?? null,
          invoice_number: p.invoice_number ?? "",
          reference_number: p.reference_number ?? "",
          notes: p.notes ?? "",
          from_person_id: p.type === "income" ? personId : null,
          to_person_id: p.type === "expense" ? personId : null,
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "transaction" } : { ok: true };
    }

    case "finance.allocate": {
      const p = action.payload;
      if (!refId) return { ok: false, error: "finance.allocate needs a transaction reference." };
      const target = phaseId ? "phase" : projectId ? "project" : "overhead";
      const { error } = await supabase
        .from("transaction_allocations")
        .insert({
          transaction_id: refId,
          target,
          project_id: projectId,
          phase_id: phaseId,
          amount: p.amount,
          notes: p.notes ?? "",
          created_by_id: userId,
        });
      throwOnError(error);
      return { ok: true };
    }

    case "finance.invoice_sent": {
      const p = action.payload;
      if (!refId) return { ok: false, error: "finance.invoice_sent needs a transaction reference." };
      const { error } = await supabase
        .from("transactions")
        .update({
          invoice_status: "sent",
          invoice_sent_at: p.invoice_sent_at ? new Date(p.invoice_sent_at).toISOString() : nowIso(),
        })
        .eq("id", refId)
        .eq("type", "income");
      throwOnError(error);
      return { ok: true };
    }

    case "finance.invoice_cleared": {
      const p = action.payload;
      if (!refId) return { ok: false, error: "finance.invoice_cleared needs a transaction reference." };
      const { error } = await supabase
        .from("transactions")
        .update({
          invoice_status: "cleared",
          invoice_cleared_at: p.invoice_cleared_at ? new Date(p.invoice_cleared_at).toISOString() : nowIso(),
          status: "completed",
          reference_number: p.reference_number ?? "",
        })
        .eq("id", refId)
        .eq("type", "income");
      throwOnError(error);
      return { ok: true };
    }

    case "finance.mark_completed": {
      if (!refId) return { ok: false, error: "finance.mark_completed needs a transaction reference." };
      const { error } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", refId);
      throwOnError(error);
      return { ok: true };
    }

    case "communication.draft": {
      const p = action.payload;
      if (!projectId || !personId) {
        return { ok: false, error: "communication.draft needs a project and a person." };
      }
      const { data, error } = await supabase
        .from("message_drafts")
        .insert({
          project_id: projectId,
          person_id: personId,
          phase_id: phaseId,
          content: p.content,
          intent: p.intent,
          length_label: p.length_label ?? "short",
          styles: p.styles ?? [],
          additional_context: "",
          direction: "outbound",
          model_id: "capture",
          status: "draft",
          created_by_id: userId,
        })
        .select("id")
        .single();
      throwOnError(error);
      return data ? { ok: true, createdId: String(data.id), createdKind: "message_draft" } : { ok: true };
    }
  }
}
