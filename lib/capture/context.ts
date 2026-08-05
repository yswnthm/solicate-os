import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProjectsForSelect, getPeople } from "@/features/queries";
import { semanticSearch, type SemanticMatch } from "@/lib/ai/semantic";
import type { CaptureInput, ClarificationAnswers } from "@/lib/capture/types";

// Context retrieval for the capture templates. Like every other feature, the
// model receives a structured memory package — the operator never re-explains
// existing context.
//
// Retrieval is intentionally bounded with TARGETED queries — only the 6 data
// types the capture templates actually need are fetched. Participants,
// activity, global people/users are not fetched here
// (capture gets people from the cached getPeople() catalog instead).

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Truncate a string to at most maxChars characters. */
function truncate(text: string | null | undefined, maxChars: number): string {
  if (!text) return "";
  return text.length <= maxChars ? text : text.slice(0, maxChars) + "…";
}

export interface CaptureContext {
  [key: string]: unknown;
  input: {
    scope: CaptureInput["scope"];
    text: string;
    new_phase_name: string | null;
    new_client_name: string | null;
  };
  project: Record<string, unknown> | null;
  phases: Record<string, unknown>[];
  open_tasks: Record<string, unknown>[];
  done_tasks: Record<string, unknown>[];
  open_issues: Record<string, unknown>[];
  financials: Record<string, unknown>[];
  recent_entries: Record<string, unknown>[];
  decisions: Record<string, unknown>[];
  // V3: archive records retrieved by similarity to the capture. Empty when
  // embeddings are not configured or nothing matches.
  semantic_matches: SemanticMatch[];
  projects: { id: string; name: string; client: string | null }[];
  people: { id: string; name: string; is_partner: boolean }[];
  client: { id: string | null; name: string } | null;
}

/** Extract a client name from a supabase relation (object or array form). */
function clientNameOf(relation: unknown): string | null {
  if (!relation) return null;
  const row = Array.isArray(relation) ? relation[0] : relation;
  const name = (row as { name?: unknown } | undefined)?.name;
  return typeof name === "string" && name.trim() ? name : null;
}

/**
 * Build the full memory package for a capture session. Uses targeted direct
 * queries — only the 6 data types actually consumed by the capture templates
 * are fetched. Skips participants, activity, and global people/users (those
 * aren't needed for capture analysis/proposal).
 *
 * All text body fields are truncated in this layer to keep JSON payload small.
 */
export async function getCaptureContext(input: CaptureInput): Promise<CaptureContext> {
  const supabase = await createSupabaseServerClient();

  // Fetch catalog (cached, 60s TTL) + project-scoped data in parallel.
  // If no project_id, skip the project queries entirely.
  const catalogPromise = Promise.all([getActiveProjectsForSelect(), getPeople()]);

  let projectData: {
    project: Record<string, unknown> | null;
    phases: Record<string, unknown>[];
    tasks: Record<string, unknown>[];
    issues: Record<string, unknown>[];
    finance: Record<string, unknown>[];
    entries: Record<string, unknown>[];
  } | null = null;

  if (input.project_id) {
    const pid = input.project_id;
    // 6 targeted parallel queries — exactly what capture needs, nothing more.
    const [project, phases, tasks, issues, entries, finance] = await Promise.all([
      supabase
        .from("projects")
        .select("*, people!projects_person_id_fkey(id, name)")
        .eq("id", pid)
        .maybeSingle(),
      supabase
        .from("phases")
        .select("id, name, description, position, status, started_on, target_date, completed_at, project_id")
        .eq("project_id", pid)
        .order("position"),
      supabase
        .from("tasks")
        // No description_md — title+status+id is all the proposer needs
        .select("id, title, status, priority, due_at, phase_id, phases(id, name, position)")
        .eq("project_id", pid)
        .order("status")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(60),
      supabase
        .from("issues")
        // No description_md
        .select("id, title, status, severity, resolution_summary, phase_id, phases(id, name)")
        .eq("project_id", pid)
        .order("reported_at", { ascending: false })
        .limit(30),
      supabase
        .from("entries")
        .select("id, title, type, body_md, occurred_at, decision_outcome, decision_state, phase_id, phases(id, name)")
        .eq("project_id", pid)
        .eq("triage_state", "filed")
        .order("occurred_at", { ascending: false })
        .limit(40),
      supabase
        .from("v_project_finance")
        .select("allocation_id, transaction_id, project_id, phase_id, target, allocated_amount, allocation_notes, type, status, invoice_status, invoice_number, transaction_date, currency_code, reference_number, transaction_notes, category_name")
        .eq("project_id", pid)
        .order("transaction_date", { ascending: false })
        .limit(25),
    ]);
    [project, phases, tasks, issues, entries, finance].forEach((r) => throwOnError(r.error));
    projectData = {
      project: project.data as Record<string, unknown> | null,
      phases: (phases.data ?? []) as unknown as Record<string, unknown>[],
      tasks: (tasks.data ?? []) as unknown as Record<string, unknown>[],
      issues: (issues.data ?? []) as unknown as Record<string, unknown>[],
      finance: (finance.data ?? []) as unknown as Record<string, unknown>[],
      entries: (entries.data ?? []) as unknown as Record<string, unknown>[],
    };
  }

  const [[projects, people]] = await Promise.all([catalogPromise]);

  let client: { id: string | null; name: string } | null = null;
  if (input.scope === "new_project") {
    if (input.client_id) {
      const { data, error } = await supabase.from("people").select("id, name").eq("id", input.client_id).maybeSingle();
      throwOnError(error);
      if (data) client = { id: String(data.id), name: String(data.name) };
    }
    if (!client && input.new_client_name) {
      client = { id: null, name: input.new_client_name };
    }
  }

  const phases = projectData?.phases ?? [];
  const tasks = projectData?.tasks ?? [];
  const issues = projectData?.issues ?? [];
  const finance = projectData?.finance ?? [];
  const entries = projectData?.entries ?? [];

  const openTasks = tasks.filter((t) => !["done", "cancelled"].includes(String(t.status)));
  const doneTasks = tasks.filter((t) => t.status === "done");

  // V3: retrieve archive records most similar to the capture. This surfaces
  // older entries/decisions the recent snapshot misses. Graceful
  // no-op (returns []) when embeddings are not configured or the search fails.
  const semantic_matches = input.project_id ? await semanticSearch(input.text, input.project_id, 8) : [];

  return {
    input: {
      scope: input.scope,
      text: input.text,
      new_phase_name: input.new_phase_name ?? null,
      new_client_name: input.new_client_name ?? null,
    },
    project: projectData?.project ?? null,
    phases: phases.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      status: p.status,
      started_on: p.started_on,
      target_date: p.target_date,
    })),
    open_tasks: openTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_at: t.due_at,
      phase: (t.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
    })),
    done_tasks: doneTasks.map((t) => ({
      id: t.id,
      title: t.title,
      phase: (t.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
    })),
    open_issues: issues
      .filter((i) => !["resolved", "accepted", "closed"].includes(String(i.status)))
      .map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        severity: i.severity,
        phase: (i.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
      })),
    financials: finance.map((f: any) => ({
      id: f.allocation_id || f.id,
      kind: f.type === "income" ? "payment" : f.type === "invoice" ? "invoice" : (f.kind ?? "expense"),
      title: f.transaction_notes || f.allocation_notes || f.category_name || f.title || "Transaction",
      amount: Number(f.allocated_amount ?? f.amount ?? 0),
      currency: f.currency_code,
      date: f.transaction_date || f.occurred_on,
      payment_status: (f.invoice_status ?? f.payment_status ?? null) as string | null,
      phase: null,
    })),
    // Body truncated to 300 chars — enough for the model to understand
    // what each entry is about without burning tokens on full prose.
    recent_entries: entries.slice(0, 40).map((e) => ({
      title: e.title,
      type: e.type,
      date: e.occurred_at,
      body: truncate(String(e.body_md ?? ""), 300),
    })),
    decisions: entries
      .filter((e) => e.type === "decision")
      .slice(0, 20)
      .map((e) => ({
        id: e.id,
        title: e.title,
        outcome: e.decision_outcome,
        date: e.occurred_at,
      })),
    projects: projects.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      client: clientNameOf(p.people),
    })),
    people: people.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      is_partner: Boolean(p.is_partner),
    })),
    client,
    semantic_matches,
  };
}

