import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProjectsForSelect, getPeople, getProjectWorkspace } from "@/features/queries";
import type { CaptureInput, ClarificationAnswers } from "@/lib/capture/types";

// Context retrieval for the capture templates. Like every other feature, the
// model receives a structured memory package — the operator never re-explains
// existing context.

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
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
 * Build the full memory package for a capture session. Existing-project
 * captures pull the live workspace; new-project and projectless captures get
 * the project/people catalog so the model can resolve references and detect
 * collisions.
 */
export async function getCaptureContext(input: CaptureInput): Promise<CaptureContext> {
  const supabase = await createSupabaseServerClient();

  const [projects, people] = await Promise.all([getActiveProjectsForSelect(), getPeople()]);

  const project = input.project_id ? await getProjectWorkspace(input.project_id) : null;

  let client: { id: string | null; name: string } | null = null;
  if (input.scope === "new_project") {
    if (input.client_id) {
      const { data, error } = await supabase.from("clients").select("id, name").eq("id", input.client_id).maybeSingle();
      throwOnError(error);
      if (data) client = { id: String(data.id), name: String(data.name) };
    }
    if (!client && input.new_client_name) {
      client = { id: null, name: input.new_client_name };
    }
  }

  const raw = project;
  const phases = (raw?.phases ?? []) as unknown as Record<string, unknown>[];
  const tasks = (raw?.tasks ?? []) as unknown as Record<string, unknown>[];
  const issues = (raw?.issues ?? []) as unknown as Record<string, unknown>[];
  const finance = (raw?.finance ?? []) as unknown as Record<string, unknown>[];
  const entries = (raw?.entries ?? []) as unknown as Record<string, unknown>[];

  const openTasks = tasks.filter((t) => !["done", "cancelled"].includes(String(t.status)));
  const doneTasks = tasks.filter((t) => t.status === "done");

  return {
    input: {
      scope: input.scope,
      text: input.text,
      new_phase_name: input.new_phase_name ?? null,
      new_client_name: input.new_client_name ?? null,
    },
    project: raw?.project
      ? (raw.project as Record<string, unknown>)
      : null,
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
    financials: finance.map((f) => ({
      id: f.id,
      kind: f.kind,
      title: f.title,
      amount: Number(f.amount),
      currency: f.currency_code,
      date: f.occurred_on,
      payment_status: f.payment_status ?? null,
      phase: (f.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
    })),
    recent_entries: entries.slice(0, 40).map((e) => ({
      title: e.title,
      type: e.type,
      date: e.occurred_at,
      body: String(e.body_md ?? "").slice(0, 400),
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
      client: clientNameOf(p.clients),
    })),
    people: people.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      is_partner: Boolean(p.is_partner),
    })),
    client,
  };
}

/** Append the operator's clarification answers for the propose step. */
export async function getCaptureProposeContext(
  input: CaptureInput,
  answers: ClarificationAnswers,
): Promise<CaptureContext & { answers: ClarificationAnswers }> {
  const base = await getCaptureContext(input);
  return { ...base, answers };
}