/**
 * Narrow a persisted JSONB value to a CaptureContext. The engine stores the
 * analyzed context on the session and reuses it for the propose step, so it
 * must be able to tell a real package from a null/partial legacy row.
 */
export function isCaptureContext(value: unknown): value is CaptureContext {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.input === "object" && v.input !== null &&
    Array.isArray(v.phases) &&
    Array.isArray(v.open_tasks) &&
    Array.isArray(v.open_issues) &&
    Array.isArray(v.projects)
  );
}

/** Append the operator's clarification answers for the propose step. */
export async function getCaptureProposeContext(
  context: CaptureContext,
  answers: ClarificationAnswers,
): Promise<CaptureContext & { answers: ClarificationAnswers }> {
  return { ...context, answers };
}

/**
 * Build the compact propose digest (H2) from a full CaptureContext.
 *
 * The proposer only needs real record ids + titles to reference existing
 * records and to know what state they are in. Everything bulky is dropped:
 * entry bodies, task/issue descriptions, phase descriptions, project prose,
 * message text. This is the payload that replaces the full snapshot at
 * propose time, cutting the propose token cost by roughly 70%.
 */
export function buildProposeDigest(context: CaptureContext): CaptureContext {
  // The digest is a pure record index for the proposer — semantic matches
  // (raw archive text) are analyze-only evidence and must not leak through.
  return {
    input: context.input,
    semantic_matches: [],
    project: context.project
      ? {
          name: context.project.name,
          status: context.project.status,
          summary: context.project.summary,
          objective: context.project.objective,
          target_date: context.project.target_date,
          client: context.project.client,
        }
      : null,
    phases: context.phases.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
    })),
    open_tasks: context.open_tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      due_at: t.due_at,
      phase: t.phase,
    })),
    done_tasks: context.done_tasks.map((t) => ({
      id: t.id,
      title: t.title,
      phase: t.phase,
    })),
    open_issues: context.open_issues.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      severity: i.severity,
      phase: i.phase,
    })),
    financials: context.financials.map((f) => ({
      id: f.id,
      kind: f.kind,
      title: f.title,
      amount: f.amount,
      currency: f.currency,
      date: f.date,
      payment_status: f.payment_status,
      phase: f.phase,
    })),
    // Titles only — the digest never carries entry bodies.
    recent_entries: context.recent_entries.map((e) => ({
      title: e.title,
      type: e.type,
      date: e.date,
    })),
    decisions: context.decisions.map((d) => ({
      id: d.id,
      title: d.title,
      outcome: d.outcome,
      date: d.date,
    })),
    people: context.people.map((p) => ({
      id: p.id,
      name: p.name,
      is_partner: p.is_partner,
    })),
    projects: context.projects,
    client: context.client,
  };
}
